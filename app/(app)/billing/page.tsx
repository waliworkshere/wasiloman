"use client";
import { CreditCard, Receipt, Mail } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { PricingCard } from "@/components/PricingCard";

export default function BillingPage() {
  const { tr } = useLang();
  const steps = [
    { icon: CreditCard, t: tr("Pay the invoice", "ادفع الفاتورة"), d: tr("Press “Pay with PayPal”. You can pay with a PayPal account or any debit or credit card.", "اضغط «ادفع عبر PayPal». يمكنك الدفع بحساب PayPal أو بأي بطاقة بنكية.") },
    { icon: Receipt, t: tr("Keep your receipt", "احتفظ بالإيصال"), d: tr("PayPal emails you a receipt as soon as the payment goes through.", "يرسل لك PayPal إيصالاً بالبريد فور إتمام الدفع.") },
    { icon: Mail, t: tr("Email it to us", "أرسله لنا بالبريد"), d: tr("Email the receipt and your Wasil account email to fullcirclewali@gmail.com and we'll confirm your plan.", "أرسل الإيصال وبريد حسابك في واصل إلى fullcirclewali@gmail.com وسنؤكد خطتك.") },
  ];
  return (
    <div className="max-w-4xl">
      <PageHeader title={tr("Plan and billing", "الخطة والفوترة")} subtitle={tr("Everything in Wasil is included and unlimited.", "كل ميزات واصل مشمولة وبلا حدود.")} />
      <PricingCard current />
      <div className="card mt-6 p-6">
        <h2 className="font-semibold">{tr("How payment works", "كيف يتم الدفع")}</h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.t}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="num grid h-6 w-6 place-items-center rounded-full bg-ink-900 text-xs text-white">{i + 1}</span>
                {s.t}
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">{s.d}</p>
            </li>
          ))}
        </ol>
        <a href="mailto:fullcirclewali@gmail.com?subject=Wasil%20payment%20receipt" className="btn-secondary mt-6">
          <Mail size={15} /> fullcirclewali@gmail.com
        </a>
      </div>
    </div>
  );
}
