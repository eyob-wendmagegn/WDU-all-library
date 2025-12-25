// admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiUsers, FiBook, FiFileText } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';

interface AdminData {
  totals: {
    users: number;
    activeUsers: number;
    deactiveUsers: number;
    books: number;
    posts: number;
    reports: number;
  };
  charts: {
    userGrowth: { labels: string[]; data: number[] };
    postActivity: { labels: string[]; data: number[] };
  };
  recentUsers: Array<{ name: string; username: string; createdAt: string }>;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageHovered, setIsImageHovered] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.admin);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  const { totals, charts, recentUsers } = data;

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-fade-in border border-gray-100 h-full">
      <div className={`p-3 rounded-lg ${color} animate-pulse-once shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{t(label)}</p>
        <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
      </div>
    </div>
  );

  // Prepare data for charts
  const userGrowthData = charts.userGrowth.labels.map((label, index) => ({
    name: label,
    users: charts.userGrowth.data[index] || 0,
  }));

  const postActivityData = charts.postActivity.labels.map((label, index) => ({
    name: label,
    posts: charts.postActivity.data[index] || 0,
  }));

  // Fixed formatter functions with proper type handling
  const userFormatter = (value: number | undefined) => {
    const val = value || 0;
    return [`${val} users`, 'Users'];
  };

  const postFormatter = (value: number | undefined) => {
    const val = value || 0;
    return [`${val} posts`, 'Posts'];
  };

  return (
    <Layout role="admin">
      <div className="p-1 md:p-0.5 space-y-6 max-w-7xl mx-auto animate-fade-in">

        {/* Fixed Image Card with Welcome Text - Mobile responsive */}
        <motion.div
          className="relative rounded-2xl overflow-hidden shadow-xl animate-slide-down h-72 md:h-80 group"
          onMouseEnter={() => setIsImageHovered(true)}
          onMouseLeave={() => setIsImageHovered(false)}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.3 }
          }}
        >
          <div className="absolute inset-0">
            <motion.img 
              src="/users.jpg" 
              alt="Library Users" 
              className="w-full h-full object-cover"
              animate={{
                scale: isImageHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/60"
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
              {t('adminDashboard') || 'Admin Dashboard'}
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl font-medium mb-3 md:mb-4 drop-shadow-md opacity-90"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {t('welcomeAdmin') || 'Welcome Admin'}
            </motion.p>
            
            <motion.p 
              className="text-sm sm:text-base md:text-lg opacity-90 max-w-2xl drop-shadow-md"
              animate={{
                y: isImageHovered ? -2 : 0,
              }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              {t('adminDashboardDescription') || 'Manage users, books, posts, and monitor system performance.'}
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

        {/* Stat Cards - Updated grid to use 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <StatCard icon={FiUsers} label="totalUsers" value={totals.users} color="bg-blue-600" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <StatCard icon={FiBook} label="totalBooks" value={totals.books} color="bg-green-600" />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <StatCard icon={FiFileText} label="totalPosts" value={totals.posts} color="bg-purple-600" />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth - Changed to AreaChart with gradient */}
          <div className="bg-white rounded-xl shadow-sm p-5 animate-fade-in-up border border-gray-100" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('userGrowth')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart 
                data={userGrowthData}
                className="animate-chart-load"
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderColor: '#e5e7eb',
                    color: '#1f2937',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                  formatter={userFormatter}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fill="url(#colorUsers)"
                  fillOpacity={1}
                  dot={{ 
                    fill: '#4f46e5',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    r: 4
                  }}
                  activeDot={{ r: 6, fill: '#4f46e5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Post Activity - Keeping as LineChart but matching style */}
          <div className="bg-white rounded-xl shadow-sm p-5 animate-fade-in-up border border-gray-100" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('postsActivity')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart 
                data={postActivityData}
                className="animate-chart-load"
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderColor: '#e5e7eb',
                    color: '#1f2937',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                  formatter={postFormatter}
                />
                <Area 
                  type="monotone" 
                  dataKey="posts" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fill="url(#colorPosts)"
                  fillOpacity={1}
                  dot={{ 
                    fill: '#10b981',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    r: 4
                  }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 animate-fade-in-up border border-gray-100" style={{ animationDelay: '0.7s' }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('recentlyRegisteredUsers')}</h3>
          {recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user, i) => (
                <div 
                  key={i} 
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-slide-in-left transition-colors hover:bg-gray-100"
                  style={{ animationDelay: `${0.1 * i}s` }}
                >
                  <div>
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.username}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">{t('noRecentUsers')}</p> 
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --tooltip-bg: #fff;
          --tooltip-border: #e5e7eb;
          --tooltip-text: #1f2937;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulseOnce {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        @keyframes chartLoad {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slide-down {
          animation: slideDown 0.5s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.4s ease-out forwards;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animate-pulse-once {
          animation: pulseOnce 0.6s ease-out;
        }

        .animate-chart-load {
          animation: chartLoad 0.8s ease-out forwards;
          opacity: 0;
        }
      `}} />
    </Layout>
  );
}