// lib/i18n.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';

type Lang = 'en' | 'am';
type Translations = Record<string, string>;

interface I18nContextProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  ready: boolean;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('en');
  const [dict, setDict] = useState<Translations>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved && (saved === 'en' || saved === 'am')) setLang(saved);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/translations/${lang}`);
        setDict(res.data);
        localStorage.setItem('lang', lang);
        api.defaults.headers.common['Accept-Language'] = lang;
      } catch (e) {
        console.error('Failed to load translations', e);
      } finally {
        setReady(true);
      }
    })();
  }, [lang]);

  const t = (key: string): string => dict[key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, ready }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextProps => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
};