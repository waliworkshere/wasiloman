"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, CheckCheck, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { enterDemo } from "@/lib/demo";
import { CONTACT_EMAIL, PricingPlans } from "@/components/PricingCard";
import { AppFrame } from "@/components/landing/AppFrame";

/* Photographs: Wikimedia Commons, credited in the footer */
const P = (id: string, big = true) => ({
  src: `/photos/photo-${id}-960.jpg`,
  srcSet: `/photos/photo-${id}-500.jpg 500w, /photos/photo-${id}-960.jpg 960w${big ? `, /photos/photo-${id}.jpg 1280w` : ""}`,
});

function Photo({ id, alt, big = true, sizes = "50vw", className = "", priority = false }: { id: string; alt: string; big?: boolean; sizes?: string; className?: string; priority?: boolean }) {
  const p = P(id, big);
  return (
    <div className={`photo ${className}`}>
      <img src={p.src} srcSet={p.srcSet} sizes={sizes} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

const CREDITS = [
  ["Simo.Albo80", "https://commons.wikimedia.org/wiki/File:Uomo_omanita_in_abito_tradizionale_con_khanjar_al_Souq_di_Sinaw_(Oman).jpg", "CC BY-SA 4.0"],
  ["Andries Oudshoorn", "https://commons.wikimedia.org/wiki/File:Muttrah_(4).jpg", "CC BY-SA 2.0"],
  ["Ji-Elle", "https://commons.wikimedia.org/wiki/File:Nizwa-Tailors_(1).jpg", "CC BY-SA 3.0"],
  ["Fabio Achilli", "https://commons.wikimedia.org/wiki/File:Nizwa_craft_market_(37125080815).jpg", "CC BY 2.0"],
  ["Andries Oudshoorn", "https://commons.wikimedia.org/wiki/File:Nizwa_(3).jpg", "CC BY-SA 2.0"],
  ["Domenico Convertini", "https://commons.wikimedia.org/wiki/File:Old_Muscat_City_View,_Muscat,_Oman3.jpg", "CC BY-SA 2.0"],
];

export default function Landing() {
  const { tr } = useLang();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const demo = () => {
    enterDemo();
    router.push("/dashboard");
  };

  const links = [
    { href: "#product", l: tr("Product", "المنتج") },
    { href: "#who", l: tr("Who it's for", "لمن") },
    { href: "#pricing", l: tr("Pricing", "الأسعار") },
  ];

  return (
    <div className="bg-white text-black">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-black focus:px-3 focus:py-2 focus:text-white">
        {tr("Skip to content", "تخطَّ إلى المحتوى")}
      </a>

      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-6">
          <Link href="/" aria-label="WasilOman">
            <Logo size={30} />
          </Link>
          <nav className="hidden items-center gap-8 text-[14px] text-ink-600 md:flex">
            {links.map((x) => (
              <a key={x.href} href={x.href} className="transition-colors hover:text-black">{x.l}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <LangToggle />
            <Link href="/login" className="btn px-3 text-ink-600 hover:text-black">{tr("Log in", "دخول")}</Link>
            <button onClick={demo} className="btn-primary">{tr("Open the demo", "افتح العرض التجريبي")}</button>
          </div>
          <button className="btn-ghost -me-2 h-11 w-11 p-0 md:hidden" aria-label={tr("Menu", "القائمة")} aria-expanded={menu} onClick={() => setMenu(!menu)}>
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menu && (
          <div className="border-t border-sand-200 bg-white px-6 pb-6 pt-2 md:hidden">
            {links.map((x) => (
              <a key={x.href} href={x.href} onClick={() => setMenu(false)} className="block border-b border-sand-100 py-3.5 text-[17px]">{x.l}</a>
            ))}
            <div className="mt-5 flex items-center justify-between">
              <LangToggle />
              <Link href="/login" className="btn h-11 px-3 text-ink-600">{tr("Log in", "دخول")}</Link>
            </div>
            <button onClick={demo} className="btn-primary mt-4 h-12 w-full">{tr("Open the demo", "افتح العرض التجريبي")}</button>
          </div>
        )}
      </header>

      <main id="main">
        {/* 1 — Hero */}
        <section className="mx-auto grid min-h-[calc(100svh-64px)] max-w-[1240px] items-center gap-12 px-6 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="enter">
            <h1 className="text-[44px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[58px] lg:text-[68px]">
              {tr("WhatsApp marketing for shops and businesses in Oman.", "تسويق عبر واتساب للمحلات والشركات في عُمان.")}
            </h1>
            <p className="mt-7 max-w-[34rem] text-[18px] leading-[1.55] text-ink-500">
              {tr(
                "Send one offer to all your customers, see who read it, and let a bot answer the questions you get every day. In Arabic and English, on the official WhatsApp Business API.",
                "أرسل عرضاً واحداً لكل عملائك، واعرف من قرأه، ودع الرد الآلي يجيب عن الأسئلة اليومية. بالعربية والإنجليزية، عبر واجهة واتساب للأعمال الرسمية."
              )}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={demo} className="btn-primary h-12 px-6 text-[15px]">{tr("Open the demo", "افتح العرض التجريبي")}</button>
              <a href="#pricing" className="btn h-12 border border-black px-6 text-[15px] text-black hover:bg-black hover:text-white">{tr("See the plans", "اطّلع على الخطط")}</a>
            </div>
            <p className="mt-8 border-t border-sand-200 pt-5 text-[14px] text-ink-500">
              <span className="font-medium text-black">{tr("$150 a month", "١٥٠ دولاراً شهرياً")}</span>{" "}
              {tr("for the National Day offer, with no limit on messages or contacts.", "في عرض العيد الوطني، بلا حدود للرسائل أو جهات الاتصال.")}
            </p>
          </div>

          <div className="enter relative mx-auto w-full max-w-[520px] lg:max-w-none">
            <Photo id="f183280244" big={false} priority sizes="(max-width: 1023px) 100vw, 45vw" alt={tr("An Omani man in a white dishdasha and massar, seated at a souq", "رجل عُماني بالدشداشة البيضاء والمصر، جالس في سوق")} className="aspect-[4/5] rounded-2xl" />
            <div className="absolute -bottom-6 start-4 w-[min(300px,82%)] rounded-xl border border-black/10 bg-white p-4 shadow-pop sm:-start-8">
              <div className="flex items-center justify-between text-[12px] text-ink-500">
                <span>{tr("Bulk message", "رسالة جماعية")}</span>
                <span className="flex items-center gap-1 text-black"><CheckCheck size={14} /> {tr("Done", "اكتملت")}</span>
              </div>
              <div className="mt-1 text-[15px] font-semibold">{tr("National Day halwa offer", "عرض الحلوى للعيد الوطني")}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                {[["1,151", tr("sent", "أُرسلت")], ["95%", tr("delivered", "وصلت")], ["71%", tr("read", "قُرئت")]].map(([v, l]) => (
                  <div key={l}>
                    <div className="num text-[18px] font-semibold tracking-tight">{v}</div>
                    <div className="text-ink-500">{l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-sand-100"><div className="h-1.5 w-[71%] rounded-full bg-black" /></div>
            </div>
          </div>
        </section>

        {/* 2 — Product */}
        <section id="product" className="scroll-mt-16 border-t border-sand-200 bg-canvas">
          <div className="mx-auto flex min-h-[100svh] max-w-[1240px] flex-col justify-center px-6 py-20">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
              <h2 className="max-w-[18ch] text-[34px] font-medium leading-[1.08] tracking-[-0.035em] sm:text-[44px]">
                {tr("Every campaign, receipt and reply on one screen.", "كل حملة وكل إشعار قراءة وكل رد في شاشة واحدة.")}
              </h2>
              <p className="max-w-[30rem] text-[17px] leading-[1.6] text-ink-500 lg:justify-self-end">
                {tr(
                  "Sent, delivered and read for every customer, a chart of the last two weeks, and the newest replies waiting for you. No spreadsheets, no phone full of broadcast lists.",
                  "الإرسال والوصول والقراءة لكل عميل، ورسم لآخر أسبوعين، وأحدث الردود بانتظارك. بدون جداول، وبدون هاتف مليء بقوائم البث."
                )}
              </p>
            </div>
            <div className="mt-12">
              <AppFrame />
            </div>
          </div>
        </section>

        {/* 3 — Who it's for */}
        <section id="who" className="scroll-mt-16">
          <div className="mx-auto grid min-h-[100svh] max-w-[1240px] items-center gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <h2 className="max-w-[16ch] text-[34px] font-medium leading-[1.08] tracking-[-0.035em] sm:text-[44px]">
                {tr("Built for the way Oman sells.", "صُمم بطريقة البيع في عُمان.")}
              </h2>
              <p className="mt-6 max-w-[30rem] text-[17px] leading-[1.6] text-ink-500">
                {tr(
                  "From a tailor in Nizwa to a halwa shop in Muttrah, your customers already answer on WhatsApp. WasilOman lets you reach every one of them at once, by name.",
                  "من خيّاط في نزوى إلى محل حلوى في مطرح، عملاؤك يردّون على واتساب أصلاً. واصل عُمان يتيح لك الوصول إليهم جميعاً دفعة واحدة، وبأسمائهم."
                )}
              </p>
              <ul className="mt-10 divide-y divide-sand-200 border-y border-sand-200 text-[16px]">
                {[
                  [tr("Shops and souq stalls", "المحلات ومحلات السوق"), tr("offers, new stock, Eid hours", "العروض، البضاعة الجديدة، مواعيد العيد")],
                  [tr("Restaurants and cafés", "المطاعم والمقاهي"), tr("menus, orders, weekend deals", "القوائم، الطلبات، عروض نهاية الأسبوع")],
                  [tr("Clinics and salons", "العيادات والصالونات"), tr("appointment reminders", "تذكير بالمواعيد")],
                  [tr("Real estate and car dealers", "العقارات ومعارض السيارات"), tr("new listings to the right buyers", "عروض جديدة للمشترين المناسبين")],
                ].map(([a, b]) => (
                  <li key={a} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                    <span className="font-medium">{a}</span>
                    <span className="text-[14px] text-ink-500">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Photo id="f6832825" sizes="(max-width: 1023px) 100vw, 55vw" alt={tr("Shoppers walking through Muttrah souq", "متسوقون في سوق مطرح")} className="col-span-2 aspect-[16/9] rounded-2xl" />
              <Photo id="f12796336" sizes="(max-width: 1023px) 50vw, 27vw" alt={tr("Dishdashas hanging in a tailor's shop in Nizwa", "دشاديش معلقة في محل خياطة في نزوى")} className="aspect-[4/3] rounded-2xl" />
              <Photo id="f66931966" big={false} sizes="(max-width: 1023px) 50vw, 27vw" alt={tr("Pottery stalls at the craft market in Nizwa", "محلات الفخار في سوق الحرف في نزوى")} className="aspect-[4/3] rounded-2xl" />
            </div>
          </div>
        </section>

        {/* 4 — What it does */}
        <section className="border-t border-sand-200 bg-canvas">
          <div className="mx-auto flex min-h-[100svh] max-w-[1240px] flex-col justify-center px-6 py-20">
            <h2 className="max-w-[20ch] text-[34px] font-medium leading-[1.08] tracking-[-0.035em] sm:text-[44px]">
              {tr("Send the offer, answer the replies, let the bot do the rest.", "أرسل العرض، رُدّ على العملاء، ودع الرد الآلي يكمل الباقي.")}
            </h2>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              <div className="flex flex-col rounded-2xl border border-sand-200 bg-white p-6 transition-transform hover:-translate-y-0.5">
                <div className="rounded-xl border border-sand-200 p-4 text-[13px]">
                  <div className="flex justify-between text-ink-500"><span>{tr("Sending to 1,180 contacts", "جارٍ الإرسال إلى ١١٨٠ جهة")}</span><span className="num text-black">64%</span></div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand-100"><div className="h-2 w-[64%] rounded-full bg-black" /></div>
                  <div className="mt-4 grid grid-cols-3 text-center">
                    {[["754", tr("sent", "أُرسلت")], ["731", tr("delivered", "وصلت")], ["9", tr("failed", "فشلت")]].map(([v, l]) => (
                      <div key={l}><div className="num text-[17px] font-semibold">{v}</div><div className="text-[11.5px] text-ink-500">{l}</div></div>
                    ))}
                  </div>
                </div>
                <h3 className="mt-7 text-[18px] font-semibold">{tr("Bulk send", "الإرسال الجماعي")}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-ink-500">{tr("Pick an approved message, pick who gets it, send now or at 9 tonight. Each name is filled in for you.", "اختر رسالة معتمدة، واختر المستلمين، وأرسل الآن أو في التاسعة مساءً. يُكتب اسم كل عميل تلقائياً.")}</p>
              </div>
              <div className="flex flex-col rounded-2xl border border-sand-200 bg-white p-6 transition-transform hover:-translate-y-0.5">
                <div className="space-y-2 rounded-xl border border-sand-200 bg-sand-50 p-4 text-[13px]" dir="rtl" style={{ fontFamily: "var(--font-arabic)" }}>
                  <div className="max-w-[85%] rounded-lg rounded-ss-none bg-white px-3 py-2 shadow-sm">هل العرض متوفر في فرع الخوير؟</div>
                  <div className="ms-auto max-w-[85%] rounded-lg rounded-se-none bg-black px-3 py-2 text-white">نعم، حتى نهاية الأسبوع في كل الفروع 🌙</div>
                  <div className="max-w-[60%] rounded-lg rounded-ss-none bg-white px-3 py-2 shadow-sm">ممتاز، شكراً</div>
                </div>
                <h3 className="mt-7 text-[18px] font-semibold">{tr("One inbox", "صندوق محادثات واحد")}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-ink-500">{tr("Every reply lands in one place, live. Answer from your computer instead of passing one phone around the shop.", "كل رد يصل إلى مكان واحد مباشرة. رُدّ من حاسوبك بدل تمرير هاتف واحد في المحل.")}</p>
              </div>
              <div className="flex flex-col rounded-2xl border border-sand-200 bg-white p-6 transition-transform hover:-translate-y-0.5">
                <div className="rounded-xl border border-sand-200 p-4 text-[13px]">
                  <span className="rounded-md bg-black px-2 py-1 text-[11.5px] text-white">{tr("Keyword", "كلمة")}: menu</span>
                  <div className="ms-4 h-4 border-s border-dashed border-ink-300" />
                  <div className="rounded-lg border border-sand-200 px-3 py-2">{tr("Marhaba! How can we help?", "أهلاً! كيف نقدر نساعدك؟")}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[tr("Prices", "الأسعار"), tr("Location", "الموقع"), tr("Talk to us", "موظف")].map((b) => (
                      <span key={b} className="rounded-full border border-black px-2.5 py-1 text-[11.5px]">{b}</span>
                    ))}
                  </div>
                </div>
                <h3 className="mt-7 text-[18px] font-semibold">{tr("Auto-reply bots", "الردود الآلية")}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-ink-500">{tr("“Price?”, “Location?”, “Open today?” answered at 3am. Drag the blocks together, no code.", "«كم السعر؟» و«وين موقعكم؟» و«مفتوحين اليوم؟» تُجاب حتى الثالثة فجراً. اسحب الكتل وصِلها، بدون برمجة.")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5 — Getting started */}
        <section className="mx-auto grid min-h-[100svh] max-w-[1240px] items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16">
          <Photo id="f6841219" big={false} sizes="(max-width: 1023px) 100vw, 50vw" alt={tr("Men gathered in the shade of trees in the square at Nizwa", "رجال مجتمعون في ظل الأشجار في ساحة نزوى")} className="order-2 aspect-[4/3] rounded-2xl lg:order-1" />
          <div className="order-1 lg:order-2">
            <h2 className="max-w-[16ch] text-[34px] font-medium leading-[1.08] tracking-[-0.035em] sm:text-[44px]">
              {tr("Your first offer sent the same afternoon.", "أول عرض يُرسل في نفس اليوم.")}
            </h2>
            <ol className="mt-10 space-y-8">
              {[
                [tr("Connect your number", "اربط رقمك"), tr("Any Omantel, Ooredoo or Vodafone number that isn't on the WhatsApp app. We walk you through it in four steps.", "أي رقم من عمانتل أو أوريدو أو فودافون غير مفعّل على تطبيق واتساب. نرشدك في أربع خطوات.")],
                [tr("Upload your customer list", "ارفع قائمة عملائك"), tr("Straight from Excel. Numbers like 9123 4567 get +968 added for you.", "مباشرة من إكسل. الأرقام مثل 9123 4567 يُضاف لها 968+ تلقائياً.")],
                [tr("Send, then watch the replies", "أرسل، وتابع الردود"), tr("Your message goes to Meta for approval, usually within minutes. Then it goes to everyone.", "تُرسل رسالتك إلى ميتا للموافقة، عادةً خلال دقائق. ثم تصل إلى الجميع.")],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[40px_1fr] gap-4">
                  <span className="num grid h-10 w-10 place-items-center rounded-full border border-black text-[15px] font-medium">{i + 1}</span>
                  <div>
                    <h3 className="text-[18px] font-semibold">{t}</h3>
                    <p className="mt-1.5 text-[15px] leading-[1.55] text-ink-500">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6 — Pricing */}
        <section id="pricing" className="scroll-mt-16 border-t border-sand-200 bg-canvas">
          <div className="mx-auto flex min-h-[100svh] max-w-[1240px] flex-col justify-center px-6 py-20">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
              <h2 className="max-w-[18ch] text-[34px] font-medium leading-[1.08] tracking-[-0.035em] sm:text-[44px]">
                {tr("Pricing for the software, or for us to run it.", "أسعار للبرنامج، أو لنديره عنك.")}
              </h2>
              <p className="max-w-[30rem] text-[17px] leading-[1.6] text-ink-500 lg:justify-self-end">
                {tr(
                  "For Oman's National Day, Unlimited is $150 a month with every feature in the software. Business and Managed add our team doing the setup and the sending.",
                  "بمناسبة العيد الوطني، خطة «غير محدود» بسعر ١٥٠ دولاراً شهرياً مع كل ميزات البرنامج. خطتا «الأعمال» و«المُدارة» تضيفان فريقنا للإعداد والإرسال."
                )}
              </p>
            </div>
            <div className="mt-12">
              <PricingPlans />
            </div>
          </div>
        </section>

        {/* 7 — Close */}
        <section className="relative isolate min-h-[100svh] overflow-hidden bg-black text-white">
          <img src="/photos/photo-f165815865.jpg" srcSet="/photos/photo-f165815865-960.jpg 960w, /photos/photo-f165815865.jpg 1280w" sizes="100vw" alt={tr("Old Muscat between the mountains and the sea", "مسقط القديمة بين الجبال والبحر")} loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55 grayscale" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="mx-auto flex min-h-[100svh] max-w-[1240px] flex-col justify-end px-6 pb-20 pt-32">
            <h2 className="max-w-[16ch] text-[40px] font-medium leading-[1.02] tracking-[-0.045em] sm:text-[60px] lg:text-[76px]">
              {tr("Your next offer can reach every customer tonight.", "عرضك القادم يمكن أن يصل لكل عملائك الليلة.")}
            </h2>
            <div className="mt-10 flex flex-wrap gap-3">
              <button onClick={demo} className="btn h-12 bg-white px-6 text-[15px] text-black hover:bg-white/85">{tr("Open the demo", "افتح العرض التجريبي")}</button>
              <Link href="/login?mode=signup" className="btn h-12 border border-white/40 px-6 text-[15px] text-white hover:bg-white hover:text-black">{tr("Create your account", "أنشئ حسابك")}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black text-white/60">
        <div className="mx-auto max-w-[1240px] px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-8 border-b border-white/10 pb-10">
            <Logo light size={28} />
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[14px]">
              <a href="#pricing" className="hover:text-white">{tr("Pricing", "الأسعار")}</a>
              <Link href="/privacy" className="hover:text-white">{tr("Privacy policy", "سياسة الخصوصية")}</Link>
              <Link href="/data-deletion" className="hover:text-white">{tr("Data deletion", "حذف البيانات")}</Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-1 hover:text-white">{CONTACT_EMAIL} <ArrowUpRight size={13} /></a>
            </div>
          </div>
          <p className="mt-8 text-[12px] leading-relaxed text-white/40">
            © {new Date().getFullYear()} WasilOman. {tr("Not affiliated with WhatsApp or Meta.", "غير تابع لواتساب أو ميتا.")}{" "}
            {tr("Photographs from Wikimedia Commons by", "الصور من ويكيميديا كومنز بعدسة")}{" "}
            {CREDITS.map(([by, url, lic], i) => (
              <span key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-white">{by}</a> ({lic}){i < CREDITS.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </div>
      </footer>
    </div>
  );
}
