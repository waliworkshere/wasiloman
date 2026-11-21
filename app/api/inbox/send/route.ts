import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { sendText } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const { sb, user, account } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  if (!account) return NextResponse.json({ error: "Connect WhatsApp first" }, { status: 400 });
  const { contact_id, text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  const { data: contact } = await sb.from("contacts").select("*").eq("id", contact_id).single();
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const open = contact.last_inbound_at && Date.now() - new Date(contact.last_inbound_at).getTime() < 24 * 3600 * 1000;
  if (!open) {
    return NextResponse.json({ error: "WhatsApp only allows free replies within 24 hours of the customer's last message. Send a template from Bulk Send instead." }, { status: 400 });
  }
  try {
    const wamid = await sendText(account, contact.phone, text.trim());
    const { data: msg } = await sb
      .from("messages")
      .insert({ owner_id: user.id, contact_id, direction: "out", type: "text", body: text.trim(), wa_message_id: wamid, status: "sent", source: "inbox" })
      .select()
      .single();
    await sb.from("contacts").update({ last_message_at: new Date().toISOString(), last_message_preview: text.trim().slice(0, 80) }).eq("id", contact_id);
    return NextResponse.json({ message: msg });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
