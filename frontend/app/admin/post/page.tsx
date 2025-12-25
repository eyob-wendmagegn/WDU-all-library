'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import NewsForm from '@/components/NewsForm';
import api from '@/lib/api';
import { FiPlus, FiX, FiZap, FiLoader, FiCopy, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

interface AIResult {
  title: string;
  summary: string;
}

export default function AdminPost() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  
  // AI Assistant State
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiIdeas, setAiIdeas] = useState<AIResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  const generateIdeas = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setAiIdeas([]);
    setError('');
    
    try {
      const res = await api.post('/news/generate-ideas', { topic });
      if (res.data.ideas) {
        setAiIdeas(res.data.ideas);
      }
    } catch (err: any) {
      console.error('Failed to generate ideas', err);
      setError(err.response?.data?.message || t('failedToGenerateIdeas') || 'Failed to generate ideas. Please check your API key configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Layout role="admin">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="p-4 md:p-6 max-w-4xl mx-auto space-y-6"
      >
        {/* Header Section */}
        <motion.div
          initial={{ y: -40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">{t('postNews')}</h1>
              <p className="text-gray-600">{t('announceUpdates')}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-md hover:bg-blue-700 hover:shadow-xl transition-all font-medium"
            >
              <FiPlus size={18} />
              {t('postNew')}
            </motion.button>
          </div>
        </motion.div>

        {/* AI Content Assistant Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-100 rounded-2xl p-6 relative overflow-hidden shadow-lg"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <FiZap className="text-amber-500 w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-800">{t('aiContentAssistant')}</h2>
            </div>
            
            <p className="text-gray-600 mb-6 max-w-2xl">
              {t('aiContentDesc')}
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('libraryGuidelines') || " Library Guidelines..."}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && generateIdeas()}
              />
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-2"
                >
                  <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={generateIdeas}
                disabled={isGenerating || !topic.trim()}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition-all text-white bg-blue-600 ${
                  (isGenerating || !topic.trim()) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-md'
                }`}
              >
                {isGenerating ? (
                  <>
                    <FiLoader className="animate-spin" /> {t('generating')}
                  </>
                ) : (
                  <>
                    <FiZap /> {t('generateIdeas')}
                  </>
                )}
              </motion.button>
            </div>

            {/* Results Display */}
            <AnimatePresence>
              {aiIdeas.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 grid gap-4 md:grid-cols-1"
                >
                  {aiIdeas.map((idea, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative"
                    >
                      <div className="pr-8">
                        <h3 className="font-bold text-gray-800 mb-1">{idea.title}</h3>
                        <p className="text-sm text-gray-600">{idea.summary}</p>
                      </div>
                      
                      <button
                        onClick={() => copyToClipboard(`${idea.title}\n${idea.summary}`, index)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('copyToClipboard')}
                      >
                        {copiedIndex === index ? <FiCheck className="text-green-500" /> : <FiCopy />}
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.85, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.85, y: 50, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 350, 
                  damping: 30 
                }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-bold text-gray-800">{t('createNewsPost')}</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                  >
                    <FiX size={22} />
                  </motion.button>
                </div>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.1,
                      },
                    },
                  }}
                >
                  <NewsForm onClose={() => setShowForm(false)} />
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#fee2e2' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForm(false)}
                  className="mt-5 w-full border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  {t('cancel')}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}