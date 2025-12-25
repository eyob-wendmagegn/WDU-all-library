'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import CommentForm from '@/components/CommentForm';
import { FiMessageSquare, FiInfo, FiCheckCircle, FiAlertCircle, FiHelpCircle, FiBookOpen } from 'react-icons/fi';
import { useTranslation } from '@/lib/i18n';

export default function TeacherComment() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Layout role="teacher">
      <div className="p-6 space-y-8">
        {/* Main Header Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg text-center border border-blue-100">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-md mb-6">
            <FiMessageSquare className="text-4xl text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('giveFeedback')}</h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            {t('shareThoughts')}
          </p>
          <button
            onClick={() => setOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <FiMessageSquare className="text-xl" /> 
            <span className="text-lg font-semibold">{t('giveComment')}</span>
          </button>
        </div>

        {/* Information Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Purpose Card */}
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiBookOpen className="text-2xl text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('feedbackPurpose')}</h3>
                <p className="text-gray-600">
                  {t('feedbackPurposeDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Types of Feedback Card */}
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-2xl text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('feedbackTypes')}</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">• {t('feedbackTypesList1')}</li>
                  <li className="flex items-center gap-2">• {t('feedbackTypesList2')}</li>
                  <li className="flex items-center gap-2">• {t('feedbackTypesList3')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Response Card */}
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiAlertCircle className="text-2xl text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('responseInfo')}</h3>
                <p className="text-gray-600 mb-3">
                  {t('responseInfoDesc')}
                </p>
                <div className="text-sm text-purple-600 font-medium">
                  {t('confidentialAppreciated')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <FiInfo className="text-2xl text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-800">{t('feedbackGuidelinesTeacher')}</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">1</span>
                {t('constructiveFeedback')}
              </h3>
              <p className="text-gray-600 pl-8">
                {t('constructiveFeedbackDesc')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">2</span>
                {t('resourceRequestsTeacher')}
              </h3>
              <p className="text-gray-600 pl-8">
                {t('resourceRequestsTeacherDesc')}
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">3</span>
                {t('collabSuggestions')}
              </h3>
              <p className="text-gray-600 pl-8">
                {t('collabSuggestionsDesc')}
              </p>
            </div>
          </div>

          <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-4">
              <FiHelpCircle className="text-2xl text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{t('needInspiration')}</h4>
                <p className="text-gray-700">
                  {t('needInspirationDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial/Quote Section */}
        <div className="text-center p-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
          <div className="max-w-3xl mx-auto">
            <FiMessageSquare className="text-4xl text-indigo-500 mx-auto mb-4 opacity-75" />
            <blockquote className="text-2xl font-medium text-gray-800 italic mb-6">
              {t('teacherQuote')}
            </blockquote>
          </div>
        </div>
      </div>

      {/* Modal - Keep your existing modal exactly as is */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{t('sendToAdmin')}</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <CommentForm onClose={() => setOpen(false)} />
            <button 
              onClick={() => setOpen(false)} 
              className="mt-6 w-full border-2 border-gray-300 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 font-medium"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}