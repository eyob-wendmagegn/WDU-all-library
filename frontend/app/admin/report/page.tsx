// app/admin/report/page.tsx
'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiFileText, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

type ReportType = 'users' | 'news' | 'books' | 'deactive';

interface ReportData {
  type: ReportType;
  weekStart: string;
  data: any;
}

export default function AdminReport() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ReportType | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (type: ReportType) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await api.get(`/reports/${type}`);
      setReport(res.data);
      setSelected(type);
    } catch (e: any) {
      setError(e.response?.data?.message || t('reportFailed'));
    } finally {
      setLoading(false);
    }
  };

  const options: { key: ReportType; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: t('recentlyAddedUsers'), icon: <FiFileText className="w-5 h-5" /> },
    { key: 'news', label: t('recentlyAddedNews'), icon: <FiFileText className="w-5 h-5" /> },
    { key: 'books', label: t('recentlyAddedBooks'), icon: <FiFileText className="w-5 h-5" /> },
    { key: 'deactive', label: t('deactivatedUsersThisWeek'), icon: <FiAlertCircle className="w-5 h-5" /> },
  ];

  return (
    <Layout role="admin">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="p-4 md:p-6 max-w-5xl mx-auto space-y-6"
      >
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FiFileText className="w-7 h-7 text-indigo-600" />
            </div>
            {t('weeklyReportGenerator')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('chooseReportType')} <strong className="text-indigo-600">{t('generate')}</strong>.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map((opt, i) => (
              <motion.button
                key={opt.key}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchReport(opt.key)}
                disabled={loading}
                className={`p-5 rounded-xl border-2 text-left transition-all relative overflow-hidden
                  ${selected === opt.key 
                    ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md' 
                    : 'border-gray-200 hover:border-indigo-400 hover:shadow-md bg-gray-50'
                  }
                  ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selected === opt.key ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {opt.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{opt.label}</div>
                    {loading && selected === opt.key && (
                      <div className="flex items-center gap-2 mt-1 text-indigo-600 text-sm">
                        <FiLoader className="animate-spin w-4 h-4" />
                        <span>{t('generatingReport')}...</span>
                      </div>
                    )}
                  </div>
                </div>

                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100 to-transparent opacity-0"
                  whileHover={{ x: ['-100%', '100%'], opacity: [0, 0.7, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 p-5 rounded-xl flex items-center gap-3 shadow-md"
            >
              <FiAlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium">{t('error')}</p>
                <p className="text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {report && (
            <motion.div
              key={report.type}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                mass: 1
              }}
              className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {options.find((o) => o.key === report.type)?.icon}
                  {options.find((o) => o.key === report.type)?.label}
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {t('week')}: <strong>{new Date(report.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
                </span>
              </div>

              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.15 }
                  }
                }}
                initial="hidden"
                animate="visible"
              >
                {report.type === 'users' && (
                  <>
                    <AnimatedSection title={t('addedUsers')} items={report.data.added} />
                    <AnimatedSection title={t('deactivatedUsers')} items={report.data.deactivated} />
                  </>
                )}

                {report.type === 'news' && <AnimatedSection title={t('newsItems')} items={report.data.added} />}

                {report.type === 'books' && <AnimatedSection title={t('booksAdded')} items={report.data.added} />}

                {report.type === 'deactive' && <AnimatedSection title={t('deactivatedUsers')} items={report.data.deactivated} />}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}

function AnimatedSection({ title, items }: { title: string; items: any[] }) {
  const { t } = useTranslation();
  if (!items || items.length === 0) {
    return (
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
        className="border-t border-gray-200 pt-5"
      >
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          {title}
        </h3>
        <p className="text-gray-500 italic mt-2">{t('noRecordsThisWeek')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      className="border-t border-gray-200 pt-5"
    >
      <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
        {title} <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{items.length}</span>
      </h3>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-600">
              {Object.keys(items[0]).map((k) => (
                <th key={k} className="px-6 py-4 text-left font-medium text-white capitalize">
                  {t(k.replace(/_/g, ' '))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((row, i) => (
              <motion.tr
                key={i}
                variants={{
                  hidden: { opacity: 0, x: -30 },
                  visible: { opacity: 1, x: 0 }
                }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-gray-50/80 transition-colors"
              >
                {Object.values(row).map((v: any, j) => (
                  <td key={j} className="px-6 py-4 text-gray-700">
                    {v instanceof Date 
                      ? new Date(v).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : String(v)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}