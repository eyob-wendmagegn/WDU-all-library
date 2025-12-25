//components/Header.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import {
  FaBell, FaCamera, FaTimes, FaSpinner, FaSignOutAlt,
  FaChevronRight
} from 'react-icons/fa';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';

interface ProfileData {
  userId: string;
  username: string;
  name: string;
  profileImage: string | null;
  defaultInitial: string;
  hasCustomImage: boolean;
}

export default function Header({ role }: { role: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  // Determine Page Type
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/change-password');
  const isDashboard = !isLandingPage && !isAuthPage;

  // --- Profile & Notification State (Only for Dashboard) ---
  const [count, setCount] = useState(0);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for user info
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userId, setUserId] = useState<string>('unknown');

  // --- User Data Logic (Only run if Dashboard) ---
  useEffect(() => {
    if (!isDashboard) {
        setLoadingProfile(false);
        return;
    }
    console.log('🚀 HEADER: Starting user data search...');
   
    // Method 2: Check for separate items (prioritize this)
    const id = localStorage.getItem('id');
    const name = localStorage.getItem('name');
    const userRole = localStorage.getItem('role');
   
    if (id) {
      setUserInfo({ id, name: name || 'User', role: userRole || 'user', username: `user_${id}` });
      setUserId(id);
      return;
    }
  }, [isDashboard]);

  useEffect(() => {
    if (!isDashboard) return;
    if (userId === 'unknown') {
      const fetchUserFromAPI = async () => {
        try {
          const response = await api.get('/users/me');
          if (response.data && response.data.id) {
            setUserInfo(response.data);
            setUserId(response.data.id);
            localStorage.setItem('id', response.data.id);
            if (response.data.name) localStorage.setItem('name', response.data.name);
            fetchProfileData(response.data.id);
          }
        } catch (error) {
          setLoadingProfile(false);
          const defaultProfile: ProfileData = {
            userId: 'unknown', username: 'User', name: 'User',
            profileImage: null, defaultInitial: 'U', hasCustomImage: false
          };
          setProfile(defaultProfile);
        }
      };
      fetchUserFromAPI();
      return;
    }
   
    fetchProfileData(userId);
    fetchCount();
   
    const intervalId = setInterval(fetchCount, 10000);
    return () => clearInterval(intervalId);
  }, [userId, role, isDashboard]);

  const fetchCount = async () => {
    if (userId === 'unknown') return;
    try {
      const r = role === 'admin'
        ? await api.get('/comments/unread')
        : await api.get('/news/unread', { params: { role, userId } });
      setCount(r.data.count ?? 0);
    } catch {
      console.error('Failed to fetch unread count');
    }
  };

  const fetchProfileData = async (id: string) => {
    setLoadingProfile(true);
    try {
      try { await api.post(`/profiles/${id}/create`); } catch (e) {}
     
      const response = await api.get(`/profiles/${id}`);
      if (response.data.success && response.data.profile) {
        setProfile(response.data.profile);
      } else {
        createFallbackProfile(id);
      }
    } catch (error) {
      createFallbackProfile(id);
    } finally {
      setLoadingProfile(false);
    }
  };

  const createFallbackProfile = (id: string) => {
    let name = userInfo?.name || userInfo?.username || 'User';
    const fallbackProfile: ProfileData = {
      userId: id,
      username: userInfo?.username || `user_${id}`,
      name: name,
      profileImage: null,
      defaultInitial: name.charAt(0).toUpperCase(),
      hasCustomImage: false
    };
    setProfile(fallbackProfile);
  };

  // --- Handlers ---
  const handleBellClick = async () => {
    if (!count || userId === 'unknown') return;
    try {
      if (role === 'admin') {
        await api.post('/comments/read');
        router.push('/admin/comment');
      } else {
        await api.post('/news/read', { userId });
        router.push(`/${role}/news`);
      }
      setCount(0);
    } catch {
      console.error('Failed to mark as read');
    }
  };

  const handleProfileClick = () => setShowProfileMenu(!showProfileMenu);
  const handleChangeProfileClick = () => { setShowProfileMenu(false); fileInputRef.current?.click(); };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || userId === 'unknown') return;
    if (file.size > 3 * 1024 * 1024) { alert('Image must be less than 3MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const response = await api.put(`/profiles/${userId}/image`, { profileImage: e.target?.result as string });
        if (response.data.success) { setProfile(response.data.profile); alert('✅ Profile picture updated successfully!'); }
      } catch (error: any) { alert('Upload failed.'); } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = async () => {
    if (userId === 'unknown' || !confirm('Remove profile picture?')) return;
    try {
      const response = await api.delete(`/profiles/${userId}/image`);
      if (response.data.success) { setProfile(response.data.profile); setShowProfileMenu(false); }
    } catch (error) { alert('Failed to remove image'); }
  };

  const handleLogout = () => { setShowProfileMenu(false); localStorage.clear(); sessionStorage.clear(); setTimeout(() => router.push('/login'), 100); };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container') && !target.closest('.profile-button')) { setShowProfileMenu(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProfileDisplay = () => {
    if (loadingProfile) return <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-cyan-500/50 flex items-center justify-center"><FaSpinner className="text-cyan-400 animate-spin text-xs" /></div>;
    if (profile?.profileImage) return <div className="relative w-8 h-8 rounded-full overflow-hidden border border-cyan-500/50" style={{ width: '32px', height: '32px' }}><img src={profile.profileImage} alt={profile.name} className="object-cover w-full h-full" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>;
    return <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm border border-white/20">{profile?.defaultInitial || 'U'}</div>;
  };

  const getDisplayName = () => profile?.name || userInfo?.name || 'User';
  const getUsername = () => profile?.username || userInfo?.username || 'user';
  const getInitial = () => getDisplayName().charAt(0).toUpperCase();

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`sticky top-0 z-40 h-16 transition-colors duration-200 ${
      isDashboard
        ? 'bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-slate-900/90 backdrop-blur-md border-b border-white/10 shadow-xl'
        : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-b border-white/10 shadow-xl'
    }`}>
      {/* Animated Gradient Background for Dashboard */}
      {isDashboard && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
         
          {/* Animated Gradient Orbs (Similar to login page) */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-3/4 right-1/3 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-500/10 to-blue-400/10 rounded-full blur-3xl"></div>
          {/* Subtle Particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      )}
      <div className="h-full flex items-center justify-between px-4 lg:px-6 relative z-10">
        <Link href="/" className={`flex items-center gap-3 group ${isDashboard ? 'lg:hidden ml-12' : ''}`}>
          <div className="relative w-10 h-10 overflow-hidden rounded-full transition-transform group-hover:scale-105">
            <Image src="/wldu.jpg" alt="WDU Library" width={40} height={40} className="object-cover w-full h-full" priority />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-bold text-white leading-tight">{t('woldiaUniversity') || 'Woldia University'}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4 ml-auto">
          {isLandingPage && (
            <nav className="hidden md:flex items-center gap-6 mr-2">
              {[
                { label: 'navHome', id: 'home' },
                { label: 'navServices', id: 'services' },
                { label: 'navContact', id: 'contact' }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleScrollTo(item.id)}
                  className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors bg-transparent border-none cursor-pointer"
                >
                  {t(item.label) || item.label}
                </button>
              ))}
            </nav>
          )}
          <LanguageSwitcher />
          {isDashboard && (
            <>
              <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block"></div>
              <button onClick={handleBellClick} className="relative p-2 text-gray-300 hover:text-cyan-400 hover:bg-white/10 rounded-full transition-all duration-200  hover:border-cyan-500/50 backdrop-blur-sm">
                <FaBell className="text-lg" />
                {count > 0 && <span className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-slate-900 animate-pulse">{count > 9 ? '9+' : count}</span>}
              </button>
              <div className="relative profile-dropdown-container">
                <button onClick={handleProfileClick} className="profile-button flex items-center gap-2 p-0.5 hover:bg-white/10 rounded-full transition-all duration-200 border border-transparent hover:border-cyan-500/50 backdrop-blur-sm" disabled={loadingProfile || uploading} title={getDisplayName()}>
                  <div className="hidden lg:flex flex-col items-end mr-1">
                    <span className="text-xs font-semibold text-gray-200 leading-tight max-w-[100px] truncate">{getDisplayName()}</span>
                    <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">{role}</span>
                  </div>
                  {getProfileDisplay()}
                  {uploading && <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center"><FaSpinner className="text-cyan-400 animate-spin" /></div>}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".jpg,.jpeg,.png,.gif,.webp,.bmp" className="hidden" />
                {showProfileMenu && (
                  <div className="absolute right-0 mt-3 w-72 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {profile?.profileImage ? <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-500/50 shadow-sm" style={{ width: '40px', height: '40px' }}><img src={profile.profileImage} alt={profile.name} className="object-cover w-full h-full" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm border border-white/20">{getInitial()}</div>}
                          <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-900"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-100 truncate text-base">{getDisplayName()}</p>
                          <p className="text-xs text-gray-400 truncate">@{getUsername()}</p>
                          <span className="mt-1 inline-flex items-center rounded-md bg-gradient-to-r from-cyan-900/40 to-blue-900/40 px-2 py-0.5 text-[10px] font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/30 uppercase">{role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <button
                        onClick={handleChangeProfileClick}
                        className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group disabled:opacity-50 border border-transparent hover:border-white/20"
                        disabled={uploading}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors border border-white/10">
                            <FaCamera className="text-sm" />
                          </div>
                          <span className="font-medium text-sm">{uploading ? (t('uploading') || 'Uploading...') : (t('changePhoto') || 'Change Photo')}</span>
                        </div>
                        <FaChevronRight className="text-gray-500 text-xs" />
                      </button>
                      {profile?.hasCustomImage && (
                        <button
                          onClick={handleRemoveProfileImage}
                          className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all group disabled:opacity-50 border border-transparent hover:border-red-600/30"
                          disabled={uploading}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-red-900/20 flex items-center justify-center text-gray-400 group-hover:text-red-400 transition-colors border border-white/10">
                              <FaTimes className="text-sm" />
                            </div>
                            <span className="font-medium text-sm">{t('removePhoto') || "Remove Photo"}</span>
                          </div>
                        </button>
                      )}
                    </div>
                    <div className="p-2 border-t border-white/10 bg-black/20">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all text-sm border border-red-600/50"
                        disabled={uploading}
                      >
                        <FaSignOutAlt /><span>{t('logout') || "Logout"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}