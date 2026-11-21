"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Users, FileText, Send, MessagesSquare, Bot, Settings, LogOut, Menu, X, Plug } from "lucide-react";
import { Logo } from "./Logo";
import { LangToggle } from "./ui";
import { useLang } from "@/lib/i18n";
import { useAccount } from "./AccountProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatPhone } from "@/lib/phone";

export function Shell({ children }: { children: ReactNode }) {
  const { tr } = useLang();
  const { account, email } = useAccount();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/dashboard", icon: LayoutDashboard, label: tr("Home", "الرئيسية") },
    { href: "/contacts", icon: Users, label: tr("Contacts", "جهات الاتصال") },
    { href: "/templates", icon: FileText, label: tr("Message Templates", "قوالب الرسائل") },
    { href: "/broadcasts", icon: Send, label: tr("Bulk Send", "إرسال جماعي") },
    { href: "/inbox", icon: MessagesSquare, label: tr("Inbox", "المحادثات") },
    { href: "/bots", icon: Bot, label: tr("Auto-Reply Bots", "الردود الآلية") },
    { href: "/settings", icon: Settings, label: tr("Settings", "الإعدادات") },
  ];

  const logout = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo light />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((n) => {
          const active = path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <n.icon size={18} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl bg-white/10 p-3 text-xs text-brand-100">
        {account ? (
          <>
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> {tr("WhatsApp connected", "واتساب متصل")}
            </div>
            <div className="mt-1 truncate" dir="ltr">
              {account.display_phone || formatPhone(account.phone_number_id)}
            </div>
          </>
        ) : (
          <Link href="/connect" className="flex items-center gap-2 font-semibold text-gold-400">
            <Plug size={14} /> {tr("Connect WhatsApp", "اربط واتساب")}
          </Link>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="truncate">{email}</span>
          <button onClick={logout} title={tr("Log out", "تسجيل الخروج")} className="rounded-lg p-1.5 hover:bg-white/10">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-brand-800 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-ink-900/40" />
          <aside className="absolute inset-y-0 start-0 w-64 bg-brand-800" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand-200 bg-sand-50/90 px-4 py-3 backdrop-blur lg:px-8">
          <button className="btn-ghost p-2 lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden text-sm text-ink-500 lg:block">{tr("Marhaba 👋", "مرحباً 👋")}</div>
          <LangToggle />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
