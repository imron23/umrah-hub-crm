"use client";

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import AIAuditAgent from '@/components/analytics/AIAuditAgent';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function MarketingDashboard() {
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedSource, setSelectedSource] = useState<any | null>(null);

  useEffect(() => {
    fetch('http://localhost:8081/api/v1/public/leads_demo')
      .then(res => res.json())
      .then(data => {
        setAllLeads(data.leads || []);
        setLoading(false);
      });
  }, []);

  const filteredLeads = allLeads.filter(lead => {
    if (sourceFilter === 'all') return true;
    const leadSource = lead.utm_logs?.[0]?.utm_source?.toLowerCase();
    
    if (sourceFilter === 'organic') return leadSource === 'direct' || leadSource === 'referral' || !leadSource;
    return leadSource === sourceFilter;
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 12,
        cornerRadius: 8,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(128,128,128,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } }
    }
  };

  const lpStats = filteredLeads.reduce((acc: any, lead: any) => {
    const lp = lead.utm_logs?.[0]?.utm_content || 'lp_unknown';
    if (!acc[lp]) acc[lp] = { name: lp, leads: 0, highIntent: 0, booked: 0 };
    acc[lp].leads++;
    if (lead.lead_score > 70) acc[lp].highIntent++;
    if (lead.status === 'booked') acc[lp].booked++;
    return acc;
  }, {});

  const lpLabels = Object.keys(lpStats).sort((a, b) => lpStats[b].leads - lpStats[a].leads);
  const lpLeadsData = lpLabels.map(l => lpStats[l].leads);
  const lpHIUnits = lpLabels.map(l => lpStats[l].highIntent);

  const totalLeads = filteredLeads.length;
  const totalHighIntent = filteredLeads.filter(l => l.lead_score > 70).length;
  const qualityIndex = totalLeads > 0 ? Math.round((totalHighIntent / totalLeads) * 100) : 0;

  const sources = [
    { id: 'all', label: 'All Sources', icon: '🌍' },
    { id: 'fb_ads', label: 'FB Ads', icon: '📱' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
    { id: 'google_search', label: 'Google Search', icon: '🔍' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'organic', label: 'Organic/Direct', icon: '🌐' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 animate-in fade-in duration-300 pb-20">
      
      {/* HEADER SECTION - LINEAR STYLE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-main)] pb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Campaign Intelligence</h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1">Audit landing page conversion efficiency and channel quality scores.</p>
        </div>
        
        <div className="flex flex-wrap gap-1.5 p-1 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg">
            {sources.map(s => (
                <button
                    key={s.id}
                    onClick={() => setSourceFilter(s.id)}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-2 ${
                        sourceFilter === s.id ? 'bg-[var(--brand-solid)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                >
                    <span className="text-xs">{s.icon}</span>
                    {s.label}
                </button>
            ))}
        </div>
      </div>

      <div className="flex justify-end gap-4">
          <AIAuditAgent />
          <div className="linear-button">
              <span className="text-[11px] font-semibold text-[var(--text-primary)] mr-2">{totalLeads}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Total Leads</span>
          </div>
          <div className="linear-button">
              <span className="text-[11px] font-semibold text-emerald-600 mr-2">${sourceFilter === 'all' ? '42.50' : '38.20'}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase">CAC Est.</span>
          </div>
      </div>

      {/* MARKETING METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Lead Quality Index" value={`${qualityIndex}%`} sub={`Avg. intent for ${sourceFilter}`} trend={qualityIndex > 50 ? "+4.2%" : "-1.8%"} />
        <MetricCard label="Top Performer" value={(lpLabels[0] || 'N/A').replace('lp_', '').toUpperCase()} sub="Winning Landing Page" />
        <MetricCard label="Channel Efficiency" value={qualityIndex > 60 ? 'OPTIMIZED' : 'NEEDS AUDIT'} sub="Algorithm ROI Score" color={qualityIndex > 60 ? 'text-emerald-500' : 'text-amber-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MarketingChartContainer title="Landing Page Efficiency" sub="Leads Volume vs High Intent Quality">
            <Bar 
                options={chartOptions}
                data={{
                    labels: lpLabels.map(l => l.replace('lp_', '').toUpperCase()),
                    datasets: [
                        { label: 'Total Leads', data: lpLeadsData, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4 },
                        { label: 'High Intent', data: lpHIUnits, backgroundColor: '#6366f1', borderRadius: 4 }
                    ]
                }}
            />
        </MarketingChartContainer>

        <MarketingChartContainer title="Acquisition Cost Trend" sub="Weekly fluctuation of CPA by campaign">
            <Line 
                options={chartOptions}
                data={{
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        data: [45, 38, 52, 42],
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.05)',
                        fill: true,
                        tension: 0.4,
                    }]
                }}
            />
        </MarketingChartContainer>

        {/* 3. CHANNEL PENETRATION - NOW INTERACTIVE */}
        <MarketingChartContainer title="Traffic Source Quality" sub="Click cards to audit deep-link data per channel.">
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-full">
                {['FB Ads', 'Google', 'WhatsApp', 'Organic'].map(src => (
                    <button 
                      key={src} 
                      onClick={() => setSelectedSource({
                        name: src,
                        icon: src === 'FB Ads' ? '📱' : src === 'Google' ? '🔍' : src === 'WhatsApp' ? '💬' : '🌐',
                        quality: Math.floor(Math.random() * 30 + 60),
                        volume: Math.floor(Math.random() * 500 + 100),
                        roi: (Math.random() * 3 + 2).toFixed(1)
                      })}
                      className="flex-1 bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-[var(--brand-solid)] hover:scale-[1.02] transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center justify-center text-lg group-hover:bg-[var(--brand-muted)] transition-colors">
                            {src === 'FB Ads' ? '📱' : src === 'Google' ? '🔍' : src === 'WhatsApp' ? '💬' : '🌐'}
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{src}</span>
                        <span className="text-lg font-bold text-[var(--text-primary)]">{Math.floor(Math.random() * 30 + 60)}%</span>
                        <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Detail →</span>
                    </button>
                ))}
             </div>
        </MarketingChartContainer>

        <MarketingChartContainer title="Campaign ROI Audit" sub="Spend vs Conversion Value Analysis">
             <div className="h-full flex items-center justify-center p-2">
                <div className="w-full space-y-4">
                    <ROIBar campaign="Ramadhan Promo" roi={4.2} color="bg-[var(--brand-solid)]" />
                    <ROIBar campaign="Haji Furoda Early" roi={8.5} color="bg-emerald-500" />
                    <ROIBar campaign="Umrah Turki Plus" roi={3.1} color="bg-amber-500" />
                    <ROIBar campaign="Backpacker Hemat" roi={1.8} color="bg-slate-700" />
                </div>
             </div>
        </MarketingChartContainer>
      </div>

      {/* MODAL POPUP - SOURCE DETAIL */}
      {selectedSource && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSource(null)} />
             <div className="relative w-full max-w-lg bg-[var(--bg-app)] border border-[var(--border-card)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-6 border-b border-[var(--border-main)] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--brand-muted)] border border-[var(--brand-solid)]/20 flex items-center justify-center text-xl">
                            {selectedSource.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{selectedSource.name} Performance</h3>
                            <p className="text-[12px] text-[var(--text-muted)] tracking-tight">Granular data audit for current cycle.</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedSource(null)} className="linear-button w-8 h-8 px-0">✕</button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="linear-card p-4">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Lead Volume</p>
                            <p className="text-xl font-bold text-[var(--text-primary)]">{selectedSource.volume}</p>
                        </div>
                        <div className="linear-card p-4">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Quality Score</p>
                            <p className="text-xl font-bold text-emerald-500">{selectedSource.quality}%</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Key Performance Indicators</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end border-b border-[var(--border-main)] pb-2 text-[13px]">
                                <span className="text-[var(--text-secondary)]">Estimated ROI</span>
                                <span className="text-[var(--text-primary)] font-bold">{selectedSource.roi}x</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-[var(--border-main)] pb-2 text-[13px]">
                                <span className="text-[var(--text-secondary)]">Conversion Path</span>
                                <span className="text-[var(--text-primary)] font-bold">Standard LP Hub</span>
                            </div>
                            <div className="flex justify-between items-end pb-2 text-[13px]">
                                <span className="text-[var(--text-secondary)]">System Status</span>
                                <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="linear-button-primary flex-1">Download Report</button>
                        <button className="linear-button flex-1" onClick={() => setSelectedSource(null)}>Close Audit</button>
                    </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, trend, color = 'text-[var(--text-primary)]' }: any) {
    return (
        <div className="linear-card">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-tight">{label}</span>
                {trend && <span className="text-[11px] font-bold text-emerald-500">{trend}</span>}
            </div>
            <h2 className={`text-2xl font-bold tracking-tight ${color}`}>{value}</h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">{sub}</p>
        </div>
    )
}

function MarketingChartContainer({ children, title, sub }: any) {
    return (
        <div className="linear-card flex flex-col h-[340px]">
            <div className="mb-6">
                <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">{sub}</p>
            </div>
            <div className="flex-1 relative">
                {children}
            </div>
        </div>
    )
}

function ROIBar({ campaign, roi, color }: any) {
    const width = (roi / 10) * 100;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-[var(--text-secondary)]">
                <span>{campaign}</span>
                <span className="text-[var(--text-primary)] font-bold">ROI: {roi}x</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--bg-card-hover)] rounded-full overflow-hidden border border-[var(--border-card)]">
                <div className={`h-full ${color} transition-all duration-1000 rounded-full`} style={{ width: `${width}%` }} />
            </div>
        </div>
    )
}
