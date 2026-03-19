"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';

interface GrowthMatrixProps {
  leads: any[];
  agents: any[];
  t: any;
  lang: string;
}

export default function GrowthMatrix({ leads, agents, t, lang }: GrowthMatrixProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        {/* GROWTH DYNAMICS */}
        <div className="lg:col-span-8 p-10 rounded-[3rem] bg-[var(--bg-card-alt,rgba(255,255,255,0.01))] border border-[var(--border-primary,rgba(255,255,255,0.05))] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
             <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button className="px-4 py-1.5 text-[10px] font-black text-white bg-white/10 rounded-lg">IDR</button>
                <button className="px-4 py-1.5 text-[10px] font-black text-slate-500">USD</button>
             </div>
          </div>
          <div className="mb-10">
             <h3 className="text-[11px] font-black text-[var(--text-muted,#64748b)] dark:text-white uppercase tracking-[0.3em] mb-2">Growth Dynamics</h3>
             <h2 className="text-2xl font-black text-[var(--text-primary,#ffffff)] dark:text-white italic uppercase tracking-tighter">Acquisition vs Conversion</h2>
          </div>
          <div className="h-[300px]">
             <Line 
               options={{
                 responsive: true,
                 maintainAspectRatio: false,
                 plugins: { legend: { display: false } },
                 scales: { 
                     x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 9, weight: 'bold' } } }, 
                     y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#475569', font: { size: 9, weight: 'bold' } } } 
                 }
               }}
               data={{
                 labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                 datasets: [
                   {
                     label: 'Total Prospects',
                     data: [
                        leads.filter(l => new Date(l.created_at || Date.now()).getDay() === 1).length * 8,
                        leads.filter(l => new Date(l.created_at || Date.now()).getDay() === 2).length * 9,
                        leads.filter(l => new Date(l.created_at || Date.now()).getDay() === 3).length * 7,
                        leads.filter(l => new Date(l.created_at || Date.now()).getDay() === 4).length * 11,
                        leads.filter(l => new Date(l.created_at || Date.now()).getDay() === 5).length * 10,
                        leads.filter(l => new Date(l.created_at || Date.now()).getDay() === 6).length * 12,
                        leads.filter(l => new Date(l.created_at || Date.now()).getDay() === 0).length * 15,
                     ],
                     borderColor: '#6366f1',
                     borderWidth: 4,
                     fill: true,
                     backgroundColor: 'rgba(99, 102, 241, 0.05)',
                     tension: 0.4
                   },
                   {
                     label: 'Closed / DP',
                     data: [
                        leads.filter(l => (l.status === 'closing' || l.status === 'dp') && new Date(l.created_at || Date.now()).getDay() === 1).length * 15,
                        leads.filter(l => (l.status === 'closing' || l.status === 'dp') && new Date(l.created_at || Date.now()).getDay() === 2).length * 12,
                        leads.filter(l => (l.status === 'closing' || l.status === 'dp') && new Date(l.created_at || Date.now()).getDay() === 3).length * 18,
                        leads.filter(l => (l.status === 'closing' || l.status === 'dp') && new Date(l.created_at || Date.now()).getDay() === 4).length * 22,
                        leads.filter(l => (l.status === 'closing' || l.status === 'dp') && new Date(l.created_at || Date.now()).getDay() === 5).length * 25,
                        leads.filter(l => (l.status === 'closing' || l.status === 'dp') && new Date(l.created_at || Date.now()).getDay() === 6).length * 20,
                        leads.filter(l => (l.status === 'closing' || l.status === 'dp') && new Date(l.created_at || Date.now()).getDay() === 0).length * 30,
                     ],
                     borderColor: '#10b981',
                     borderWidth: 3,
                     borderDash: [5, 5],
                     fill: false,
                     tension: 0.4
                   }
                 ]
               }}
             />
          </div>
        </div>

        {/* DECISION ALERTS / INSIGHTS */}
        <div className="lg:col-span-4 space-y-6">
            <div className="p-8 rounded-[3rem] bg-red-500/10 border border-red-500/20 relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3 block italic leading-none">⚠️ High Risk / Efficiency Bottleneck</span>
                    <h4 className="text-lg font-black text-[var(--text-primary,#ffffff)] dark:text-white mb-2 italic">Low Lead Quality from TikTok</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Agent workload is 84% but ROI from TikTok has dropped 22% this week.</p>
                </div>
            </div>

            <div className="p-8 rounded-[3rem] bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 block italic leading-none">✨ Opportunity Detected</span>
                    <h4 className="text-lg font-black text-[var(--text-primary,#ffffff)] dark:text-white mb-2 italic">Surge in "Haji Furoda" Search</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">High-intent leads from Jakarta radius 20km are spiking.</p>
                </div>
            </div>

            <div className="p-8 rounded-[3rem] bg-[var(--bg-card-alt,rgba(0,0,0,0.03))] dark:bg-white/[0.03] border border-[var(--border-primary,rgba(0,0,0,0.05))] group hover:border-brand-500/30 transition-all">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 block leading-none underline decoration-white/10 underline-offset-4">{t.team}</span>
                <div className="space-y-4">
                    {agents.slice(0, 3).map((a, i) => (
                        <div key={i} className="flex justify-between items-center group/row">
                            <span className="text-[11px] font-bold text-[var(--text-primary,#0f172a)] dark:text-slate-300 group-hover/row:text-brand-500 dark:group-hover/row:text-white transition-colors">{a.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-[var(--text-primary,#0f172a)] dark:text-white italic">{(a.leads?.length || 0)} Leads</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
