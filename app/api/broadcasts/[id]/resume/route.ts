import { NextResponse, after } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { runBroadcast } from "@/lib/broadcast";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Called by the broadcast page while it is open, so large lists keep sending even without a cron job. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const { data: b } = await sb.from("broadcasts").select("id,status,scheduled_at").eq("id", id).single();
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const due = b.status === "sending" || (b.status === "scheduled" && b.scheduled_at && new Date(b.scheduled_at) <= new Date());
  if (due) after(() => runBroadcast(id, 50_000));
  return NextResponse.json({ ok: true, running: due });
}

/** Cancel a scheduled broadcast */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  await sb.from("broadcasts").delete().eq("id", id).in("status", ["scheduled", "draft"]);
  return NextResponse.json({ ok: true });
}
