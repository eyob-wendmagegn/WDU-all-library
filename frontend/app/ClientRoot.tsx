// app/ClientRoot.tsx
'use client';

import { I18nProvider } from '@/lib/i18n';
import Header from '@/components/Header';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function ClientRoot({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Determine role from URL (or fallback to "guest")
  const role = pathname.startsWith('/admin')
    ? 'admin'
    : pathname.startsWith('/librarian')
    ? 'librarian'
    : pathname.startsWith('/teacher')
    ? 'teacher'
    : pathname.startsWith('/student')
    ? 'student'
    : 'guest';

  return (
    <I18nProvider>
      {/* ONE HEADER FOR ALL PAGES */}
      <Header role={role} />
      {children}
    </I18nProvider>
  );
}