"use client";
/* A static, faithful copy of the WasilOman overview screen, shown on the homepage. */
import { LayoutGrid, Send, FileText, MessagesSquare, Users, Bot } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { LogoMark } from "@/components/Logo";

const SENT = [52, 61, 48, 70, 66, 58, 120, 74, 69, 63, 1180, 88, 71, 64];
const READ = [37, 44, 33, 51, 49, 40, 86, 55, 50, 47, 838, 64, 52, 46];

function Spark({ v }: { v: number[] }) {
  const m = Math.max(...v);
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 64},${22 - (x / m) * 20}`).join(" ");
  return (
    <svg width="64" height="24" viewBox="0 0 64 24" aria-hidden style={{ direction: "ltr" }}>
      <polyline points={pts} fill="none" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function AppFrame() {
  const { tr } = useLang();
  const W = 560, H = 150, max = 1200;
  const x = (i: number) => (i / (SENT.length - 1)) * W;
  const y = (v: number) => H - (v / max) * (H - 8);
  const line = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const nav = [
    [LayoutGrid, tr("Overview", "نظرة عامة")],
    [Send, tr("Bulk send", "إرسال جماعي")],
    [FileText, tr("Templates", "القوالب")],
    [MessagesSquare, tr("Inbox", "المحادثات")],
    [Users, tr("Contacts", "جهات الاتصال")],
    [Bot, tr("Auto-reply bots", "الردود الآلية")],
  ] as const;

  return (
    <div className="overflow-hidden rounded-xl border border-black/15 bg-white shadow-pop" aria-label={tr("The WasilOman dashboard", "لوحة تحكم واصل عُمان")} role="img">
      <div className="flex items-center gap-1.5 border-b border-sand-200 bg-sand-50 px-4 py-2.5" dir="ltr">
        <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
        <span className="mx-auto rounded-md bg-white px-3 py-0.5 text-[11px] text-ink-400">wasiloman.vercel.app/dashboard</span>
      </div>
      <div className="flex text-[12px]">
        <div className="hidden w-[170px] shrink-0 bg-black p-3 text-white/60 md:block">
          <div className="mb-4 flex items-center gap-2 px-1.5 pt-1">
            <LogoMark size={18} light />
            <span className="text-[12px] font-semibold text-white">Al Noor Sweets</span>
          </div>
          {nav.map(([Icon, l], i) => (
            <div key={l} className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 0 ? "bg-white/10 text-white" : ""}`}>
              <Icon size={13} /> {l}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 bg-canvas p-4">
          <div className="text-[15px] font-semibold text-black">{tr("Good evening, Al Noor Sweets", "مساء الخير، حلويات النور")}</div>
          <div className="mt-3 grid grid-cols-2 divide-sand-200 rounded-lg border border-sand-200 bg-white sm:grid-cols-4 sm:divide-x rtl:sm:divide-x-reverse">
            {[
              [tr("Messages sent", "رسائل مُرسلة"), "2,918", SENT],
              [tr("Delivered", "وصلت"), "98.1%", null],
              [tr("Read", "قُرئت"), "72%", READ],
              [tr("Replies", "ردود"), "187", null],
            ].map(([l, v, s]) => (
              <div key={l as string} className="p-3">
                <div className="text-ink-500">{l as string}</div>
                <div className="mt-1 flex items-end justify-between">
                  <span className="num text-[20px] font-semibold tracking-tight text-black">{v as string}</span>
                  {s && <Spark v={s as number[]} />}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-lg border border-sand-200 bg-white p-3">
              <div className="mb-2 font-semibold text-black">{tr("Message activity", "نشاط الرسائل")}</div>
              <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden style={{ direction: "ltr" }}>
                {[0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1="0" x2={W} y1={y(max * t)} y2={y(max * t)} stroke="#ECECEB" />)}
                <path d={`${line(SENT)} L${W},${H} L0,${H} Z`} fill="#000" opacity="0.06" />
                <path d={line(SENT)} fill="none" stroke="#000" strokeWidth="2" />
                <path d={line(READ)} fill="none" stroke="#000" strokeWidth="1.5" strokeDasharray="4 4" />
              </svg>
            </div>
            <div className="rounded-lg border border-sand-200 bg-white p-3">
              <div className="mb-2 font-semibold text-black">{tr("Latest replies", "أحدث الردود")}</div>
              {[
                ["Ahmed", "كم سعر علبة الحلوى الكبيرة؟"],
                ["Fatma", "2 saffron and 1 rose please"],
                ["Salim", "Location / الموقع"],
              ].map(([n, m]) => (
                <div key={n} className="flex gap-2 border-t border-sand-100 py-2 first:border-0">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sand-100 text-[10px] font-semibold text-black">{n[0]}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-black">{n}</div>
                    <div className="truncate text-ink-500" dir="auto">{m}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
