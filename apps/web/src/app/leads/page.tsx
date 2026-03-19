"use client";

import React, { useState, useEffect } from 'react';
import LeadsTable from "@/components/leads/LeadsTable";
import ManualLeadModal from "@/components/leads/ManualLeadModal";

export default function LeadsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'my' | 'high'>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8081/api/v1/public/leads_demo')
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  const filteredLeads = leads.filter(lead => {
    // Owner Filter
    if (ownerFilter === 'high' && (lead.lead_score || 0) < 80) return false;
    // (In a real app 'my' would filter by agent_id, here we just show all for demo)
    
    // Source Filter
    const leadSource = lead.utm_logs?.[0]?.utm_source?.toLowerCase() || '';
    if (sourceFilter === 'organic') {
        return ['direct', 'referral', 'email_marketing', ''].includes(leadSource);
    } else if (sourceFilter !== 'all') {
        return leadSource === sourceFilter;
    }
    
    return true;
  });

  const stats = {
    total: filteredLeads.length,
    hot: filteredLeads.filter(l => (l.lead_score || 0) >= 80).length,
    conversion: filteredLeads.length > 0 ? ((filteredLeads.filter(l => l.status === 'closing').length / filteredLeads.length) * 100).toFixed(1) : "0",
    cac: filteredLeads.length > 0 ? (18000000 / leads.length / 1000).toFixed(1) : "0" // Simulated CAC based on total budget 18jt
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const sources = [
    { id: 'all', label: 'All Sources', icon: '🌐' },
    { id: 'fb_ads', label: 'FB Ads', icon: '📱' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
    { id: 'google_search', label: 'Google Search', icon: '🔍' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'organic', label: 'Organic/Direct', icon: '🌐' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase italic">Leads & Pipeline</h1>
          <p className="text-slate-400 mt-2 font-medium">Manage and monitor pilgrim assignments across marketing channels.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex p-1 bg-white/[0.03] border border-white/10 rounded-2xl luxury-glass">
            <button 
              onClick={() => setOwnerFilter('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ownerFilter === 'all' ? 'bg-brand-solid text-white shadow-lg shadow-brand-glow/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              All Manifest
            </button>
            <button 
              onClick={() => setOwnerFilter('high')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ownerFilter === 'high' ? 'bg-brand-solid text-white shadow-lg shadow-brand-glow/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              High Intensity
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group px-6 h-12 rounded-2xl bg-brand-solid hover:invert-0 transition-all shadow-xl shadow-brand-glow/20 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-white"
          >
            <span>Add Manual Lead</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MiniStat label="Active Trajectories" value={stats.total.toString()} sub="Synced cross-channel" color="text-white" />
        <MiniStat label="High Intent Pool" value={stats.hot.toString()} sub="Ready for closing" color="text-emerald-400" />
        <MiniStat label="Conversion Target" value={`${stats.conversion}%`} sub="Current efficiency" color="text-brand-400" />
        <MiniStat label="CAC Analysis" value={`Rp${stats.cac}k`} sub="Budget: 18jt Cap" color="text-amber-400" />
      </div>

      {/* SOURCE FILTERS - AS SEEN IN SCREENSHOT */}
      <div className="flex bg-white/[0.02] border border-white/5 p-1.5 rounded-[2rem] luxury-glass w-fit overflow-x-auto no-scrollbar">
         {sources.map(s => (
            <button
                key={s.id}
                onClick={() => setSourceFilter(s.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    sourceFilter === s.id 
                    ? 'bg-brand-solid text-white shadow-xl shadow-brand-glow/30' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
            >
                <span className="text-base">{s.icon}</span>
                {s.label}
            </button>
         ))}
      </div>

      <div className="luxury-glass rounded-[3rem] overflow-hidden border border-white/5">
        <LeadsTable leadsData={filteredLeads} loading={loading} />
      </div>

      <div className="p-10 rounded-[4rem] bg-gradient-to-br from-brand-solid/10 via-transparent to-emerald-500/5 border border-white/5 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-solid/10 blur-[100px] rounded-full group-hover:bg-brand-solid/20 transition-all duration-1000" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl text-center lg:text-left">
                <h3 className="text-3xl font-black text-white mb-3 italic uppercase tracking-tighter">Round-Robin Intelligence</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                    System is currently balancing <span className="text-white">{(stats.total * 30).toLocaleString()} leads/month</span> across active agents.
                    Priority routing is enabled for Bogor & Jakarta regions to ensure maximum conversion for premium packages.
                </p>
            </div>
            <div className="flex gap-4 shrink-0">
                <button className="px-8 h-14 rounded-2xl bg-white/[0.03] border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all">
                    Agent Map
                </button>
                <button className="px-8 h-14 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/10">
                    Re-Sync Workers
                </button>
            </div>
        </div>
      </div>

      {isModalOpen && (
        <ManualLeadModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value, sub, color }: any) {
    return (
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between h-40 hover:border-brand-solid/20 transition-all group luxury-glass">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">{label}</p>
            <div>
                <h4 className={`text-4xl font-black ${color} tracking-tighter`}>{value}</h4>
                <p className="text-[10px] text-slate-600 mt-1 uppercase italic tracking-widest font-bold group-hover:text-slate-500 transition-colors">{sub}</p>
            </div>
        </div>
    )
}
