"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, Send, CheckCheck, Eye, Bot, Plug, FileText, CheckCircle2, Circle } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PageHeader, StatusBadge } from "@/components/ui";

type Stats = { contacts: number; broadcasts: number; sent: number; delivered: number; read: number; bots: number; templates: number };

export default function Dashboard() {
  const { tr } = useLang();
  const { account } = useAccount();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const sb = supabaseBrowser();
    (async () => {
      const [c, b, f] = await Promise.all([
        sb.from("contacts").select("id", { count: "exact", head: true }),
        sb.from("broadcasts").select("id,name,status,total,sent,delivered,read,failed,created_at").order("created_at", { ascending: false }),
        sb.from("flows").select("id", { count: "exact", head: true }),
      ]);
      const list = b.data || [];
      setRecent(list.slice(0, 5));
      const sum = (k: string) => list.reduce((a: number, x: any) => a + (x[k] || 0), 0);
      let templates = 0;
      if (account) {
        try {
          const r = await fetch("/api/templates").then((r) => r.json());
          templates = (r.templates || []).length;
        } catch {}
      }
      setStats({ contacts: c.count || 0, broadcasts: list.length, sent: sum("sent"), delivered: sum("delivered"), read: sum("read"), bots: f.count || 0, templates });
    })();
  }, [account]);

  const cards = [
    { icon: Users, label: tr("Contacts", "جهات الاتصال"), value: stats?.contacts },
    { icon: Send, label: tr("Messages sent", "رسائل مُرسلة"), value: stats?.sent },
    { icon: CheckCheck, label: tr("Delivered", "وصلت"), value: stats?.delivered },
    { icon: Eye, label: tr("Read", "قُرئت"), value: stats?.read, extra: stats && stats.sent ? `${Math.round((stats.read / stats.sent) * 100)}%` : undefined },
  ];

  const steps = [
    { done: !!account, label: tr("Connect your WhatsApp number", "اربط رقم واتساب"), href: "/connect", icon: Plug },
    { done: (stats?.contacts || 0) > 0, label: tr("Add or upload your contacts", "أضف أو ارفع جهات الاتصال"), href: "/contacts", icon: Users },
    { done: (stats?.templates || 0) > 0, label: tr("Create a message template", "أنشئ قالب رسالة"), href: "/templates/new", icon: FileText },
    { done: (stats?.broadcasts || 0) > 0, label: tr("Send your first bulk message", "أرسل أول رسالة جماعية"), href: "/broadcasts/new", icon: Send },
    { done: (stats?.bots || 0) > 0, label: tr("Set up an auto-reply bot", "أنشئ رداً آلياً"), href: "/bots", icon: Bot },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div>
      <PageHeader title={tr("Home", "الرئيسية")} subtitle={tr("A quick look at how your WhatsApp messages are doing.", "نظرة سريعة على أداء رسائلك على واتساب.")} action={<Link href="/broadcasts/new" className="btn-primary"><Send size={16} />{tr("New bulk message", "رسالة جماعية جديدة")}</Link>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center justify-between text-ink-500">
              <span className="text-sm">{c.label}</span>
              <c.icon size={18} className="text-brand-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold">{c.value ?? "—"}</span>
              {c.extra && <span className="text-sm font-semibold text-emerald-600">{c.extra}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {doneCount < steps.length && (
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{tr("Getting started", "خطوات البداية")}</h2>
              <span className="text-sm text-ink-500">{doneCount}/{steps.length}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-sand-100">
              <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
            <div className="mt-4 space-y-1">
              {steps.map((s) => (
                <Link key={s.href} href={s.href} className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-sand-50">
                  {s.done ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} className="text-sand-300" />}
                  <span className={s.done ? "text-ink-400 line-through" : "font-medium"}>{s.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className={`card p-6 ${doneCount < steps.length ? "lg:col-span-3" : "lg:col-span-5"}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{tr("Recent bulk messages", "أحدث الرسائل الجماعية")}</h2>
            <Link href="/broadcasts" className="text-sm font-semibold text-brand-600">{tr("See all", "عرض الكل")}</Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">{tr("Nothing sent yet.", "لم يُرسل شيء بعد.")}</p>
          ) : (
            <div className="mt-4 divide-y divide-sand-100">
              {recent.map((b) => (
                <Link key={b.id} href={`/broadcasts/${b.id}`} className="flex items-center justify-between py-3 text-sm hover:opacity-80">
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-ink-400">{new Date(b.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden text-ink-500 sm:inline">{b.delivered}/{b.total} {tr("delivered", "وصلت")}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
