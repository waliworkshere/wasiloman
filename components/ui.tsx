"use client";
import { X, Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useLang } from "@/lib/i18n";
import { demoApi, isDemo } from "@/lib/demo";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex rounded-lg border border-sand-200 bg-sand-50 p-0.5 text-xs font-semibold ${className}`} role="group" aria-label="Language">
      {(["en", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-md px-2.5 py-1 transition-colors ${lang === l ? "bg-white text-ink-900 shadow-card" : "text-ink-400 hover:text-ink-900"}`}
          style={l === "ar" ? { fontFamily: "var(--font-arabic)" } : undefined}
        >
          {l === "en" ? "EN" : "عربي"}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center border-dashed px-6 py-16 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`card max-h-[90vh] w-full overflow-y-auto p-6 shadow-pop ${wide ? "max-w-3xl" : "max-w-lg"}`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} size={18} />;
}

export function Loading() {
  return (
    <div className="grid place-items-center py-20 text-brand-600">
      <Spinner />
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  APPROVED: "green", completed: "green", read: "green",
  delivered: "blue", sent: "blue",
  sending: "amber", PENDING: "amber",
  scheduled: "violet",
  pending: "grey", draft: "grey",
  REJECTED: "red", failed: "red", PAUSED: "red", DISABLED: "red",
};
const TONES: Record<string, [string, string]> = {
  green: ["bg-brand-50 text-brand-700 ring-brand-200/60", "bg-brand-500"],
  blue: ["bg-sky-50 text-sky-700 ring-sky-200/60", "bg-sky-500"],
  amber: ["bg-gold-50 text-gold-600 ring-gold-100", "bg-gold-400"],
  violet: ["bg-violet-50 text-violet-700 ring-violet-200/60", "bg-violet-500"],
  grey: ["bg-sand-100 text-ink-500 ring-sand-200", "bg-ink-300"],
  red: ["bg-red-50 text-red-700 ring-red-200/60", "bg-red-500"],
};

export function StatusBadge({ status }: { status: string }) {
  const { tr } = useLang();
  const labels: Record<string, [string, string]> = {
    APPROVED: ["Approved", "معتمد"],
    PENDING: ["In review", "قيد المراجعة"],
    REJECTED: ["Rejected", "مرفوض"],
    PAUSED: ["Paused", "متوقف"],
    DISABLED: ["Disabled", "معطّل"],
    completed: ["Completed", "مكتمل"],
    sending: ["Sending", "جارٍ الإرسال"],
    scheduled: ["Scheduled", "مجدول"],
    draft: ["Draft", "مسودة"],
    failed: ["Failed", "فشل"],
    pending: ["Waiting", "في الانتظار"],
    sent: ["Sent", "أُرسلت"],
    delivered: ["Delivered", "وصلت"],
    read: ["Read", "قُرئت"],
  };
  const l = labels[status];
  const [box, dot] = TONES[STATUS_TONE[status] || "grey"];
  return (
    <span className={`badge whitespace-nowrap ring-1 ring-inset ${box}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot} ${status === "sending" ? "animate-pulse" : ""}`} />
      {l ? tr(l[0], l[1]) : status}
    </span>
  );
}

export function Toast({ msg, type = "ok", onDone }: { msg: string | null; type?: "ok" | "err"; onDone: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-pop ${type === "ok" ? "bg-ink-900" : "bg-red-600"}`}>
      {msg}
    </div>
  );
}

/** Small helper for calling our own API routes */
export async function api<T = any>(url: string, body?: any, method?: string): Promise<T> {
  if (isDemo()) return demoApi(url, body, method) as Promise<T>;
  const isForm = body instanceof FormData;
  const res = await fetch(url, {
    method: method || (body ? "POST" : "GET"),
    headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong");
  return json as T;
}
