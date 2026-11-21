"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Plus, Trash2, Zap } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PRESETS } from "@/lib/bot-presets";
import { ConnectBanner } from "@/components/ConnectBanner";
import { Empty, Loading, Modal, PageHeader, Spinner } from "@/components/ui";

export default function BotsPage() {
  const { tr } = useLang();
  const router = useRouter();
  const { userId } = useAccount();
  const [flows, setFlows] = useState<any[] | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabaseBrowser().from("flows").select("id,name,keywords,match_type,is_active,runs,updated_at").order("created_at", { ascending: false });
    setFlows(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (key: string) => {
    const p = PRESETS.find((x) => x.key === key)!;
    setCreating(key);
    const { data, error } = await supabaseBrowser()
      .from("flows")
      .insert({ owner_id: userId, name: tr(p.en, p.ar), keywords: p.keywords, match_type: p.match_type, nodes: p.nodes, edges: p.edges, is_active: false })
      .select("id")
      .single();
    setCreating(null);
    if (error) return alert(error.message);
    router.push(`/bots/${data.id}`);
  };

  const toggle = async (f: any) => {
    await supabaseBrowser().from("flows").update({ is_active: !f.is_active }).eq("id", f.id);
    load();
  };
  const remove = async (f: any) => {
    if (!confirm(tr(`Delete “${f.name}”?`, `حذف «${f.name}»؟`))) return;
    await supabaseBrowser().from("flows").delete().eq("id", f.id);
    load();
  };

  return (
    <div>
      <ConnectBanner />
      <PageHeader
        title={tr("Auto-Reply Bots", "الردود الآلية")}
        subtitle={tr("When a customer sends a word like “hi” or “menu”, the bot answers automatically — even at 3am.", "عندما يرسل العميل كلمة مثل «مرحبا» أو «قائمة»، يرد الروبوت تلقائياً — حتى في الثالثة فجراً.")}
        action={<button className="btn-primary" onClick={() => setNewOpen(true)}><Plus size={16} />{tr("New bot", "رد آلي جديد")}</button>}
      />
      {flows === null ? (
        <Loading />
      ) : flows.length === 0 ? (
        <Empty icon={<Bot size={26} />} title={tr("No bots yet", "لا توجد ردود آلية بعد")} text={tr("Start with a ready-made welcome menu and change the words to fit your business.", "ابدأ بقائمة ترحيب جاهزة وغيّر الكلمات لتناسب نشاطك.")} action={<button className="btn-primary" onClick={() => setNewOpen(true)}><Plus size={16} />{tr("Create a bot", "أنشئ رداً آلياً")}</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {flows.map((f) => (
            <div key={f.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/bots/${f.id}`} className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold"><Bot size={18} className="text-brand-600" />{f.name}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {f.match_type === "any" ? (
                      <span className="badge bg-gold-400/15 text-gold-600">{tr("Replies to any message", "يرد على أي رسالة")}</span>
                    ) : (
                      f.keywords.slice(0, 6).map((k: string) => <span key={k} className="badge bg-sand-100 text-ink-700">{k}</span>)
                    )}
                  </div>
                </Link>
                <button onClick={() => toggle(f)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${f.is_active ? "bg-brand-500" : "bg-sand-300"}`} title={tr("On / Off", "تشغيل / إيقاف")}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${f.is_active ? "start-[22px]" : "start-0.5"}`} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-sand-100 pt-3 text-xs text-ink-400">
                <span className="flex items-center gap-1"><Zap size={13} />{f.runs} {tr("times used", "مرة استُخدم")}</span>
                <div className="flex gap-1">
                  <Link href={`/bots/${f.id}`} className="btn-ghost px-3 py-1.5 text-xs">{tr("Edit", "تعديل")}</Link>
                  <button onClick={() => remove(f)} className="btn-ghost p-1.5 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title={tr("Choose a starting point", "اختر نقطة البداية")} wide>
        <div className="grid gap-3 md:grid-cols-3">
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => create(p.key)} disabled={!!creating} className="rounded-2xl border border-sand-200 p-5 text-start transition hover:border-brand-400 hover:bg-brand-50/50">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">{creating === p.key ? <Spinner /> : <Bot size={19} />}</div>
              <div className="font-semibold">{tr(p.en, p.ar)}</div>
              <div className="mt-1 text-sm text-ink-500">{tr(p.descEn, p.descAr)}</div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
