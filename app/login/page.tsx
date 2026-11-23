"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LangToggle, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { enterDemo, exitDemo } from "@/lib/demo";
import { Play } from "lucide-react";

function LoginForm() {
  const { tr } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    exitDemo();
    const sb = supabaseBrowser();
    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else if (!data.session) setInfo(tr("Check your email to confirm your account, then log in.", "افحص بريدك الإلكتروني لتأكيد حسابك، ثم سجّل الدخول."));
      else router.push("/connect");
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setError(tr("Wrong email or password.", "البريد أو كلمة المرور غير صحيحة."));
      else router.push("/dashboard");
    }
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink-950 p-12 text-white lg:flex">
        <Logo light size={30} />
        <div>
          <h2 className="max-w-md text-[34px] font-bold leading-tight tracking-[-0.02em]">{tr("Your customers are on WhatsApp. Now you are too.", "عملاؤك على واتساب. والآن أنت أيضاً.")}</h2>
          <p className="mt-4 text-ink-300">{tr("Send offers to hundreds of customers and let bots answer questions for you.", "أرسل العروض لمئات العملاء ودع الردود الآلية تجيب عنك.")}</p>
        </div>
        <div className="text-sm text-ink-400">🇴🇲 Muscat · Sohar · Salalah · Nizwa · Sur</div>
      </div>
      <div className="flex flex-col p-6">
        <div className="flex justify-between lg:justify-end">
          <div className="lg:hidden">
            <Logo />
          </div>
          <LangToggle />
        </div>
        <div className="m-auto w-full max-w-sm py-10">
          <h1 className="text-2xl font-bold">{mode === "login" ? tr("Welcome back", "أهلاً بعودتك") : tr("Create your free account", "أنشئ حسابك المجاني")}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {mode === "login" ? tr("Log in to continue to Wasil Oman.", "سجّل الدخول للمتابعة إلى واصل عُمان.") : tr("It takes less than a minute.", "يستغرق أقل من دقيقة.")}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">{tr("Email", "البريد الإلكتروني")}</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" placeholder="you@company.om" />
            </div>
            <div>
              <label className="label">{tr("Password", "كلمة المرور")}</label>
              <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
            </div>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {info && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">{info}</p>}
            <button className="btn-primary w-full py-2.5" disabled={busy}>
              {busy && <Spinner />}
              {mode === "login" ? tr("Log in", "تسجيل الدخول") : tr("Create account", "إنشاء الحساب")}
            </button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-ink-400"><span className="h-px flex-1 bg-sand-200" />{tr("or", "أو")}<span className="h-px flex-1 bg-sand-200" /></div>
          <button type="button" onClick={() => { enterDemo(); router.push("/dashboard"); }} className="btn-secondary w-full py-2.5">
            <Play size={15} /> {tr("Explore the demo first", "استكشف العرض التجريبي أولاً")}
          </button>
          <p className="mt-6 text-center text-sm text-ink-500">
            {mode === "login" ? tr("New here?", "جديد هنا؟") : tr("Already have an account?", "لديك حساب؟")}{" "}
            <button className="font-semibold text-brand-600" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? tr("Create an account", "أنشئ حساباً") : tr("Log in", "سجّل الدخول")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
