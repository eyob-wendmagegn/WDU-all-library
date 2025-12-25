// components/NewsForm.tsx
'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { FiSend } from 'react-icons/fi';
import { useTranslation } from '@/lib/i18n';

export default function NewsForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ role: 'all', news: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: any) => {
    e.preventDefault();
    if (!form.news.trim()) return alert(t('newsRequired') || 'News required');
    setLoading(true);
    try {
      await api.post('/news', form);
      alert(t('newsPosted') || 'News posted!');
      setForm({ role: 'all', news: '' });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || t('failed') || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">{t('targetAudience') || 'Target Audience'}</label>
        <select 
          name="role" 
          value={form.role} 
          onChange={handle} 
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
        >
          <option value="all">{t('allUsers') || 'All Users'}</option>
          <option value="librarian">{t('librarian')}</option>
          <option value="teacher">{t('teacher')}</option>
          <option value="student">{t('student')}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700">{t('newsMessage') || 'News Message'}</label>
        <textarea
          name="news"
          placeholder={t('writeAnnouncement') || "Write your announcement..."}
          required
          minLength={5}
          rows={4}
          value={form.news}
          onChange={handle}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium shadow-sm hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <FiSend /> {loading ? (t('posting') || 'Posting...') : (t('postNews') || 'Post News')}
      </button>
    </form>
  );
}