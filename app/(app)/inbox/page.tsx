"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessagesSquare, Send, Search, Bot, Megaphone, Check, CheckCheck, Clock, ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatPhone } from "@/lib/phone";
import { ConnectBanner } from "@/components/ConnectBanner";
import { Empty, Loading, PageHeader, Spinner, api } from "@/components/ui";

export default function InboxPage() {
  const { tr } = useLang();
  const [convos, setConvos] = useState<any[] | null>(null);
  const [active, setActive] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<any>(null);
  activeRef.current = active;

  const loadConvos = useCallback(async () => {
    const { data } = await supabaseBrowser().from("contacts").select("id,name,phone,last_message_at,last_message_preview,last_inbound_at,unread").not("last_message_at", "is", null).order("last_message_at", { ascending: false }).limit(300);
    setConvos(data || []);
  }, []);

  const loadMsgs = useCallback(async (cid: string) => {
    const { data } = await supabaseBrowser().from("messages").select("*").eq("contact_id", cid).order("created_at").limit(500);
    setMsgs(data || []);
  }, []);

  useEffect(() => {
    loadConvos();
    const sb = supabaseBrowser();
    const ch = sb
      .channel("inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (p: any) => {
        const m = p.new;
        if (activeRef.current && m?.contact_id === activeRef.current.id) {
          setMsgs((prev) => {
            const i = prev.findIndex((x) => x.id === m.id);
            if (i >= 0) { const n = [...prev]; n[i] = m; return n; }
            return [...prev, m];
          });
        }
        loadConvos();
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [loadConvos]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const open = async (c: any) => {
    setActive(c);
    setErr(null);
    loadMsgs(c.id);
    if (c.unread) {
      await supabaseBrowser().from("contacts").update({ unread: 0 }).eq("id", c.id);
      loadConvos();
    }
  };

  const windowOpen = active?.last_inbound_at && Date.now() - new Date(active.last_inbound_at).getTime() < 24 * 3600 * 1000;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api("/api/inbox/send", { contact_id: active.id, text });
      setMsgs((m) => (m.some((x) => x.id === r.message.id) ? m : [...m, r.message]));
      setText("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const filtered = (convos || []).filter((c) => !q || (c.name || "").toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  const tick = (s: string) => (s === "read" ? <CheckCheck size={13} className="text-sky-500" /> : s === "delivered" ? <CheckCheck size={13} /> : s === "sent" ? <Check size={13} /> : s === "failed" ? <span className="text-red-500">!</span> : <Clock size={12} />);

  return (
    <div>
      <ConnectBanner />
      <PageHeader title={tr("Inbox", "المحادثات")} subtitle={tr("Replies from your customers appear here live.", "ردود عملائك تظهر هنا مباشرة.")} />
      {convos === null ? (
        <Loading />
      ) : convos.length === 0 ? (
        <Empty icon={<MessagesSquare size={26} />} title={tr("No conversations yet", "لا توجد محادثات بعد")} text={tr("When customers message your WhatsApp number, their chats show up here.", "عندما يراسل العملاء رقمك على واتساب، ستظهر محادثاتهم هنا.")} />
      ) : (
        <div className="card grid h-[calc(100vh-220px)] min-h-[480px] overflow-hidden md:grid-cols-[300px_1fr]">
          <div className={`flex flex-col border-e border-sand-100 ${active ? "hidden md:flex" : "flex"}`}>
            <div className="border-b border-sand-100 p-3">
              <div className="relative">
                <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input className="input py-2 ps-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Search", "بحث")} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map((c) => (
                <button key={c.id} onClick={() => open(c)} className={`flex w-full items-center gap-3 border-b border-sand-50 p-3 text-start hover:bg-sand-50 ${active?.id === c.id ? "bg-brand-50" : ""}`}>
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">{(c.name || "#")[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{c.name || formatPhone(c.phone)}</span>
                      <span className="shrink-0 text-[11px] text-ink-400">{new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="truncate text-xs text-ink-500">{c.last_message_preview}</span>
                      {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">{c.unread}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {active ? (
            <div className="flex min-h-0 flex-col">
              <div className="flex items-center gap-3 border-b border-sand-100 p-3">
                <button className="btn-ghost p-1.5 md:hidden" onClick={() => setActive(null)}><ArrowLeft size={18} className="rtl:rotate-180" /></button>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">{(active.name || "#")[0]}</div>
                <div>
                  <div className="text-sm font-semibold">{active.name || tr("Unknown", "غير معروف")}</div>
                  <div className="text-xs text-ink-400" dir="ltr">{formatPhone(active.phone)}</div>
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto bg-[#EFEAE2] p-4">
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm shadow-sm ${m.direction === "out" ? "bg-[#D9FDD3]" : "bg-white"}`}>
                      {m.source === "bot" && <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-brand-600"><Bot size={11} />{tr("Bot", "رد آلي")}</div>}
                      {m.source === "broadcast" && <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-gold-600"><Megaphone size={11} />{tr("Bulk message", "رسالة جماعية")}</div>}
                      <div className="whitespace-pre-wrap break-words">{m.body || `[${m.type}]`}</div>
                      <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-ink-400">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {m.direction === "out" && tick(m.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              {err && <p className="bg-red-50 px-4 py-2 text-xs text-red-700">{err}</p>}
              {windowOpen ? (
                <form onSubmit={send} className="flex gap-2 border-t border-sand-100 p-3">
                  <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={tr("Type a reply…", "اكتب رداً…")} />
                  <button className="btn-primary px-4" disabled={busy || !text.trim()}>{busy ? <Spinner /> : <Send size={17} className="rtl:-scale-x-100" />}</button>
                </form>
              ) : (
                <div className="border-t border-sand-100 bg-sand-50 p-4 text-center text-xs text-ink-500">
                  {tr("It's been more than 24 hours since this customer messaged you. WhatsApp only allows template messages now — use Bulk Send.", "مرت أكثر من ٢٤ ساعة على آخر رسالة من هذا العميل. واتساب يسمح الآن بالقوالب فقط — استخدم الإرسال الجماعي.")}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden place-items-center text-sm text-ink-400 md:grid">{tr("Choose a conversation", "اختر محادثة")}</div>
          )}
        </div>
      )}
    </div>
  );
}
