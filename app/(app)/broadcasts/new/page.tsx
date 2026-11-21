"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Users, Wand2, Send, CalendarClock, ArrowLeft, ArrowRight, ImageIcon } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ConnectBanner } from "@/components/ConnectBanner";
import { Loading, PageHeader, Spinner, api } from "@/components/ui";
import { WhatsAppPreview, templateToPreview } from "@/components/WhatsAppPreview";
import { countVars, resolveVar, type VarSource } from "@/lib/whatsapp-shared";

export default function NewBroadcast() {
  const { tr, dir } = useLang();
  const router = useRouter();
  const { account } = useAccount();
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<any[] | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [tpl, setTpl] = useState<any>(null);
  const [audience, setAudience] = useState<"all" | "tags">("all");
  const [tags, setTags] = useState<string[]>([]);
  const [vars, setVars] = useState<VarSource[]>([]);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const Next = dir === "rtl" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    api("/api/templates").then((r) => setTemplates(r.templates.filter((t: any) => t.status === "APPROVED"))).catch(() => setTemplates([]));
    (async () => {
      const all: any[] = [];
      for (let from = 0; ; from += 1000) {
        const { data } = await supabaseBrowser().from("contacts").select("id,name,phone,tags,attributes,opted_in").range(from, from + 999);
        all.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      setContacts(all);
    })();
  }, []);

  const allTags = useMemo(() => Array.from(new Set(contacts.flatMap((c) => c.tags))).sort(), [contacts]);
  const attrKeys = useMemo(() => Array.from(new Set(contacts.flatMap((c) => Object.keys(c.attributes || {})))).sort(), [contacts]);
  const recipients = useMemo(() => contacts.filter((c) => c.opted_in && (audience === "all" || c.tags.some((t: string) => tags.includes(t)))), [contacts, audience, tags]);

  const body = tpl?.components?.find((c: any) => c.type === "BODY")?.text || "";
  const header = tpl?.components?.find((c: any) => c.type === "HEADER");
  const needsMedia = header && ["IMAGE", "VIDEO", "DOCUMENT"].includes(header.format);
  const nVars = countVars(body);
  const sample = recipients[0] || { name: tr("Ahmed", "أحمد"), phone: "96891234567", attributes: {} };

  const pickTemplate = (t: any) => {
    setTpl(t);
    const n = countVars(t.components?.find((c: any) => c.type === "BODY")?.text);
    setVars(Array.from({ length: n }, (_, i) => (i === 0 ? { type: "name", fallback: tr("Customer", "عميلنا العزيز") } : { type: "text", value: "" })));
    setMediaId(null);
    setMediaPreview(null);
    if (!name) setName(`${t.name} – ${new Date().toLocaleDateString()}`);
  };

  const upload = async (f: File) => {
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("purpose", "message");
      const r = await api("/api/media", fd);
      setMediaId(r.id);
      setMediaPreview(f.type.startsWith("image") ? URL.createObjectURL(f) : null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  };

  const canNext = [
    !!tpl,
    recipients.length > 0,
    (!needsMedia || !!mediaId) && vars.every((v) => v.type !== "text" || v.value?.trim()) && vars.every((v) => v.type !== "attribute" || v.value),
    true,
  ][step];

  const send = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api("/api/broadcasts", {
        name,
        template_name: tpl.name,
        template_language: tpl.language,
        template_components: tpl.components,
        variable_map: vars,
        header_media_id: mediaId,
        header_type: header?.format,
        audience_tags: audience === "tags" ? tags : [],
        scheduled_at: when === "later" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      router.push(`/broadcasts/${r.id}`);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  };

  const steps = [
    { icon: FileText, t: tr("Message", "الرسالة") },
    { icon: Users, t: tr("Who gets it", "المستلمون") },
    { icon: Wand2, t: tr("Personalise", "التخصيص") },
    { icon: Send, t: tr("Send", "الإرسال") },
  ];

  return (
    <div>
      <ConnectBanner />
      <PageHeader title={tr("New bulk message", "رسالة جماعية جديدة")} subtitle={tr("4 simple steps.", "٤ خطوات بسيطة.")} />

      <div className="mb-6 flex items-center gap-2 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button disabled={i > step} onClick={() => setStep(i)} className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${i === step ? "bg-brand-600 text-white" : i < step ? "bg-brand-100 text-brand-700" : "bg-sand-100 text-ink-400"}`}>
              {i < step ? <Check size={15} /> : <s.icon size={15} />} {i + 1}. {s.t}
            </button>
            {i < steps.length - 1 && <div className="h-px w-6 bg-sand-300" />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card p-6">
          {step === 0 && (
            <div>
              <h2 className="mb-1 font-semibold">{tr("Which message do you want to send?", "أي رسالة تريد إرسالها؟")}</h2>
              <p className="mb-4 text-sm text-ink-500">{tr("Only templates approved by Meta are shown.", "تظهر فقط القوالب المعتمدة من ميتا.")}</p>
              {templates === null ? (
                <Loading />
              ) : templates.length === 0 ? (
                <div className="rounded-xl bg-sand-100 p-6 text-center text-sm">
                  {tr("No approved templates yet.", "لا توجد قوالب معتمدة بعد.")}{" "}
                  <Link href="/templates/new" className="font-semibold text-brand-600">{tr("Create one", "أنشئ قالباً")}</Link>
                </div>
              ) : (
                <div className="grid gap-2">
                  {templates.map((t) => (
                    <button key={t.id} onClick={() => pickTemplate(t)} className={`rounded-xl border p-4 text-start transition ${tpl?.id === t.id ? "border-brand-500 bg-brand-50 ring-4 ring-brand-100" : "border-sand-200 hover:border-sand-300"}`}>
                      <div className="font-mono text-sm font-semibold" dir="ltr">{t.name}</div>
                      <div className="mt-1 line-clamp-2 text-sm text-ink-500">{t.components?.find((c: any) => c.type === "BODY")?.text}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-4 font-semibold">{tr("Who should receive it?", "من يجب أن يستلمها؟")}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => setAudience("all")} className={`rounded-xl border p-4 text-start ${audience === "all" ? "border-brand-500 bg-brand-50" : "border-sand-200"}`}>
                  <div className="font-semibold">{tr("All my contacts", "كل جهات الاتصال")}</div>
                  <div className="text-sm text-ink-500">{contacts.filter((c) => c.opted_in).length} {tr("people", "شخص")}</div>
                </button>
                <button onClick={() => setAudience("tags")} className={`rounded-xl border p-4 text-start ${audience === "tags" ? "border-brand-500 bg-brand-50" : "border-sand-200"}`}>
                  <div className="font-semibold">{tr("Only people with a tag", "فقط من لديهم وسم")}</div>
                  <div className="text-sm text-ink-500">{tr("e.g. VIP, Muscat", "مثال: VIP، مسقط")}</div>
                </button>
              </div>
              {audience === "tags" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {allTags.length === 0 && <p className="text-sm text-ink-400">{tr("You have no tags yet. Add tags on the Contacts page.", "لا توجد وسوم بعد. أضفها من صفحة جهات الاتصال.")}</p>}
                  {allTags.map((t) => (
                    <button key={t} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} className={`badge px-3 py-1.5 text-sm ${tags.includes(t) ? "bg-brand-600 text-white" : "bg-sand-100 text-ink-700"}`}>
                      {tags.includes(t) && <Check size={13} />} {t}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm">
                <b className="text-lg">{recipients.length}</b> {tr("people will receive this message.", "شخص سيستلم هذه الرسالة.")}
                <div className="mt-1 text-xs text-ink-500">{tr("People who unsubscribed are skipped automatically.", "يتم تخطي من ألغوا الاشتراك تلقائياً.")}</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {needsMedia && (
                <div>
                  <h2 className="mb-1 font-semibold">{tr("Choose the image for this message", "اختر الصورة لهذه الرسالة")}</h2>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-sand-300 p-4 hover:border-brand-400">
                    {uploading ? <Spinner /> : mediaId ? <Check className="text-emerald-600" /> : <ImageIcon className="text-ink-400" />}
                    <span className="text-sm">{mediaId ? tr("Uploaded ✓ — click to change", "تم الرفع ✓ — اضغط للتغيير") : tr("Click to upload (JPG/PNG, MP4 or PDF)", "اضغط للرفع (JPG/PNG أو MP4 أو PDF)")}</span>
                    <input type="file" className="hidden" accept={header.format === "IMAGE" ? "image/jpeg,image/png" : header.format === "VIDEO" ? "video/mp4" : "application/pdf"} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                  </label>
                </div>
              )}
              {nVars === 0 && !needsMedia && <p className="text-sm text-ink-500">{tr("This message has nothing to personalise. Continue to the next step.", "لا يوجد ما يمكن تخصيصه في هذه الرسالة. تابع للخطوة التالية.")}</p>}
              {nVars > 0 && (
                <div>
                  <h2 className="mb-1 font-semibold">{tr("Fill in the blanks for each person", "املأ الفراغات لكل شخص")}</h2>
                  <p className="mb-4 text-sm text-ink-500">{tr("Choose what goes into each {{number}}.", "اختر ما يوضع مكان كل {{رقم}}.")}</p>
                  <div className="space-y-3">
                    {vars.map((v, i) => (
                      <div key={i} className="grid gap-2 rounded-xl border border-sand-200 p-3 sm:grid-cols-[60px_1fr_1fr] sm:items-center">
                        <span className="font-mono text-sm font-semibold text-brand-700" dir="ltr">{`{{${i + 1}}}`}</span>
                        <select className="input py-2" value={v.type} onChange={(e) => { const n = [...vars]; n[i] = { type: e.target.value as VarSource["type"], value: "", fallback: v.fallback }; setVars(n); }}>
                          <option value="name">{tr("Customer's name", "اسم العميل")}</option>
                          <option value="phone">{tr("Customer's number", "رقم العميل")}</option>
                          {attrKeys.length > 0 && <option value="attribute">{tr("Other column from my file", "عمود آخر من ملفي")}</option>}
                          <option value="text">{tr("Same text for everyone", "نفس النص للجميع")}</option>
                        </select>
                        {v.type === "text" && <input className="input py-2" value={v.value || ""} placeholder={tr("e.g. 20%", "مثال: ٢٠٪")} onChange={(e) => { const n = [...vars]; n[i] = { ...v, value: e.target.value }; setVars(n); }} />}
                        {v.type === "attribute" && (
                          <select className="input py-2" value={v.value || ""} onChange={(e) => { const n = [...vars]; n[i] = { ...v, value: e.target.value }; setVars(n); }}>
                            <option value="">—</option>
                            {attrKeys.map((k) => <option key={k}>{k}</option>)}
                          </select>
                        )}
                        {(v.type === "name" || v.type === "attribute") && (
                          <input className="input py-2 sm:col-start-3" value={v.fallback || ""} placeholder={tr("If empty, use…", "إذا كان فارغاً، استخدم…")} onChange={(e) => { const n = [...vars]; n[i] = { ...v, fallback: e.target.value }; setVars(n); }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="label">{tr("Name this campaign (only you see it)", "سمِّ هذه الحملة (لك فقط)")}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => setWhen("now")} className={`rounded-xl border p-4 text-start ${when === "now" ? "border-brand-500 bg-brand-50" : "border-sand-200"}`}>
                  <Send size={18} className="mb-2 text-brand-600" />
                  <div className="font-semibold">{tr("Send now", "أرسل الآن")}</div>
                </button>
                <button onClick={() => setWhen("later")} className={`rounded-xl border p-4 text-start ${when === "later" ? "border-brand-500 bg-brand-50" : "border-sand-200"}`}>
                  <CalendarClock size={18} className="mb-2 text-violet-600" />
                  <div className="font-semibold">{tr("Schedule for later", "جدولة لوقت لاحق")}</div>
                </button>
              </div>
              {when === "later" && <input type="datetime-local" className="input" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />}
              <div className="rounded-xl bg-sand-100 p-4 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">{tr("Message", "الرسالة")}</span><span className="font-mono" dir="ltr">{tpl?.name}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-ink-500">{tr("Recipients", "المستلمون")}</span><b>{recipients.length}</b></div>
                <div className="mt-1 flex justify-between"><span className="text-ink-500">{tr("From", "من")}</span><span dir="ltr">{account?.display_phone}</span></div>
              </div>
              <p className="text-xs text-ink-400">{tr("Meta charges a small fee per marketing conversation, billed to your Meta business account.", "تفرض ميتا رسوماً بسيطة لكل محادثة تسويقية، تُحتسب على حساب نشاطك في ميتا.")}</p>
              {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
              <button onClick={send} disabled={busy || (when === "later" && !scheduledAt)} className="btn-primary w-full py-3.5 text-base">
                {busy ? <Spinner /> : when === "now" ? <Send size={18} /> : <CalendarClock size={18} />}
                {when === "now" ? tr(`Send to ${recipients.length} people`, `أرسل إلى ${recipients.length} شخص`) : tr("Schedule", "جدولة")}
              </button>
            </div>
          )}

          {step < 3 && (
            <div className="mt-8 flex justify-between border-t border-sand-100 pt-5">
              <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><Back size={16} />{tr("Back", "رجوع")}</button>
              {err && step === 2 && <span className="text-sm text-red-600">{err}</span>}
              <button className="btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>{tr("Next", "التالي")}<Next size={16} /></button>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2 text-sm font-semibold text-ink-500">{tr("What the customer sees", "ما يراه العميل")}</div>
          {tpl ? (
            <WhatsAppPreview data={{ ...templateToPreview(tpl, account?.verified_name || undefined), ...(mediaPreview ? { headerImageUrl: mediaPreview } : {}) }} vars={vars.map((v) => resolveVar(v, sample))} />
          ) : (
            <div className="card grid h-64 place-items-center text-sm text-ink-400">{tr("Choose a message", "اختر رسالة")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
