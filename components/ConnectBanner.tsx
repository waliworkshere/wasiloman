"use client";
import Link from "next/link";
import { Plug } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "./AccountProvider";

export function ConnectBanner() {
  const { tr } = useLang();
  const { account, loading } = useAccount();
  if (loading || account) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-400/40 bg-gold-400/10 px-5 py-4">
      <div className="flex items-center gap-3 text-sm">
        <Plug size={18} className="text-gold-600" />
        <span className="font-medium text-ink-700">{tr("Connect your WhatsApp number first to use this.", "اربط رقم واتساب أولاً لاستخدام هذه الميزة.")}</span>
      </div>
      <Link href="/connect" className="btn-primary py-2">
        {tr("Connect now", "اربط الآن")}
      </Link>
    </div>
  );
}
