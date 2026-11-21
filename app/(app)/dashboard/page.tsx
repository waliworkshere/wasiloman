"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plug, Users, FileText, Send, Bot, CheckCircle2, Circle, ArrowUpRight, MessageCircle, ShieldCheck, Gauge } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { StatusBadge, api } from "@/components/ui";
import { Sparkline, TimeChart } from "@/components/charts";
import { formatPhone } from "@/lib/phone";

const DAYS = 14;

async function fetchAll(build: (from: number, to: number) => any) {
  const out: any[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data } = await build(from, from + 999);
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

function timeAgo(iso: string, lang: string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  const rtf = new Intl.RelativeTimeFormat(lang === "ar" ? "ar" : "en", { numeric: "auto", style: "short" });
  if (m < 60) return rtf.format(-m, "minute");
  if (m < 1440) return rtf.format(-Math.round(m / 60), "hour");
  return rtf.format(-Math.round(m / 1440), "day");
}

export default function Dashboard() {
  const { tr, lang } = useLang();
  const { account } = useAccount();
  const [contactsCount, setContactsCount] = useState<number | null>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [botCount, setBotCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    const since = new Date(Date.now() - DAYS * 864e5).toISOString();
    (async () => {
      const [c, b, f, msgs] = await Promise.all([
        sb.from("contacts").select("id", { count: "exact", head: true }),
        sb.from("broadcasts").select("id,name,status,total,sent,delivered,read,failed,created_at,scheduled_at").order("created_at", { ascending: false }),
        sb.from("flows").select("id", { count: "exact", head: true }).eq("is_active", true),
        fetchAll((a, z) => sb.from("messages").select("id,contact_id,direction,status,body,created_at").gte("created_at", since).order("created_at").range(a, z)),
      ]);
      setContactsCount(c.count || 0);
      setBroadcasts(b.data || []);
      setBotCount(f.count || 0);
      setMessages(msgs);
      const inbound = msgs.filter((m: any) => m.direction === "in").slice(-8);
      const ids = Array.from(new Set(inbound.map((m: any) => m.contact_id)));
      if (ids.length) {
        const { data } = await sb.from("contacts").select("id,name,phone").in("id", ids);
        setNames(Object.fromEntries((data || []).map((x: any) => [x.id, x.name || formatPhone(x.phone)])));
      }
    })();
    if (account) {
      api("/api/templates").then((r) => setTemplateCount((r.templates || []).length)).catch(() => null);
      api("/api/whatsapp/connect").then(setHealth).catch(() => null);
    }
  }, [account]);

  const daily = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-OM" : "en-GB", { day: "numeric", month: "short" });
    const days = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(Date.now() - (DAYS - 1 - i) * 864e5);
      d.setHours(0, 0, 0, 0);
      return { key: d.toDateString(), label: fmt.format(d), sent: 0, read: 0, replies: 0 };
    });
    const idx = Object.fromEntries(days.map((d, i) => [d.key, i]));
    for (const m of messages) {
      const i = idx[new Date(m.created_at).toDateString()];
      if (i === undefined) continue;
      if (m.direction === "out") {
        days[i].sent++;
        if (m.status === "read") days[i].read++;
      } else days[i].replies++;
    }
    return days;
  }, [messages, lang]);

  const totals = useMemo(() => {
    const out = messages.filter((m) => m.direction === "out");
    const sent = out.length;
    const delivered = out.filter((m) => m.status === "delivered" || m.status === "read").length;
    const read = out.filter((m) => m.status === "read").length;
    const replies = messages.filter((m) => m.direction === "in").length;
    return { sent, delivered, read, replies };
  }, [messages]);

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  const n = (v: number) => v.toLocaleString(lang === "ar" ? "ar-OM" : "en");
  const loading = contactsCount === null;

  const kpis = [
    { label: tr("Contacts", "جهات الاتصال"), value: loading ? "—" : n(contactsCount!), spark: null as number[] | null, href: "/contacts" },
    { label: tr("Messages sent", "رسائل مُرسلة"), value: n(totals.sent), spark: daily.map((d) => d.sent), sub: tr(`last ${DAYS} days`, `آخر ${DAYS} يوماً`) },
    { label: tr("Delivered", "نسبة الوصول"), value: `${pct(totals.delivered, totals.sent)}%`, spark: null, sub: `${n(totals.delivered)} ${tr("messages", "رسالة")}` },
    { label: tr("Read", "نسبة القراءة"), value: `${pct(totals.read, totals.sent)}%`, spark: daily.map((d) => d.read), sub: `${n(totals.read)} ${tr("messages", "رسالة")}` },
    { label: tr("Customer replies", "ردود العملاء"), value: n(totals.replies), spark: daily.map((d) => d.replies), color: "#C98A22", href: "/inbox" },
  ];

  const funnel = [
    { label: tr("Sent", "أُرسلت"), v: totals.sent, color: "bg-ink-800" },
    { label: tr("Delivered", "وصلت"), v: totals.delivered, color: "bg-brand-700" },
    { label: tr("Read", "قُرئت"), v: totals.read, color: "bg-brand-500" },
    { label: tr("Replied", "ردّوا"), v: totals.replies, color: "bg-gold-400" },
  ];

  const steps = [
    { done: !!account, label: tr("Connect your WhatsApp number", "اربط رقم واتساب"), href: "/connect", icon: Plug },
    { done: (contactsCount || 0) > 0, label: tr("Add your contacts", "أضف جهات الاتصال"), href: "/contacts", icon: Users },
    { done: templateCount > 0, label: tr("Create a message template", "أنشئ قالب رسالة"), href: "/templates/new", icon: FileText },
    { done: broadcasts.length > 0, label: tr("Send your first bulk message", "أرسل أول رسالة جماعية"), href: "/broadcasts/new", icon: Send },
    { done: botCount > 0, label: tr("Turn on an auto-reply bot", "فعّل رداً آلياً"), href: "/bots", icon: Bot },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const hour = new Date().getHours();
  const greet = hour >= 5 && hour < 12 ? tr("Good morning", "صباح الخير") : hour >= 12 && hour < 18 ? tr("Good afternoon", "مساء الخير") : tr("Good evening", "مساء الخير");
  const inbound = messages.filter((m) => m.direction === "in").slice(-6).reverse();
  const quality: Record<string, [string, string, string]> = {
    GREEN: [tr("High", "عالية"), "text-brand-600", "bg-brand-500"],
    YELLOW: [tr("Medium", "متوسطة"), "text-gold-600", "bg-gold-400"],
    RED: [tr("Low", "منخفضة"), "text-red-600", "bg-red-500"],
  };
  const q = quality[health?.info?.quality_rating] || null;
  const tier: Record<string, string> = { TIER_250: "250", TIER_1K: "1,000", TIER_10K: "10,000", TIER_100K: "100,000", TIER_UNLIMITED: tr("Unlimited", "غير محدود") };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.015em]">
            {greet}
            {account?.verified_name ? `, ${account.verified_name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-ink-500">{tr(`Here's how your WhatsApp messages did in the last ${DAYS} days.`, `هذا أداء رسائلك على واتساب خلال آخر ${DAYS} يوماً.`)}</p>
        </div>
      </div>

      {doneCount < steps.length && !loading && (
        <div className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
          <div className="lg:w-56">
            <div className="font-semibold">{tr("Finish setting up", "أكمل الإعداد")}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
              <div className="h-1.5 flex-1 rounded-full bg-sand-100">
                <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
              </div>
              <span className="num">{doneCount}/{steps.length}</span>
            </div>
          </div>
          <div className="grid flex-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-5">
            {steps.map((s) => (
              <Link key={s.href} href={s.href} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] ${s.done ? "border-transparent text-ink-400" : "border-sand-200 font-medium hover:border-brand-300 hover:bg-brand-50/40"}`}>
                {s.done ? <CheckCircle2 size={16} className="shrink-0 text-brand-500" /> : <Circle size={16} className="shrink-0 text-sand-300" />}
                <span className={s.done ? "line-through" : ""}>{s.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="card grid grid-cols-2 divide-sand-200 md:grid-cols-5 md:divide-x rtl:md:divide-x-reverse">
        {kpis.map((k, i) => {
          const body = (
            <div className={`flex h-full flex-col justify-between gap-3 p-5 ${i > 1 ? "border-t border-sand-200 md:border-t-0" : ""}`}>
              <div className="flex items-center justify-between text-[13px] font-medium text-ink-500">
                {k.label}
                {k.href && <ArrowUpRight size={14} className="text-ink-300" />}
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="num text-[26px] font-bold leading-none tracking-[-0.02em]">{k.value}</div>
                  {k.sub && <div className="mt-1.5 whitespace-nowrap text-xs text-ink-400">{k.sub}</div>}
                </div>
                {k.spark && <Sparkline values={k.spark} color={k.color} />}
              </div>
            </div>
          );
          return k.href ? <Link key={k.label} href={k.href} className="hover:bg-sand-50/70">{body}</Link> : <div key={k.label}>{body}</div>;
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">{tr("Message activity", "نشاط الرسائل")}</h2>
            <div className="flex gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand-500" />{tr("Sent", "أُرسلت")}</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-ink-800" />{tr("Read", "قُرئت")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-gold-400" />{tr("Replies", "ردود")}</span>
            </div>
          </div>
          <TimeChart
            height={300}
            data={daily}
            series={[
              { key: "sent", label: tr("Sent", "أُرسلت"), color: "#14906A", kind: "area" },
              { key: "read", label: tr("Read", "قُرئت"), color: "#15262E", kind: "line" },
              { key: "replies", label: tr("Replies", "ردود"), color: "#E2A33B", kind: "bar" },
            ]}
          />
        </div>

        {/* Funnel + number health */}
        <div className="flex flex-col gap-6">
          <div className="card p-5">
            <h2 className="font-semibold">{tr("From sent to replied", "من الإرسال إلى الرد")}</h2>
            <p className="mt-0.5 text-xs text-ink-400">{tr("How far your messages get", "إلى أي مدى تصل رسائلك")}</p>
            <div className="mt-4 space-y-3">
              {funnel.map((f) => {
                const w = totals.sent ? Math.max(2, (f.v / totals.sent) * 100) : 0;
                return (
                  <div key={f.label}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="font-medium text-ink-700">{f.label}</span>
                      <span className="num text-ink-500">
                        <b className="font-semibold text-ink-900">{n(f.v)}</b> · {pct(f.v, totals.sent)}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-sand-100">
                      <div className={`h-2.5 rounded-full ${f.color} transition-[width] duration-700`} style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{tr("Your number", "رقمك")}</h2>
              <Link href="/settings" className="text-xs font-semibold text-brand-600 hover:underline">{tr("Manage", "إدارة")}</Link>
            </div>
            {account ? (
              <div className="mt-3 space-y-2.5 text-[13px]">
                <div className="num font-semibold" dir="ltr">{account.display_phone}</div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-ink-500"><ShieldCheck size={14} />{tr("Quality", "الجودة")}</span>
                  {q ? <span className={`flex items-center gap-1.5 font-semibold ${q[1]}`}><span className={`h-1.5 w-1.5 rounded-full ${q[2]}`} />{q[0]}</span> : <span className="text-ink-300">—</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-ink-500"><Gauge size={14} />{tr("Daily limit", "الحد اليومي")}</span>
                  <span className="num font-semibold">{tier[health?.info?.messaging_limit_tier] || "—"} {tr("customers", "عميل")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-ink-500"><Bot size={14} />{tr("Bots on", "ردود آلية مفعّلة")}</span>
                  <span className="num font-semibold">{botCount}</span>
                </div>
              </div>
            ) : (
              <Link href="/connect" className="btn-primary mt-3 w-full"><Plug size={15} />{tr("Connect WhatsApp", "اربط واتساب")}</Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaigns */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold">{tr("Recent bulk messages", "أحدث الرسائل الجماعية")}</h2>
            <Link href="/broadcasts" className="text-xs font-semibold text-brand-600 hover:underline">{tr("View all", "عرض الكل")}</Link>
          </div>
          {broadcasts.length === 0 ? (
            <div className="border-t border-sand-100 px-5 py-12 text-center text-sm text-ink-400">
              {tr("Nothing sent yet.", "لم يُرسل شيء بعد.")}{" "}
              <Link href="/broadcasts/new" className="font-semibold text-brand-600">{tr("Send your first", "أرسل الأولى")}</Link>
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="border-y border-sand-100 bg-sand-50 text-xs text-ink-400">
                <tr>
                  <th className="px-5 py-2 text-start font-medium">{tr("Campaign", "الحملة")}</th>
                  <th className="px-3 py-2 text-start font-medium">{tr("Status", "الحالة")}</th>
                  <th className="hidden px-3 py-2 text-end font-medium sm:table-cell">{tr("Recipients", "المستلمون")}</th>
                  <th className="px-5 py-2 text-end font-medium">{tr("Read rate", "نسبة القراءة")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {broadcasts.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-sand-50/70">
                    <td className="px-5 py-3">
                      <Link href={`/broadcasts/${b.id}`} className="font-medium text-ink-900 hover:underline">{b.name}</Link>
                      <div className="text-xs text-ink-400">{new Date(b.status === "scheduled" ? b.scheduled_at : b.created_at).toLocaleDateString(lang === "ar" ? "ar-OM" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={b.status} /></td>
                    <td className="num hidden px-3 py-3 text-end sm:table-cell">{n(b.total)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden h-1.5 w-16 rounded-full bg-sand-100 sm:block">
                          <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${pct(b.read, b.total)}%` }} />
                        </div>
                        <span className="num w-10 text-end font-semibold">{b.status === "scheduled" ? "—" : `${Math.round(pct(b.read, b.total))}%`}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Latest replies */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold">{tr("Latest replies", "أحدث الردود")}</h2>
            <Link href="/inbox" className="text-xs font-semibold text-brand-600 hover:underline">{tr("Open inbox", "افتح المحادثات")}</Link>
          </div>
          {inbound.length === 0 ? (
            <div className="border-t border-sand-100 px-5 py-12 text-center text-sm text-ink-400">
              <MessageCircle className="mx-auto mb-2 text-sand-300" />
              {tr("Customer replies will show up here.", "ستظهر ردود العملاء هنا.")}
            </div>
          ) : (
            <ul className="divide-y divide-sand-100 border-t border-sand-100">
              {inbound.map((m) => (
                <li key={m.id}>
                  <Link href="/inbox" className="flex gap-3 px-5 py-3 hover:bg-sand-50/70">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand-100 text-xs font-bold text-ink-600">{(names[m.contact_id] || "#")[0]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2 text-[13px]">
                        <span className="truncate font-semibold">{names[m.contact_id] || "…"}</span>
                        <span className="shrink-0 text-xs text-ink-400">{timeAgo(m.created_at, lang)}</span>
                      </div>
                      <div className="truncate text-[13px] text-ink-500" dir="auto">{m.body}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
