"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, PartyPopper, Search, ArrowRight, ArrowLeft, ChevronDown, ShieldCheck, Smartphone, AlertTriangle } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { PageHeader, Spinner, api } from "@/components/ui";

type Phone = { id: string; display_phone_number: string; verified_name: string };
type Waba = { id: string; name: string; phones: Phone[] };

function CopyField({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-ink-500">{label}</div>
      <div className="flex gap-2">
        <input readOnly value={value} dir="ltr" className="input bg-sand-50 py-2 font-mono text-xs" onFocus={(e) => e.target.select()} />
        <button
          type="button"
          className="btn-secondary px-3"
          aria-label="Copy"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }}
        >
          {done ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

function Step({ n, title, active, done, children, onOpen }: { n: number; title: string; active: boolean; done: boolean; children: ReactNode; onOpen: () => void }) {
  return (
    <div className={`card overflow-hidden transition ${active ? "border-brand-400 ring-4 ring-brand-100" : ""}`}>
      <button onClick={onOpen} className="flex w-full items-center gap-3 p-5 text-start">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-brand-600 text-white" : active ? "bg-ink-900 text-white" : "bg-sand-100 text-ink-500"}`}>
          {done ? <Check size={16} /> : n}
        </span>
        <span className="flex-1 font-semibold">{title}</span>
        <ChevronDown size={18} className={`text-ink-400 transition ${active ? "rotate-180" : ""}`} />
      </button>
      {active && <div className="border-t border-sand-100 px-5 pb-6 pt-4">{children}</div>}
    </div>
  );
}

function Ol({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2.5 text-sm text-ink-700">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sand-100 text-[11px] font-bold text-ink-500">{i + 1}</span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  );
}

const B = ({ children }: { children: ReactNode }) => <b className="font-semibold text-ink-900">{children}</b>;

export default function ConnectPage() {
  const { tr, dir } = useLang();
  const router = useRouter();
  const { account, refresh } = useAccount();
  const Next = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [step, setStep] = useState(1);
  const [tokenType, setTokenType] = useState<"temp" | "permanent">("permanent");
  const [token, setToken] = useState("");
  const [wabas, setWabas] = useState<Waba[] | null>(null);
  const [picked, setPicked] = useState<{ waba_id: string; phone_number_id: string }>({ waba_id: "", phone_number_id: "" });
  const [manualIds, setManualIds] = useState(false);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [appSecret, setAppSecret] = useState("");
  const [hook, setHook] = useState({ callback_url: "", verify_token: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ phone: string; name: string; temp: boolean } | null>(null);

  useEffect(() => {
    api("/api/whatsapp/webhook-info").then(setHook).catch(() => null);
  }, []);

  const lookup = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ wabas: Waba[] }>("/api/whatsapp/lookup", { access_token: token });
      setWabas(r.wabas);
      const first = r.wabas.find((w) => w.phones.length);
      if (first) {
        setPicked({ waba_id: first.id, phone_number_id: first.phones[0].id });
        setManualIds(false);
      } else setManualIds(true);
      setStep(3);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api("/api/whatsapp/connect", { access_token: token, ...picked, app_secret: appSecret, pin });
      await refresh();
      const temp = r.expires_at > 0 && r.expires_at * 1000 - Date.now() < 3 * 24 * 3600 * 1000;
      setDone({ phone: r.display_phone, name: r.verified_name, temp });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (done || account) {
    return (
      <div className="card mx-auto max-w-xl p-10 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
          <PartyPopper size={30} />
        </div>
        <h1 className="text-2xl font-bold">{tr("Your WhatsApp is connected", "تم ربط واتساب بنجاح")}</h1>
        <p className="mt-2 text-ink-500">
          <span dir="ltr" className="font-semibold text-ink-900">{done?.phone || account?.display_phone}</span> — {done?.name || account?.verified_name}
        </p>
        {done?.temp && (
          <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-start text-sm text-amber-800">
            <AlertTriangle size={18} className="shrink-0" />
            {tr("You used a temporary token. It stops working within 24 hours — reconnect with a permanent token when you're ready to go live.", "استخدمت رمزاً مؤقتاً يتوقف خلال ٢٤ ساعة. أعد الربط برمز دائم عندما تكون جاهزاً.")}
          </p>
        )}
        <div className="mt-8 grid gap-3 text-start sm:grid-cols-2">
          <button onClick={() => router.push("/contacts")} className="btn-secondary justify-between">
            {tr("Add your contacts", "أضف جهات الاتصال")} <Next size={16} />
          </button>
          <button onClick={() => router.push("/templates/new")} className="btn-secondary justify-between">
            {tr("Create a message", "أنشئ رسالة")} <Next size={16} />
          </button>
        </div>
        <button onClick={() => router.push("/dashboard")} className="btn-primary mt-4 w-full">
          {tr("Go to dashboard", "الذهاب للوحة التحكم")}
        </button>
        {account && !done && (
          <button onClick={() => router.push("/settings")} className="btn-ghost mt-2 w-full text-xs">
            {tr("Change or disconnect number", "تغيير أو فصل الرقم")}
          </button>
        )}
      </div>
    );
  }

  const allPhones = (wabas || []).flatMap((w) => w.phones.map((p) => ({ ...p, waba: w })));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={tr("Connect your WhatsApp number", "اربط رقم واتساب الخاص بك")} subtitle={tr("Four steps, about 10 minutes. You only do this once.", "أربع خطوات، حوالي ١٠ دقائق. تقوم بها مرة واحدة فقط.")} />

      <div className="mb-5 flex gap-3 rounded-xl border border-sand-200 bg-white p-4 text-sm text-ink-700">
        <Smartphone size={20} className="mt-0.5 shrink-0 text-brand-600" />
        <div>
          <B>{tr("Which number can I use?", "أي رقم يمكنني استخدامه؟")}</B>{" "}
          {tr(
            "Any Omantel, Ooredoo or Vodafone number that is not active on the WhatsApp app. To try things first, Meta gives you a free test number — no SIM needed.",
            "أي رقم من عمانتل أو أوريدو أو فودافون غير مفعّل على تطبيق واتساب. للتجربة أولاً، تعطيك ميتا رقماً تجريبياً مجانياً — بدون شريحة."
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Step n={1} title={tr("Create a free Meta app", "أنشئ تطبيقاً مجانياً في ميتا")} active={step === 1} done={step > 1} onOpen={() => setStep(1)}>
          <Ol
            items={[
              <>{tr("Open Meta for Developers and log in with your Facebook account.", "افتح موقع ميتا للمطورين وسجّل الدخول بحساب فيسبوك.")}</>,
              <>{tr("Click", "اضغط")} <B>Create app</B>.</>,
              <>{tr("Choose", "اختر")} <B>Connect with customers through WhatsApp</B> {tr("and press Next.", "ثم التالي.")}</>,
              <>{tr("Name it (for example your shop name), choose or create your business portfolio, then press", "اكتب اسماً (مثل اسم محلك)، واختر أو أنشئ ملف نشاطك التجاري، ثم اضغط")} <B>Create app</B>.</>,
              <>{tr("In the left menu open", "من القائمة افتح")} <B>WhatsApp → API Setup</B>. {tr("Meta adds a free test number for you.", "ستضيف ميتا رقماً تجريبياً مجانياً لك.")}</>,
              <>{tr("To use your own number, press", "لاستخدام رقمك الخاص اضغط")} <B>Add phone number</B> {tr("on the same page and confirm it with the SMS code.", "في نفس الصفحة وأكّده برمز الرسالة النصية.")}</>,
            ]}
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="https://developers.facebook.com/apps/creation/" target="_blank" rel="noreferrer" className="btn-secondary">
              <ExternalLink size={15} /> {tr("Open Meta for Developers", "افتح ميتا للمطورين")}
            </a>
            <button className="btn-primary" onClick={() => setStep(2)}>
              {tr("I've done this", "أنهيت هذه الخطوة")} <Next size={16} />
            </button>
          </div>
        </Step>

        <Step n={2} title={tr("Copy your access token", "انسخ رمز الوصول")} active={step === 2} done={step > 2} onOpen={() => setStep(2)}>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { v: "permanent" as const, t: tr("Permanent token", "رمز دائم"), d: tr("Recommended. Never expires.", "موصى به. لا تنتهي صلاحيته.") },
              { v: "temp" as const, t: tr("Quick test token", "رمز تجربة سريع"), d: tr("Works for 24 hours.", "يعمل لمدة ٢٤ ساعة.") },
            ].map((o) => (
              <button key={o.v} onClick={() => setTokenType(o.v)} className={`rounded-xl border p-3 text-start text-sm ${tokenType === o.v ? "border-brand-500 bg-brand-50" : "border-sand-200"}`}>
                <div className="font-semibold">{o.t}</div>
                <div className="text-xs text-ink-500">{o.d}</div>
              </button>
            ))}
          </div>
          {tokenType === "temp" ? (
            <Ol
              items={[
                <>{tr("In your Meta app open", "في تطبيقك على ميتا افتح")} <B>WhatsApp → API Setup</B>.</>,
                <>{tr("Press", "اضغط")} <B>Generate access token</B> {tr("and copy it.", "وانسخه.")}</>,
                <>{tr("Test numbers can only message numbers you add under", "الأرقام التجريبية تراسل فقط الأرقام التي تضيفها في")} <B>To → Manage phone number list</B>. {tr("Add your own mobile there.", "أضف رقم جوالك هناك.")}</>,
              ]}
            />
          ) : (
            <Ol
              items={[
                <>{tr("Open", "افتح")} <a className="font-semibold text-brand-600 underline" href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer">Business Settings → System users</a>.</>,
                <>{tr("Press", "اضغط")} <B>Add</B>, {tr("name it “Wasil” and choose the role", "سمّه «Wasil» واختر الدور")} <B>Admin</B>.</>,
                <>{tr("Press", "اضغط")} <B>Assign assets</B>: {tr("give it Full control of your app and of your WhatsApp account.", "امنحه تحكماً كاملاً في تطبيقك وفي حساب واتساب.")}</>,
                <>{tr("Press", "اضغط")} <B>Generate new token</B>, {tr("choose your app and set expiry to", "اختر تطبيقك واجعل مدة الصلاحية")} <B>Never</B>.</>,
                <>{tr("Tick", "حدّد")} <B>whatsapp_business_messaging</B> {tr("and", "و")} <B>whatsapp_business_management</B>, {tr("then generate and copy the token.", "ثم أنشئ الرمز وانسخه.")}</>,
              ]}
            />
          )}
          <label className="label mt-5">{tr("Paste your token", "الصق الرمز")}</label>
          <textarea className="input min-h-[80px] font-mono text-xs" dir="ltr" value={token} onChange={(e) => setToken(e.target.value.trim())} placeholder="EAAG…" />
          {err && step === 2 && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn-primary mt-4" disabled={busy || token.length < 20} onClick={lookup}>
            {busy ? <Spinner /> : <Search size={16} />} {tr("Find my WhatsApp number", "ابحث عن رقمي")}
          </button>
        </Step>

        <Step n={3} title={tr("Choose your number", "اختر رقمك")} active={step === 3} done={step > 3} onOpen={() => wabas && setStep(3)}>
          {!manualIds && allPhones.length > 0 ? (
            <div className="space-y-2">
              {allPhones.map((p) => (
                <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${picked.phone_number_id === p.id ? "border-brand-500 bg-brand-50" : "border-sand-200"}`}>
                  <input type="radio" checked={picked.phone_number_id === p.id} onChange={() => setPicked({ waba_id: p.waba.id, phone_number_id: p.id })} />
                  <div className="flex-1">
                    <div className="font-semibold tabular-nums" dir="ltr">{p.display_phone_number}</div>
                    <div className="text-xs text-ink-500">{p.verified_name} — {p.waba.name}</div>
                  </div>
                </label>
              ))}
              <button className="btn-ghost text-xs" onClick={() => setManualIds(true)}>{tr("My number isn't listed", "رقمي غير موجود")}</button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-ink-500">
                {tr("We couldn't find it automatically. Copy these two IDs from", "لم نجده تلقائياً. انسخ المعرّفين من")} <B>WhatsApp → API Setup</B>:
              </p>
              <div>
                <label className="label">{tr("Phone number ID", "معرّف رقم الهاتف")}</label>
                <input className="input font-mono" dir="ltr" value={picked.phone_number_id} onChange={(e) => setPicked({ ...picked, phone_number_id: e.target.value.trim() })} placeholder="1234567890" />
              </div>
              <div>
                <label className="label">{tr("WhatsApp Business Account ID", "معرّف حساب واتساب للأعمال")}</label>
                <input className="input font-mono" dir="ltr" value={picked.waba_id} onChange={(e) => setPicked({ ...picked, waba_id: e.target.value.trim() })} placeholder="1098765432" />
              </div>
            </div>
          )}
          <button className="mt-4 flex items-center gap-1 text-xs font-semibold text-ink-500" onClick={() => setShowPin(!showPin)}>
            <ChevronDown size={14} className={showPin ? "rotate-180" : ""} /> {tr("My own number shows “Pending” in Meta", "رقمي يظهر «قيد الانتظار» في ميتا")}
          </button>
          {showPin && (
            <div className="mt-2 rounded-xl bg-sand-100 p-4">
              <label className="label">{tr("Choose a 6-digit PIN", "اختر رمزاً من ٦ أرقام")}</label>
              <input className="input w-40 font-mono tracking-widest" dir="ltr" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
              <p className="hint">{tr("We'll register the number for you. Keep this PIN — it's your number's two-step verification code.", "سنسجّل الرقم لك. احتفظ بهذا الرمز — إنه رمز التحقق بخطوتين لرقمك.")}</p>
            </div>
          )}
          <button className="btn-primary mt-5" disabled={!picked.phone_number_id || !picked.waba_id} onClick={() => setStep(4)}>
            {tr("Continue", "متابعة")} <Next size={16} />
          </button>
        </Step>

        <Step n={4} title={tr("Receive customer replies", "استقبال ردود العملاء")} active={step === 4} done={false} onOpen={() => picked.phone_number_id && setStep(4)}>
          <p className="mb-4 text-sm text-ink-500">{tr("This lets Wasil show replies, delivery ticks and run your bots.", "هذا يسمح لواصل بعرض الردود وعلامات الاستلام وتشغيل الردود الآلية.")}</p>
          <Ol
            items={[
              <>{tr("In your Meta app open", "في تطبيقك على ميتا افتح")} <B>WhatsApp → Configuration</B>.</>,
              <>{tr("Under Webhook press", "تحت Webhook اضغط")} <B>Edit</B>, {tr("paste the two values below, then press", "والصق القيمتين أدناه، ثم اضغط")} <B>Verify and save</B>.</>,
              <>{tr("Under Webhook fields press", "تحت Webhook fields اضغط")} <B>Manage</B> {tr("and subscribe to", "واشترك في")} <B>messages</B>.</>,
            ]}
          />
          <div className="mt-4 space-y-3 rounded-xl border border-dashed border-sand-300 p-4">
            <CopyField label="Callback URL" value={hook.callback_url} />
            <CopyField label="Verify token" value={hook.verify_token} />
          </div>
          <div className="mt-5">
            <label className="label flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-brand-600" /> {tr("App secret (recommended)", "المفتاح السري للتطبيق (موصى به)")}
            </label>
            <input className="input font-mono" dir="ltr" value={appSecret} onChange={(e) => setAppSecret(e.target.value.trim())} placeholder="••••••••••••" />
            <p className="hint">{tr("App settings → Basic → App secret → Show. Stops anyone faking messages to your account.", "إعدادات التطبيق ← أساسي ← App secret ← إظهار. يمنع أي شخص من تزوير رسائل لحسابك.")}</p>
          </div>
          {err && step === 4 && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn-primary mt-5 w-full py-3" disabled={busy} onClick={connect}>
            {busy ? <Spinner /> : <Check size={18} />} {tr("Connect my number", "اربط رقمي")}
          </button>
        </Step>
      </div>
    </div>
  );
}
