// app/admin/setting/page.tsx
'use client' // ← ADD THIS LINE

import Layout from '@/components/Layout'
import { useTranslation } from '@/lib/i18n' // ← ADDED

export default function AdminSetting() {
  const { t } = useTranslation() // ← NOW WORKS!

  return (
    <Layout role="admin">
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('adminSettings')}</h1>
        <p className="text-gray-600">{t('manageSystemPreferences')}</p>
      </div>
    </Layout>
  )
}