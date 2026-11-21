"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, User, Bold, Italic, ImageIcon, Type, Ban, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { ConnectBanner } from "@/components/ConnectBanner";
import { PageHeader, Spinner, api } from "@/components/ui";
import { WhatsAppPreview } from "@/components/WhatsAppPreview";
import { countVars } from "@/lib/whatsapp-shared";

type Btn = { type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER"; text: string; url?: string; phone_number?: string };

export default function NewTemplate() {
  const { tr, lang } = useLang();
  const router = useRouter();
  const { account } = useAccount();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<"MARKETING" | "UTILITY">("MARKETING");
  const [language, setLanguage] = useState(lang === "ar" ? "ar" : "en");
  const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE">("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [examples, setExamples] = useState<string[]>([]);
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<Btn[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nVars = countVars(body);

  const quickStart = [
    {
      l: tr("Special offer", "عرض خاص"),
      b: lang === "ar" ? "مرحباً {{1}} 👋\n\nعرض خاص لك: خصم *{{2}}* على جميع منتجاتنا هذا الأسبوع فقط! 🎉\n\nزورونا أو اطلب الآن." : "Hi {{1}} 👋\n\nSpecial offer just for you: *{{2}} off* everything this week only! 🎉\n\nVisit us or order now.",
      ex: [lang === "ar" ? "أحمد" : "Ahmed", "20%"],
    },
    {
      l: tr("Eid greeting", "تهنئة العيد"),
      b: lang === "ar" ? "عيد مبارك يا {{1}} 🌙\n\nكل عام وأنتم بخير من عائلة {{2}}." : "Eid Mubarak, {{1}} 🌙\n\nWarm wishes to you and your family from everyone at {{2}}.",
      ex: [lang === "ar" ? "فاطمة" : "Fatma", account?.verified_name || "Wasil"],
    },
    {
      l: tr("Appointment reminder", "تذكير بموعد"),
      b: lang === "ar" ? "مرحباً {{1}}، نذكرك بموعدك يوم {{2}} الساعة {{3}}. نتطلع لرؤيتك!" : "Hello {{1}}, this is a reminder of your appointment on {{2}} at {{3}}. See you soon!",
      ex: [lang === "ar" ? "سالم" : "Salim", "Sunday", "4:00 PM"],
      cat: "UTILITY" as const,
    },
  ];

  const insertAtCursor = (s: string) => {
    const el = bodyRef.current;
    if (!el) return setBody(body + s);
    const start = el.selectionStart, end = el.selectionEnd;
    const next = body.slice(0, start) + s + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + s.length; });
  };
  const wrap = (ch: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    setBody(body.slice(0, s) + ch + body.slice(s, e) + ch + body.slice(e));
  };
  const addVariable = () => insertAtCursor(`{{${nVars + 1}}}`);

  const submit = async () => {
    setErr(null);
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_|_$/g, "");
    if (!cleanName) return setErr(tr("Please give the template a name.", "أعط القالب اسماً."));
    if (!body.trim()) return setErr(tr("Please write the message.", "اكتب نص الرسالة."));
    if (nVars && examples.slice(0, nVars).some((x) => !x?.trim())) return setErr(tr("Fill in an example for every variable — Meta needs them to approve.", "املأ مثالاً لكل متغير — ميتا تحتاجها للموافقة."));
    if (headerType === "IMAGE" && !headerFile) return setErr(tr("Choose a sample image for the header.", "اختر صورة نموذجية للرأس."));
    setBusy(true);
    try {
      const components: any[] = [];
      if (headerType === "TEXT" && headerText.trim()) components.push({ type: "HEADER", format: "TEXT", text: headerText.trim() });
      if (headerType === "IMAGE" && headerFile) {
        const fd = new FormData();
        fd.append("file", headerFile);
        fd.append("purpose", "template-sample");
        const { handle } = await api("/api/media", fd);
        components.push({ type: "HEADER", format: "IMAGE", example: { header_handle: [handle] } });
      }
      components.push({ type: "BODY", text: body.trim(), ...(nVars ? { example: { body_text: [examples.slice(0, nVars)] } } : {}) });
      if (footer.trim()) components.push({ type: "FOOTER", text: footer.trim() });
      const btns = buttons.filter((b) => b.text.trim());
      if (btns.length) components.push({ type: "BUTTONS", buttons: btns.map((b) => (b.type === "URL" ? { type: "URL", text: b.text, url: b.url } : b.type === "PHONE_NUMBER" ? { type: "PHONE_NUMBER", text: b.text, phone_number: b.phone_number } : { type: "QUICK_REPLY", text: b.text })) });
      await api("/api/templates", { name: cleanName, category, language, components });
      router.push("/templates");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <ConnectBanner />
      <PageHeader title={tr("Create a message template", "إنشاء قالب رسالة")} subtitle={tr("Write your message once, then send it to as many people as you want.", "اكتب رسالتك مرة واحدة، ثم أرسلها لأي عدد من الناس.")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} className="text-gold-500" />{tr("Start from an example", "ابدأ من مثال")}</div>
            <div className="flex flex-wrap gap-2">
              {quickStart.map((q) => (
                <button key={q.l} className="btn-secondary py-2" onClick={() => { setBody(q.b); setExamples(q.ex); if (q.cat) setCategory(q.cat); if (!name) setName(q.l.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "") || "offer"); }}>
                  {q.l}
                </button>
              ))}
            </div>
          </div>

          <div className="card grid gap-4 p-5 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="label">{tr("Template name", "اسم القالب")}</label>
              <input className="input font-mono" dir="ltr" value={name} onChange={(e) => setName(e.target.value)} placeholder="eid_offer_2026" />
              <p className="hint">{tr("English letters, numbers and _ only. Only you see this name.", "أحرف إنجليزية وأرقام و _ فقط. هذا الاسم لك فقط.")}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="label">{tr("Type of message", "نوع الرسالة")}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "MARKETING" as const, t: tr("Marketing", "تسويق"), d: tr("Offers, news, greetings", "عروض، أخبار، تهاني") },
                  { v: "UTILITY" as const, t: tr("Utility", "خدمات"), d: tr("Orders, reminders, updates", "طلبات، تذكيرات، تحديثات") },
                ].map((c) => (
                  <button key={c.v} onClick={() => setCategory(c.v)} className={`rounded-xl border p-3 text-start text-sm ${category === c.v ? "border-brand-500 bg-brand-50" : "border-sand-200"}`}>
                    <div className="font-semibold">{c.t}</div>
                    <div className="text-xs text-ink-500">{c.d}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">{tr("Language", "اللغة")}</label>
              <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
                <option value="en_US">English (US)</option>
                <option value="en_GB">English (UK)</option>
              </select>
            </div>
          </div>

          <div className="card space-y-4 p-5">
            <div>
              <label className="label">{tr("Header (optional)", "الرأس (اختياري)")}</label>
              <div className="flex gap-2">
                {[
                  { v: "NONE" as const, i: Ban, t: tr("None", "بدون") },
                  { v: "TEXT" as const, i: Type, t: tr("Title", "عنوان") },
                  { v: "IMAGE" as const, i: ImageIcon, t: tr("Image", "صورة") },
                ].map((h) => (
                  <button key={h.v} onClick={() => setHeaderType(h.v)} className={`btn py-2 ${headerType === h.v ? "bg-brand-600 text-white" : "border border-sand-200 bg-white text-ink-700"}`}>
                    <h.i size={15} /> {h.t}
                  </button>
                ))}
              </div>
              {headerType === "TEXT" && <input className="input mt-3" maxLength={60} value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder={tr("e.g. Eid Sale 🌙", "مثال: تخفيضات العيد 🌙")} />}
              {headerType === "IMAGE" && (
                <div className="mt-3">
                  <input type="file" accept="image/jpeg,image/png" onChange={(e) => { const f = e.target.files?.[0] || null; setHeaderFile(f); setHeaderPreview(f ? URL.createObjectURL(f) : null); }} className="text-sm" />
                  <p className="hint">{tr("This is a sample for Meta's review. When sending, you can use any image.", "هذه صورة نموذجية لمراجعة ميتا. عند الإرسال يمكنك اختيار أي صورة.")}</p>
                </div>
              )}
            </div>

            <div>
              <label className="label">{tr("Message", "نص الرسالة")}</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <button className="btn-secondary px-3 py-1.5 text-xs" onClick={addVariable}><User size={14} />{tr("Add a variable (e.g. name)", "أضف متغيراً (مثل الاسم)")}</button>
                <button className="btn-secondary px-2.5 py-1.5" onClick={() => wrap("*")}><Bold size={14} /></button>
                <button className="btn-secondary px-2.5 py-1.5" onClick={() => wrap("_")}><Italic size={14} /></button>
              </div>
              <textarea ref={bodyRef} className="input min-h-[160px]" maxLength={1024} value={body} onChange={(e) => setBody(e.target.value)} placeholder={tr("Hi {{1}}, …", "مرحباً {{1}}، …")} />
              <p className="hint">{tr("{{1}}, {{2}} are filled in for each person when you send (e.g. their name).", "{{1}} و {{2}} تُملأ لكل شخص عند الإرسال (مثل اسمه).")} {body.length}/1024</p>
            </div>

            {nVars > 0 && (
              <div className="rounded-xl bg-sand-100 p-4">
                <div className="mb-2 text-sm font-semibold">{tr("Example values (for Meta's review)", "قيم نموذجية (لمراجعة ميتا)")}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: nVars }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-500" dir="ltr">{`{{${i + 1}}}`}</span>
                      <input className="input py-2" value={examples[i] || ""} onChange={(e) => { const n = [...examples]; n[i] = e.target.value; setExamples(n); }} placeholder={i === 0 ? tr("Ahmed", "أحمد") : "…"} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">{tr("Footer (optional)", "التذييل (اختياري)")}</label>
              <input className="input" maxLength={60} value={footer} onChange={(e) => setFooter(e.target.value)} placeholder={tr("Reply STOP to unsubscribe", "أرسل «إيقاف» لإلغاء الاشتراك")} />
            </div>

            <div>
              <label className="label">{tr("Buttons (optional, up to 3)", "أزرار (اختياري، حتى ٣)")}</label>
              <div className="space-y-2">
                {buttons.map((b, i) => (
                  <div key={i} className="flex flex-wrap gap-2 rounded-xl border border-sand-200 p-2">
                    <select className="input w-auto py-2" value={b.type} onChange={(e) => { const n = [...buttons]; n[i] = { ...b, type: e.target.value as Btn["type"] }; setButtons(n); }}>
                      <option value="QUICK_REPLY">{tr("Quick reply", "رد سريع")}</option>
                      <option value="URL">{tr("Open website", "فتح موقع")}</option>
                      <option value="PHONE_NUMBER">{tr("Call number", "اتصال")}</option>
                    </select>
                    <input className="input min-w-[120px] flex-1 py-2" maxLength={25} value={b.text} placeholder={tr("Button text", "نص الزر")} onChange={(e) => { const n = [...buttons]; n[i] = { ...b, text: e.target.value }; setButtons(n); }} />
                    {b.type === "URL" && <input className="input min-w-[160px] flex-1 py-2" dir="ltr" value={b.url || ""} placeholder="https://" onChange={(e) => { const n = [...buttons]; n[i] = { ...b, url: e.target.value }; setButtons(n); }} />}
                    {b.type === "PHONE_NUMBER" && <input className="input min-w-[140px] flex-1 py-2" dir="ltr" value={b.phone_number || ""} placeholder="+96891234567" onChange={(e) => { const n = [...buttons]; n[i] = { ...b, phone_number: e.target.value }; setButtons(n); }} />}
                    <button className="btn-ghost p-2" onClick={() => setButtons(buttons.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
                  </div>
                ))}
                {buttons.length < 3 && <button className="btn-secondary py-2" onClick={() => setButtons([...buttons, { type: "QUICK_REPLY", text: "" }])}><Plus size={15} />{tr("Add button", "إضافة زر")}</button>}
              </div>
            </div>
          </div>

          {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full py-3" onClick={submit} disabled={busy || !account}>
            {busy && <Spinner />} {tr("Submit to Meta for approval", "إرسال إلى ميتا للموافقة")}
          </button>
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 text-sm font-semibold text-ink-500">{tr("Preview", "معاينة")}</div>
          <WhatsAppPreview data={{ headerType, headerText, headerImageUrl: headerPreview, body, footer, buttons, businessName: account?.verified_name || undefined }} vars={examples} />
        </div>
      </div>
    </div>
  );
}
