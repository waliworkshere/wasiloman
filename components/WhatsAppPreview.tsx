"use client";
import { ExternalLink, Phone, Reply, ImageIcon, FileText, Video } from "lucide-react";
import { useLang } from "@/lib/i18n";

export type PreviewData = {
  headerType?: "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  headerText?: string;
  headerImageUrl?: string | null;
  body: string;
  footer?: string;
  buttons?: { type: string; text: string }[];
  businessName?: string;
};

/** Replace {{1}} with values, and render WhatsApp *bold* / _italic_ */
function render(text: string, vars?: string[]) {
  let t = text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => (vars?.[Number(n) - 1] ? vars[Number(n) - 1] : `{{${n}}}`));
  t = t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  t = t.replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/_([^_\n]+)_/g, "<i>$1</i>").replace(/~([^~\n]+)~/g, "<s>$1</s>");
  return t;
}

export function WhatsAppPreview({ data, vars }: { data: PreviewData; vars?: string[] }) {
  const { tr } = useLang();
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="overflow-hidden rounded-[1.6rem] border-[6px] border-ink-900 bg-[#ECE5DD] shadow-xl">
      <div className="flex items-center gap-2.5 bg-brand-700 px-3 py-2.5 text-white">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-xs font-bold">{(data.businessName || "W")[0]}</div>
        <div className="text-sm font-semibold">{data.businessName || tr("Your business", "نشاطك التجاري")}</div>
      </div>
      <div className="min-h-[300px] p-3">
        <div className="max-w-[90%] rounded-xl rounded-ss-none bg-white shadow-sm">
          <div className="p-2">
            {data.headerType === "TEXT" && data.headerText && <div className="mb-1 px-1 font-bold" dangerouslySetInnerHTML={{ __html: render(data.headerText, vars) }} />}
            {data.headerType === "IMAGE" &&
              (data.headerImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.headerImageUrl} alt="" className="mb-1 max-h-48 w-full rounded-lg object-cover" />
              ) : (
                <div className="mb-1 grid h-32 place-items-center rounded-lg bg-sand-200 text-ink-400"><ImageIcon /></div>
              ))}
            {data.headerType === "VIDEO" && <div className="mb-1 grid h-32 place-items-center rounded-lg bg-ink-700 text-white"><Video /></div>}
            {data.headerType === "DOCUMENT" && <div className="mb-1 flex items-center gap-2 rounded-lg bg-sand-100 p-3 text-sm text-ink-500"><FileText size={18} /> document.pdf</div>}
            <div className="whitespace-pre-wrap break-words px-1 text-[14px] leading-relaxed" dangerouslySetInnerHTML={{ __html: render(data.body || tr("Your message will appear here…", "ستظهر رسالتك هنا…"), vars) }} />
            {data.footer && <div className="mt-1 px-1 text-xs text-ink-400">{data.footer}</div>}
            <div className="mt-0.5 px-1 text-end text-[10px] text-ink-400">{time}</div>
          </div>
          {(data.buttons || []).filter((b) => b.text).map((b, i) => (
            <div key={i} className="flex items-center justify-center gap-1.5 border-t border-sand-100 py-2 text-sm font-medium text-sky-600">
              {b.type === "URL" ? <ExternalLink size={14} /> : b.type === "PHONE_NUMBER" ? <Phone size={14} /> : <Reply size={14} />}
              {b.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Converts a Meta template object into preview data */
export function templateToPreview(t: any, businessName?: string): PreviewData {
  const c = (type: string) => t?.components?.find((x: any) => x.type === type);
  const h = c("HEADER");
  return {
    headerType: h ? h.format : "NONE",
    headerText: h?.text,
    headerImageUrl: h?.example?.header_handle?.[0] ?? null,
    body: c("BODY")?.text || "",
    footer: c("FOOTER")?.text,
    buttons: c("BUTTONS")?.buttons || [],
    businessName,
  };
}
