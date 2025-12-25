//components/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  FaHome, FaUsers, FaComment, FaChartBar, FaFileAlt, FaBook, FaBookOpen,
  FaPlus, FaCog, FaBars, FaTimes, FaChevronDown, FaKey,  FaUserEdit
} from 'react-icons/fa';
import { useTranslation } from '@/lib/i18n';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  subItems?: { label: string; href: string; icon: React.ElementType }[];
}

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const pathname = usePathname();

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const adminMenu: MenuItem[] = [
    { label: t('dashboard'), href: '/admin', icon: FaHome },
    { label: t('users'), href: '/admin/users', icon: FaUsers },
    { label: t('comment'), href: '/admin/comment', icon: FaComment },
    { label: t('report'), href: '/admin/report', icon: FaChartBar },
    { label: t('post'), href: '/admin/post', icon: FaFileAlt },
    {
      label: t('setting'),
      href: '/admin/setting',
      icon: FaCog,
      subItems: [
        { label: t('changePassword'), href: '/admin/setting/change-password', icon: FaKey },
        { label: t('changeUsername'), href: '/admin/setting/change-username', icon: FaUserEdit }
      ],
    },
  ];

  const librarianMenu: MenuItem[] = [
    { label: t('dashboard'), href: '/librarian', icon: FaHome },
    { label: t('books'), href: '/librarian/books', icon: FaBook },
    { label: t('borrow'), href: '/librarian/borrow', icon: FaBookOpen },
    { label: t('comment'), href: '/librarian/comment', icon: FaComment },
    { label: t('news'), href: '/librarian/news', icon: FaPlus },
    {
      label: t('setting'),
      href: '/librarian/setting',
      icon: FaCog,
      subItems: [
        { label: t('changePassword'), href: '/librarian/setting/change-password', icon: FaKey },
        { label: t('changeUsername'), href: '/librarian/setting/change-username', icon: FaUserEdit }
      ],
    },
  ];

  const teacherMenu: MenuItem[] = [
    { label: t('dashboard'), href: '/teacher', icon: FaHome },
    { label: t('books'), href: '/teacher/books', icon: FaBook },
    { label: t('borrow'), href: '/teacher/borrow', icon: FaBookOpen },
    { label: t('comment'), href: '/teacher/comment', icon: FaComment },
    { label: t('news'), href: '/teacher/news', icon: FaPlus },
    {
      label: t('setting'),
      href: '/teacher/setting',
      icon: FaCog,
      subItems: [
        { label: t('changePassword'), href: '/teacher/setting/change-password', icon: FaKey },
        { label: t('changeUsername'), href: '/teacher/setting/change-username', icon: FaUserEdit }
      ],
    },
  ];

  const studentMenu: MenuItem[] = [
    { label: t('dashboard'), href: '/student', icon: FaHome },
    { label: t('books'), href: '/student/books', icon: FaBook },
    { label: t('comment'), href: '/student/comment', icon: FaComment },
    { label: t('news'), href: '/student/news', icon: FaPlus },
    {
      label: t('setting'),
      href: '/student/setting',
      icon: FaCog,
      subItems: [
        { label: t('changePassword'), href: '/student/setting/change-password', icon: FaKey },
        { label: t('changeUsername'), href: '/student/setting/change-username', icon: FaUserEdit }
      ],
    },
  ];

  const menuMap: Record<string, MenuItem[]> = {
    admin: adminMenu,
    librarian: librarianMenu,
    teacher: teacherMenu,
    student: studentMenu,
  };
  const menu = menuMap[role] ?? [];

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu(prev => prev === label ? null : label);
  };

  if (!menu.length) return null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`lg:hidden fixed top-0 left-0 z-[70] h-16 w-16 flex items-center justify-center text-white hover:bg-white/10 transition-colors ${isOpen ? 'hidden' : 'block'}`}
        aria-label="Open menu"
      >
        <FaBars className="text-xl" />
      </button>

      {/* Sidebar with Gradient Background */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        h-screen
      `}>
        {/* Sidebar Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
        
        {/* Animated Gradient Orbs (Similar to login pages) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/3 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-500/10 to-blue-400/10 rounded-full blur-3xl"></div>
        
        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-white/5 to-transparent" />

        {/* Subtle Top Border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Close Button (Mobile) */}
        <div className="absolute top-4 right-3 lg:hidden z-50">
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg border border-white/10 transition-all duration-300"
          >
            <FaTimes className="text-xl text-white" />
          </button>
        </div>

        {/* Branding Section */}
        <div className="relative z-10 flex items-center gap-2 px-6 pt-8 pb-6 group cursor-default">
          <div className="relative w-12 h-12 overflow-hidden rounded-full shrink-0 transition-transform duration-500 group-hover:scale-105">
             <Image 
               src="/wldu.jpg" 
               alt="Woldia University" 
               width={48} 
               height={48} 
               className="object-cover w-full h-full"
               priority
             />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
             <h1 className="text-base font-bold text-white leading-tight tracking-wide drop-shadow-md group-hover:text-cyan-50 transition-colors">
               {t('woldiaUniversity')}
             </h1>
          </div>
        </div>

        {/* Scrollable Menu Area */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.subItems?.some(s => pathname === s.href) ?? false);
            const isSubOpen = openSubmenu === item.label;

            return (
              <div key={item.label}>
                <div
                  onClick={() => item.subItems && toggleSubmenu(item.label)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 font-medium text-sm group ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 backdrop-blur-sm' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                  }`}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 flex-1"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className={`text-lg ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-cyan-300'}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                  {item.subItems && (
                    <FaChevronDown className={`text-sm transition-transform duration-300 ${isSubOpen ? 'rotate-180' : ''} ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-cyan-300'
                    }`} />
                  )}
                </div>

                {/* Submenu */}
                {item.subItems && isSubOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-300 backdrop-blur-sm ${
                            subActive 
                              ? 'bg-gradient-to-r from-blue-500/80 to-indigo-500/80 text-white shadow-md' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <SubIcon className={`text-sm ${subActive ? 'text-white' : 'text-gray-400 group-hover:text-cyan-300'}`} />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-slate-900/90 z-40 backdrop-blur-sm"
        />
      )}
    </>
  );
}