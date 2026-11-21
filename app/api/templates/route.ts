import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { createTemplate, deleteTemplate, listTemplates } from "@/lib/whatsapp";

export async function GET() {
  const { user, account } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  if (!account) return NextResponse.json({ templates: [] });
  try {
    return NextResponse.json({ templates: await listTemplates(account) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const { user, account } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  if (!account) return NextResponse.json({ error: "Connect WhatsApp first" }, { status: 400 });
  try {
    const body = await req.json();
    const res = await createTemplate(account, body);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { user, account } = await requireUser();
  if (!user || !account) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const name = new URL(req.url).searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
  try {
    await deleteTemplate(account, name);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
