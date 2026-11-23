"use client";
import { Check, ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

export const PAYPAL_LINK = "https://www.paypal.com/invoice/p/#SLUJ46X9ANGEV7NG";
export const CONTACT_EMAIL = "fullcirclewali@gmail.com";

type Plan = {
  id: string;
  name: string;
  price: number;
  tagline: string;
  lead?: string;
  features: string[];
  cta: string;
  href: string;
  offer?: boolean;
};

export function usePlans(): Plan[] {
  const { tr } = useLang();
  const mail = (plan: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`WasilOman ${plan} plan`)}`;
  return [
    {
      id: "unlimited",
      name: tr("Unlimited", "غير محدود"),
      price: 150,
      offer: true,
      tagline: tr("The full software. You run it yourself.", "البرنامج كاملاً. تديره بنفسك."),
      features: [
        tr("Unlimited contacts and bulk messages", "جهات اتصال ورسائل جماعية بلا حدود"),
        tr("Unlimited templates and auto-reply bots", "قوالب وردود آلية بلا حدود"),
        tr("Shared inbox with live replies", "صندوق محادثات مباشر"),
        tr("Scheduled sending", "جدولة الإرسال"),
        tr("Delivered and read reports, CSV export", "تقارير الوصول والقراءة وتصدير CSV"),
        tr("Excel import and automatic STOP handling", "استيراد إكسل وإلغاء الاشتراك تلقائياً"),
        tr("Arabic and English", "عربي وإنجليزي"),
        tr("Email support", "دعم عبر البريد"),
      ],
      cta: tr("Pay with PayPal", "ادفع عبر PayPal"),
      href: PAYPAL_LINK,
    },
    {
      id: "business",
      name: tr("Business", "الأعمال"),
      price: 290,
      tagline: tr("We set it up and build it with you.", "نجهّزه ونبنيه معك."),
      lead: tr("Everything in Unlimited, plus", "كل ما في «غير محدود»، بالإضافة إلى"),
      features: [
        tr("We connect your WhatsApp number for you", "نربط رقم واتساب الخاص بك نيابةً عنك"),
        tr("Help with Meta business verification", "مساعدة في توثيق نشاطك لدى ميتا"),
        tr("10 templates written in Arabic and English", "١٠ قوالب مكتوبة بالعربية والإنجليزية"),
        tr("3 auto-reply bots built for you", "٣ ردود آلية نبنيها لك"),
        tr("One-hour online training for your team", "تدريب عن بُعد لفريقك لمدة ساعة"),
        tr("Same-day email support", "دعم بالبريد في نفس اليوم"),
      ],
      cta: tr("Email us to start", "راسلنا للبدء"),
      href: mail("Business"),
    },
    {
      id: "managed",
      name: tr("Managed", "المُدارة"),
      price: 490,
      tagline: tr("We run your WhatsApp marketing every month.", "ندير تسويقك عبر واتساب كل شهر."),
      lead: tr("Everything in Business, plus", "كل ما في «الأعمال»، بالإضافة إلى"),
      features: [
        tr("Up to 4 campaigns a month, written and sent for you", "حتى ٤ حملات شهرياً نكتبها ونرسلها لك"),
        tr("A monthly results report", "تقرير نتائج شهري"),
        tr("Contact list cleaning and import", "تنظيف واستيراد قوائم جهات الاتصال"),
        tr("Help applying for the verified business badge", "مساعدة في طلب شارة الحساب الموثّق"),
        tr("One named account manager", "مدير حساب مخصص"),
      ],
      cta: tr("Email us to start", "راسلنا للبدء"),
      href: mail("Managed"),
    },
  ];
}

export function PricingPlans({ current }: { current?: string }) {
  const { tr, lang } = useLang();
  const plans = usePlans();
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const dark = !!p.offer;
          return (
            <div key={p.id} className={`flex flex-col rounded-2xl border p-7 ${dark ? "border-black bg-black text-white" : "border-sand-200 bg-white text-black"}`}>
              <div className="flex min-h-[28px] items-center justify-between gap-3">
                <h3 className="text-[17px] font-semibold">{p.name}</h3>
                {p.offer && (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-[11.5px] font-semibold text-white">
                    {tr("National Day offer", "عرض العيد الوطني")} 🇴🇲
                  </span>
                )}
                {current === p.id && !p.offer && <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[11.5px] font-medium">{tr("Your plan", "خطتك")}</span>}
              </div>
              <p className={`mt-1.5 text-[14px] ${dark ? "text-white/60" : "text-ink-500"}`}>{p.tagline}</p>
              <div className="mt-7 flex items-baseline gap-1.5" dir="ltr">
                <span className="num text-[44px] font-semibold leading-none tracking-[-0.04em]">${p.price}</span>
                <span className={`text-[14px] ${dark ? "text-white/60" : "text-ink-500"}`}>USD / {lang === "ar" ? "شهرياً" : "month"}</span>
              </div>
              <a
                href={p.href}
                target={p.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className={`btn mt-7 w-full py-3 text-[14px] ${dark ? "bg-accent font-semibold text-white hover:bg-accent-600" : "border border-black bg-white text-black hover:bg-black hover:text-white"}`}
              >
                {p.cta} <ArrowUpRight size={15} className="rtl:-scale-x-100" />
              </a>
              <div className={`mt-7 border-t pt-6 ${dark ? "border-white/15" : "border-sand-200"}`}>
                {p.lead && <div className={`mb-3 text-[13px] font-medium ${dark ? "text-white/60" : "text-ink-500"}`}>{p.lead}</div>}
                <ul className="space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] leading-snug">
                      <Check size={16} strokeWidth={2.2} className={`mt-0.5 shrink-0 ${dark ? "text-accent" : "text-black"}`} />
                      <span className={dark ? "text-white/85" : "text-ink-700"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-[13px] text-ink-500">
        {tr(
          "Prices in US dollars, billed monthly. WhatsApp conversation fees are charged by Meta to your own Meta business account and are not part of any plan.",
          "الأسعار بالدولار الأمريكي وتُدفع شهرياً. رسوم محادثات واتساب تفرضها ميتا على حساب نشاطك لديها وليست ضمن أي خطة."
        )}
      </p>
    </div>
  );
}
