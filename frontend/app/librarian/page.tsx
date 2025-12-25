// librarian/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  FiBook,
  FiActivity,
} from 'react-icons/fi';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion, Variants } from 'framer-motion';

interface LibrarianData {
  totals: {
    books: number;
    borrowed: number;
    returned: number;
    paid: number;
  };
  pie: {
    borrowed: number;
    available: number;
  };
  returns: {
    labels: string[];
    data: number[];
  };
  added: {
    labels: string[];
    data: number[];
  };
  borrowedTrend: {
    labels: string[];
    data: number[];
  };
  recentActivity: Array<{
    action: string;
    user: string;
    book: string;
    date: string;
    fine?: number;
  }>;
}

// Separate animation variants for different sections
const headerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

const statCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

const chartContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const chartItemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const activityItemVariants: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function LibrarianDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<LibrarianData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.librarian);
        
        // Show stats immediately when data loads
        setTimeout(() => {
          setShowStats(true);
        }, 100);
        
        // Show charts after stats
        setTimeout(() => {
          setShowCharts(true);
        }, 300);
        
        // Show activity last
        setTimeout(() => {
          setShowActivity(true);
        }, 500);
      } catch (err) {
        console.error('Librarian dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout role="librarian">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  const { totals, pie, returns, added, borrowedTrend, recentActivity } = data;

  const StatCard = ({ icon: Icon, label, value, bg, color, isCurrency = false }: any) => (
    <motion.div
      variants={statCardVariants}
      initial="hidden"
      animate={showStats ? "visible" : "hidden"}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className={`p-3 rounded-lg ${bg}`}>
        {isCurrency ? (
          <span className={`text-lg font-bold ${color}`}>ETB</span>
        ) : (
          <Icon className={`w-6 h-6 ${color}`} />
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600">{t(label)}</p>
        <p className="text-2xl font-bold text-gray-800">
          {isCurrency ? `ETB ${value.toLocaleString()}` : value.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );

  const pieData = [
    { name: t('borrowed'), value: pie.borrowed, color: '#3b82f6' },
    { name: t('available'), value: pie.available, color: '#10b981' },
  ];

  return (
    <Layout role="librarian">
      <div className="p-4 md:p-0.5 space-y-6 max-w-7xl mx-auto">
        {/* Fixed Image Card with Welcome Text - Mobile responsive */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="visible"
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
              src="/books.jpg" 
              alt="Library Books" 
              className="w-full h-full object-cover"
              animate={{
                scale: isImageHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-green-900/60"
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
              {t('librarianDashboard') || 'Librarian Dashboard'}
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl font-medium mb-3 md:mb-4 drop-shadow-md opacity-90"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {t('monitorLibraryFlow') || 'Monitor library flow, manage inventory, and track analytics.'}
            </motion.p>
            
            <motion.p 
              className="text-base sm:text-lg md:text-xl font-medium mb-2 md:mb-3 drop-shadow-md opacity-90"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {t('librarianDashboardSubtitle1') || 'Track books, borrows, returns, and payments.'}
            </motion.p>
            
            <motion.p 
              className="text-sm sm:text-base md:text-lg opacity-90 max-w-2xl drop-shadow-md"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              {t('librarianDashboardSubtitle2') || 'View real-time analytics and manage library operations efficiently.'}
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

        {/* Stat Cards - No stagger, appear immediately */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            icon={FiBook}
            label="totalBooks"
            value={totals.books}
            bg="bg-blue-100"
            color="text-blue-600"
          />
          <StatCard
            label="totalPaid"
            value={totals.paid}
            bg="bg-purple-100"
            color="text-purple-600"
            isCurrency={true}
          />
        </div>

        {/* Charts Row 1 - With staggered animation */}
        <motion.div
          variants={chartContainerVariants}
          initial="hidden"
          animate={showCharts ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Book Status Pie */}
          <motion.div
            variants={chartItemVariants}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('bookStatus')}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Book Returns */}
          <motion.div
            variants={chartItemVariants}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('bookReturns')}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={returns.labels.map((l, i) => ({
                  day: l,
                  returns: returns.data[i],
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="returns"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Charts Row 2 */}
        <motion.div
          variants={chartContainerVariants}
          initial="hidden"
          animate={showCharts ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Books Added */}
          <motion.div
            variants={chartItemVariants}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('booksAdded')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={added.labels.map((l, i) => ({
                  day: l,
                  added: added.data[i],
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="added" fill="#34d399" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Borrowed Trend */}
          <motion.div
            variants={chartItemVariants}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('borrowedBooks')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={borrowedTrend.labels.map((l, i) => ({
                  week: l,
                  borrowed: borrowedTrend.data[i],
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="borrowed"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showActivity ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('recentActivity')}</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={showActivity ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FiActivity
                      className={`w-5 h-5 ${
                        act.action === 'Borrowed' ? 'text-orange-600' : 'text-green-600'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-gray-800">{act.user}</p>
                      <p className="text-sm text-gray-600">
                        {t(act.action)} "{act.book}"
                        {act.fine != null && act.fine > 0 && (
                          <span className="text-red-600 ml-1 font-medium">
                            ({t('fine')}: ETB {act.fine})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{act.date}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 italic text-center py-4">
                {t('noRecentActivity')}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}