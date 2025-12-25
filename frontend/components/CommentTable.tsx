'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FiSearch } from 'react-icons/fi';
import { useTranslation } from '@/lib/i18n';

export default function CommentTable() {
  const { t } = useTranslation();
  const [comments, setComments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetch = async () => {
    const r = await api.get('/comments', { params: { page, limit, search } });
    setComments(r.data.comments);
    setTotal(r.data.total);
  };

  useEffect(() => { fetch(); }, [page, search]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      {/* Search */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-2">
          <FiSearch className="mt-2 text-gray-500" />
          <input
            placeholder={t('searchComments')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-auto ">
          <thead className="text-xs uppercase tracking-wider">
            <tr className="bg-blue-600 ">
              <th className="px-6 py-4 text-left font-medium text-white">{t('commentId')}</th>
              <th className="px-6 py-4 text-left font-medium text-white">{t('commentUser')}</th>
              <th className="px-6 py-4 text-left font-medium text-white">{t('commentRole')}</th>
              <th className="px-6 py-4 text-left font-medium text-white">{t('commentContent')}</th>
              <th className="px-6 py-4 text-left font-medium text-white">{t('commentDate')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {comments.map(c => (
              <tr key={c._id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{c.id}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{c.username}</p>
                    <p className="text-xs text-gray-500">{c.userId}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${
                    c.role === 'student' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    c.role === 'teacher' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    c.role === 'librarian' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {t(c.role) || c.role}
                  </span>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="text-sm text-gray-700 truncate">{c.comment}</p>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-sm gap-2">
        <p className="text-gray-600">{total} {t('total')}</p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p-1))}
            disabled={page===1}
            className="px-3 py-1.5 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {t('prev')}
          </button>
          <span className="px-3 py-1.5 text-gray-700">{t('page')} {page}</span>
          <button
            onClick={() => setPage(p => p+1)}
            disabled={comments.length < limit}
            className="px-3 py-1.5 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}