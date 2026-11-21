import { supabaseAdmin } from "./supabase/server";
import { sendTemplate, type WaAccount } from "./whatsapp";
import { resolveVar, type VarSource } from "./whatsapp-shared";

const BATCH = 60;
const PARALLEL = 10;

function buildComponents(b: any, r: any) {
  const comps: any[] = [];
  const tpl: any[] = b.template_components || [];
  const header = tpl.find((c) => c.type === "HEADER");
  if (header && ["IMAGE", "VIDEO", "DOCUMENT"].includes(header.format) && b.header_media_id) {
    const t = header.format.toLowerCase();
    comps.push({ type: "header", parameters: [{ type: t, [t]: { id: b.header_media_id } }] });
  }
  const vars: VarSource[] = b.variable_map || [];
  if (vars.length) {
    comps.push({ type: "body", parameters: vars.map((v) => ({ type: "text", text: resolveVar(v, r) })) });
  }
  return comps;
}

function renderBody(b: any, r: any) {
  const body = (b.template_components || []).find((c: any) => c.type === "BODY")?.text || "";
  const vars: VarSource[] = b.variable_map || [];
  return body.replace(/\{\{\s*(\d+)\s*\}\}/g, (_: string, n: string) => (vars[Number(n) - 1] ? resolveVar(vars[Number(n) - 1], r) : ""));
}

/** Sends pending messages of a broadcast until done or until the time budget runs out. */
export async function runBroadcast(broadcastId: string, budgetMs = 50_000) {
  const sb = supabaseAdmin();
  const started = Date.now();
  const { data: b } = await sb.from("broadcasts").select("*").eq("id", broadcastId).single();
  if (!b || !["sending", "scheduled"].includes(b.status)) return;
  const { data: acct } = await sb.from("whatsapp_accounts").select("*").eq("owner_id", b.owner_id).single();
  if (!acct) {
    await sb.from("broadcasts").update({ status: "failed" }).eq("id", broadcastId);
    return;
  }
  if (b.status === "scheduled") await sb.from("broadcasts").update({ status: "sending" }).eq("id", broadcastId);

  while (Date.now() - started < budgetMs) {
    const { data: batch } = await sb.from("broadcast_recipients").select("*").eq("broadcast_id", broadcastId).eq("status", "pending").limit(BATCH);
    if (!batch || batch.length === 0) {
      await sb.from("broadcasts").update({ status: "completed" }).eq("id", broadcastId);
      break;
    }
    for (let i = 0; i < batch.length; i += PARALLEL) {
      await Promise.all(
        batch.slice(i, i + PARALLEL).map(async (r) => {
          try {
            const wamid = await sendTemplate(acct as WaAccount, r.phone, b.template_name, b.template_language, buildComponents(b, r));
            await sb.from("broadcast_recipients").update({ status: "sent", wa_message_id: wamid, updated_at: new Date().toISOString() }).eq("id", r.id);
            if (r.contact_id) {
              const text = renderBody(b, r);
              await sb.from("messages").insert({ owner_id: b.owner_id, contact_id: r.contact_id, direction: "out", type: "template", body: text, wa_message_id: wamid, status: "sent", source: "broadcast", payload: { template: b.template_name } });
              await sb.from("contacts").update({ last_message_at: new Date().toISOString(), last_message_preview: text.slice(0, 80) }).eq("id", r.contact_id);
            }
          } catch (e: any) {
            await sb.from("broadcast_recipients").update({ status: "failed", error: String(e.message || e).slice(0, 300), updated_at: new Date().toISOString() }).eq("id", r.id);
          }
        })
      );
    }
    await sb.rpc("refresh_broadcast_stats", { b: broadcastId });
  }
  await sb.rpc("refresh_broadcast_stats", { b: broadcastId });
}
