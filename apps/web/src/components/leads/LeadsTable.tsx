"use client";

import React, { useEffect, useState } from 'react';
import LeadDetailModal from './LeadDetailModal';

export default function LeadsTable({ leadsData, loading }: { leadsData?: any[], loading?: boolean }) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date"); 

  const leads = (leadsData || [])
    .filter(l => 
        (l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.city.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === "all" ? true : l.status === statusFilter)
    )
    .sort((a, b) => {
        if (sortBy === "score") return b.lead_score - a.lead_score;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime();
    });

  const parseMessage = (msg: string) => {
    const budgetMatch = msg?.match(/\[Budget:\s*(.*?)\]/);
    const companionMatch = msg?.match(/\[Pendamping:\s*(.*?)\]/);
    return {
      grade: budgetMatch ? budgetMatch[1] : "Reguler",
      pax: companionMatch ? companionMatch[1] : "Single"
    };
  };

  if (loading) return (
    <div className="p-16 flex flex-col items-center justify-center gap-5">
        <div className="w-8 h-8 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm text-text-muted font-bold tracking-widest">Loading Manifest...</p>
    </div>
  );

  return (
    <div className="w-full bg-surface rounded-none md:rounded-[2rem]">
      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border-b border-border-card shrink-0">
          <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                  <input 
                      type="text" 
                      placeholder="Smart Search (Name / City)..."
                      className="w-full bg-app border border-border-card rounded-2xl py-3 pl-12 pr-4 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all placeholder:text-text-muted"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="relative">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-app border border-border-card rounded-2xl py-3 px-6 text-xs font-bold text-text-secondary focus:outline-none focus:border-brand-500 cursor-pointer hover:bg-card-hover transition-all appearance-none pr-10"
                  >
                      <option value="all">Status: ALL</option>
                      <option value="new">NEW</option>
                      <option value="contacted">CONTACTED</option>
                      <option value="prospect">PROSPECT</option>
                      <option value="dp">DP</option>
                      <option value="closing">CLOSING</option>
                      <option value="lost">LOST</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none">▼</div>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-text-muted hidden md:inline ml-4">Sort By:</span>
              <button onClick={() => setSortBy('date')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'date' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-app text-text-secondary hover:text-white border border-border-card'}`}>Latest</button>
              <button onClick={() => setSortBy('score')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${sortBy === 'score' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-app text-text-secondary hover:text-white border border-border-card'}`}>Score</button>
          </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-card">
            <tr className="border-b border-border-card">
              <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider">Full Name</th>
              <th className="px-4 py-5 text-xs font-bold text-text-muted uppercase tracking-wider">Grade</th>
              <th className="px-4 py-5 text-xs font-bold text-text-muted uppercase tracking-wider text-center">Pax</th>
              <th className="px-5 py-5 text-xs font-bold text-text-muted uppercase tracking-wider text-center">Score</th>
              <th className="px-5 py-5 text-xs font-bold text-text-muted uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Action Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-card">
            {leads.map((lead, i) => {
              const details = parseMessage(lead.message);
              const isClosing = lead.status === 'dp' || lead.status === 'closing';
              
              // Safe date parsing to avoid "Invalid Date"
              let validDateStr = isClosing ? (lead.updated_at || lead.created_at) : lead.created_at;
              if (!validDateStr) validDateStr = new Date().toISOString();
              const displayDate = new Date(validDateStr);
              const formattedDate = displayDate.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

              return (
                  <tr 
                  key={lead.id} 
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="group hover:bg-card-hover cursor-pointer transition-colors duration-200 animate-in fade-in slide-in-from-top-1"
                  style={{ animationDelay: `${i * 15}ms` }}
                  >
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-sm font-black text-white shadow-sm shrink-0 border border-brand-500/20">
                              {lead.name[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-text-primary group-hover:text-brand-300 transition-colors">{lead.name || 'Unknown Lead'}</span>
                              <span className="text-xs text-text-muted flex items-center gap-1"><span className="text-[10px]">📍</span> {lead.city || 'Unknown Origin'}</span>
                          </div>
                      </div>
                  </td>
                  <td className="px-4 py-4">
                      <div className="flex items-center">
                          <span className="text-xs font-bold text-brand-300 bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/20">{details.grade}</span>
                      </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                          <span className="text-xs font-bold text-text-secondary flex items-center gap-2 bg-app px-3 py-1.5 rounded-lg border border-border-card shadow-sm">
                              {details.pax?.toLowerCase().includes('group') || details.pax?.toLowerCase().includes('keluarga') ? '👥' : '👤'} 
                              {details.pax}
                          </span>
                      </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center">
                            <span className={`text-sm font-black ${lead.lead_score >= 80 ? 'text-emerald-400' : lead.lead_score >= 50 ? 'text-amber-400' : 'text-text-muted'}`}>
                                {lead.lead_score || 0}%
                            </span>
                      </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                              lead.status === 'new' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 
                              lead.status === 'contacted' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 
                              lead.status === 'processed' || lead.status === 'prospect' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                              lead.status === 'booked' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                              lead.status === 'dp' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                              lead.status === 'closing' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 
                              lead.status === 'lost' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
                              'bg-slate-500/10 border-slate-500/30 text-slate-400'
                          }`}>
                              {lead.status || 'UNKNOWN'}
                          </span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs text-text-secondary font-semibold tabular-nums">
                              {formattedDate !== 'Invalid Date' ? formattedDate : '-'}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isClosing ? 'text-emerald-500' : 'text-slate-500'}`}>
                              {isClosing ? 'Finalized' : 'Acquired'}
                          </span>
                      </div>
                  </td>
                  </tr>
              );
            })}
          </tbody>
        </table>
        {leads.length === 0 && (
            <div className="w-full p-12 text-center text-text-muted text-sm font-medium">
                No intelligences match your target query.
            </div>
        )}
      </div>

      {selectedLeadId && (
        <LeadDetailModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}
    </div>
  );
}
