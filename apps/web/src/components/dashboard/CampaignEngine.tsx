"use client";

import React from 'react';

interface CampaignEngineProps {
  t: any;
  campaignStatus: string | null;
  downloadBrochure: () => void;
  launchCampaign: () => void;
}

export default function CampaignEngine({ t, campaignStatus, downloadBrochure, launchCampaign }: CampaignEngineProps) {
  return (
    <div className="p-12 rounded-[4.5rem] bg-gradient-to-br from-brand-600/10 via-white/[0.01] to-emerald-500/10 border border-[var(--border-primary,rgba(255,255,255,0.05))] shadow-3xl relative overflow-hidden group mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 border-b border-white/5 pb-12">
            <div>
                <span className="text-[11px] font-black text-brand-500 uppercase tracking-[0.4em] mb-4 block italic leading-none">{t.strategy}</span>
                <h2 className="text-5xl font-black text-[var(--text-primary,#ffffff)] dark:text-white italic tracking-tighter uppercase leading-[0.9]">Bogor 15jt <br/><span className="text-brand-500 underline decoration-brand-500/20 underline-offset-8">All-in</span> Engine</h2>
            </div>

            <div className="flex flex-wrap items-center gap-10">
                {campaignStatus && (
                    <div className="bg-brand-500/10 text-brand-500 px-6 py-2.5 rounded-2xl border border-brand-500/30 text-[10px] font-black italic tracking-widest animate-pulse">
                        {campaignStatus}
                    </div>
                )}
                <div className="flex items-center gap-10">
                    <div className="text-right border-r border-white/10 pr-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">{t.winRate}</p>
                        <p className="text-3xl font-black text-[var(--text-primary,#ffffff)] dark:text-white italic tracking-tighter">10.9%</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={downloadBrochure} className="bg-white/5 border border-white/10 text-[var(--text-primary,#ffffff)] dark:text-white px-8 py-3 rounded-2xl text-[10px] font-black italic tracking-widest shadow-lg hover:bg-white/10 transition-all">{t.pdf}</button>
                        <button onClick={launchCampaign} className="bg-sky-500 text-white px-10 py-3 rounded-[2rem] text-[11px] font-black italic tracking-widest shadow-xl hover:bg-sky-600 transition-all hover:scale-105 active:scale-95 shadow-sky-500/20">{t.launch}</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4 space-y-10">
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">Aggressive acquisition funnel for 100 new recruits with optimized CAC Rp180k floor.</p>
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4 group/item cursor-pointer p-4 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/5 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 group-hover/item:bg-brand-500 group-hover/item:text-white transition-all shadow-inner">✓</div>
                        <div>
                            <p className="text-[11px] font-black text-[var(--text-primary,#ffffff)] dark:text-white italic uppercase tracking-wider">Sunnah Compliant</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">USP VALIDATED</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 group/item cursor-pointer p-4 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/5 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all shadow-inner">✓</div>
                        <div>
                            <p className="text-[11px] font-black text-[var(--text-primary,#ffffff)] dark:text-white italic uppercase tracking-wider">Premium Assets</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Fasilitas Ready</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-10 rounded-[4rem] bg-black/40 border border-white/5 flex flex-col justify-between hover:border-brand-500/20 transition-all group/kpi">
                    <div className="mb-8">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block leading-none">Campaign CTR</span>
                      <h4 className="text-4xl font-black text-white italic tracking-tighter group-hover/kpi:text-brand-400 transition-colors">1.42%</h4>
                    </div>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest leading-none bg-emerald-400/10 py-2 px-4 rounded-xl text-center">ON TRACK</p>
                </div>
                <div className="p-10 rounded-[4rem] bg-black/40 border border-white/5 flex flex-col justify-between hover:border-brand-500/20 transition-all group/kpi">
                    <div className="mb-8">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block leading-none">Avg. CPL</span>
                      <h4 className="text-4xl font-black text-white italic tracking-tighter">Rp32K</h4>
                    </div>
                    <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest leading-none bg-brand-400/10 py-2 px-4 rounded-xl text-center italic font-black">HEALTHY</p>
                </div>
                <div className="p-10 rounded-[4rem] bg-white/[0.03] border border-brand-500/20 flex flex-col justify-between relative group/asset cursor-pointer overflow-hidden backdrop-blur-3xl shadow-2xl hover:bg-white/[0.08] transition-all">
                    <div className="absolute inset-0 bg-brand-500 opacity-0 group-hover/asset:opacity-10 transition-all" />
                    <div className="flex justify-between items-start mb-10">
                        <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] block leading-none italic animate-pulse">Asset Focus</span>
                        <span className="text-[10px] font-black text-slate-400 italic">85%</span>
                    </div>
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 bg-brand-500/10 rounded-2xl flex items-center justify-center text-3xl shadow-xl">📄</div>
                        <div>
                            <p className="text-[12px] font-black text-[var(--text-primary,#ffffff)] dark:text-white italic uppercase tracking-tighter">Brochure_15jt.pdf</p>
                            <p className="text-[10px] text-slate-400 font-bold">READY TO AUTO-WA</p>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner font-bold lowercase scale-y-125 pointer-events-none">
                        <div className="h-full bg-brand-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: '85%' }} />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
