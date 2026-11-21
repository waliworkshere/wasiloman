import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { uploadMedia, uploadTemplateSample } from "@/lib/whatsapp";

export const runtime = "nodejs";

/**
 * POST multipart form: file + purpose ("template-sample" | "message")
 * - template-sample → returns { handle } used when creating a template with an image/video/document header
 * - message → returns { id } WhatsApp media id used when sending
 */
export async function POST(req: Request) {
  const { user, account } = await requireUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  if (!account) return NextResponse.json({ error: "Connect WhatsApp first" }, { status: 400 });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 16 * 1024 * 1024) return NextResponse.json({ error: "File is too big (max 16 MB)" }, { status: 400 });
  try {
    if (form.get("purpose") === "template-sample") {
      return NextResponse.json({ handle: await uploadTemplateSample(account, file, file.name) });
    }
    return NextResponse.json({ id: await uploadMedia(account, file, file.name) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
