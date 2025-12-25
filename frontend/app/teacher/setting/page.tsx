// app/teacher/setting/page.tsx
'use client';

import Layout from '@/components/Layout';
import { useTranslation } from '@/lib/i18n';

export default function TeacherSetting() {
  const { t } = useTranslation();

  return (
    <Layout role="teacher">
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('teacherSetting')}</h1>
        <p className="text-gray-600">{t('manageSystemPreferences')}</p>
      </div>
    </Layout>
  );
}