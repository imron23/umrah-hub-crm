"use client";

import React, { useEffect, useState } from 'react';

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
}

export default function LPHub() {
  const [lps, setLps] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLPs();
  }, []);

  const fetchLPs = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/v1/public/lps');
      const data = await res.json();
      setLps(data.lps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`http://localhost:8081/api/v1/public/lps/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLps(lps.map(lp => lp.id === id ? { ...lp, status: newStatus } : lp));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyLink = (slug: string) => {
    const baseUrl = window.location.origin;
    const cleanSlug = slug.replace('lp_', '').replace(/_/g, '-');
    const fullUrl = `${baseUrl}/lp/${cleanSlug}`;
    navigator.clipboard.writeText(fullUrl);
    alert(`Link copied: ${fullUrl}`);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em] mb-3 block">Campaign Control Center</span>
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Landing Pages Hub</h1>
        <p className="text-slate-400 mt-2">Activate or deactivate specific acquisition funnels and manage promotional links.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lps.map((lp) => (
          <div key={lp.id} className="group relative bg-white/[0.02] border border-white/5 rounded-[40px] p-8 hover:bg-white/[0.04] transition-all hover:border-white/10">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${lp.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                {lp.status === 'active' ? '⚡' : '💤'}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleStatus(lp.id, lp.status)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    lp.status === 'active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'
                  }`}
                >
                  {lp.status === 'active' ? 'Turn Off' : 'Turn On'}
                </button>
              </div>
            </div>

            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">{lp.name}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Internal ID: {lp.slug}</p>

            <div className="space-y-3">
              <button 
                onClick={() => copyLink(lp.slug)}
                className="w-full py-4 rounded-3xl bg-white/5 text-slate-300 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-2 group-hover:border-white/20 border border-transparent"
              >
                <span>🔗</span> Copy Promotion Link
              </button>
              <a 
                href={`/lp/${lp.slug.replace('lp_', '').replace(/_/g, '-')}`}
                target="_blank"
                className="w-full py-4 rounded-3xl bg-brand-500/10 text-brand-500 font-bold uppercase tracking-widest text-[10px] hover:bg-brand-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span>👁️</span> Preview Page
              </a>
            </div>

            {/* Micro Stats (Demo) */}
            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Leads Today</p>
                    <p className="text-xl font-black text-white italic">+{Math.floor(Math.random() * 10)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">CR Ratio</p>
                    <p className="text-xl font-black text-brand-500 italic">{Math.floor(Math.random() * 5 + 3)}.2%</p>
                </div>
            </div>
          </div>
        ))}

        {/* Create New LP Placeholder */}
        <div className="border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center p-12 text-center group hover:border-brand-500/40 transition-all cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-4 group-hover:bg-brand-500/10 group-hover:text-brand-500 transition-all">
                +
            </div>
            <h4 className="text-white font-bold uppercase tracking-tight italic">Design New Campaign</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">Custom landing page engine</p>
        </div>
      </div>
    </div>
  );
}
