"use client";
import { X, Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useLang } from "@/lib/i18n";

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex rounded-xl border border-sand-200 bg-white p-0.5 text-xs font-semibold ${className}`}>
      {(["en", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-lg px-3 py-1.5 transition ${lang === l ? "bg-brand-600 text-white" : "text-ink-500 hover:text-ink-900"}`}
        >
          {l === "en" ? "English" : "العربية"}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`card max-h-[90vh] w-full overflow-y-auto p-6 ${wide ? "max-w-3xl" : "max-w-lg"}`} onClick={(e) => e.stopPropagation()}>
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

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  read: "bg-emerald-50 text-emerald-700",
  delivered: "bg-sky-50 text-sky-700",
  sent: "bg-sky-50 text-sky-700",
  sending: "bg-amber-50 text-amber-700",
  PENDING: "bg-amber-50 text-amber-700",
  scheduled: "bg-violet-50 text-violet-700",
  pending: "bg-sand-100 text-ink-500",
  draft: "bg-sand-100 text-ink-500",
  REJECTED: "bg-red-50 text-red-700",
  failed: "bg-red-50 text-red-700",
  PAUSED: "bg-red-50 text-red-700",
  DISABLED: "bg-red-50 text-red-700",
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
    sending: ["Sending…", "جارٍ الإرسال…"],
    scheduled: ["Scheduled", "مجدول"],
    draft: ["Draft", "مسودة"],
    failed: ["Failed", "فشل"],
    pending: ["Waiting", "في الانتظار"],
    sent: ["Sent", "أُرسلت"],
    delivered: ["Delivered", "وصلت"],
    read: ["Read", "قُرئت"],
  };
  const l = labels[status];
  return <span className={`badge ${STATUS_STYLES[status] || "bg-sand-100 text-ink-500"}`}>{l ? tr(l[0], l[1]) : status}</span>;
}

export function Toast({ msg, type = "ok", onDone }: { msg: string | null; type?: "ok" | "err"; onDone: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${type === "ok" ? "bg-brand-700" : "bg-red-600"}`}>
      {msg}
    </div>
  );
}

/** Small helper for calling our own API routes */
export async function api<T = any>(url: string, body?: any, method?: string): Promise<T> {
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
