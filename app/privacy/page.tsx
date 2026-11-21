"use client";
import { LegalPage } from "@/components/LegalPage";
import { useLang } from "@/lib/i18n";

export default function Privacy() {
  const { lang } = useLang();
  if (lang === "ar")
    return (
      <LegalPage title="سياسة الخصوصية">
        <p>آخر تحديث: نوفمبر ٢٠٢٦. توضح هذه السياسة كيف تجمع منصة «واصل عُمان» البيانات وتستخدمها وتحميها.</p>
        <h2>البيانات التي نجمعها</h2>
        <ul>
          <li>بيانات الحساب: البريد الإلكتروني وكلمة المرور (مشفّرة).</li>
          <li>بيانات واتساب للأعمال: معرّف الحساب ورقم الهاتف واسم العرض ورمز الوصول الذي تمنحه عبر تسجيل الدخول من ميتا.</li>
          <li>جهات الاتصال والرسائل التي ترفعها أو تستقبلها عبر رقمك.</li>
        </ul>
        <h2>كيف نستخدم البيانات</h2>
        <p>نستخدم البيانات فقط لتقديم الخدمة: إرسال الرسائل واستقبالها، وتشغيل الردود الآلية، وعرض التقارير. لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث، باستثناء ميتا (واتساب) لإرسال الرسائل.</p>
        <h2>الحماية</h2>
        <p>تُخزَّن البيانات في قواعد بيانات آمنة مع عزل كامل بين الحسابات، ولا تُرسل رموز الوصول إلى المتصفح أبداً.</p>
        <h2>حقوقك</h2>
        <p>يمكنك تصدير بياناتك أو حذفها في أي وقت. راجع صفحة <a className="text-brand-600 underline" href="/data-deletion">حذف البيانات</a>.</p>
        <h2>التواصل</h2>
        <p>لأي استفسار راسلنا عبر البريد الإلكتروني المسجل في صفحة التطبيق على ميتا.</p>
      </LegalPage>
    );
  return (
    <LegalPage title="Privacy Policy">
      <p>Last updated: November 2026. This policy explains how Wasil Oman (“we”) collects, uses and protects data.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account data: your email and password (stored hashed).</li>
        <li>WhatsApp Business data: account ID, phone number, display name and the access token you grant through Meta login.</li>
        <li>Contacts and messages you upload or receive through your number.</li>
      </ul>
      <h2>How we use it</h2>
      <p>Only to provide the service: sending and receiving messages, running auto-reply bots and showing reports. We do not sell your data or share it with third parties, except Meta (WhatsApp) to deliver messages.</p>
      <h2>Security</h2>
      <p>Data is stored in secured databases with strict separation between accounts. Access tokens are never sent to the browser.</p>
      <h2>Your rights</h2>
      <p>You can export or delete your data at any time. See <a className="text-brand-600 underline" href="/data-deletion">Data deletion</a>.</p>
      <h2>Contact</h2>
      <p>For any questions, email us at the contact address listed on our Meta app page.</p>
    </LegalPage>
  );
}
