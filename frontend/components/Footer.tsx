'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import Link from 'next/link';
import { FaTelegram } from 'react-icons/fa';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-300 py-12 border-t border-white/10 text-sm">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <h3 className="text-white text-lg font-bold">
            {t('woldiaUniversity')} {t('library')}
          </h3>
          <p className="text-gray-400 leading-relaxed">
            {t('connectsReaders')}
          </p>
          
        </div>

        {/* Services Column */}
        <div>
          <h3 className="text-white text-lg font-bold mb-5 relative inline-block">
            {t('ourServices')}
          </h3>
          <ul className="space-y-3">
            <li>
              <a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200 block w-fit">
                {t('bookBorrowing')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200 block w-fit">
                {t('bookSearching')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200 block w-fit">
                {t('bookAdding')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200 block w-fit">
                {t('bookReturning')}
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Us Column */}
        <div>
          <h3 className="text-white text-lg font-bold mb-5 relative inline-block">
            {t('contactUs')}
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="font-medium text-gray-200">{t('woldiaUniversity')}</span>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-cyan-400 font-medium">{t('phone')}</span>
              <a href="tel:+251983610499" className="hover:text-white transition-colors">
                +251 983 610 499
              </a>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-cyan-400 font-medium">{t('emailLabel')}:</span>
              <a href="mailto:eyobwende18@gmail.com" className="hover:text-white transition-colors break-all">
                eyobwende18@gmail.com
              </a>
            </li>
            <li className="flex flex-col gap-1">
              <span className="text-cyan-400 font-medium">{t('telegram')}:</span>
              <a href="http://localhost:5000/api/telegram" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                <FaTelegram className="text-lg" />
                <span>{t('joinGroup')}</span>
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center text-gray-500 text-xs sm:text-sm">
        <p>&copy; {currentYear} {t('librarySystem')}. {t('allRightsReserved')}</p>
      </div>
    </footer>
  );
}