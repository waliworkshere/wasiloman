import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

/** Gives a logged-in user the values to paste in Meta → WhatsApp → Configuration → Webhook */
export async function GET(req: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const origin = new URL(req.url).origin;
  return NextResponse.json({
    callback_url: `${origin}/api/webhook`,
    verify_token: process.env.WHATSAPP_VERIFY_TOKEN || "",
  });
}
