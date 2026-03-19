"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center p-0.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg">
      <button 
        onClick={() => setLang('id')}
        className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all ${lang === 'id' ? 'bg-[var(--brand-solid)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-60 hover:opacity-100'}`}
      >
        ID
      </button>
      <button 
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all ${lang === 'en' ? 'bg-[var(--brand-solid)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-60 hover:opacity-100'}`}
      >
        EN
      </button>
    </div>
  );
}
