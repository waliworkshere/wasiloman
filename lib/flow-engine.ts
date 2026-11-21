import type { SupabaseClient } from "@supabase/supabase-js";
import { sendButtons, sendImage, sendList, sendText, type WaAccount } from "./whatsapp";
import type { FlowEdge, FlowNode } from "./flow-types";

type Contact = { id: string; phone: string; name: string | null; tags: string[]; attributes: Record<string, any>; owner_id: string };
type Input = { text: string; replyId?: string };

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Replace {name} and {any_attribute} in bot texts */
function fill(text: string, c: Contact) {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k === "name" ? c.name || "" : k === "phone" ? c.phone : String(c.attributes?.[k] ?? "")));
}

export async function handleInbound(sb: SupabaseClient, acct: WaAccount, contact: Contact, input: Input) {
  const { data: flows } = await sb.from("flows").select("*").eq("owner_id", acct.owner_id).eq("is_active", true);
  if (!flows?.length) return;
  const text = norm(input.text || "");

  const keywordFlow = flows.find((f) => {
    const kws: string[] = (f.keywords || []).map(norm).filter(Boolean);
    if (f.match_type === "exact") return kws.includes(text);
    if (f.match_type === "contains") return kws.some((k) => text.includes(k));
    return false;
  });

  const { data: session } = await sb.from("flow_sessions").select("*").eq("owner_id", acct.owner_id).eq("contact_id", contact.id).maybeSingle();

  if (keywordFlow) return startFlow(sb, acct, contact, keywordFlow);

  if (session) {
    const flow = flows.find((f) => f.id === session.flow_id);
    if (flow) return continueFlow(sb, acct, contact, flow, session.node_id, input);
  }

  const fallback = flows.find((f) => f.match_type === "any");
  if (fallback) return startFlow(sb, acct, contact, fallback);
}

async function startFlow(sb: SupabaseClient, acct: WaAccount, contact: Contact, flow: any) {
  await sb.from("flows").update({ runs: (flow.runs || 0) + 1 }).eq("id", flow.id);
  const start = (flow.nodes as FlowNode[]).find((n) => n.type === "start");
  if (!start) return;
  return run(sb, acct, contact, flow, nextOf(flow, start.id, "next"));
}

function nextOf(flow: any, nodeId: string, handle?: string) {
  const edges = flow.edges as FlowEdge[];
  const e = edges.find((x) => x.source === nodeId && (handle ? (x.sourceHandle || "next") === handle : true));
  return e?.target ?? null;
}

async function continueFlow(sb: SupabaseClient, acct: WaAccount, contact: Contact, flow: any, nodeId: string, input: Input) {
  const node = (flow.nodes as FlowNode[]).find((n) => n.id === nodeId);
  if (!node) return endSession(sb, acct, contact);

  if (node.type === "choices") {
    const opts = node.data.options || [];
    let idx = -1;
    if (input.replyId?.startsWith(node.id + ":")) idx = Number(input.replyId.split(":")[1]);
    if (idx < 0) idx = opts.findIndex((o) => norm(o) === norm(input.text || ""));
    if (idx < 0 && /^\d+$/.test(input.text?.trim() || "")) {
      const n = Number(input.text.trim()) - 1;
      if (n >= 0 && n < opts.length) idx = n;
    }
    if (idx < 0) return run(sb, acct, contact, flow, node.id); // ask again
    return run(sb, acct, contact, flow, nextOf(flow, node.id, `opt-${idx}`));
  }

  if (node.type === "question") {
    if (node.data.saveAs) {
      const key = node.data.saveAs.trim().toLowerCase().replace(/\s+/g, "_");
      const attributes = { ...(contact.attributes || {}), [key]: input.text };
      contact.attributes = attributes;
      await sb.from("contacts").update({ attributes }).eq("id", contact.id);
    }
    return run(sb, acct, contact, flow, nextOf(flow, node.id, "next"));
  }

  return run(sb, acct, contact, flow, nextOf(flow, node.id));
}

async function endSession(sb: SupabaseClient, acct: WaAccount, contact: Contact) {
  await sb.from("flow_sessions").delete().eq("owner_id", acct.owner_id).eq("contact_id", contact.id);
}

async function wait(sb: SupabaseClient, acct: WaAccount, contact: Contact, flow: any, nodeId: string) {
  await sb.from("flow_sessions").upsert({ owner_id: acct.owner_id, contact_id: contact.id, flow_id: flow.id, node_id: nodeId, updated_at: new Date().toISOString() });
}

async function log(sb: SupabaseClient, acct: WaAccount, contact: Contact, body: string, wamid: string, type = "text") {
  await sb.from("messages").insert({ owner_id: acct.owner_id, contact_id: contact.id, direction: "out", type, body, wa_message_id: wamid, status: "sent", source: "bot" });
  await sb.from("contacts").update({ last_message_at: new Date().toISOString(), last_message_preview: body.slice(0, 80) }).eq("id", contact.id);
}

async function run(sb: SupabaseClient, acct: WaAccount, contact: Contact, flow: any, nodeId: string | null) {
  const nodes = flow.nodes as FlowNode[];
  for (let step = 0; step < 15 && nodeId; step++) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) break;
    const text = fill(node.data.text || "", contact);

    switch (node.type) {
      case "start":
        nodeId = nextOf(flow, node.id, "next");
        continue;

      case "message": {
        if (node.data.imageUrl) {
          const id = await sendImage(acct, contact.phone, node.data.imageUrl, text || undefined);
          await log(sb, acct, contact, text || "[image]", id, "image");
        } else if (text) {
          const id = await sendText(acct, contact.phone, text);
          await log(sb, acct, contact, text, id);
        }
        await new Promise((r) => setTimeout(r, 600)); // keep message order
        nodeId = nextOf(flow, node.id, "next");
        continue;
      }

      case "tag": {
        if (node.data.tag) {
          contact.tags = Array.from(new Set([...(contact.tags || []), node.data.tag]));
          await sb.from("contacts").update({ tags: contact.tags }).eq("id", contact.id);
        }
        nodeId = nextOf(flow, node.id, "next");
        continue;
      }

      case "choices": {
        const opts = (node.data.options || []).filter(Boolean);
        const body = text || "👇";
        const id =
          opts.length <= 3
            ? await sendButtons(acct, contact.phone, body, opts.map((o, i) => ({ id: `${node.id}:${i}`, title: o })))
            : await sendList(acct, contact.phone, body, node.data.buttonText || "Options", opts.map((o, i) => ({ id: `${node.id}:${i}`, title: o })));
        await log(sb, acct, contact, `${body}\n${opts.map((o, i) => `${i + 1}. ${o}`).join("\n")}`, id, "interactive");
        await wait(sb, acct, contact, flow, node.id);
        return;
      }

      case "question": {
        const id = await sendText(acct, contact.phone, text || "?");
        await log(sb, acct, contact, text, id);
        await wait(sb, acct, contact, flow, node.id);
        return;
      }

      case "handoff": {
        if (text) {
          const id = await sendText(acct, contact.phone, text);
          await log(sb, acct, contact, text, id);
        }
        const tags = Array.from(new Set([...(contact.tags || []), "needs-human"]));
        await sb.from("contacts").update({ tags }).eq("id", contact.id);
        await endSession(sb, acct, contact);
        return;
      }
    }
  }
  await endSession(sb, acct, contact);
}
