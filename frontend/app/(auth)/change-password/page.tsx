'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaLock, FaKey, FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from '@/lib/i18n';
import api from '@/lib/api';

export default function ChangePassword() {
  const { t } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Set isClient only on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Predefined particle positions - same on server and client
  const particlePositions = useMemo(() => [
    { left: '10%', top: '20%', delay: '0.5s', duration: '4s' },
    { left: '30%', top: '40%', delay: '1.0s', duration: '5s' },
    { left: '50%', top: '60%', delay: '1.5s', duration: '3s' },
    { left: '70%', top: '30%', delay: '2.0s', duration: '6s' },
    { left: '90%', top: '50%', delay: '2.5s', duration: '4s' },
    { left: '20%', top: '80%', delay: '0.0s', duration: '5s' },
    { left: '40%', top: '10%', delay: '0.8s', duration: '7s' },
    { left: '60%', top: '90%', delay: '1.2s', duration: '4s' },
    { left: '80%', top: '70%', delay: '2.8s', duration: '6s' },
    { left: '15%', top: '35%', delay: '1.8s', duration: '5s' }
  ], []);

  useEffect(() => {
    const token = localStorage.getItem('changeToken');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  // Check password strength
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 6) strength += 1;
    if (newPassword.length >= 8) strength += 1;
    if (/[A-Z]/.test(newPassword)) strength += 1;
    if (/[0-9]/.test(newPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1;
    setPasswordStrength(strength);
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setMsg(t('passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg(t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('changeToken');

    if (!token) {
      setMsg(t('sessionExpired'));
      setLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      await api.post('/auth/change-password', {
        username: payload.username,
        id: payload.userId,
        newPassword,
        confirmPassword,
      });

      localStorage.removeItem('changeToken');
      setMsg(t('passwordChanged'));
      setTimeout(() => router.push('/login-normal'), 1500);
    } catch (err: any) {
      setMsg(err.response?.data?.message || t('changePasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 1) return t('veryWeak') || 'Very Weak';
    if (strength <= 2) return t('weak') || 'Weak';
    if (strength <= 3) return t('medium') || 'Medium';
    if (strength <= 4) return t('strong') || 'Strong';
    return t('veryStrong') || 'Very Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
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

      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* Password Card - Compact Glassmorphism style */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden border border-white/20">
          {/* Card header - Gradient matching homepage */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FaLock className="text-white text-base" />
              </div>
              {t('setYourPassword')}
            </h2>
          </div>

          <div className="p-5">
            {msg && (
              <div className="mb-4 animate-fadeIn">
                <div className={`p-3 rounded-lg border-l-4 ${
                  msg.includes(t('passwordChanged')) || msg.includes('Success')
                    ? 'bg-green-500/20 backdrop-blur-sm text-green-200 border-green-400'
                    : 'bg-red-500/20 backdrop-blur-sm text-red-200 border-red-400'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        msg.includes(t('passwordChanged')) || msg.includes('Success')
                          ? 'bg-green-500/30 text-green-300'
                          : 'bg-red-500/30 text-red-300'
                      }`}>
                        {msg.includes(t('passwordChanged')) || msg.includes('Success') ? '✓' : '⚠️'}
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
              <div className="group">
                <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-2">
                  <FaKey className="text-cyan-400" />
                  {t('newPassword') || 'New Password'}
                  {newPassword && (
                    <span className={`ml-auto text-xs font-medium px-2 py-1 rounded ${
                      getStrengthColor(passwordStrength).replace('bg-', 'bg-')
                    } bg-opacity-30 text-white`}>
                      {getStrengthText(passwordStrength)}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('newPassword') || "Enter new password"}
                    className="w-full px-3 py-2.5 pl-10 pr-10 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300 group-hover:border-cyan-400 text-white placeholder-gray-300"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
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
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= passwordStrength ? getStrengthColor(passwordStrength) : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-gray-300 flex justify-between">
                      <span>{t('minChars') || 'Minimum 6 characters'}</span>
                      <span>{newPassword.length}/50</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-2">
                  <FaCheckCircle className="text-cyan-400" />
                  {t('confirmPassword') || 'Confirm Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('confirmPassword') || "Confirm your password"}
                    className="w-full px-3 py-2.5 pl-10 pr-10 text-sm bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300 group-hover:border-cyan-400 text-white placeholder-gray-300"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 text-sm">
                    <FaCheckCircle />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                    aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                
                {confirmPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs">
                      {newPassword === confirmPassword ? (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px]">✓</span>
                          </div>
                          <span className="text-green-400 font-medium">{t('passwordsMatch') || 'Passwords match'}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px]">✗</span>
                          </div>
                          <span className="text-red-400 font-medium">{t('passwordsDoNotMatch') || "Passwords don't match"}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 text-sm rounded-lg transition-all duration-300 shadow hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('settingPassword') || "Setting Password..."}</span>
                  </>
                ) : (
                  <span>{t('setAndContinue') || "Set Password & Continue"}</span>
                )}
              </button>
            </form>

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