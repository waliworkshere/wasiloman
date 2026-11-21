"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { CheckCircle2, Wrench, Smartphone, Building2, ShieldCheck, ArrowRight, ArrowLeft, PartyPopper } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { PageHeader, Spinner, api } from "@/components/ui";

function Facebook({ size = 20, fill = "currentColor" }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden>
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export default function ConnectPage() {
  const { tr, dir } = useLang();
  const router = useRouter();
  const { account, refresh } = useAccount();
  const [method, setMethod] = useState<"facebook" | "manual">("facebook");
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ phone: string; name: string } | null>(null);
  const [manual, setManual] = useState({ access_token: "", waba_id: "", phone_number_id: "" });
  const signup = useRef<{ code?: string; waba_id?: string; phone_number_id?: string; sent?: boolean }>({});
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID;

  // Init Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: true, version: process.env.NEXT_PUBLIC_META_GRAPH_VERSION || "v23.0" });
      setSdkReady(true);
    };
    if (window.FB) window.fbAsyncInit();
  }, [appId]);

  // Embedded Signup sends the WABA + phone number IDs through postMessage
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!String(event.origin).endsWith("facebook.com")) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
        if (data.event === "CANCEL") {
          setBusy(false);
          setError(tr(`The setup was closed at step: ${data.data?.current_step || "unknown"}. Please try again.`, "تم إغلاق نافذة الإعداد قبل الانتهاء. حاول مرة أخرى."));
          return;
        }
        if (String(data.event).startsWith("FINISH")) {
          signup.current.waba_id = data.data?.waba_id;
          signup.current.phone_number_id = data.data?.phone_number_id;
          maybeFinish();
        }
      } catch {}
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = async (payload: any) => {
    setBusy(true);
    setError(null);
    try {
      const res = await api("/api/whatsapp/connect", payload);
      await refresh();
      setDone({ phone: res.display_phone, name: res.verified_name });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const maybeFinish = () => {
    const s = signup.current;
    if (s.code && s.waba_id && !s.sent) {
      s.sent = true;
      finish({ mode: "facebook", ...s });
    }
  };

  const launchFacebook = () => {
    setError(null);
    if (!window.FB) return setError(tr("Facebook is still loading, please wait a second.", "فيسبوك ما زال يُحمّل، انتظر ثانية."));
    signup.current = {};
    setBusy(true);
    window.FB.login(
      (response: any) => {
        const code = response?.authResponse?.code;
        if (!code) {
          setBusy(false);
          return;
        }
        signup.current.code = code;
        maybeFinish();
        // If the popup didn't send the WABA id, let the server find it
        setTimeout(() => {
          if (!signup.current.sent) {
            signup.current.sent = true;
            finish({ mode: "facebook", code });
          }
        }, 2500);
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      }
    );
  };

  if (done || account) {
    const phone = done?.phone || account?.display_phone;
    const name = done?.name || account?.verified_name;
    return (
      <div className="card mx-auto max-w-xl p-10 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <PartyPopper size={30} />
        </div>
        <h1 className="text-2xl font-bold">{tr("Your WhatsApp is connected!", "تم ربط واتساب بنجاح!")}</h1>
        <p className="mt-2 text-ink-500">
          <span dir="ltr" className="font-semibold text-ink-900">{phone}</span> · {name}
        </p>
        <div className="mt-8 grid gap-3 text-start sm:grid-cols-2">
          <button onClick={() => router.push("/contacts")} className="btn-secondary justify-between">
            {tr("1. Add your contacts", "١. أضف جهات الاتصال")} <Arrow size={16} />
          </button>
          <button onClick={() => router.push("/templates/new")} className="btn-secondary justify-between">
            {tr("2. Create a message", "٢. أنشئ رسالة")} <Arrow size={16} />
          </button>
        </div>
        <button onClick={() => router.push("/dashboard")} className="btn-primary mt-4 w-full">
          {tr("Go to home", "الذهاب للرئيسية")}
        </button>
      </div>
    );
  }

  const needs = [
    { icon: Facebook, t: tr("A Facebook account", "حساب فيسبوك"), d: tr("Your personal one is fine. We never post anything.", "حسابك الشخصي يكفي. لن ننشر أي شيء.") },
    { icon: Smartphone, t: tr("A phone number", "رقم هاتف"), d: tr("Omantel, Ooredoo or Vodafone. It must NOT be active on the WhatsApp app — delete it from the app first, or use a new number.", "عمانتل أو أوريدو أو فودافون. يجب ألا يكون مفعّلاً على تطبيق واتساب — احذفه من التطبيق أولاً أو استخدم رقماً جديداً.") },
    { icon: Building2, t: tr("Your business name", "اسم نشاطك التجاري"), d: tr("This name is shown to customers on WhatsApp.", "هذا الاسم يظهر للعملاء على واتساب.") },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" crossOrigin="anonymous" onLoad={() => window.fbAsyncInit?.()} />
      <PageHeader
        title={tr("Connect your WhatsApp number", "اربط رقم واتساب الخاص بك")}
        subtitle={tr("Choose how you want to connect. Most people use Facebook — it takes about 2 minutes.", "اختر طريقة الربط. معظم الناس يستخدمون فيسبوك — تستغرق حوالي دقيقتين.")}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {[
          { id: "facebook" as const, icon: Facebook, t: tr("Connect with Facebook", "الربط عبر فيسبوك"), d: tr("Recommended · Easy, no technical steps", "موصى به · سهل وبدون خطوات تقنية") },
          { id: "manual" as const, icon: Wrench, t: tr("Manual setup", "إعداد يدوي"), d: tr("For developers with their own Meta app", "للمطورين الذين لديهم تطبيق ميتا") },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`card flex items-start gap-3 p-5 text-start transition ${method === m.id ? "border-brand-500 ring-4 ring-brand-100" : "hover:border-sand-300"}`}
          >
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${method === m.id ? "bg-brand-600 text-white" : "bg-sand-100 text-ink-500"}`}>
              <m.icon size={19} />
            </div>
            <div>
              <div className="font-semibold">{m.t}</div>
              <div className="text-sm text-ink-500">{m.d}</div>
            </div>
          </button>
        ))}
      </div>

      {method === "facebook" ? (
        <div className="card p-6 md:p-8">
          <h2 className="font-semibold">{tr("Before you start, have these ready:", "قبل أن تبدأ، جهّز التالي:")}</h2>
          <div className="mt-4 space-y-4">
            {needs.map((n) => (
              <div key={n.t} className="flex gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <n.icon size={17} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{n.t}</div>
                  <div className="text-sm text-ink-500">{n.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-sand-100 p-4 text-sm text-ink-700">
            <div className="mb-2 font-semibold">{tr("What happens in the Facebook window:", "ماذا يحدث في نافذة فيسبوك:")}</div>
            <ol className="list-decimal space-y-1 ps-5 text-ink-500">
              <li>{tr("Log in to Facebook and press Continue.", "سجّل الدخول إلى فيسبوك واضغط متابعة.")}</li>
              <li>{tr("Choose or create your business portfolio.", "اختر أو أنشئ ملف نشاطك التجاري.")}</li>
              <li>{tr("Create a WhatsApp Business account & display name.", "أنشئ حساب واتساب للأعمال واسم العرض.")}</li>
              <li>{tr("Enter your phone number and the 6-digit code you receive by SMS.", "أدخل رقم هاتفك والرمز المكوّن من ٦ أرقام الذي يصلك برسالة.")}</li>
              <li>{tr("Press Finish — we'll do the rest automatically.", "اضغط إنهاء — وسنكمل الباقي تلقائياً.")}</li>
            </ol>
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {!appId || !configId ? (
            <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {tr(
                "Admin: set NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_CONFIG_ID to enable Facebook connect.",
                "للمسؤول: أضف NEXT_PUBLIC_META_APP_ID و NEXT_PUBLIC_META_CONFIG_ID لتفعيل الربط عبر فيسبوك."
              )}
            </p>
          ) : null}

          <button onClick={launchFacebook} disabled={busy || !sdkReady || !appId || !configId} className="btn mt-6 w-full bg-[#1877F2] py-3.5 text-base text-white hover:bg-[#166FE0]">
            {busy ? <Spinner /> : <Facebook size={20} fill="white" />}
            {busy ? tr("Connecting… keep the Facebook window open", "جارٍ الربط… لا تغلق نافذة فيسبوك") : tr("Connect with Facebook", "الربط عبر فيسبوك")}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
            <ShieldCheck size={14} /> {tr("Secure official Meta login. We never see your Facebook password.", "تسجيل دخول رسمي وآمن من ميتا. لا نرى كلمة مرور فيسبوك أبداً.")}
          </p>
        </div>
      ) : (
        <form
          className="card space-y-5 p-6 md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            finish({ mode: "manual", ...manual });
          }}
        >
          <div className="rounded-xl bg-sand-100 p-4 text-sm text-ink-500">
            {tr(
              "Open developers.facebook.com → your app → WhatsApp → API Setup. Copy the values below. Use a permanent System User token (Business Settings → System users) so it doesn't expire.",
              "افتح developers.facebook.com ← تطبيقك ← WhatsApp ← API Setup وانسخ القيم أدناه. استخدم رمز مستخدم نظام دائم حتى لا تنتهي صلاحيته."
            )}
          </div>
          {[
            { k: "phone_number_id" as const, l: tr("Phone number ID", "معرّف رقم الهاتف"), p: "1234567890" },
            { k: "waba_id" as const, l: tr("WhatsApp Business Account ID", "معرّف حساب واتساب للأعمال"), p: "1098765432" },
            { k: "access_token" as const, l: tr("Permanent access token", "رمز الوصول الدائم"), p: "EAAG..." },
          ].map((f) => (
            <div key={f.k}>
              <label className="label">{f.l}</label>
              <input className="input font-mono" dir="ltr" required value={manual[f.k]} placeholder={f.p} onChange={(e) => setManual({ ...manual, [f.k]: e.target.value })} />
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-sand-300 p-4 text-sm">
            <div className="font-semibold">{tr("Webhook settings (paste in Meta → WhatsApp → Configuration)", "إعدادات الويب هوك (الصقها في ميتا ← WhatsApp ← Configuration)")}</div>
            <div className="mt-2 grid gap-1 font-mono text-xs text-ink-500" dir="ltr">
              <div>Callback URL: {typeof window !== "undefined" ? window.location.origin : ""}/api/webhook</div>
              <div>Verify token: {tr("(the WHATSAPP_VERIFY_TOKEN from your settings)", "(قيمة WHATSAPP_VERIFY_TOKEN)")}</div>
              <div>Fields: messages</div>
            </div>
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy ? <Spinner /> : <CheckCircle2 size={18} />} {tr("Connect", "ربط")}
          </button>
        </form>
      )}
    </div>
  );
}
