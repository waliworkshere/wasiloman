import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { runBroadcast } from "@/lib/broadcast";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Runs every few minutes (Vercel Cron / Supabase pg_cron): sends scheduled broadcasts and continues big ones. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sb = supabaseAdmin();
  const now = new Date().toISOString();
  const { data } = await sb
    .from("broadcasts")
    .select("id,status,scheduled_at")
    .or(`status.eq.sending,and(status.eq.scheduled,scheduled_at.lte.${now})`)
    .order("created_at")
    .limit(5);
  const ids = (data || []).map((b) => b.id);
  const per = Math.max(8_000, Math.floor(50_000 / Math.max(ids.length, 1)));
  for (const id of ids) await runBroadcast(id, per);
  return NextResponse.json({ processed: ids.length });
}
