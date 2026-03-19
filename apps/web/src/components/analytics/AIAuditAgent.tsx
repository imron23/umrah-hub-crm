"use client";

import React, { useState } from 'react';

interface Decision {
  campaign: string;
  quadrant: string;
  reason: string;
  action: string;
  priority: string;
}

interface AuditResult {
  agent_name: string;
  analysis_summary: string;
  decisions: Decision[];
  global_advice: string;
}

export default function AIAuditAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const triggerAudit = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const res = await fetch('http://localhost:8081/api/v1/public/ai-audit');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={triggerAudit}
        className="group relative flex items-center gap-4 px-10 py-5 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] text-black hover:scale-105 transition-all shadow-[0_15px_40px_rgba(245,158,11,0.25)] active:scale-95 overflow-hidden border border-white/20"
      >
        <span className="relative z-10 flex items-center gap-3">
            <span className="text-2xl animate-pulse">🤖</span>
            Autonomous Audit
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10">
          <div 
            className="absolute inset-0 backdrop-blur-3xl bg-black/80 animate-in fade-in duration-300" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-5xl bg-[#080c14] border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
            
            {/* GLOW DECOR */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[40%] bg-amber-500/10 blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">⚡</div>
                    <div>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.5em] mb-1 block">Agent Protocol 0x4FF2</span>
                        <h2 className="text-3xl md:text-4xl font-black italic uppercase italic tracking-tighter text-white">Cross-Channel Strategy Audit</h2>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all hover:rotate-90"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 md:p-16 space-y-12 custom-scrollbar z-10">
                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-10">
                        <div className="relative">
                            <div className="w-32 h-32 border-[6px] border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">🛰️</div>
                        </div>
                        <div className="text-center space-y-4">
                            <h4 className="text-2xl font-black text-white italic uppercase tracking-widest animate-pulse">Simulating ROI Quadrants...</h4>
                            <p className="text-[11px] text-slate-500 uppercase tracking-[0.3em] max-w-md mx-auto leading-relaxed">Cross-referencing lead quality, conversion velocity, and acquisition costs across all active campaigns.</p>
                        </div>
                    </div>
                ) : result && (
                    <div className="space-y-16 pb-10">
                        {/* Summary */}
                        <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
                            <div className="flex items-center gap-4 mb-8">
                                <span className="px-5 py-2 rounded-2xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest">Executive Summary</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Confidence Level: 98.4%</span>
                            </div>
                            <blockquote className="text-2xl md:text-3xl text-white font-medium italic leading-[1.1] tracking-tight mb-10">
                                "{result.analysis_summary}"
                            </blockquote>
                            <div className="pt-10 border-t border-amber-500/10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Core Strategic Pivot</p>
                                    <p className="text-[13px] text-slate-300 font-medium leading-relaxed">{result.global_advice}</p>
                                </div>
                                <div className="flex items-end justify-end">
                                    <div className="px-6 py-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                        <p className="text-[9px] font-bold text-amber-500 uppercase mb-1">Status</p>
                                        <p className="text-xs font-black text-white uppercase tracking-widest">Optimization Required</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quadrant Decisions */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-black text-white uppercase tracking-widest italic px-4 flex items-center gap-4">
                                <span className="w-12 h-[1px] bg-slate-800" /> Granular Channel Logic
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {result.decisions.map((dec, i) => (
                                    <div key={i} className={`p-10 rounded-[3rem] border transition-all duration-500 group relative overflow-hidden ${
                                        dec.priority === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                                    }`}>
                                        {/* BG DECOR */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity ${
                                            dec.priority === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'
                                        }`} />

                                        <div className="flex justify-between items-start mb-10 relative z-10">
                                            <div className="space-y-2">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ring-1 ${
                                                    dec.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-500 ring-red-500/20' : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                                                }`}>
                                                    {dec.quadrant}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-black tracking-[0.2em] ${dec.priority === 'CRITICAL' ? 'text-red-500' : 'text-slate-600'}`}>
                                                {dec.priority}
                                            </span>
                                        </div>

                                        <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4 relative z-10">{dec.campaign}</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed mb-10 relative z-10 font-medium">"{dec.reason}"</p>

                                        <div className="pt-8 border-t border-white/5 relative z-10">
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-4 italic">Autonomous Command:</p>
                                            <button className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl active:scale-95 ${
                                                dec.action.includes('KILL') 
                                                    ? 'bg-red-600/10 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white hover:shadow-red-900/40' 
                                                    : 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white hover:shadow-emerald-900/40'
                                            }`}>
                                                {dec.action}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            {!loading && result && (
                <div className="px-10 py-6 bg-white/[0.02] border-t border-white/5 flex justify-center z-10">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.5em]">Antigravity CRM • Strategy Protocol Active</p>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
