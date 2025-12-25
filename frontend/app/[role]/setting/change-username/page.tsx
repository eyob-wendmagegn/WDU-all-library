'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useTranslation } from '@/lib/i18n'
import api from '@/lib/api'
import { FaUserEdit, FaCheck, FaExclamationCircle } from 'react-icons/fa'

// Remove Props interface

export default function ChangeUsername() {
  const { t } = useTranslation()
  const router = useRouter()
  
  // Get role from URL pathname instead of params
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const role = pathname.split('/')[1] || '';

  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 1. Fetch current user data to auto-fill
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me')
        setUsername(res.data.username)
      } catch (err) {
        setMsg({ type: 'error', text: t('failedToLoadData') })
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [t])

  // 2. Handle Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (username.length < 3) {
      setMsg({ type: 'error', text: t('usernameMinLength') })
      return
    }

    setSubmitting(true)
    setMsg(null)

    try {
      await api.post('/auth/change-username', { newUsername: username })
      setMsg({ type: 'success', text: t('usernameChangedSuccess') })
      // Optional: Refresh page or redirect
      setTimeout(() => {
        setMsg(null)
      }, 3000)
    } catch (err: any) {
      setMsg({ 
        type: 'error', 
        text: err.response?.data?.message || t('changeUsernameFailed') 
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout role={role}>
      <div className="max-w-md mx-auto mt-10">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <FaUserEdit className="text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              {t('changeUsername')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t('updateUsernameDesc')}
            </p>
          </div>

          {msg && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium animate-fadeIn ${
              msg.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
               <div className={`mt-0.5 ${msg.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                 {msg.type === 'success' ? <FaCheck /> : <FaExclamationCircle />}
               </div>
               <p>{msg.text}</p>
            </div>
          )}

          {loading ? (
             <div className="flex justify-center py-10">
               <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('username')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none text-gray-800"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    placeholder={t('enterNewUsername')}
                    disabled={submitting}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-1">
                  {t('usernameHelp')}
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-sm hover:shadow-md flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <FaUserEdit />
                    {t('updateUsername')}
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {t('copyright')}
            </p>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </Layout>
  )
}