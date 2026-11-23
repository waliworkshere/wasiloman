"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutGrid, Users, FileText, Send, MessagesSquare, Bot, Settings, LogOut, Menu, X, Plug, LifeBuoy, Sparkles, Plus, CreditCard } from "lucide-react";
import { Logo } from "./Logo";
import { LangToggle } from "./ui";
import { useLang } from "@/lib/i18n";
import { useAccount } from "./AccountProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { exitDemo } from "@/lib/demo";

export function Shell({ children }: { children: ReactNode }) {
  const { tr } = useLang();
  const { account, email, demo } = useAccount();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    supabaseBrowser()
      .from("contacts")
      .select("unread")
      .not("last_message_at", "is", null)
      .then(({ data }: { data: { unread: number }[] | null }) => setUnread((data || []).reduce((a, c) => a + (c.unread || 0), 0)));
  }, [path]);

  const groups = [
    { items: [{ href: "/dashboard", icon: LayoutGrid, label: tr("Overview", "نظرة عامة") }] },
    {
      title: tr("Messaging", "المراسلة"),
      items: [
        { href: "/broadcasts", icon: Send, label: tr("Bulk send", "إرسال جماعي") },
        { href: "/templates", icon: FileText, label: tr("Templates", "القوالب") },
        { href: "/inbox", icon: MessagesSquare, label: tr("Inbox", "المحادثات"), count: unread },
      ],
    },
    { title: tr("Audience", "الجمهور"), items: [{ href: "/contacts", icon: Users, label: tr("Contacts", "جهات الاتصال") }] },
    { title: tr("Automation", "الأتمتة"), items: [{ href: "/bots", icon: Bot, label: tr("Auto-reply bots", "الردود الآلية") }] },
  ];

  const titles: Record<string, string> = {
    "/dashboard": tr("Overview", "نظرة عامة"),
    "/broadcasts": tr("Bulk send", "إرسال جماعي"),
    "/templates": tr("Templates", "القوالب"),
    "/inbox": tr("Inbox", "المحادثات"),
    "/contacts": tr("Contacts", "جهات الاتصال"),
    "/bots": tr("Auto-reply bots", "الردود الآلية"),
    "/settings": tr("Settings", "الإعدادات"),
    "/connect": tr("Connect WhatsApp", "ربط واتساب"),
    "/billing": tr("Plan and billing", "الخطة والفوترة"),
  };
  const section = Object.keys(titles).find((k) => path.startsWith(k));

  const logout = async () => {
    if (demo) {
      exitDemo();
      window.location.href = "/";
      return;
    }
    await supabaseBrowser().auth.signOut();
    router.push("/login");
  };

  const initial = (account?.verified_name || email || "W")[0].toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col text-[13.5px]">
      <div className="px-4 pb-4 pt-5">
        <Logo light size={26} />
      </div>

      {/* Workspace / number */}
      <div className="mx-3 mb-4 rounded-lg border border-white/10 bg-white/[0.04] p-3">
        {account ? (
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-sm font-bold text-black">{initial}</div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-white">{account.verified_name}</div>
              <div className="flex items-center gap-1.5 text-2xs text-ink-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span dir="ltr" className="num truncate">{account.display_phone}</span>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/connect" onClick={() => setOpen(false)} className="flex items-center gap-2 font-semibold text-white">
            <Plug size={15} /> {tr("Connect WhatsApp", "اربط واتساب")}
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.title && <div className="mb-1.5 px-2.5 text-2xs font-medium text-ink-400">{g.title}</div>}
            <div className="space-y-0.5">
              {g.items.map((n: any) => {
                const active = path.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 font-medium transition-colors ${
                      active ? "bg-white/[0.08] text-white" : "text-ink-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {active && <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-white" />}
                    <n.icon size={17} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-white" : ""} />
                    <span className="flex-1">{n.label}</span>
                    {n.count > 0 && <span className="num rounded-full bg-white px-1.5 text-2xs font-bold text-black">{n.count}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 p-3">
        <Link href="/billing" onClick={() => setOpen(false)} className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 font-medium ${path.startsWith("/billing") ? "bg-white/[0.08] text-white" : "text-ink-300 hover:text-white"}`}>
          <CreditCard size={17} strokeWidth={1.8} /> <span className="flex-1">{tr("Plan and billing", "الخطة والفوترة")}</span>
          <span className="rounded bg-white/10 px-1.5 text-2xs font-semibold text-white">{tr("Unlimited", "غير محدود")}</span>
        </Link>
        <Link href="/settings" onClick={() => setOpen(false)} className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 font-medium ${path.startsWith("/settings") ? "bg-white/[0.08] text-white" : "text-ink-300 hover:text-white"}`}>
          <Settings size={17} strokeWidth={1.8} /> {tr("Settings", "الإعدادات")}
        </Link>
        <a href="mailto:fullcirclewali@gmail.com" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 font-medium text-ink-300 hover:text-white">
          <LifeBuoy size={17} strokeWidth={1.8} /> {tr("Email support", "الدعم عبر البريد")}
        </a>
        <div className="mt-2 flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-ink-700 text-2xs font-bold text-white">{(email || "?")[0].toUpperCase()}</div>
          <span className="min-w-0 flex-1 truncate text-xs text-ink-300">{email}</span>
          <button onClick={logout} aria-label={tr("Log out", "تسجيل الخروج")} title={tr("Log out", "تسجيل الخروج")} className="rounded-md p-1.5 text-ink-400 hover:bg-white/10 hover:text-white">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <div className="hidden w-[248px] shrink-0 bg-ink-950 lg:block">
        <aside className="sticky top-0 h-screen">{sidebar}</aside>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-ink-950/50" />
          <aside className="absolute inset-y-0 start-0 w-[260px] bg-ink-950" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {demo && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-sand-200 bg-white px-4 py-2 text-[13px] font-medium text-black">
            <span className="flex items-center gap-1.5"><Sparkles size={14} /> {tr("You're exploring a demo workspace with sample data. Nothing is really sent.", "أنت تتصفح مساحة تجريبية ببيانات نموذجية. لا يتم إرسال أي شيء فعلياً.")}</span>
            <Link href="/login?mode=signup" onClick={() => exitDemo()} className="rounded-md bg-ink-950 px-2.5 py-1 text-xs font-semibold text-white hover:bg-ink-800">
              {tr("Create your free account", "أنشئ حسابك المجاني")}
            </Link>
          </div>
        )}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-sand-200 bg-white/85 px-4 backdrop-blur lg:px-8">
          <button className="btn-ghost -ms-2 p-2 lg:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="text-[15px] font-semibold">{section ? titles[section] : ""}</div>
          <div className="flex-1" />
          <LangToggle />
          {!path.startsWith("/broadcasts/new") && (
            <Link href="/broadcasts/new" className="btn-primary hidden py-1.5 sm:inline-flex">
              <Plus size={15} /> {tr("New bulk message", "رسالة جماعية جديدة")}
            </Link>
          )}
        </header>
        <main className="mx-auto max-w-[1200px] px-4 py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
