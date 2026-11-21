"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Smartphone, Unplug, Copy, Check, Languages, Activity } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { LangToggle, PageHeader, api } from "@/components/ui";

export default function SettingsPage() {
  const { tr } = useLang();
  const { account, refresh, email } = useAccount();
  const [health, setHealth] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const webhook = typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : "";

  useEffect(() => {
    if (account) api("/api/whatsapp/connect").then(setHealth).catch(() => null);
  }, [account]);

  const disconnect = async () => {
    if (!confirm(tr("Disconnect this WhatsApp number from Wasil? Your contacts stay saved.", "فصل رقم واتساب عن واصل؟ جهات الاتصال ستبقى محفوظة."))) return;
    await api("/api/whatsapp/connect", undefined, "DELETE");
    refresh();
  };

  const tier: Record<string, string> = { TIER_250: "250", TIER_1K: "1,000", TIER_10K: "10,000", TIER_100K: "100,000", TIER_UNLIMITED: "∞" };

  return (
    <div className="max-w-3xl">
      <PageHeader title={tr("Settings", "الإعدادات")} />
      <div className="space-y-5">
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><Smartphone size={18} className="text-brand-600" />{tr("WhatsApp number", "رقم واتساب")}</h2>
          {account ? (
            <div className="space-y-3 text-sm">
              <Row k={tr("Number", "الرقم")} v={<span dir="ltr">{account.display_phone}</span>} />
              <Row k={tr("Display name", "اسم العرض")} v={account.verified_name} />
              <Row k={tr("Connected with", "طريقة الربط")} v={account.connected_via === "facebook" ? "Facebook" : tr("Manual", "يدوي")} />
              <Row k="Phone number ID" v={<span className="font-mono" dir="ltr">{account.phone_number_id}</span>} />
              <Row k="WABA ID" v={<span className="font-mono" dir="ltr">{account.waba_id}</span>} />
              {health?.info && (
                <>
                  <Row k={tr("Quality", "الجودة")} v={<span className={health.info.quality_rating === "GREEN" ? "text-emerald-600" : health.info.quality_rating === "RED" ? "text-red-600" : "text-amber-600"}>● {health.info.quality_rating}</span>} />
                  <Row k={tr("Daily limit (unique customers)", "الحد اليومي (عملاء مختلفون)")} v={tier[health.info.messaging_limit_tier] || health.info.messaging_limit_tier || "—"} />
                </>
              )}
              {health?.error && <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-700"><Activity size={15} />{health.error}</p>}
              <button className="btn-danger mt-2" onClick={disconnect}><Unplug size={16} />{tr("Disconnect", "فصل الرقم")}</button>
            </div>
          ) : (
            <Link href="/connect" className="btn-primary">{tr("Connect WhatsApp", "اربط واتساب")}</Link>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-2 font-semibold">{tr("Webhook URL", "رابط الويب هوك")}</h2>
          <p className="mb-3 text-sm text-ink-500">{tr("Only needed for manual setup. Facebook connect sets this up for you.", "مطلوب فقط للإعداد اليدوي. الربط عبر فيسبوك يضبطه تلقائياً.")}</p>
          <div className="flex gap-2">
            <input className="input font-mono text-xs" dir="ltr" readOnly value={webhook} />
            <button className="btn-secondary" onClick={() => { navigator.clipboard.writeText(webhook); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button>
          </div>
        </div>

        <div className="card flex items-center justify-between p-6">
          <h2 className="flex items-center gap-2 font-semibold"><Languages size={18} className="text-brand-600" />{tr("Language", "اللغة")}</h2>
          <LangToggle />
        </div>

        <div className="card p-6 text-sm">
          <Row k={tr("Account email", "بريد الحساب")} v={email} />
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-sand-100 pb-2 last:border-0">
      <span className="text-ink-500">{k}</span>
      <span className="text-end font-medium">{v}</span>
    </div>
  );
}
