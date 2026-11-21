"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Users, Upload, Plus, Search, Trash2, Tag, Download, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useAccount } from "@/components/AccountProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { normalizePhone, formatPhone } from "@/lib/phone";
import { Empty, Loading, Modal, PageHeader, Spinner, Toast } from "@/components/ui";

type Contact = { id: string; name: string | null; phone: string; tags: string[]; attributes: Record<string, any>; opted_in: boolean; created_at: string };

export default function ContactsPage() {
  const { tr } = useLang();
  const { userId } = useAccount();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [toast, setToast] = useState<{ m: string; t?: "ok" | "err" } | null>(null);

  const load = useCallback(async () => {
    const all: Contact[] = [];
    const sb = supabaseBrowser();
    for (let from = 0; ; from += 1000) {
      const { data } = await sb.from("contacts").select("id,name,phone,tags,attributes,opted_in,created_at").order("created_at", { ascending: false }).range(from, from + 999);
      all.push(...((data as Contact[]) || []));
      if (!data || data.length < 1000) break;
    }
    setContacts(all);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => Array.from(new Set((contacts || []).flatMap((c) => c.tags))).sort(), [contacts]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (contacts || []).filter((c) => (!tag || c.tags.includes(tag)) && (!s || (c.name || "").toLowerCase().includes(s) || c.phone.includes(s.replace(/\D/g, "") || "~")));
  }, [contacts, q, tag]);

  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id)));
  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const removeSelected = async () => {
    if (!confirm(tr(`Delete ${selected.size} contacts?`, `حذف ${selected.size} من جهات الاتصال؟`))) return;
    const ids = Array.from(selected);
    for (let i = 0; i < ids.length; i += 200) await supabaseBrowser().from("contacts").delete().in("id", ids.slice(i, i + 200));
    setSelected(new Set());
    setToast({ m: tr("Deleted", "تم الحذف") });
    load();
  };

  const toggleOptIn = async (c: Contact) => {
    await supabaseBrowser().from("contacts").update({ opted_in: !c.opted_in }).eq("id", c.id);
    load();
  };

  return (
    <div>
      <PageHeader
        title={tr("Contacts", "جهات الاتصال")}
        subtitle={tr("Everyone you can send messages to. Use tags (like “VIP” or “Muscat”) to group people.", "كل من يمكنك مراسلتهم. استخدم الوسوم (مثل «VIP» أو «مسقط») لتجميع العملاء.")}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setImportOpen(true)}>
              <Upload size={16} /> {tr("Import Excel / CSV", "استيراد من إكسل")}
            </button>
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> {tr("Add contact", "إضافة جهة اتصال")}
            </button>
          </div>
        }
      />

      {contacts === null ? (
        <Loading />
      ) : contacts.length === 0 ? (
        <Empty
          icon={<Users size={26} />}
          title={tr("No contacts yet", "لا توجد جهات اتصال بعد")}
          text={tr("Upload your customer list from Excel, or add people one by one.", "ارفع قائمة عملائك من إكسل، أو أضفهم واحداً تلو الآخر.")}
          action={
            <button className="btn-primary" onClick={() => setImportOpen(true)}>
              <Upload size={16} /> {tr("Import your list", "استورد قائمتك")}
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-sand-100 p-4">
            <div className="relative min-w-[200px] flex-1">
              <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input ps-9" placeholder={tr("Search name or number", "ابحث بالاسم أو الرقم")} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="input w-auto" value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">{tr("All tags", "كل الوسوم")}</option>
              {allTags.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            {selected.size > 0 && (
              <div className="flex gap-2">
                <button className="btn-secondary py-2" onClick={() => setTagOpen(true)}>
                  <Tag size={15} /> {tr("Add tag", "إضافة وسم")} ({selected.size})
                </button>
                <button className="btn-danger py-2" onClick={removeSelected}>
                  <Trash2 size={15} /> {tr("Delete", "حذف")}
                </button>
              </div>
            )}
            <span className="text-sm text-ink-400">{filtered.length} {tr("contacts", "جهة")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand-50 text-start text-xs font-medium text-ink-400">
                <tr>
                  <th className="w-10 p-3">
                    <input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={toggleAll} />
                  </th>
                  <th className="p-3 text-start">{tr("Name", "الاسم")}</th>
                  <th className="p-3 text-start">{tr("WhatsApp number", "رقم واتساب")}</th>
                  <th className="p-3 text-start">{tr("Tags", "الوسوم")}</th>
                  <th className="p-3 text-start">{tr("Receives marketing", "يستقبل التسويق")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filtered.slice(0, 500).map((c) => (
                  <tr key={c.id} className="hover:bg-sand-50/60">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                    </td>
                    <td className="p-3 font-medium">{c.name || <span className="text-ink-400">—</span>}</td>
                    <td className="p-3 text-ink-500" dir="ltr">
                      <span className="inline-block">{formatPhone(c.phone)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map((t) => (
                          <span key={t} className="badge bg-brand-50 text-brand-700">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleOptIn(c)} className={`badge ${c.opted_in ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {c.opted_in ? tr("Yes", "نعم") : tr("Unsubscribed", "ألغى الاشتراك")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 500 && <p className="p-4 text-center text-xs text-ink-400">{tr("Showing first 500. Use search to find others.", "يتم عرض أول ٥٠٠. استخدم البحث للعثور على الباقي.")}</p>}
          </div>
        </div>
      )}

      <AddContactModal open={addOpen} onClose={() => setAddOpen(false)} userId={userId} onSaved={() => { setAddOpen(false); load(); setToast({ m: tr("Contact saved", "تم الحفظ") }); }} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} userId={userId} onDone={(n) => { setImportOpen(false); load(); setToast({ m: tr(`${n} contacts imported`, `تم استيراد ${n} جهة اتصال`) }); }} />
      <TagModal
        open={tagOpen}
        onClose={() => setTagOpen(false)}
        onSave={async (t) => {
          const sb = supabaseBrowser();
          const chosen = (contacts || []).filter((c) => selected.has(c.id));
          await Promise.all(chosen.map((c) => sb.from("contacts").update({ tags: Array.from(new Set([...c.tags, t])) }).eq("id", c.id)));
          setTagOpen(false);
          setSelected(new Set());
          load();
        }}
      />
      <Toast msg={toast?.m || null} type={toast?.t} onDone={() => setToast(null)} />
    </div>
  );
}

function parseTags(s: string) {
  return s.split(",").map((t) => t.trim()).filter(Boolean);
}

function AddContactModal({ open, onClose, onSaved, userId }: { open: boolean; onClose: () => void; onSaved: () => void; userId: string | null }) {
  const { tr } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tags, setTags] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizePhone(phone);
    if (!p) return setErr(tr("Please enter a valid number, e.g. 91234567 or +968 9123 4567", "أدخل رقماً صحيحاً، مثل 91234567 أو 4567 9123 968+"));
    setBusy(true);
    const { error } = await supabaseBrowser().from("contacts").upsert({ owner_id: userId, name: name || null, phone: p, tags: parseTags(tags) }, { onConflict: "owner_id,phone" });
    setBusy(false);
    if (error) return setErr(error.message);
    setName(""); setPhone(""); setTags(""); setErr(null);
    onSaved();
  };
  return (
    <Modal open={open} onClose={onClose} title={tr("Add contact", "إضافة جهة اتصال")}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">{tr("Name", "الاسم")}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("e.g. Ahmed Al Balushi", "مثال: أحمد البلوشي")} />
        </div>
        <div>
          <label className="label">{tr("WhatsApp number", "رقم واتساب")}</label>
          <input className="input" dir="ltr" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9123 4567" />
          <p className="hint">{tr("Omani numbers: just type the 8 digits. Other countries: include the country code.", "أرقام عُمان: اكتب ٨ أرقام فقط. الدول الأخرى: أضف رمز الدولة.")}</p>
        </div>
        <div>
          <label className="label">{tr("Tags (optional)", "الوسوم (اختياري)")}</label>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="VIP, Muscat" />
          <p className="hint">{tr("Separate with commas.", "افصل بينها بفاصلة.")}</p>
        </div>
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />}{tr("Save", "حفظ")}</button>
      </form>
    </Modal>
  );
}

function ImportModal({ open, onClose, onDone, userId }: { open: boolean; onClose: () => void; onDone: (n: number) => void; userId: string | null }) {
  const { tr } = useLang();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [nameCol, setNameCol] = useState("");
  const [phoneCol, setPhoneCol] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => { setRows([]); setCols([]); setNameCol(""); setPhoneCol(""); setTags(""); setErr(null); };

  const onFile = (f: File) => {
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const c = res.meta.fields || [];
        setCols(c);
        setRows(res.data);
        setPhoneCol(c.find((x) => /phone|mobile|number|whatsapp|رقم|هاتف|جوال/i.test(x)) || c[0] || "");
        setNameCol(c.find((x) => /name|اسم/i.test(x)) || "");
      },
      error: () => setErr(tr("Could not read this file. Save your Excel as CSV and try again.", "تعذرت قراءة الملف. احفظ ملف إكسل بصيغة CSV وحاول مجدداً.")),
    });
  };

  const valid = rows.filter((r) => normalizePhone(r[phoneCol]));

  const doImport = async () => {
    setBusy(true);
    const t = parseTags(tags);
    const seen = new Set<string>();
    const records = valid
      .map((r) => {
        const phone = normalizePhone(r[phoneCol])!;
        const attributes: Record<string, string> = {};
        cols.forEach((c) => { if (c !== phoneCol && c !== nameCol && r[c]) attributes[c.trim().toLowerCase().replace(/\s+/g, "_")] = r[c]; });
        return { owner_id: userId, phone, name: nameCol ? r[nameCol]?.trim() || null : null, tags: t, attributes };
      })
      .filter((r) => (seen.has(r.phone) ? false : (seen.add(r.phone), true)));
    const sb = supabaseBrowser();
    for (let i = 0; i < records.length; i += 500) {
      const { error } = await sb.from("contacts").upsert(records.slice(i, i + 500), { onConflict: "owner_id,phone" });
      if (error) { setErr(error.message); setBusy(false); return; }
    }
    setBusy(false);
    reset();
    onDone(records.length);
  };

  const sample = () => {
    const csv = "name,phone,city\nAhmed Al Balushi,91234567,Muscat\nFatma Al Harthy,+96898765432,Sohar\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "wasil-contacts-sample.csv";
    a.click();
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={tr("Import contacts", "استيراد جهات الاتصال")} wide>
      {rows.length === 0 ? (
        <div>
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50 px-6 py-12 text-center hover:border-brand-400">
            <Upload className="mb-3 text-brand-500" />
            <span className="font-semibold">{tr("Choose a CSV file", "اختر ملف CSV")}</span>
            <span className="mt-1 text-sm text-ink-500">{tr("In Excel: File → Save As → CSV (UTF-8)", "في إكسل: ملف ← حفظ باسم ← CSV (UTF-8)")}</span>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          <button onClick={sample} className="btn-ghost mt-3 text-brand-600">
            <Download size={15} /> {tr("Download a sample file", "تنزيل ملف نموذجي")}
          </button>
          {err && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{tr("Which column has the phone number?", "أي عمود يحتوي رقم الهاتف؟")}</label>
              <select className="input" value={phoneCol} onChange={(e) => setPhoneCol(e.target.value)}>
                {cols.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{tr("Which column has the name?", "أي عمود يحتوي الاسم؟")}</label>
              <select className="input" value={nameCol} onChange={(e) => setNameCol(e.target.value)}>
                <option value="">{tr("— none —", "— لا يوجد —")}</option>
                {cols.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{tr("Add a tag to everyone in this file (optional)", "أضف وسماً لكل من في الملف (اختياري)")}</label>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder={tr("e.g. Ramadan 2026", "مثال: رمضان ٢٠٢٦")} />
          </div>
          <div className="overflow-hidden rounded-xl border border-sand-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-sand-100">
                {rows.slice(0, 5).map((r, i) => {
                  const p = normalizePhone(r[phoneCol]);
                  return (
                    <tr key={i}>
                      <td className="p-2.5">{nameCol ? r[nameCol] : "—"}</td>
                      <td className="p-2.5" dir="ltr">{r[phoneCol]}</td>
                      <td className="p-2.5 text-end">{p ? <span className="text-emerald-600" dir="ltr">✓ +{p}</span> : <span className="text-red-500">{tr("invalid", "غير صالح")}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm">
            <span>
              <b>{valid.length}</b> {tr("valid numbers", "رقم صالح")} · <span className="text-ink-500">{rows.length - valid.length} {tr("skipped", "تم تخطيها")}</span>
            </span>
            <button className="btn-ghost py-1 text-xs" onClick={reset}><X size={14} />{tr("Choose another file", "اختر ملفاً آخر")}</button>
          </div>
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full" disabled={busy || valid.length === 0} onClick={doImport}>
            {busy && <Spinner />} {tr(`Import ${valid.length} contacts`, `استيراد ${valid.length} جهة اتصال`)}
          </button>
        </div>
      )}
    </Modal>
  );
}

function TagModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (t: string) => Promise<void> }) {
  const { tr } = useLang();
  const [t, setT] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={tr("Add a tag", "إضافة وسم")}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!t.trim()) return; setBusy(true); await onSave(t.trim()); setBusy(false); setT(""); }} className="space-y-4">
        <input className="input" autoFocus value={t} onChange={(e) => setT(e.target.value)} placeholder="VIP" />
        <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />}{tr("Add tag", "إضافة الوسم")}</button>
      </form>
    </Modal>
  );
}
