import { NextResponse, after } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { runBroadcast } from "@/lib/broadcast";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Create a broadcast, build the recipient list from contacts, and start sending (or schedule). */
export async function POST(req: Request) {
  const { sb, user, account } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  if (!account) return NextResponse.json({ error: "Connect WhatsApp first" }, { status: 400 });

  const body = await req.json();
  const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : null;
  const scheduled = scheduledAt && scheduledAt.getTime() > Date.now() + 60_000;

  // Collect the audience
  const contacts: any[] = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from("contacts").select("id,name,phone,attributes").eq("opted_in", true).range(from, from + 999);
    if (body.audience_tags?.length) q = q.overlaps("tags", body.audience_tags);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    contacts.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  if (contacts.length === 0) return NextResponse.json({ error: "No contacts match this audience" }, { status: 400 });

  const { data: b, error } = await sb
    .from("broadcasts")
    .insert({
      owner_id: user.id,
      name: body.name || body.template_name,
      template_name: body.template_name,
      template_language: body.template_language,
      template_components: body.template_components || [],
      variable_map: body.variable_map || [],
      header_media_id: body.header_media_id || null,
      header_type: body.header_type || null,
      audience_tags: body.audience_tags || [],
      status: scheduled ? "scheduled" : "sending",
      scheduled_at: scheduled ? scheduledAt!.toISOString() : null,
      total: contacts.length,
    })
    .select()
    .single();
  if (error || !b) return NextResponse.json({ error: error?.message || "Could not create" }, { status: 400 });

  const rows = contacts.map((c) => ({ broadcast_id: b.id, owner_id: user.id, contact_id: c.id, phone: c.phone, name: c.name, attributes: c.attributes || {} }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error: e } = await sb.from("broadcast_recipients").insert(rows.slice(i, i + 500));
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
  }

  if (!scheduled) after(() => runBroadcast(b.id, 50_000));
  return NextResponse.json({ id: b.id });
}
