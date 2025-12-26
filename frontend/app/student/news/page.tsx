'use client';

import { useState, useEffect } from 'react';  // ← ADD THIS
import Layout from '@/components/Layout';
import NewsList from '@/components/NewsList';
import { useTranslation } from '@/lib/i18n';

export default function StudentNewsPage() {
  const { t } = useTranslation();
  const role = 'student';

  const [userId, setUserId] = useState('unknown');  // ← Start with fallback

  useEffect(() => {
    const id = localStorage.getItem('userId') || 'unknown';
    setUserId(id);
  }, []);  // ← Runs only on client after mount

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