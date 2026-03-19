"use client";

import React from 'react';

interface FinancialPulseProps {
  collectedIDR: number;
  collectedUSD: number;
  highIntent: number;
}

export default function FinancialPulse({ collectedIDR, collectedUSD, highIntent }: FinancialPulseProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="md:col-span-2 p-10 rounded-[3rem] bg-gradient-to-br from-brand-600 to-brand-900 border border-white/20 relative overflow-hidden group shadow-2xl">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
            <span className="text-[10px] font-black text-brand-200 uppercase tracking-[0.4em] mb-4 block">IDR Realized Cash</span>
            <h2 className="text-6xl font-black text-white italic tracking-tighter leading-none">Rp{(collectedIDR / 1000000).toFixed(1)}M</h2>
            <div className="mt-8 flex items-center gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase">Umrah & Pesantren Feed</span>
                <span className="text-brand-200 text-xs font-medium">↑ 12.4% vs last cycle</span>
            </div>
        </div>

        <div className="p-10 rounded-[3rem] bg-[var(--bg-card-alt,rgba(255,255,255,0.02))] border border-[var(--border-primary,rgba(255,255,255,0.05))] flex flex-col justify-between hover:bg-white/[0.05] transition-all">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">USD Liquidity</span>
              <h3 className="text-4xl font-black text-[var(--text-primary,#ffffff)] dark:text-white italic tracking-tighter">${(collectedUSD / 1000).toFixed(1)}K</h3>
              <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase">Confirmed Haji Furoda</p>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full mt-6">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
            </div>
        </div>

        <div className="p-10 rounded-[3rem] bg-[var(--bg-card-alt,rgba(255,255,255,0.02))] border border-[var(--border-primary,rgba(255,255,255,0.05))] flex flex-col justify-between hover:bg-white/[0.05] transition-all">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">High Intent Intensity</span>
              <h3 className="text-4xl font-black text-[var(--text-primary,#ffffff)] dark:text-white italic tracking-tighter">{highIntent}</h3>
              <p className="text-[10px] text-brand-400 font-bold mt-2 uppercase">SQL Stage Leads</p>
            </div>
            <div className="flex gap-1 mt-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-8 flex-1 rounded-lg ${i < 4 ? 'bg-brand-500' : 'bg-white/5'}`} />
                ))}
            </div>
        </div>
    </div>
  );
}
