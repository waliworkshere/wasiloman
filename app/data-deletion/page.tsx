"use client";
import { LegalPage } from "@/components/LegalPage";
import { useLang } from "@/lib/i18n";

export default function DataDeletion() {
  const { lang } = useLang();
  if (lang === "ar")
    return (
      <LegalPage title="تعليمات حذف البيانات">
        <p>يمكنك حذف بياناتك من «واصل عُمان» في أي وقت:</p>
        <ul>
          <li>لفصل رقم واتساب وحذف رمز الوصول: الإعدادات ← «فصل الرقم».</li>
          <li>لحذف جهات الاتصال: صفحة جهات الاتصال ← حدّدها ← «حذف».</li>
          <li>لحذف حسابك بالكامل مع كل البيانات: راسلنا عبر البريد الإلكتروني المسجل في صفحة التطبيق، وسنحذف كل شيء خلال ٧ أيام.</li>
        </ul>
        <p>يمكنك أيضاً إزالة صلاحيات التطبيق من فيسبوك: الإعدادات ← الأمان ← تطبيقات ومواقع الأعمال ← إزالة «Wasil Oman».</p>
      </LegalPage>
    );
  return (
    <LegalPage title="Data Deletion Instructions">
      <p>You can delete your data from Wasil Oman at any time:</p>
      <ul>
        <li>To disconnect your WhatsApp number and delete its access token: Settings → “Disconnect”.</li>
        <li>To delete contacts: Contacts → select them → “Delete”.</li>
        <li>To delete your whole account and all data: email us at the contact address on our Meta app page and we will delete everything within 7 days.</li>
      </ul>
      <p>You can also remove the app's access from Facebook: Settings → Security → Business Integrations → remove “Wasil Oman”.</p>
    </LegalPage>
  );
}
