"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
}

const translations = {
  id: {
      title: "Decision Control HQ",
      sub: "Manajemen Inventaris Suci",
      strategy: "Director Kampanye Strategis",
      impact: "Log Dampak Pasar",
      velocity: "Umpan Kecepatan Sales",
      winRate: "Tingkat Kemenangan Global",
      roi: "ROI DIOPTIMALKAN",
      launch: "LUNCURKAN KAMPANYE",
      pdf: "PDF STRATEGIS",
      logistics: "Detak Logistik Suci",
      team: "Kecepatan Operasional Tim",
      financial: "Matriks Arus Keuangan",
      cash: "Uang IDR Terkumpul",
      pipeline: "Pipa USD (Haji Furoda)",
      weather: "Cuaca Tanah Suci",
      prayer: "Waktu Shalat",
      fx: "Kurs Mata Uang"
  },
  en: {
      title: "Decision Control HQ",
      sub: "Sacred Inventory Management",
      strategy: "Strategic Campaign Director",
      impact: "Market Impact Log",
      velocity: "Sales Velocity Feed",
      winRate: "Global Win Rate",
      roi: "ROI OPTIMIZED",
      launch: "LAUNCH CAMPAIGN",
      pdf: "STRATEGIC PDF",
      logistics: "Sacred Logistics Pulse",
      team: "Team Operational Velocity",
      financial: "Financial Flow Matrices",
      cash: "Collected IDR Cash",
      pipeline: "USD Pipeline (Haji Furoda)",
      weather: "Tanah Suci Weather",
      prayer: "Prayer Times",
      fx: "FX Matrix"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('id');

  useEffect(() => {
    const savedLang = localStorage.getItem('crm-lang') as Language;
    if (savedLang) setLang(savedLang);
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('crm-lang', newLang);
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
