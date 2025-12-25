//app/layout.tsx
import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import ClientRoot from './ClientRoot'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Library Management',
  description: 'Next.js + Tailwind + MongoDB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}