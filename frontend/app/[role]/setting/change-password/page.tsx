'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useTranslation } from '@/lib/i18n'
import api from '@/lib/api'

// Remove the Props interface - we'll use a different approach

export default function ChangePassword() {
  const { t } = useTranslation()

  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  // Get role from URL pathname instead of params
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const role = pathname.split('/')[1] || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      setMsg(t('passwordsDoNotMatch'))
      return
    }

    if (form.newPassword.length < 6) {
      setMsg(t('passwordMinLength'))
      return
    }

    setLoading(true)
    setMsg('')

    try {
      await api.post('/auth/change-password-after-login', form)
      setMsg(t('passwordChangedSuccess'))
      setTimeout(() => router.push(`/${role}`), 1500)
    } catch (err: any) {
      setMsg(err.response?.data?.message || t('changePasswordFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout role={role}>
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 mt-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            {t('changePassword')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('updatePasswordDesc') || 'Update your account password for security'}
          </p>
        </div>

        {msg && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            msg.includes(t('success'))
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('oldPassword')}
            </label>
            <input
              type="password"
              placeholder={t('oldPassword')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
              value={form.oldPassword}
              onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('newPassword')}
            </label>
            <input
              type="password"
              placeholder={t('newPassword')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('confirmNewPassword')}
            </label>
            <input
              type="password"
              placeholder={t('confirmNewPassword')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('changing') : t('changePassword')}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {t('copyright')}
          </p>
        </div>
      </div>
    </Layout>
  )
}