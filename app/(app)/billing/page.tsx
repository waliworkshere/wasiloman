"use client";
import { CreditCard, Receipt, Mail } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { CONTACT_EMAIL, PricingPlans } from "@/components/PricingCard";

export default function BillingPage() {
  const { tr } = useLang();
  const steps = [
    { icon: CreditCard, t: tr("Pay the invoice", "ادفع الفاتورة"), d: tr("Unlimited: press “Pay with PayPal” and pay with a PayPal account or any bank card. Business and Managed: email us and we send your invoice.", "خطة «غير محدود»: اضغط «ادفع عبر PayPal» وادفع بحساب PayPal أو أي بطاقة بنكية. خطتا «الأعمال» و«المُدارة»: راسلنا ونرسل لك الفاتورة.") },
    { icon: Receipt, t: tr("Keep your receipt", "احتفظ بالإيصال"), d: tr("PayPal emails you a receipt as soon as the payment goes through.", "يرسل لك PayPal إيصالاً بالبريد فور إتمام الدفع.") },
    { icon: Mail, t: tr("Email it to us", "أرسله لنا بالبريد"), d: tr(`Send the receipt and your WasilOman account email to ${CONTACT_EMAIL} and we confirm your plan.`, `أرسل الإيصال وبريد حسابك في واصل إلى ${CONTACT_EMAIL} وسنؤكد خطتك.`) },
  ];
  return (
    <div>
      <PageHeader title={tr("Plan and billing", "الخطة والفوترة")} subtitle={tr("Three plans. The National Day offer on Unlimited is $150 a month.", "ثلاث خطط. عرض العيد الوطني على «غير محدود» بسعر ١٥٠ دولاراً شهرياً.")} />
      <PricingPlans current="unlimited" />
      <div className="card mt-8 p-6">
        <h2 className="font-semibold">{tr("How payment works", "كيف يتم الدفع")}</h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.t}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="num grid h-6 w-6 place-items-center rounded-full bg-black text-xs text-white">{i + 1}</span>
                {s.t}
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">{s.d}</p>
            </li>
          ))}
        </ol>
        <a href={`mailto:${CONTACT_EMAIL}?subject=WasilOman%20payment%20receipt`} className="btn-secondary mt-6">
          <Mail size={15} /> {CONTACT_EMAIL}
        </a>
      </div>
    </div>
  );
}
