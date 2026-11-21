"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Bot, Users, MessagesSquare, ShieldCheck, Languages, Play, CheckCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { enterDemo } from "@/lib/demo";

export default function Landing() {
  const { tr } = useLang();
  const router = useRouter();
  const demo = () => {
    enterDemo();
    router.push("/dashboard");
  };

  const steps = [
    { t: tr("Connect your number", "اربط رقمك"), d: tr("Use any Omantel, Ooredoo or Vodafone number on the official WhatsApp Business API.", "استخدم أي رقم من عمانتل أو أوريدو أو فودافون عبر واجهة واتساب للأعمال الرسمية.") },
    { t: tr("Upload your customers", "ارفع قائمة عملائك"), d: tr("Import your Excel list. Omani numbers like 9123 4567 are fixed automatically.", "استورد قائمة إكسل. أرقام عُمان مثل 9123 4567 تُصحَّح تلقائياً.") },
    { t: tr("Send, then let the bot reply", "أرسل، ودع الرد الآلي يجيب"), d: tr("Send an offer to everyone at once and see who read it. Bots answer “price?” and “location?” for you.", "أرسل عرضاً للجميع دفعة واحدة وشاهد من قرأه. الردود الآلية تجيب عن «كم السعر؟» و«وين موقعكم؟».") },
  ];
  const features = [
    { icon: Send, t: tr("Bulk send with live results", "إرسال جماعي بنتائج مباشرة"), d: tr("Sent, delivered and read — for every customer, as it happens.", "أُرسلت، وصلت، قُرئت — لكل عميل، لحظة بلحظة.") },
    { icon: Bot, t: tr("Drag-and-drop bots", "ردود آلية بالسحب والإفلات"), d: tr("Menus, questions and handover to staff. No code.", "قوائم وأسئلة وتحويل لموظف. بدون برمجة.") },
    { icon: MessagesSquare, t: tr("One shared inbox", "صندوق محادثات واحد"), d: tr("Every reply in one place, answered from your computer.", "كل الردود في مكان واحد، ترد عليها من جهازك.") },
    { icon: Users, t: tr("Tags and lists", "وسوم وقوائم"), d: tr("Send to VIPs in Muscat only, or everyone who joined in Ramadan.", "أرسل لعملاء VIP في مسقط فقط، أو لمن انضم في رمضان.") },
    { icon: Languages, t: tr("Arabic and English", "عربي وإنجليزي"), d: tr("The whole app, and your messages, in both languages.", "التطبيق كاملاً ورسائلك باللغتين.") },
    { icon: ShieldCheck, t: tr("Official API, no bans", "واجهة رسمية بدون حظر"), d: tr("Built on Meta's Cloud API — not a risky WhatsApp Web hack.", "مبني على واجهة ميتا الرسمية — وليس على حيل واتساب ويب.") },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-ink-950 text-white">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Logo light />
          <div className="flex items-center gap-2">
            <LangToggle className="border-white/10 bg-white/5 [&_button[aria-pressed=false]]:text-ink-300" />
            <Link href="/login" className="btn px-3 text-ink-300 hover:text-white">{tr("Log in", "دخول")}</Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-24 pt-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-5 text-sm font-medium text-gold-400">{tr("WhatsApp marketing for businesses in Oman", "تسويق عبر واتساب للأعمال في عُمان")}</p>
            <h1 className="max-w-xl text-[40px] font-bold leading-[1.08] tracking-[-0.025em] md:text-[54px]">
              {tr("Your customers read WhatsApp. Reach all of them at once.", "عملاؤك يقرؤون واتساب. تواصل معهم جميعاً دفعة واحدة.")}
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-300">
              {tr(
                "Send offers, reminders and greetings to hundreds of customers, see who read them, and let a bot answer the questions you get every day.",
                "أرسل العروض والتذكيرات والتهاني لمئات العملاء، واعرف من قرأها، ودع الرد الآلي يجيب عن الأسئلة اليومية."
              )}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={demo} className="btn-primary px-5 py-3 text-[15px]">
                <Play size={16} fill="currentColor" /> {tr("Try the live demo", "جرّب العرض الحي")}
              </button>
              <Link href="/login?mode=signup" className="btn border border-white/15 px-5 py-3 text-[15px] text-white hover:bg-white/5">
                {tr("Create free account", "أنشئ حساباً مجانياً")}
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink-400">{tr("The demo uses sample data from a Muscat sweets shop. No sign-up needed.", "العرض يستخدم بيانات نموذجية لمحل حلويات في مسقط. بدون تسجيل.")}</p>
          </div>

          {/* Product moment: a campaign report next to the message customers see */}
          <div className="relative mx-auto w-full max-w-md" dir="ltr">
            <div className="rounded-2xl border border-white/10 bg-white p-5 text-ink-900 shadow-pop">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-ink-400">Bulk message</div>
                  <div className="font-semibold">National Day halwa offer</div>
                </div>
                <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/60"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />Completed</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[["Sent", "1,151"], ["Delivered", "95%"], ["Read", "71%"]].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-sand-50 p-3">
                    <div className="text-xs text-ink-400">{l}</div>
                    <div className="num mt-1 text-xl font-bold tracking-tight">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[["Sent", 100, "bg-ink-800"], ["Delivered", 95, "bg-brand-700"], ["Read", 71, "bg-brand-500"], ["Replied", 18, "bg-gold-400"]].map(([l, w, c]) => (
                  <div key={l as string} className="flex items-center gap-3 text-xs">
                    <span className="w-16 text-ink-500">{l}</span>
                    <div className="h-2 flex-1 rounded-full bg-sand-100"><div className={`h-2 rounded-full ${c}`} style={{ width: `${w}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-16 -right-3 w-60 rounded-2xl bg-[#EFEAE2] p-3 shadow-pop md:-right-10" dir="rtl">
              <div className="rounded-xl rounded-ss-none bg-white p-2.5 text-[13px] leading-relaxed text-ink-900 shadow-sm" style={{ fontFamily: "var(--font-arabic)" }}>
                <div className="mb-2 h-16 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600" />
                كل عام وأنتم بخير يا أحمد 🇴🇲 خصم <b>20%</b> على جميع أنواع الحلوى العمانية.
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-ink-400">9:41 <CheckCheck size={13} className="text-sky-500" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — a real sequence */}
      <section className="border-b border-sand-200 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="max-w-lg text-[28px] font-bold leading-tight tracking-[-0.02em]">{tr("Up and running in an afternoon", "جاهز للعمل خلال ساعات")}</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.t} className="border-t-2 border-ink-900 pt-5">
                <div className="num text-sm font-bold text-brand-600">{i + 1}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-canvas py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-[28px] font-bold tracking-[-0.02em]">{tr("Everything a busy shop needs", "كل ما يحتاجه محل مشغول")}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.t} className="flex gap-4">
                <f.icon size={20} className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  <h3 className="font-semibold">{f.t}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-500">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink-950 px-8 py-8 text-white">
            <div>
              <div className="text-xl font-semibold">{tr("See it with real-looking data", "شاهده ببيانات حقيقية المظهر")}</div>
              <div className="mt-1 text-sm text-ink-300">{tr("Click around a full workspace — campaigns, inbox, bots — before you sign up.", "تصفح مساحة عمل كاملة — حملات، محادثات، ردود آلية — قبل التسجيل.")}</div>
            </div>
            <button onClick={demo} className="btn-primary px-5 py-3"><Play size={16} fill="currentColor" />{tr("Open the demo", "افتح العرض التجريبي")}</button>
          </div>
        </div>
      </section>

      <footer className="border-t border-sand-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-ink-400">
          <Logo size={26} />
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink-900">{tr("Privacy policy", "سياسة الخصوصية")}</Link>
            <Link href="/data-deletion" className="hover:text-ink-900">{tr("Data deletion", "حذف البيانات")}</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
