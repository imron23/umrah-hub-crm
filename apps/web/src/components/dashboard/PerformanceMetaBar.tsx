"use client";

import React from 'react';

interface PerformanceMetaBarProps {
  activeDetail: string | null;
  setActiveDetail: (detail: string | null) => void;
  weatherData: any[];
}

export default function PerformanceMetaBar({ activeDetail, setActiveDetail, weatherData }: PerformanceMetaBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-16 px-8 py-5 bg-[var(--bg-card-alt,rgba(255,255,255,0.02))] border border-[var(--border-primary,rgba(255,255,255,0.05))] rounded-[2.5rem] backdrop-blur-3xl shadow-2xl transition-all hover:bg-white/[0.04]">
        <div className="flex flex-wrap items-center gap-8">
            <div 
              onClick={() => setActiveDetail(activeDetail === 'calendar' ? null : 'calendar')}
              className={`flex items-center gap-4 group cursor-pointer p-2 rounded-xl transition-all ${activeDetail === 'calendar' ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
            >
                <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center text-xl animate-pulse">📅</div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Hijri Cycle</p>
                    <p className="text-[13px] font-black text-[var(--text-primary,#ffffff)] italic tracking-tight underline decoration-white/10">29 Ramadhan 1447H</p>
                </div>
            </div>
            <div 
              onClick={() => setActiveDetail(activeDetail === 'prayer' ? null : 'prayer')}
              className={`flex items-center gap-4 border-l border-white/10 pl-8 group cursor-pointer p-2 rounded-xl transition-all ${activeDetail === 'prayer' ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
            >
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-xl">🕋</div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Makkah Prayer</p>
                    <p className="text-[13px] font-black text-[var(--text-primary,#ffffff)] italic tracking-tight underline decoration-white/10">Dhuhr: <span className="text-emerald-400">01:24:12 Remaining</span></p>
                </div>
            </div>
            <div 
              onClick={() => setActiveDetail(activeDetail === 'fx' ? null : 'fx')}
              className={`flex items-center gap-4 border-l border-white/10 pl-8 group cursor-pointer p-2 rounded-xl transition-all ${activeDetail === 'fx' ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
            >
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-xl">💰</div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">FX Matrix (SAR/IDR)</p>
                    <p className="text-[13px] font-black text-[var(--text-primary,#ffffff)] italic tracking-tight underline decoration-white/10">Rate: <span className="text-amber-400">4,215.10</span> <span className="text-[9px] text-red-500 ml-1">↓ 0.2%</span></p>
                </div>
            </div>
        </div>

        {/* CLIMATE PULSE HQ */}
        <div className="flex-1 border-l border-white/10 pl-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 italic leading-none">Global Climate Intelligence HQ</p>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {weatherData.map((w, i) => (
                    <div key={i} className="group relative overflow-hidden bg-white/[0.03] border border-white/10 rounded-[1.2rem] p-3 flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:scale-105 hover:border-brand-500/50 cursor-pointer shadow-2xl">
                        <span className="text-xl mb-1.5 group-hover:scale-125 transition-transform duration-500 animate-pulse">{w.icon}</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-1 leading-none">{w.name}</span>
                        <span className="text-[14px] font-black text-[var(--text-primary,#ffffff)] italic leading-none">{w.temp}°C</span>
                        
                        <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                            w.temp >= 35 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                            w.temp >= 30 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 
                            w.temp < 20 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 
                            'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                        } opacity-50`} />
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
