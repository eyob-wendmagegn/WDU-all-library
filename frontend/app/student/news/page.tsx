'use client';

import Layout from '@/components/Layout';
import NewsList from '@/components/NewsList';
import { useTranslation } from '@/lib/i18n'; // ← ADDED

export default function StudentNewsPage() {
  const { t } = useTranslation(); // ← ADDED
  const role = 'student';
  const userId = localStorage.getItem('userId') || 'unknown';

  return (
    <Layout role={role}>
      <div className="p-6 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('news') || 'News'}</h1>
          <p className="text-gray-600">{t('stayInformed') || 'Stay informed with library announcements'}</p>
        </div>
        <NewsList role={role} userId={userId} />
      </div>
    </Layout>
  );
}