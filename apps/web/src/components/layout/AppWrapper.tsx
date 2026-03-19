"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "./Sidebar";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAuthOrMarketing = pathname.startsWith('/login') || pathname.startsWith('/lp') || pathname.startsWith('/promo');

  if (isAuthOrMarketing) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-[var(--border-main)] flex items-center justify-between px-6 bg-[var(--bg-header)] backdrop-blur-md sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-3">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <h2 className="text-[11px] font-medium text-[var(--text-secondary)] tracking-tight uppercase">
                  Operational Dashboard <span className="text-[var(--text-muted)] mx-2">/</span> <span className="text-[var(--text-secondary)]">Live Strategy Feed</span>
               </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 pr-4 border-r border-[var(--border-main)]">
                <LanguageToggle />
                <ThemeToggle />
            </div>
            
            <div className="flex items-center gap-3">
            <button className="w-7 h-7 rounded-md bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center justify-center text-[11px] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all">🔔</button>
            <div className="flex items-center gap-2.5 bg-[var(--bg-card)] border border-[var(--border-card)] pl-1 pr-3 py-0.5 rounded-md">
                <div className="w-5 h-5 rounded bg-[var(--brand-solid)] flex items-center justify-center font-bold text-[9px] text-white">AF</div>
                <div className="hidden lg:block">
                    <p className="text-[11px] font-medium text-[var(--text-primary)] tracking-tight">Ahmad Faisal</p>
                </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
        {children}
      </div>
    </main>
  </div>
  );
}
