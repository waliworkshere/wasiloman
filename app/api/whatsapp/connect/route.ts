import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { getPhoneInfo, graph, inspectToken, registerPhone, subscribeApp } from "@/lib/whatsapp";

export const runtime = "nodejs";

/**
 * POST { access_token, waba_id, phone_number_id, app_secret?, pin? }
 * Connects a WhatsApp Cloud API number the user set up in their own Meta app.
 */
export async function POST(req: Request) {
  const { sb, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in again" }, { status: 401 });

  const body = await req.json();
  const token = String(body.access_token || "").trim();
  const wabaId = String(body.waba_id || "").trim();
  const phoneId = String(body.phone_number_id || "").trim();
  const appSecret = String(body.app_secret || "").trim() || null;
  const pin = String(body.pin || "").trim();

  try {
    if (!token || !wabaId || !phoneId) throw new Error("Please fill in all the fields.");

    const info = await getPhoneInfo(phoneId, token);
    const tokenInfo = await inspectToken(token).catch(() => null);

    // Make Meta send incoming messages & delivery reports for this WABA to the app
    await subscribeApp(wabaId, token).catch(() => null);

    // Optional: register the number on Cloud API (needed for new real numbers)
    if (/^\d{6}$/.test(pin)) {
      await registerPhone(phoneId, token, pin).catch((e) => {
        if (!/already registered/i.test(e.message)) throw e;
      });
    }

    const { error } = await sb.from("whatsapp_accounts").upsert(
      {
        owner_id: user.id,
        waba_id: wabaId,
        phone_number_id: phoneId,
        access_token: token,
        app_id: tokenInfo?.app_id ?? null,
        app_secret: appSecret,
        display_phone: info.display_phone_number,
        verified_name: info.verified_name,
        connected_via: "manual",
      },
      { onConflict: "owner_id" }
    );
    if (error) {
      if (error.code === "23505") throw new Error("This number is already connected to another Wasil account.");
      throw new Error(error.message);
    }
    return NextResponse.json({
      ok: true,
      display_phone: info.display_phone_number,
      verified_name: info.verified_name,
      expires_at: tokenInfo?.expires_at || 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Connection failed" }, { status: 400 });
  }
}

export async function DELETE() {
  const { sb, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in again" }, { status: 401 });
  await sb.from("whatsapp_accounts").delete().eq("owner_id", user.id);
  return NextResponse.json({ ok: true });
}

/** Health check of the connected number */
export async function GET() {
  const { account } = await requireUser();
  if (!account) return NextResponse.json({ connected: false });
  try {
    const info = await graph(`${account.phone_number_id}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier,name_status`, account.access_token);
    const tokenInfo = await inspectToken(account.access_token).catch(() => null);
    return NextResponse.json({ connected: true, info, token_expires_at: tokenInfo?.expires_at ?? null });
  } catch (e: any) {
    return NextResponse.json({ connected: true, error: e.message });
  }
}
