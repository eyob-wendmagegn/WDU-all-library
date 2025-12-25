// app/librarian/setting/page.tsx
'use client'; // ← ADDED

import Layout from '@/components/Layout'
import { useTranslation } from '@/lib/i18n'; // ← ADDED

export default function LibrarianSetting() {
  const { t } = useTranslation(); // ← ADDED

  return (
    <Layout role="librarian">
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('librarianSetting')}</h1>
        <p className="text-gray-600">{t('manageSystemPreferences')}</p>
      </div>
    </Layout>
  )
}