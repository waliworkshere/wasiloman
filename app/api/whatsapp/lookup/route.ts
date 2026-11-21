import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { findPhoneNumbers, graph, inspectToken } from "@/lib/whatsapp";

export const runtime = "nodejs";

/**
 * POST { access_token } → finds the WhatsApp Business Accounts and phone numbers this token can use,
 * so the user only has to paste one token.
 */
export async function POST(req: Request) {
  const { user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in again" }, { status: 401 });
  const { access_token } = await req.json();
  const token = String(access_token || "").trim();
  if (!token) return NextResponse.json({ error: "Paste your access token first." }, { status: 400 });

  try {
    const info = await inspectToken(token);
    if (!info.is_valid) throw new Error("This token is not valid or has expired. Generate a new one in Meta.");

    const wabaIds: string[] = Array.from(
      new Set(
        (info.granular_scopes || [])
          .filter((s: any) => s.scope === "whatsapp_business_management" || s.scope === "whatsapp_business_messaging")
          .flatMap((s: any) => s.target_ids || [])
      )
    );

    const wabas = [];
    for (const id of wabaIds) {
      try {
        const w = await graph<{ id: string; name?: string }>(`${id}?fields=id,name`, token);
        const phones = await findPhoneNumbers(id, token);
        wabas.push({ id, name: w.name || id, phones: phones.data });
      } catch {
        /* not a WABA (could be a phone/business id) – skip */
      }
    }
    return NextResponse.json({ app_id: info.app_id, expires_at: info.expires_at, wabas });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
