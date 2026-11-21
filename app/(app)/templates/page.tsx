"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FileText, Plus, RefreshCw, Trash2, Info } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { ConnectBanner } from "@/components/ConnectBanner";
import { Empty, Loading, PageHeader, StatusBadge, api } from "@/components/ui";
import { WhatsAppPreview, templateToPreview } from "@/components/WhatsAppPreview";

export default function TemplatesPage() {
  const { tr } = useLang();
  const { account } = useAccount();
  const [list, setList] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);

  const load = useCallback(async () => {
    setList(null);
    try {
      const r = await api("/api/templates");
      setList(r.templates);
      setPreview(r.templates[0] || null);
    } catch (e: any) {
      setErr(e.message);
      setList([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load, account]);

  const remove = async (name: string) => {
    if (!confirm(tr(`Delete template “${name}”?`, `حذف القالب «${name}»؟`))) return;
    try {
      await api(`/api/templates?name=${encodeURIComponent(name)}`, undefined, "DELETE");
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <ConnectBanner />
      <PageHeader
        title={tr("Message Templates", "قوالب الرسائل")}
        subtitle={tr(
          "WhatsApp requires bulk messages to use a template approved by Meta. Approval usually takes a few minutes.",
          "يشترط واتساب أن تستخدم الرسائل الجماعية قالباً معتمداً من ميتا. الموافقة تستغرق عادةً بضع دقائق."
        )}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={load}><RefreshCw size={16} /> {tr("Refresh", "تحديث")}</button>
            <Link href="/templates/new" className="btn-primary"><Plus size={16} /> {tr("New template", "قالب جديد")}</Link>
          </div>
        }
      />
      {err && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
      {list === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty
          icon={<FileText size={26} />}
          title={tr("No templates yet", "لا توجد قوالب بعد")}
          text={tr("Create your first message — for example an offer, a greeting, or an appointment reminder.", "أنشئ رسالتك الأولى — مثل عرض، أو تهنئة، أو تذكير بموعد.")}
          action={<Link href="/templates/new" className="btn-primary"><Plus size={16} />{tr("Create template", "إنشاء قالب")}</Link>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card divide-y divide-sand-100">
            {list.map((t) => (
              <div key={t.id} onClick={() => setPreview(t)} className={`flex cursor-pointer items-center justify-between gap-4 p-4 transition ${preview?.id === t.id ? "bg-brand-50/60" : "hover:bg-sand-50"}`}>
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold" dir="ltr">{t.name}</div>
                  <div className="mt-0.5 flex gap-2 text-xs text-ink-400">
                    <span>{t.category === "MARKETING" ? tr("Marketing", "تسويق") : t.category === "UTILITY" ? tr("Utility", "خدمات") : t.category}</span>·<span>{t.language}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <button className="btn-ghost p-2 text-ink-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); remove(t.name); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            {preview && <WhatsAppPreview data={templateToPreview(preview, account?.verified_name || undefined)} />}
            {preview?.status === "REJECTED" && (
              <p className="mt-3 flex gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                <Info size={14} className="shrink-0" />
                {tr("Meta rejected this template. Common reasons: missing example values, too many variables, or wrong category. Edit and submit again with a new name.", "رفضت ميتا هذا القالب. الأسباب الشائعة: نقص أمثلة المتغيرات، أو كثرة المتغيرات، أو فئة خاطئة. عدّله وأرسله باسم جديد.")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
