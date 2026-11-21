import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { handleInbound } from "@/lib/flow-engine";
import { markRead, sendText, type WaAccount } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const maxDuration = 30;

const STOP_WORDS = ["stop", "unsubscribe", "إيقاف", "ايقاف", "الغاء", "إلغاء", "الغاء الاشتراك"];
const START_WORDS = ["start", "subscribe", "اشتراك"];

// Meta verifies the webhook URL with a GET request
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") || "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function validSignature(raw: string, header: string | null, secret: string) {
  if (!header) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header));
  } catch {
    return false;
  }
}

const LOWER: Record<string, string[]> = {
  sent: ["pending"],
  delivered: ["pending", "sent"],
  read: ["pending", "sent", "delivered"],
  failed: ["pending", "sent"],
};

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const sb = supabaseAdmin();
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "messages") continue;
      const v = change.value || {};
      const phoneId = v.metadata?.phone_number_id;
      if (!phoneId) continue;
      const { data: acct } = await sb.from("whatsapp_accounts").select("*").eq("phone_number_id", phoneId).maybeSingle();
      if (!acct) continue;

      // Each business uses its own Meta app. If they gave us their App Secret, reject anything not signed by Meta.
      if (acct.app_secret && !validSignature(raw, signature, acct.app_secret)) {
        console.warn("webhook: bad signature for", phoneId);
        continue;
      }

      try {
        // ----- Delivery / read receipts -----
        const touched = new Set<string>();
        for (const st of v.statuses || []) {
          const lower = LOWER[st.status];
          if (!lower) continue;
          const err = st.errors?.[0] ? `${st.errors[0].title || ""} ${st.errors[0].error_data?.details || ""}`.trim() : null;
          await sb.from("messages").update({ status: st.status }).eq("wa_message_id", st.id).in("status", lower);
          const { data: rows } = await sb
            .from("broadcast_recipients")
            .update({ status: st.status, updated_at: new Date().toISOString(), ...(err ? { error: err } : {}) })
            .eq("wa_message_id", st.id)
            .in("status", lower)
            .select("broadcast_id");
          rows?.forEach((r) => touched.add(r.broadcast_id));
        }
        for (const b of touched) await sb.rpc("refresh_broadcast_stats", { b });

        // ----- Incoming messages -----
        for (const m of v.messages || []) {
          const profileName = v.contacts?.find((c: any) => c.wa_id === m.from)?.profile?.name || null;
          const text: string =
            m.text?.body ||
            m.interactive?.button_reply?.title ||
            m.interactive?.list_reply?.title ||
            m.button?.text ||
            m.image?.caption ||
            m.video?.caption ||
            m.document?.caption ||
            "";
          const replyId: string | undefined = m.interactive?.button_reply?.id || m.interactive?.list_reply?.id;
          const now = new Date().toISOString();
          const preview = text || `[${m.type}]`;

          let { data: contact } = await sb.from("contacts").select("*").eq("owner_id", acct.owner_id).eq("phone", m.from).maybeSingle();
          if (!contact) {
            const { data } = await sb
              .from("contacts")
              .insert({ owner_id: acct.owner_id, phone: m.from, name: profileName, tags: ["whatsapp-inbound"], last_inbound_at: now, last_message_at: now, last_message_preview: preview, unread: 1 })
              .select()
              .single();
            contact = data;
          } else {
            const { data } = await sb
              .from("contacts")
              .update({ name: contact.name || profileName, last_inbound_at: now, last_message_at: now, last_message_preview: preview, unread: (contact.unread || 0) + 1 })
              .eq("id", contact.id)
              .select()
              .single();
            contact = data;
          }
          if (!contact) continue;

          await sb.from("messages").insert({ owner_id: acct.owner_id, contact_id: contact.id, direction: "in", type: m.type, body: text || null, payload: m, wa_message_id: m.id, source: "customer" });
          markRead(acct as WaAccount, m.id);

          const word = text.trim().toLowerCase();
          if (STOP_WORDS.includes(word)) {
            await sb.from("contacts").update({ opted_in: false }).eq("id", contact.id);
            await sendText(acct as WaAccount, m.from, "You won't receive marketing messages from us anymore. Reply START to subscribe again.\nلن تصلك رسائل تسويقية منا بعد الآن. أرسل «اشتراك» للعودة.").catch(() => null);
            continue;
          }
          if (START_WORDS.includes(word)) {
            await sb.from("contacts").update({ opted_in: true }).eq("id", contact.id);
          }

          await handleInbound(sb, acct as WaAccount, contact, { text, replyId }).catch((e) => console.error("flow error", e));
        }
      } catch (e) {
        console.error("webhook error", e);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
