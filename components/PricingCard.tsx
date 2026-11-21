"use client";
import { Check, ExternalLink } from "lucide-react";
import { useLang } from "@/lib/i18n";

export const PAYPAL_LINK = "https://www.paypal.com/invoice/p/#SLUJ46X9ANGEV7NG";

export function usePlanFeatures() {
  const { tr } = useLang();
  return [
    tr("Unlimited contacts", "جهات اتصال غير محدودة"),
    tr("Unlimited bulk messages", "رسائل جماعية غير محدودة"),
    tr("Unlimited message templates", "قوالب رسائل غير محدودة"),
    tr("Unlimited auto-reply bots", "ردود آلية غير محدودة"),
    tr("Shared inbox with live replies", "صندوق محادثات مباشر"),
    tr("Schedule messages for later", "جدولة الرسائل لوقت لاحق"),
    tr("Delivered and read reports, CSV export", "تقارير الوصول والقراءة وتصدير CSV"),
    tr("Excel / CSV contact import", "استيراد جهات الاتصال من إكسل"),
    tr("Automatic STOP / unsubscribe handling", "إلغاء الاشتراك تلقائياً عند «إيقاف»"),
    tr("Arabic and English", "عربي وإنجليزي"),
    tr("Email support", "دعم عبر البريد الإلكتروني"),
  ];
}

/** The single Wasil plan. `dark` renders it for the dark landing section. */
export function PricingCard({ dark = false, current = false }: { dark?: boolean; current?: boolean }) {
  const { tr } = useLang();
  const features = usePlanFeatures();
  return (
    <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/10 bg-white/[0.04] text-white" : "border-sand-200 bg-white shadow-card"}`}>
      <div className={`flex flex-wrap items-start justify-between gap-4 border-b p-7 ${dark ? "border-white/10" : "border-sand-100"}`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-[-0.01em]">Wasil Unlimited</h3>
            {current && <span className="badge bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/60">{tr("Your plan", "خطتك")}</span>}
          </div>
          <p className={`mt-1 text-sm ${dark ? "text-ink-300" : "text-ink-500"}`}>{tr("One plan. Every feature. No limits.", "خطة واحدة. كل الميزات. بلا حدود.")}</p>
        </div>
        <a href={PAYPAL_LINK} target="_blank" rel="noreferrer" className="btn-primary px-5 py-2.5">
          {tr("Pay with PayPal", "ادفع عبر PayPal")} <ExternalLink size={15} />
        </a>
      </div>
      <ul className="grid gap-x-8 gap-y-3 p-7 sm:grid-cols-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[14px]">
            <Check size={17} className={`mt-0.5 shrink-0 ${dark ? "text-brand-300" : "text-brand-600"}`} />
            <span className={dark ? "text-ink-300" : "text-ink-700"}>{f}</span>
          </li>
        ))}
      </ul>
      <p className={`border-t px-7 py-4 text-xs ${dark ? "border-white/10 text-ink-400" : "border-sand-100 bg-sand-50 text-ink-400"}`}>
        {tr(
          "WhatsApp conversation fees are charged by Meta directly to your Meta business account and are not part of this plan.",
          "رسوم محادثات واتساب تفرضها ميتا مباشرة على حساب نشاطك في ميتا وليست ضمن هذه الخطة."
        )}
      </p>
    </div>
  );
}
