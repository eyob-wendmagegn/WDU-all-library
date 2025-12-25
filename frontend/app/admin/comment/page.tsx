// admin/comment/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import CommentTable from '@/components/CommentTable';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

export default function AdminComment() {
  const { t } = useTranslation();
  const [isMarkingRead, setIsMarkingRead] = useState(true);

  useEffect(() => {
    const markAsRead = async () => {
      setIsMarkingRead(true);
      try {
        await api.post('/comments/read');
      } catch (err) {
        console.error('Failed to mark comments as read');
      } finally {
        setTimeout(() => setIsMarkingRead(false), 600);
      }
    };

    markAsRead();
  }, []);

  return (
    <Layout role="admin">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="p-4 md:p-6 max-w-7xl mx-auto space-y-6"
      >
        <motion.div
          initial={{ y: -30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">{t('allComments')}</h1>
              <p className="text-gray-600">{t('viewUserFeedback')}</p>
            </div>

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={isMarkingRead ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              {t('markingAllAsRead')}...
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        >
          <CommentTable />
        </motion.div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse-slow {
            animation: pulse 2s ease-in-out infinite;
          }
        `}</style>
      </motion.div>
    </Layout>
  );
}