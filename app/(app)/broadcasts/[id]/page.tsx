"use client";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCheck, Eye, XCircle, Users, Download, Trash2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatPhone } from "@/lib/phone";
import { Loading, PageHeader, StatusBadge, api } from "@/components/ui";

export default function BroadcastDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tr } = useLang();
  const router = useRouter();
  const [b, setB] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data: bc }, { data: rs }] = await Promise.all([
      sb.from("broadcasts").select("*").eq("id", id).single(),
      sb.from("broadcast_recipients").select("id,name,phone,status,error,updated_at").eq("broadcast_id", id).order("updated_at", { ascending: false }).limit(1000),
    ]);
    setB(bc);
    setRows(rs || []);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  // Keep big broadcasts moving while this page is open
  useEffect(() => {
    if (!b || !["sending", "scheduled"].includes(b.status)) return;
    const kick = () => api(`/api/broadcasts/${id}/resume`, {}).catch(() => null);
    kick();
    const t = setInterval(kick, 55_000);
    return () => clearInterval(t);
  }, [b?.status, id, b]);

  if (!b) return <Loading />;

  const pct = (n: number) => (b.total ? Math.round((n / b.total) * 100) : 0);
  const stats = [
    { icon: Users, l: tr("Recipients", "المستلمون"), v: b.total, c: "text-ink-700" },
    { icon: Send, l: tr("Sent", "أُرسلت"), v: b.sent, p: pct(b.sent), c: "text-sky-600" },
    { icon: CheckCheck, l: tr("Delivered", "وصلت"), v: b.delivered, p: pct(b.delivered), c: "text-brand-600" },
    { icon: Eye, l: tr("Read", "قُرئت"), v: b.read, p: pct(b.read), c: "text-emerald-600" },
    { icon: XCircle, l: tr("Failed", "فشلت"), v: b.failed, p: pct(b.failed), c: "text-red-600" },
  ];
  const shown = rows.filter((r) => !filter || r.status === filter);

  const exportCsv = () => {
    const csv = "name,phone,status,error\n" + rows.map((r) => [r.name || "", r.phone, r.status, (r.error || "").replace(/,/g, ";")].join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = `${b.name}.csv`;
    a.click();
  };

  return (
    <div>
      <PageHeader
        title={b.name}
        subtitle={b.status === "scheduled" ? tr(`Scheduled for ${new Date(b.scheduled_at).toLocaleString()}`, `مجدولة في ${new Date(b.scheduled_at).toLocaleString()}`) : new Date(b.created_at).toLocaleString()}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={b.status} />
            <button className="btn-secondary" onClick={exportCsv}><Download size={16} />{tr("Export", "تصدير")}</button>
            {b.status === "scheduled" && (
              <button className="btn-danger" onClick={async () => { if (confirm(tr("Cancel this scheduled message?", "إلغاء هذه الرسالة المجدولة؟"))) { await api(`/api/broadcasts/${id}/resume`, undefined, "DELETE"); router.push("/broadcasts"); } }}>
                <Trash2 size={16} />{tr("Cancel", "إلغاء")}
              </button>
            )}
          </div>
        }
      />

      {b.status === "sending" && (
        <div className="card mb-6 p-5">
          <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{tr("Sending…", "جارٍ الإرسال…")}</span><span>{b.sent + b.failed}/{b.total}</span></div>
          <div className="h-3 rounded-full bg-sand-100"><div className="h-3 rounded-full bg-brand-500 transition-all" style={{ width: `${pct(b.sent + b.failed)}%` }} /></div>
          <p className="mt-2 text-xs text-ink-400">{tr("You can leave this page. Keeping it open makes large lists finish faster.", "يمكنك مغادرة الصفحة. إبقاؤها مفتوحة يسرّع إرسال القوائم الكبيرة.")}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.l} className="card p-4">
            <div className="flex items-center gap-2 text-sm text-ink-500"><s.icon size={16} className={s.c} />{s.l}</div>
            <div className="mt-2 flex items-baseline gap-2"><span className="text-2xl font-bold">{s.v}</span>{s.p !== undefined && <span className={`text-sm font-semibold ${s.c}`}>{s.p}%</span>}</div>
          </div>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-sand-100 p-3">
          {["", "sent", "delivered", "read", "failed", "pending"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`badge px-3 py-1.5 ${filter === f ? "bg-brand-600 text-white" : "bg-sand-100 text-ink-500"}`}>
              {f === "" ? tr("All", "الكل") : <StatusBadge status={f} />}
            </button>
          ))}
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-sand-100">
              {shown.map((r) => (
                <tr key={r.id}>
                  <td className="p-3 font-medium">{r.name || "—"}</td>
                  <td className="p-3 text-ink-500" dir="ltr">{formatPhone(r.phone)}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="max-w-xs truncate p-3 text-xs text-red-600" title={r.error || ""}>{r.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
