// teacher/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiBook, FiBookOpen, FiRotateCw, FiActivity } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';

interface TeacherData {
  totals: { addedBooks: number; borrowedBooks: number; returnedBooks: number };
  charts: { booksAdded: any; borrowedTrend: any };
  recentActivity: Array<{ action: string; book: string; date: string }>;
}

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageHovered, setIsImageHovered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.teacher);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout role="teacher">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  const { totals, charts, recentActivity } = data;

  const safeValue = (val: number | undefined) => (val ?? 0).toLocaleString();

  const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${bg} mb-3`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{safeValue(value)}</p>
    </div>
  );

  return (
    <Layout role="teacher">
      <div className="p-4 md:p-0.5 space-y-6 max-w-7xl mx-auto">

        {/* Fixed Image Card with proper mobile responsiveness */}
        <motion.div
          className="relative rounded-2xl overflow-hidden shadow-xl h-72 md:h-80 group"
          onMouseEnter={() => setIsImageHovered(true)}
          onMouseLeave={() => setIsImageHovered(false)}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.3 }
          }}
        >
          <div className="absolute inset-0">
            <motion.img 
              src="/library1.jpg" 
              alt="Library Management" 
              className="w-full h-full object-cover"
              animate={{
                scale: isImageHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-cyan-900/60"
              animate={{
                opacity: isImageHovered ? 0.9 : 0.8,
              }}
              transition={{ duration: 0.4 }}
            />
          </div>
          
          {/* Text container with responsive padding and text sizing */}
          <div className="relative z-10 h-full flex flex-col justify-center p-6 md:p-8 text-white">
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 drop-shadow-lg break-words"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {t('teacherDashboard') || 'Teacher Dashboard'}
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl font-medium mb-3 md:mb-4 drop-shadow-md opacity-90"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {t('teacherDashboardSubtitle1') || 'Track your books, adds, borrows, and returns.'}
            </motion.p>
            
            <motion.p 
              className="text-base sm:text-lg md:text-xl font-medium mb-2 md:mb-3 drop-shadow-md opacity-90"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {t('teacherDashboardSubtitle2') || 'Monitor library activity and manage book inventory efficiently.'}
            </motion.p>
            
            <motion.p 
              className="text-sm sm:text-base md:text-lg opacity-90 max-w-2xl drop-shadow-md"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              {t('teacherDashboardSubtitle3') || 'View analytics, track borrowing trends, and manage your library.'}
            </motion.p>
          </div>
          
          {/* Hover Overlay Effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: isImageHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Shine Effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: isImageHovered ? '100%' : '-100%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </motion.div>

        {/* ==== STAT CARDS ==== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={FiBook} label={t('booksAdded')} value={totals.addedBooks} bg="bg-green-100" color="text-green-600" />
          <StatCard icon={FiBookOpen} label={t('borrowedBooks')} value={totals.borrowedBooks} bg="bg-orange-100" color="text-orange-600" />
          <StatCard icon={FiRotateCw} label={t('returnedBooks')} value={totals.returnedBooks} bg="bg-blue-100" color="text-blue-600" />
        </div>

        {/* ==== CHARTS ==== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('booksAddedLast7Days')}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.booksAdded.labels.map((l: string, i: number) => ({ day: l, added: charts.booksAdded.data[i] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="added" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('borrowedBooksLast4Weeks')}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={charts.borrowedTrend.labels.map((l: string, i: number) => ({ week: l, borrowed: charts.borrowedTrend.data[i] }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="borrowed" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ==== RECENT ACTIVITY ==== */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('recentActivity')}</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiActivity className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-800">
                        {act.action} "{act.book}"
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{act.date}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic text-center py-4">{t('noActivityYet')}</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}