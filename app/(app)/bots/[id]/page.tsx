"use client";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, MessageSquare, ListChecks, HelpCircle, Tag, Headset, Save, Trash2, Plus, X, ArrowLeft, Info } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { FlowNodeData, FlowNodeType } from "@/lib/flow-types";
import { Loading, Spinner, Toast } from "@/components/ui";

type RFNode = Node<FlowNodeData & Record<string, unknown>, FlowNodeType>;

const META: Record<FlowNodeType, { icon: any; color: string; en: string; ar: string; hintEn: string; hintAr: string }> = {
  start: { icon: Play, color: "bg-black", en: "Start", ar: "البداية", hintEn: "The bot starts here when a keyword is received.", hintAr: "يبدأ الرد الآلي هنا عند استلام كلمة مفتاحية." },
  message: { icon: MessageSquare, color: "bg-black", en: "Send message", ar: "إرسال رسالة", hintEn: "Sends text (and an optional image).", hintAr: "يرسل نصاً (وصورة اختيارية)." },
  choices: { icon: ListChecks, color: "bg-black", en: "Buttons / Menu", ar: "أزرار / قائمة", hintEn: "Customer taps an option. Up to 3 = buttons, 4–10 = list.", hintAr: "يضغط العميل على خيار. حتى ٣ = أزرار، ٤–١٠ = قائمة." },
  question: { icon: HelpCircle, color: "bg-black", en: "Ask a question", ar: "طرح سؤال", hintEn: "Waits for the answer and saves it to the contact.", hintAr: "ينتظر الإجابة ويحفظها في جهة الاتصال." },
  tag: { icon: Tag, color: "bg-black", en: "Add tag", ar: "إضافة وسم", hintEn: "Adds a tag to the contact (e.g. “interested”).", hintAr: "يضيف وسماً لجهة الاتصال (مثل «مهتم»)." },
  handoff: { icon: Headset, color: "bg-black", en: "Talk to staff", ar: "تحويل لموظف", hintEn: "Ends the bot and tags the chat for a human to reply.", hintAr: "ينهي الرد الآلي ويحوّل المحادثة لموظف." },
};

function NodeCard({ type, data, selected, children }: { type: FlowNodeType; data: FlowNodeData; selected?: boolean; children?: React.ReactNode }) {
  const { tr } = useLang();
  const m = META[type];
  const Icon = m.icon;
  return (
    <div className={`w-64 rounded-2xl border bg-white shadow-card transition ${selected ? "border-brand-500 ring-4 ring-brand-100" : "border-sand-200"}`}>
      <div className="flex items-center gap-2 rounded-t-2xl border-b border-sand-100 px-3 py-2">
        <span className={`grid h-6 w-6 place-items-center rounded-lg text-white ${m.color}`}><Icon size={13} /></span>
        <span className="text-xs font-bold text-ink-700">{tr(m.en, m.ar)}</span>
      </div>
      <div className="px-3 py-2.5 text-xs text-ink-500" dir="auto">
        {type === "tag" ? <span className="badge bg-sand-100 text-black">{data.tag || "…"}</span> : type === "start" ? tr("When a keyword arrives", "عند وصول كلمة مفتاحية") : <p className="line-clamp-3 whitespace-pre-wrap">{data.text || tr("Click to write…", "اضغط للكتابة…")}</p>}
        {type === "question" && data.saveAs && <div className="mt-1.5 font-mono text-[10px] text-ink-500">→ {data.saveAs}</div>}
      </div>
      {children}
    </div>
  );
}

const nodeTypes = {
  start: ({ data, selected }: NodeProps<RFNode>) => (
    <NodeCard type="start" data={data} selected={selected}>
      <Handle type="source" position={Position.Bottom} id="next" className="!bg-black" />
    </NodeCard>
  ),
  message: ({ data, selected }: NodeProps<RFNode>) => (
    <NodeCard type="message" data={data} selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-ink-400" />
      <Handle type="source" position={Position.Bottom} id="next" className="!bg-black" />
    </NodeCard>
  ),
  question: ({ data, selected }: NodeProps<RFNode>) => (
    <NodeCard type="question" data={data} selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-ink-400" />
      <Handle type="source" position={Position.Bottom} id="next" className="!bg-black" />
    </NodeCard>
  ),
  tag: ({ data, selected }: NodeProps<RFNode>) => (
    <NodeCard type="tag" data={data} selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-ink-400" />
      <Handle type="source" position={Position.Bottom} id="next" className="!bg-black" />
    </NodeCard>
  ),
  handoff: ({ data, selected }: NodeProps<RFNode>) => (
    <NodeCard type="handoff" data={data} selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-ink-400" />
    </NodeCard>
  ),
  choices: ({ data, selected }: NodeProps<RFNode>) => (
    <NodeCard type="choices" data={data} selected={selected}>
      <Handle type="target" position={Position.Top} className="!bg-ink-400" />
      <div className="space-y-1 px-3 pb-3">
        {(data.options || []).map((o, i) => (
          <div key={i} className="relative rounded-lg border border-sand-200 bg-sand-50 px-2.5 py-1.5 text-xs font-medium text-black" dir="auto">
            {o || "…"}
            <Handle type="source" position={Position.Right} id={`opt-${i}`} className="!-right-[19px] !bg-black" />
          </div>
        ))}
      </div>
    </NodeCard>
  ),
};

function Builder({ id }: { id: string }) {
  const { tr } = useLang();
  const rf = useReactFlow();
  const [flow, setFlow] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kwInput, setKwInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    supabaseBrowser().from("flows").select("*").eq("id", id).single().then(({ data }: { data: any }) => {
      if (!data) return;
      setFlow(data);
      setNodes(data.nodes);
      setEdges((data.edges || []).map((e: any) => ({ ...e, animated: true })));
    });
  }, [id, setNodes, setEdges]);

  const selected = nodes.find((n) => n.id === selectedId) || null;

  const onConnect = useCallback(
    (c: Connection) =>
      setEdges((eds) => addEdge({ ...c, id: `${c.source}-${c.sourceHandle}-${c.target}`, animated: true }, eds.filter((e) => !(e.source === c.source && (e.sourceHandle || "next") === (c.sourceHandle || "next"))))),
    [setEdges]
  );

  const addNode = (type: FlowNodeType) => {
    const center = rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const nid = `${type}-${Math.random().toString(36).slice(2, 8)}`;
    const data: FlowNodeData =
      type === "choices" ? { text: "", options: [tr("Option 1", "خيار ١"), tr("Option 2", "خيار ٢")], buttonText: tr("Options", "الخيارات") } : type === "question" ? { text: "", saveAs: "answer" } : type === "tag" ? { tag: "interested" } : { text: "" };
    setNodes((ns) => [...ns, { id: nid, type, position: { x: center.x - 128 + Math.random() * 40, y: center.y - 40 }, data: data as RFNode["data"] }]);
    setSelectedId(nid);
  };

  const updateData = (patch: Partial<FlowNodeData>) => {
    if (!selectedId) return;
    setNodes((ns) => ns.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n)));
  };

  const deleteSelected = () => {
    if (!selected || selected.type === "start") return;
    setNodes((ns) => ns.filter((n) => n.id !== selected.id));
    setEdges((es) => es.filter((e) => e.source !== selected.id && e.target !== selected.id));
    setSelectedId(null);
  };

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (!edges.some((e) => e.source === "start")) w.push(tr("Connect the Start block to your first step.", "اربط كتلة البداية بأول خطوة."));
    nodes.filter((n) => n.type === "choices").forEach((n) => {
      (n.data.options || []).forEach((o, i) => {
        if (!edges.some((e) => e.source === n.id && e.sourceHandle === `opt-${i}`)) w.push(tr(`Option “${o}” isn't connected to anything.`, `الخيار «${o}» غير مربوط بأي خطوة.`));
      });
      if ((n.data.options || []).length > 10) w.push(tr("A menu can have at most 10 options.", "القائمة يمكن أن تحتوي ١٠ خيارات كحد أقصى."));
    });
    return w;
  }, [nodes, edges, tr]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabaseBrowser()
      .from("flows")
      .update({
        name: flow.name,
        keywords: flow.keywords,
        match_type: flow.match_type,
        is_active: flow.is_active,
        nodes: nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || "next" })),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setSaving(false);
    setToast(error ? error.message : tr("Saved ✓", "تم الحفظ ✓"));
  };

  const addKeyword = () => {
    const k = kwInput.trim();
    if (k && !flow.keywords.includes(k)) setFlow({ ...flow, keywords: [...flow.keywords, k] });
    setKwInput("");
  };

  if (!flow) return <Loading />;

  return (
    <div className="-mx-4 -my-8 flex h-[calc(100vh-57px)] flex-col lg:-mx-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-sand-200 bg-white px-4 py-3">
        <Link href="/bots" className="btn-ghost p-2"><ArrowLeft size={18} className="rtl:rotate-180" /></Link>
        <input className="input w-56 py-2 font-semibold" value={flow.name} onChange={(e) => setFlow({ ...flow, name: e.target.value })} />
        <label className="flex items-center gap-2 text-sm font-medium">
          <button onClick={() => setFlow({ ...flow, is_active: !flow.is_active })} className={`relative h-6 w-11 rounded-full transition ${flow.is_active ? "bg-brand-500" : "bg-sand-300"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${flow.is_active ? "start-[22px]" : "start-0.5"}`} />
          </button>
          {flow.is_active ? tr("Bot is ON", "الرد الآلي مُفعّل") : tr("Bot is OFF", "الرد الآلي متوقف")}
        </label>
        <div className="flex-1" />
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner /> : <Save size={16} />}{tr("Save", "حفظ")}</button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Palette */}
        <div className="w-56 shrink-0 space-y-2 overflow-y-auto border-e border-sand-200 bg-white p-3">
          <div className="px-1 pb-1 text-xs font-bold uppercase text-ink-400">{tr("Add a step", "أضف خطوة")}</div>
          {(["message", "choices", "question", "tag", "handoff"] as FlowNodeType[]).map((t) => {
            const m = META[t];
            return (
              <button key={t} onClick={() => addNode(t)} className="flex w-full items-start gap-2.5 rounded-xl border border-sand-200 p-2.5 text-start hover:border-brand-300 hover:bg-brand-50/40">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white ${m.color}`}><m.icon size={14} /></span>
                <span>
                  <span className="block text-sm font-semibold">{tr(m.en, m.ar)}</span>
                  <span className="block text-[11px] leading-snug text-ink-400">{tr(m.hintEn, m.hintAr)}</span>
                </span>
              </button>
            );
          })}
          <div className="rounded-xl bg-sand-100 p-3 text-[11px] text-ink-500">
            {tr("Drag from a coloured dot to another block to connect them. Use {name} in texts to insert the customer's name.", "اسحب من النقطة الملونة إلى كتلة أخرى لربطهما. استخدم {name} في النص لإدراج اسم العميل.")}
          </div>
        </div>

        {/* Canvas */}
        <div className="relative min-w-0 flex-1" dir="ltr">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={["Delete"]}
          >
            <Background gap={20} color="#E5DFD0" />
            <Controls showInteractive={false} />
          </ReactFlow>
          {warnings.length > 0 && (
            <div className="absolute bottom-4 left-1/2 max-w-md -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 shadow" dir="auto">
              {warnings.slice(0, 3).map((w) => <div key={w} className="flex gap-1.5"><Info size={13} className="mt-0.5 shrink-0" />{w}</div>)}
            </div>
          )}
        </div>

        {/* Inspector */}
        <div className="w-80 shrink-0 overflow-y-auto border-s border-sand-200 bg-white p-4">
          {!selected || selected.type === "start" ? (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">{tr("When should this bot reply?", "متى يرد هذا الروبوت؟")}</h3>
                <div className="mt-3 space-y-2">
                  {[
                    { v: "exact", en: "Message is exactly a keyword", ar: "الرسالة تطابق الكلمة تماماً" },
                    { v: "contains", en: "Message contains a keyword", ar: "الرسالة تحتوي الكلمة" },
                    { v: "any", en: "Any message (welcome / default reply)", ar: "أي رسالة (ترحيب / رد افتراضي)" },
                  ].map((o) => (
                    <label key={o.v} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${flow.match_type === o.v ? "border-brand-500 bg-brand-50" : "border-sand-200"}`}>
                      <input type="radio" checked={flow.match_type === o.v} onChange={() => setFlow({ ...flow, match_type: o.v })} />
                      {tr(o.en, o.ar)}
                    </label>
                  ))}
                </div>
              </div>
              {flow.match_type !== "any" && (
                <div>
                  <label className="label">{tr("Keywords", "الكلمات المفتاحية")}</label>
                  <div className="flex gap-2">
                    <input className="input py-2" value={kwInput} onChange={(e) => setKwInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())} placeholder={tr("e.g. price", "مثال: السعر")} />
                    <button className="btn-secondary px-3" onClick={addKeyword}><Plus size={16} /></button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {flow.keywords.map((k: string) => (
                      <span key={k} className="badge bg-sand-100 py-1 text-ink-700">
                        {k}
                        <button onClick={() => setFlow({ ...flow, keywords: flow.keywords.filter((x: string) => x !== k) })}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <p className="hint">{tr("Add Arabic and English words. Capital letters don't matter.", "أضف كلمات بالعربية والإنجليزية. حالة الأحرف لا تهم.")}</p>
                </div>
              )}
              <p className="rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
                {tr("To test: turn the bot ON, save, then send the keyword to your business number from your phone.", "للتجربة: فعّل الرد الآلي واحفظ، ثم أرسل الكلمة المفتاحية إلى رقم نشاطك من هاتفك.")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{tr(META[selected.type].en, META[selected.type].ar)}</h3>
                <button className="btn-ghost p-2 hover:text-red-600" onClick={deleteSelected}><Trash2 size={16} /></button>
              </div>
              <p className="text-xs text-ink-400">{tr(META[selected.type].hintEn, META[selected.type].hintAr)}</p>

              {selected.type !== "tag" && (
                <div>
                  <label className="label">{selected.type === "question" ? tr("Question", "السؤال") : tr("Message text", "نص الرسالة")}</label>
                  <textarea className="input min-h-[120px]" dir="auto" value={selected.data.text || ""} onChange={(e) => updateData({ text: e.target.value })} maxLength={1024} />
                </div>
              )}
              {selected.type === "message" && (
                <div>
                  <label className="label">{tr("Image link (optional)", "رابط صورة (اختياري)")}</label>
                  <input className="input" dir="ltr" value={selected.data.imageUrl || ""} onChange={(e) => updateData({ imageUrl: e.target.value })} placeholder="https://…/photo.jpg" />
                </div>
              )}
              {selected.type === "choices" && (
                <div>
                  <label className="label">{tr("Options", "الخيارات")}</label>
                  <div className="space-y-2">
                    {(selected.data.options || []).map((o, i) => (
                      <div key={i} className="flex gap-2">
                        <input className="input py-2" dir="auto" maxLength={(selected.data.options || []).length > 3 ? 24 : 20} value={o} onChange={(e) => { const opts = [...(selected.data.options || [])]; opts[i] = e.target.value; updateData({ options: opts }); }} />
                        <button className="btn-ghost p-2" onClick={() => {
                          const opts = (selected.data.options || []).filter((_, j) => j !== i);
                          updateData({ options: opts });
                          setEdges((es) => es.filter((e) => !(e.source === selected.id && e.sourceHandle?.startsWith("opt-"))));
                        }}><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                  {(selected.data.options || []).length < 10 && (
                    <button className="btn-secondary mt-2 py-2" onClick={() => updateData({ options: [...(selected.data.options || []), ""] })}><Plus size={15} />{tr("Add option", "إضافة خيار")}</button>
                  )}
                  <p className="hint">{tr("Max 20 letters each for 1–3 options (buttons), 24 for 4–10 (list).", "بحد أقصى ٢٠ حرفاً لكل خيار من ١–٣ (أزرار)، و٢٤ للقائمة ٤–١٠.")}</p>
                  {(selected.data.options || []).length > 3 && (
                    <div className="mt-3">
                      <label className="label">{tr("List button text", "نص زر القائمة")}</label>
                      <input className="input py-2" maxLength={20} value={selected.data.buttonText || ""} onChange={(e) => updateData({ buttonText: e.target.value })} />
                    </div>
                  )}
                </div>
              )}
              {selected.type === "question" && (
                <div>
                  <label className="label">{tr("Save the answer as", "احفظ الإجابة باسم")}</label>
                  <input className="input font-mono" dir="ltr" value={selected.data.saveAs || ""} onChange={(e) => updateData({ saveAs: e.target.value })} placeholder="area" />
                  <p className="hint">{tr("Use it later as {area} in messages, or in bulk sends.", "استخدمه لاحقاً كـ {area} في الرسائل أو الإرسال الجماعي.")}</p>
                </div>
              )}
              {selected.type === "tag" && (
                <div>
                  <label className="label">{tr("Tag", "الوسم")}</label>
                  <input className="input" value={selected.data.tag || ""} onChange={(e) => updateData({ tag: e.target.value })} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Toast msg={toast} onDone={() => setToast(null)} />
    </div>
  );
}

export default function BotBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ReactFlowProvider>
      <Builder id={id} />
    </ReactFlowProvider>
  );
}
