'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  role: string;
}

export default function Layout({ children, role }: LayoutProps) {
  return (
    // Use fixed inset-0 z-40 to overlay and hide any underlying global headers
    <div className="fixed inset-0 z-40 flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Side: Sidebar */}
      <Sidebar role={role} />

      {/* Right Side: Wrapper for Header, Main Content, and Footer */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        
        {/* Header sits at the top of the right column */}
        <Header role={role} />

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 scroll-smooth">
          <div className="min-h-full flex flex-col">
            {/* Page Content */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8">
              {children}
            </div>
            
            {/* Footer at the bottom of the content flow */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}