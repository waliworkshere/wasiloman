"use client";
import Link from "next/link";
import { Send, Bot, Users, MessagesSquare, ShieldCheck, Zap, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/ui";
import { useLang } from "@/lib/i18n";

export default function Landing() {
  const { tr } = useLang();
  const features = [
    { icon: Send, t: tr("Bulk send in one click", "إرسال جماعي بنقرة واحدة"), d: tr("Pick your customers, pick a message, press send. That's it.", "اختر عملاءك، اختر الرسالة، واضغط إرسال. بكل بساطة.") },
    { icon: Bot, t: tr("Auto-reply bots", "ردود آلية ذكية"), d: tr("Answer “price?”, “location?” and “menu” 24/7 without lifting a finger.", "رد على «كم السعر؟» و«وين موقعكم؟» على مدار الساعة تلقائياً.") },
    { icon: Users, t: tr("Upload your contacts", "ارفع قائمة عملائك"), d: tr("Import from Excel/CSV. Omani numbers like 9xxxxxxx are fixed automatically.", "استورد من إكسل. أرقام عُمان مثل 9xxxxxxx تُصحَّح تلقائياً.") },
    { icon: MessagesSquare, t: tr("One shared inbox", "صندوق محادثات واحد"), d: tr("See every reply from customers and answer them from your computer.", "شاهد كل ردود العملاء ورد عليهم من جهازك.") },
    { icon: ShieldCheck, t: tr("Official WhatsApp API", "واجهة واتساب الرسمية"), d: tr("Uses Meta's official Cloud API — your number stays safe, no bans.", "نستخدم واجهة ميتا الرسمية — رقمك آمن بدون حظر.") },
    { icon: Zap, t: tr("Connect in 2 minutes", "اربط خلال دقيقتين"), d: tr("Log in with Facebook and your number is ready. No technical steps.", "سجّل الدخول بفيسبوك ورقمك جاهز. بدون خطوات تقنية.") },
  ];
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <LangToggle />
          <Link href="/login" className="btn-primary">
            {tr("Log in", "تسجيل الدخول")}
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-2">
        <div>
          <span className="badge bg-gold-400/15 text-gold-600">🇴🇲 {tr("Made for businesses in Oman", "صُمم للأعمال في عُمان")}</span>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-ink-900 md:text-5xl">
            {tr("Reach all your customers on WhatsApp — at once.", "تواصل مع كل عملائك على واتساب — دفعة واحدة.")}
          </h1>
          <p className="mt-5 text-lg text-ink-500">
            {tr(
              "Wasil Oman helps shops, restaurants, clinics and companies send offers, reminders and updates to hundreds of customers, and reply automatically.",
              "واصل عُمان يساعد المحلات والمطاعم والعيادات والشركات على إرسال العروض والتذكيرات لمئات العملاء، والرد عليهم تلقائياً."
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login?mode=signup" className="btn-primary px-6 py-3 text-base">
              {tr("Start free", "ابدأ مجاناً")}
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">
              {tr("I have an account", "لدي حساب")}
            </Link>
          </div>
          <ul className="mt-8 space-y-2 text-sm text-ink-500">
            {[tr("No coding needed", "بدون برمجة"), tr("Arabic & English", "عربي وإنجليزي"), tr("Official Meta partner API", "واجهة ميتا الرسمية")].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-brand-500" /> {x}
              </li>
            ))}
          </ul>
        </div>

        {/* Phone mockup */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-brand-100 to-sand-200" />
          <div className="overflow-hidden rounded-[2.2rem] border-8 border-ink-900 bg-[#ECE5DD] shadow-2xl">
            <div className="flex items-center gap-3 bg-brand-700 px-4 py-3 text-white">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-sm font-bold">م</div>
              <div>
                <div className="text-sm font-semibold">{tr("Muscat Sweets", "حلويات مسقط")}</div>
                <div className="text-[11px] text-brand-100">{tr("Business account", "حساب أعمال")}</div>
              </div>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div className="max-w-[85%] rounded-xl rounded-ss-none bg-white p-3 shadow-sm">
                <div className="mb-2 h-28 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600" />
                <p>{tr("Eid Mubarak, Ahmed! 🌙 Enjoy 20% off all Omani halwa this week.", "عيد مبارك يا أحمد! 🌙 خصم ٢٠٪ على جميع الحلوى العمانية هذا الأسبوع.")}</p>
                <div className="mt-2 border-t pt-2 text-center font-semibold text-sky-600">{tr("View offer", "شاهد العرض")}</div>
              </div>
              <div className="ms-auto max-w-[70%] rounded-xl rounded-se-none bg-[#DCF8C6] p-3 shadow-sm">{tr("Location?", "وين موقعكم؟")}</div>
              <div className="max-w-[85%] rounded-xl rounded-ss-none bg-white p-3 shadow-sm">
                📍 {tr("Al Khuwair, Muscat. Open 9am – 11pm. 🤖", "الخوير، مسقط. مفتوح ٩ص – ١١م. 🤖")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">{tr("Everything you need, nothing complicated", "كل ما تحتاجه، بدون تعقيد")}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.t} className="rounded-2xl border border-sand-200 p-6">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon size={20} />
                </div>
                <h3 className="font-semibold">{f.t}</h3>
                <p className="mt-1.5 text-sm text-ink-500">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-ink-400">© {new Date().getFullYear()} Wasil Oman · واصل عُمان</footer>
    </div>
  );
}
