"use client";

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-full shadow-lg">
      <ThemeButton 
        active={theme === 'light'} 
        onClick={() => setTheme('light')} 
        icon="☀️" 
        label="Light" 
      />
      <ThemeButton 
        active={theme === 'dark'} 
        onClick={() => setTheme('dark')} 
        icon="🌙" 
        label="Dark" 
      />
      <ThemeButton 
        active={theme === 'slate'} 
        onClick={() => setTheme('slate')} 
        icon="🌌" 
        label="Slate" 
      />
    </div>
  );
}

function ThemeButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all duration-300 ${
                active 
                ? 'bg-[var(--brand-solid)] text-white shadow-sm scale-100' 
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] scale-90 opacity-60 hover:opacity-100'
            }`}
        >
            {icon}
        </button>
    )
}
