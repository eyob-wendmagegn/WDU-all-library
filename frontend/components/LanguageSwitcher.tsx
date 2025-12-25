'use client';

import { useTranslation } from '@/lib/i18n';
import { FaGlobe } from 'react-icons/fa';

export default function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 p-1.5 text-white hover:text-blue-200 hover:bg-white/10 rounded-full transition">
        <FaGlobe className="text-base" />
        <span className="text-xs font-medium uppercase">{lang}</span>
      </button>

      <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {(['en', 'am'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 ${
              lang === l ? 'font-semibold text-indigo-600' : ''
            }`}
          >
            {l === 'en' ? 'English' : 'አማርኛ'}
          </button>
        ))}
      </div>
    </div>
  );
}