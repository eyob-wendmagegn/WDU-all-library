// app/teacher/news/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import NewsList from '@/components/NewsList';
import { useTranslation } from '@/lib/i18n';

export default function TeacherNewsPage() {
  const { t } = useTranslation();
  const role = 'teacher' as const;

  // Safely read userId from localStorage only on client
  const [userId, setUserId] = useState<string>('unknown');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId || 'unknown');
  }, []);

  return (
    <Layout role={role}>
      <div className="p-6 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('news')}</h1>
          <p className="text-gray-600">{t('stayInformed')}</p>
        </div>
        <NewsList role={role} userId={userId} />
      </div>
    </Layout>
  );
}