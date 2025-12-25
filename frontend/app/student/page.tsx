// student/page.tsx
'use client';

import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n'; // ← ADDED
import { useEffect, useState } from 'react';
import { FiBookOpen, FiCheck, FiClock, FiEye, FiRotateCcw, FiXCircle } from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';

interface Borrow {
  bookTitle: string;
  borrowedAt: string;
  returnedAt?: string;
  fine: number;
  status: string;
}

interface Request {
  _id: string;
  bookTitle: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  dueDate?: string;
}

interface CurrentBook {
  bookId: string;
  bookTitle: string;
  dueDate: string;
  borrowedAt: string;
  fine: number;
}

interface StudentStats {
  totalBorrowed: number;
  totalViews: number;
  booksToReturn: number;
  currentBooks: CurrentBook[];
  history: Borrow[];
  readingProgress: number;
  requests: Request[];
}

/** Native date formatter – no external deps */
const formatDate = (dateStr: string, fmt: 'MMM dd') => {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (fmt === 'MMM dd') return `${months[d.getMonth()]} ${d.getDate()}`;
  return d.toLocaleDateString();
};

export default function StudentDashboard() {
  const { t } = useTranslation(); // ← ADDED
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isImageHovered, setIsImageHovered] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data.student);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    const fetchRequests = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;

        const user = JSON.parse(userData);
        const res = await api.get('/borrows', {
          params: {
            search: user.id || user.userId,
            limit: 50
          }
        });

        // Filter requests for this user
        const userRequests = res.data.borrows.filter((borrow: any) =>
          borrow.userId === (user.id || user.userId) &&
          ['pending', 'approved', 'rejected'].includes(borrow.status)
        );

        setRequests(userRequests);
      } catch (e: any) {
        console.error('Failed to fetch requests:', e);
      }
    };

    fetchStats();
    fetchRequests();
  }, []);

  const returnBook = async (bookId: string) => {
    if (!confirm(t('returnBookConfirm') || 'Return this book?')) return;
    try {
      await api.post('/borrows/return', { bookId });
      window.location.reload();
    } catch {
      alert(t('returnFailed') || 'Failed to return book');
    }
  };

  if (loading)
    return (
      <Layout role="student">
        <div className="p-6 text-center">{t('loading') || 'Loading...'}</div>
      </Layout>
    );

  if (error)
    return (
      <Layout role="student">
        <div className="p-6 text-red-500">{error}</div>
      </Layout>
    );

  if (!stats) return null;

  const historyChart = stats.history.map(h => ({
    name: formatDate(h.borrowedAt, 'MMM dd'),
    books: 1,
  }));

  return (
    <Layout role="student">
      <div className="p-0.5 max-w-7xl mx-auto space-y-6">

        {/* Fixed Image Card with Welcome Text - Mobile responsive */}
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
              src="/book2.jpg" 
              alt="Student Reading" 
              className="w-full h-full object-cover"
              animate={{
                scale: isImageHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-purple-900/60"
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
              {t('studentDashboard') || 'Student Dashboard'}
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl font-medium mb-3 md:mb-4 drop-shadow-md opacity-90"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {t('studentDashboardSubtitle1') || 'Track your reading, borrows, and returns.'}
            </motion.p>
            
            <motion.p 
              className="text-base sm:text-lg md:text-xl font-medium mb-2 md:mb-3 drop-shadow-md opacity-90"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {t('studentDashboardSubtitle2') || 'Monitor your reading progress and manage borrowed books.'}
            </motion.p>
            
            <motion.p 
              className="text-sm sm:text-base md:text-lg opacity-90 max-w-2xl drop-shadow-md"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              {t('studentDashboardSubtitle3') || 'View your borrowing history and stay updated with requests.'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total Borrowed */}
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiBookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalBorrowedBooks') || 'Total Borrowed Books'}</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalBorrowed}</p>
            </div>
          </div>

          {/* Total Views */}
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiEye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('totalViews') || 'Total Views'}</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalViews}</p>
            </div>
          </div>

          {/* Books to Return */}
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiRotateCcw className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('booksToReturn') || 'Books to Return'}</p>
              <p className="text-2xl font-bold text-gray-800">{stats.booksToReturn}</p>
            </div>
          </div>

          {/* Reading Progress */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-600 mb-2">{t('readingProgress') || 'Reading Progress'}</p>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-xs font-semibold text-green-600">{t('completed') || 'Completed'}</span>
                <span className="text-xs font-semibold text-green-600">{stats.readingProgress}%</span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${stats.readingProgress}%` }}
                  className="bg-green-500 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==== BOOK REQUESTS ==== */}
        {requests.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t('myRequests') || 'My Requests'}
            </h2>
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-medium text-gray-800">{request.bookTitle}</h3>
                    <p className="text-sm text-gray-500">
                      {t('requested') || 'Requested'}: {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                    {request.dueDate && (
                      <p className="text-sm text-gray-500">
                        {t('due') || 'Due'}: {new Date(request.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {request.rejectionReason && (
                      <p className="text-sm text-red-600">
                        {t('reason') || 'Reason'}: {request.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && (
                      <>
                        <FiClock className="w-4 h-4 text-yellow-500" />
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {t('pending') || 'Pending'}
                        </span>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <>
                        <FiCheck className="w-4 h-4 text-green-500" />
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {t('approved') || 'Approved'}
                        </span>
                      </>
                    )}
                    {request.status === 'rejected' && (
                      <>
                        <FiXCircle className="w-4 h-4 text-red-500" />
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {t('rejected') || 'Rejected'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==== HISTORY CHART ==== */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {t('borrowingHistory') || 'Borrowing History'}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="books" fill="#a78bfa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}