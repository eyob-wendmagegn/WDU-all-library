'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope, FaKey, FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from '@/lib/i18n';
import api, { setAuthToken } from '@/lib/api';

export default function NormalLogin() {
  const { t } = useTranslation();

  // View state: 'login', 'email', 'otp'
  const [view, setView] = useState<'login' | 'email' | 'otp'>('login');
  
  // Login Form State
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');

  // Common State
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
    { left: '8%', top: '12%', delay: '0.3s', duration: '6s' },
    { left: '28%', top: '32%', delay: '1.3s', duration: '5s' },
    { left: '48%', top: '52%', delay: '2.3s', duration: '4s' },
    { left: '68%', top: '22%', delay: '0.8s', duration: '7s' },
    { left: '88%', top: '42%', delay: '1.8s', duration: '5s' },
    { left: '18%', top: '72%', delay: '2.8s', duration: '6s' },
    { left: '38%', top: '8%', delay: '1.0s', duration: '4s' },
    { left: '58%', top: '82%', delay: '2.0s', duration: '5s' },
    { left: '78%', top: '62%', delay: '0.5s', duration: '7s' },
    { left: '98%', top: '28%', delay: '1.5s', duration: '6s' }
  ], []);

  // Clear any old session
  useEffect(() => {
    localStorage.clear();
    setAuthToken(null);
  }, []);

  // Handle Normal Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await api.post('/auth/login', creds);
      const { token, role, name } = res.data;

      // Save session
      setAuthToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', name);

      // Redirect based on role
      const path = role === 'admin' ? '/admin' : `/${role}`;
      router.push(path);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || t('loginFailed');
      setMsg(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP (Forgot Password Step 1)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      setMsg(t('otpSent') || 'OTP sent successfully to your email.');
      setView('otp');
    } catch (err: any) {
      setMsg(err.response?.data?.message || t('failedToSendOtp') || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP (Forgot Password Step 2)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await api.post('/auth/verify-otp', { email: resetEmail, otp });
      // The backend returns a token compatible with the change-password page
      const { token } = res.data;
      
      localStorage.setItem('changeToken', token);
      setMsg(t('otpVerified') || 'OTP Verified! Redirecting...');
      
      setTimeout(() => {
        router.push('/change-password');
      }, 1000);
    } catch (err: any) {
      setMsg(err.response?.data?.message || t('invalidOtp') || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLoginSubmit} className="space-y-4">
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

      {/* Password Field */}
      <div className="group">
        <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-2">
          <FaLock className="text-cyan-400" />
          {t('password') || 'Password'}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('enterPassword') || "Enter your password"}
            className="w-full px-3 py-2.5 pl-10 pr-10 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300 group-hover:border-cyan-400 text-white placeholder-gray-300"
            value={creds.password}
            onChange={(e) => setCreds({ ...creds, password: e.target.value })}
            required
            disabled={loading}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-sm">
            <FaLock />
          </div>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
          </button>
        </div>
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={() => {
              setMsg('');
              setView('email');
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline"
          >
            {t('forgotPassword') || "Forgot Password?"}
          </button>
        </div>
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
            <span>{t('authenticating') || "Authenticating..."}</span>
          </>
        ) : (
          <span>{t('signIn') || "Sign In"}</span>
        )}
      </button>
    </form>
  );

  const renderEmailForm = () => (
    <form onSubmit={handleSendOtp} className="space-y-4">
      <div className="text-center mb-3">
        <p className="text-gray-300 text-xs">
          {t('enterEmailDesc') || "Enter your registered email address to receive a verification code."}
        </p>
      </div>
      
      <div className="group">
        <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-2">
          <FaEnvelope className="text-cyan-400" />
          {t('email') || 'Email Address'}
        </label>
        <div className="relative">
          <input
            type="email"
            placeholder={t('enterEmail') || "name@example.com"}
            className="w-full px-3 py-2.5 pl-10 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300 group-hover:border-cyan-400 text-white placeholder-gray-300"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            disabled={loading}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-sm">
            <FaEnvelope />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 text-sm rounded-lg transition-all duration-300 shadow hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{t('sending') || "Sending..."}</span>
          </>
        ) : (
          <span>{t('sendOtp') || "Send OTP"}</span>
        )}
      </button>

      <div className="text-center mt-3">
        <button
          type="button"
          onClick={() => {
            setMsg('');
            setView('login');
          }}
          className="text-xs text-gray-400 hover:text-gray-300 font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
        >
          <FaArrowLeft size={10} /> {t('backToLogin') || "Back to Login"}
        </button>
      </div>
    </form>
  );

  const renderOtpForm = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      <div className="text-center mb-3">
        <p className="text-gray-300 text-xs">
          {t('enterOtpDesc') || `Enter the 6-digit code sent to ${resetEmail}`}
        </p>
      </div>

      <div className="group">
        <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-2">
          <FaKey className="text-cyan-400" />
          {t('otp') || 'One-Time Password'}
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="123456"
            className="w-full px-3 py-2.5 pl-10 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300 group-hover:border-cyan-400 text-white placeholder-gray-300 tracking-widest text-center"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            required
            maxLength={6}
            disabled={loading}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-sm">
            <FaKey />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-2.5 text-sm rounded-lg transition-all duration-300 shadow hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{t('verifying') || "Verifying..."}</span>
          </>
        ) : (
          <span>{t('verifyOtp') || "Verify OTP"}</span>
        )}
      </button>

      <div className="text-center mt-3">
        <button
          type="button"
          onClick={() => {
            setMsg('');
            setView('email');
          }}
          className="text-xs text-gray-400 hover:text-gray-300 font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
        >
          <FaArrowLeft size={10} /> {t('changeEmail') || "Change Email"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* BACKGROUND - BACKGROUND IMAGE ONLY (NO GRADIENT) */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Background Image - No zoom, maintains aspect ratio */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/techno2.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            transform: 'scale(1.1)',
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
              {view === 'login' ? t('login') : view === 'email' ? t('resetPassword') || "Reset Password" : t('verify') || "Verify Identity"}
            </h2>
          </div>

          {/* Form content */}
          <div className="p-5">
            {/* Error/Info Messages */}
            {msg && (
              <div className="mb-4 animate-fadeIn">
                <div className={`p-3 rounded-lg border-l-4 ${
                  msg.includes('Sent') || msg.includes('Verified')
                    ? 'bg-green-500/20 backdrop-blur-sm text-green-200 border-green-400'
                    : 'bg-red-500/20 backdrop-blur-sm text-red-200 border-red-400'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        msg.includes('Sent') || msg.includes('Verified')
                          ? 'bg-green-500/30 text-green-300'
                          : 'bg-red-500/30 text-red-300'
                      }`}>
                        {msg.includes('Sent') || msg.includes('Verified') ? '✓' : '⚠️'}
                      </div>
                    </div>
                    <div className="ml-2">
                      <p className="font-medium text-sm">{msg}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Rendering of Forms */}
            <div className="animate-fadeIn">
              {view === 'login' && renderLoginForm()}
              {view === 'email' && renderEmailForm()}
              {view === 'otp' && renderOtpForm()}
            </div>

            {/* First Time Link (Only visible on login view) */}
            {view === 'login' && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-center text-xs text-gray-300">
                  {t('firstTime') || "First time accessing the system?"}{' '}
                  <a 
                    href="/login" 
                    className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors hover:underline inline-flex items-center gap-1"
                  >
                    {t('setPasswordHere') || 'Set your password here'}
                  </a>
                </p>
              </div>
            )}

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