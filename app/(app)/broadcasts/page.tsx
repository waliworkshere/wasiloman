"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Send, Plus, CalendarClock } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ConnectBanner } from "@/components/ConnectBanner";
import { Empty, Loading, PageHeader, StatusBadge } from "@/components/ui";

export default function BroadcastsPage() {
  const { tr } = useLang();
  const [list, setList] = useState<any[] | null>(null);

  useEffect(() => {
    supabaseBrowser()
      .from("broadcasts")
      .select("id,name,template_name,status,scheduled_at,total,sent,delivered,read,failed,created_at,audience_tags")
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any[] | null }) => setList(data || []));
  }, []);

  return (
    <div>
      <ConnectBanner />
      <PageHeader
        title={tr("Bulk Send", "الإرسال الجماعي")}
        subtitle={tr("Send one message to many customers at once, now or at a time you choose.", "أرسل رسالة واحدة لعدد كبير من العملاء دفعة واحدة، الآن أو في وقت تختاره.")}
        action={<Link href="/broadcasts/new" className="btn-primary"><Plus size={16} /> {tr("New bulk message", "رسالة جماعية جديدة")}</Link>}
      />
      {list === null ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty
          icon={<Send size={26} />}
          title={tr("You haven't sent anything yet", "لم ترسل أي شيء بعد")}
          text={tr("Choose a message, choose who gets it, and press send. We'll show you who received and read it.", "اختر رسالة، واختر المستلمين، واضغط إرسال. سنعرض لك من استلمها وقرأها.")}
          action={<Link href="/broadcasts/new" className="btn-primary"><Send size={16} /> {tr("Send your first", "أرسل أول رسالة")}</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand-50 text-xs font-medium text-ink-400">
              <tr>
                <th className="p-3 text-start">{tr("Name", "الاسم")}</th>
                <th className="p-3 text-start">{tr("Status", "الحالة")}</th>
                <th className="p-3 text-start">{tr("Recipients", "المستلمون")}</th>
                <th className="p-3 text-start">{tr("Delivered", "وصلت")}</th>
                <th className="p-3 text-start">{tr("Read", "قُرئت")}</th>
                <th className="p-3 text-start">{tr("Failed", "فشلت")}</th>
                <th className="p-3 text-start">{tr("Date", "التاريخ")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {list.map((b) => (
                <tr key={b.id} className="cursor-pointer hover:bg-sand-50" onClick={() => (window.location.href = `/broadcasts/${b.id}`)}>
                  <td className="p-3">
                    <div className="font-medium">{b.name}</div>
                    <div className="font-mono text-xs text-ink-400" dir="ltr">{b.template_name}</div>
                  </td>
                  <td className="p-3"><StatusBadge status={b.status} /></td>
                  <td className="p-3">{b.total}</td>
                  <td className="p-3">{b.delivered}</td>
                  <td className="p-3">{b.read}</td>
                  <td className="p-3 text-red-600">{b.failed || ""}</td>
                  <td className="p-3 text-xs text-ink-500">
                    {b.status === "scheduled" ? (
                      <span className="flex items-center gap-1 text-violet-700"><CalendarClock size={13} />{new Date(b.scheduled_at).toLocaleString()}</span>
                    ) : (
                      new Date(b.created_at).toLocaleString()
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
