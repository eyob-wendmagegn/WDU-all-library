//student/setting/page.tsx
'use client';

import Layout from '@/components/Layout';
import { useTranslation } from '@/lib/i18n'; // ← ADDED

export default function StudentSetting() {
  const { t } = useTranslation(); // ← ADDED

  return (
    <Layout role="student">
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('studentSetting') || 'Student Setting'}</h1>
        <p className="text-gray-600">{t('manageSystemPreferences') || 'Manage system preferences, users, and security.'}</p>
      </div>
    </Layout>
  );
}