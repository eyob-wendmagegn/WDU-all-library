// login/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaIdCard, FaEnvelope, FaArrowRight } from 'react-icons/fa';
import { useTranslation } from '@/lib/i18n';
import api from '@/lib/api';

export default function FirstLogin() {
  const { t } = useTranslation();

  // Updated state: username empty (no prefix), id has no prefix
  const [creds, setCreds] = useState({ username: '', email: '', id: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Set isClient only on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Predefined particle positions - same on server and client
  const particlePositions = useMemo(() => [
    { left: '5%', top: '15%', delay: '0.2s', duration: '5s' },
    { left: '25%', top: '35%', delay: '1.2s', duration: '4s' },
    { left: '45%', top: '55%', delay: '2.2s', duration: '6s' },
    { left: '65%', top: '25%', delay: '0.7s', duration: '7s' },
    { left: '85%', top: '45%', delay: '1.7s', duration: '5s' },
    { left: '15%', top: '75%', delay: '2.7s', duration: '4s' },
    { left: '35%', top: '5%', delay: '0.9s', duration: '6s' },
    { left: '55%', top: '85%', delay: '1.9s', duration: '5s' },
    { left: '75%', top: '65%', delay: '2.9s', duration: '7s' },
    { left: '95%', top: '25%', delay: '0.5s', duration: '4s' }
  ], []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      // Sends username, email, and id to the backend
      const res = await api.post('/auth/first-login', creds);
      localStorage.setItem('changeToken', res.data.token);
      router.push('/change-password');
    } catch (err: any) {
      setMsg(err.response?.data?.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle ID input change with max length validation
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow only up to 10 characters
    if (value.length <= 10) {
      setCreds({ ...creds, id: value });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* BACKGROUND - FIXED: Removed transform: scale(1.1) to show full image */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Background Image - Full display without scaling */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/techno2.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            // REMOVED: transform: 'scale(1.1)' - This was causing the image to be cut off
            willChange: 'transform'
          }}
        />
        
        {/* Dark overlay to make content readable */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Fixed Particles - No Math.random() */}
        {particlePositions.map((pos, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: pos.left,
              top: pos.top,
              animationDelay: isClient ? pos.delay : '0s',
              animationDuration: isClient ? pos.duration : '0s',
            }}
          />
        ))}
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* Login Card - Compact Glassmorphism style */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-white/20">
          {/* Card header - Gradient matching homepage */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FaUser className="text-white text-base" />
              </div>
              {t('activateAccount')}
            </h2>
          </div>

          {/* Form content */}
          <div className="p-5">
            {/* Error/Info Messages */}
            {msg && (
              <div className="mb-4 animate-fadeIn">
                <div className={`p-3 rounded-lg border-l-4 ${
                  msg.includes('not found') 
                    ? 'bg-red-500/20 backdrop-blur-sm text-red-200 border-red-400'
                    : 'bg-blue-500/20 backdrop-blur-sm text-blue-200 border-blue-400'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        msg.includes('not found')
                          ? 'bg-red-500/30 text-red-300'
                          : 'bg-blue-500/30 text-blue-300'
                      }`}>
                        {msg.includes('not found') ? '⚠️' : 'ℹ️'}
                      </div>
                    </div>
                    <div className="ml-2">
                      <p className="font-medium text-sm">{msg}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="group">
                <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-2">
                  <FaUser className="text-cyan-400" />
                  {t('username') || 'Username'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('enterUsername') || "Enter your username"}
                    className="w-full px-3 py-2.5 pl-10 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300 group-hover:border-cyan-400 text-white placeholder-gray-300"
                    value={creds.username}
                    onChange={(e) => setCreds({ ...creds, username: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-sm">
                    <FaUser />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="group">
                <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-2">
                  <FaEnvelope className="text-cyan-400" />
                  {t('email') || 'Email Address'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder={t('enterEmail') || "Enter Your email"}
                    className="w-full px-3 py-2.5 pl-10 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300 group-hover:border-cyan-400 text-white placeholder-gray-300"
                    value={creds.email}
                    onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-sm">
                    <FaEnvelope />
                  </div>
                </div>
              </div>

              {/* ID Field - Updated: No prefix, max 10 characters */}
              <div className="group">
                <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-2">
                  <FaIdCard className="text-cyan-400" />
                  {t('id') || 'ID Number'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('enterId') || "Enter Your ID (max 10 characters)"}
                    className="w-full px-3 py-2.5 pl-10 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300 group-hover:border-cyan-400 text-white placeholder-gray-300"
                    value={creds.id}
                    onChange={handleIdChange}
                    maxLength={10}
                    required
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-sm">
                    <FaIdCard />
                  </div>
                  {/* Character counter */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                    {creds.id.length}/10
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t('idMaxLength') || 'Enter your ID (maximum 10 characters, any letter or number)'}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 text-sm rounded-lg transition-all duration-300 shadow hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('checking') || "Verifying..."}</span>
                  </>
                ) : (
                  <>
                    <span>{t('activate')}</span>
                    <FaArrowRight className="text-xs" />
                  </>
                )}
              </button>
            </form>

            {/* Already have password link */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-center text-xs text-gray-300">
                {t('alreadySetPassword') || "Already set your password?"}{' '}
                <a 
                  href="/login-normal" 
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors hover:underline inline-flex items-center gap-1"
                >
                  {t('loginHere') || 'Login here'}
                </a>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  {t('copyright') || "© 2025 Woldia University Library System. All rights reserved."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}