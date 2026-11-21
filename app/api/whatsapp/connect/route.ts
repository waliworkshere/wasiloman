import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { exchangeCodeForToken, findPhoneNumbers, getPhoneInfo, graph, GRAPH_VERSION, registerPhone, subscribeApp } from "@/lib/whatsapp";

export const runtime = "nodejs";

/** Finds the WABA the user just shared, if the browser didn't receive it from the popup. */
async function wabaFromToken(token: string): Promise<string | null> {
  const appToken = `${process.env.NEXT_PUBLIC_META_APP_ID}|${process.env.META_APP_SECRET}`;
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appToken)}`,
    { cache: "no-store" }
  );
  const json = await res.json();
  const scope = (json.data?.granular_scopes || []).find((s: any) => s.scope === "whatsapp_business_management");
  return scope?.target_ids?.[0] ?? null;
}

export async function POST(req: Request) {
  const { sb, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in again" }, { status: 401 });

  const body = await req.json();
  try {
    let token: string;
    let wabaId: string | null = body.waba_id || null;
    let phoneId: string | null = body.phone_number_id || null;

    if (body.mode === "facebook") {
      if (!body.code) throw new Error("Facebook did not return a login code. Please try again.");
      token = await exchangeCodeForToken(body.code);
      if (!wabaId) wabaId = await wabaFromToken(token);
    } else {
      token = String(body.access_token || "").trim();
      if (!token || !wabaId) throw new Error("Please fill in all the fields.");
    }
    if (!wabaId) throw new Error("We couldn't find your WhatsApp Business Account. Please finish all the steps in the Facebook window.");

    if (!phoneId) {
      const phones = await findPhoneNumbers(wabaId, token);
      phoneId = phones.data[0]?.id ?? null;
    }
    if (!phoneId) throw new Error("No phone number found in this WhatsApp Business Account.");

    const info = await getPhoneInfo(phoneId, token);

    // Make Meta send incoming messages & delivery reports to our webhook
    await subscribeApp(wabaId, token);

    // Register the number on Cloud API (needed after Embedded Signup). Ignore "already registered".
    if (body.mode === "facebook") {
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      await registerPhone(phoneId, token, pin).catch(() => null);
    }

    const { error } = await sb.from("whatsapp_accounts").upsert(
      {
        owner_id: user.id,
        waba_id: wabaId,
        phone_number_id: phoneId,
        access_token: token,
        display_phone: info.display_phone_number,
        verified_name: info.verified_name,
        connected_via: body.mode === "facebook" ? "facebook" : "manual",
      },
      { onConflict: "owner_id" }
    );
    if (error) {
      if (error.code === "23505") throw new Error("This number is already connected to another Wasil account.");
      throw new Error(error.message);
    }
    return NextResponse.json({ ok: true, display_phone: info.display_phone_number, verified_name: info.verified_name });
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
    return NextResponse.json({ connected: true, info });
  } catch (e: any) {
    return NextResponse.json({ connected: true, error: e.message });
  }
}
