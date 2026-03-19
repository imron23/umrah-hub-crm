"use client";

import React, { useEffect, useState, useMemo } from 'react';
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
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Bar, Doughnut, PolarArea, Line } from 'react-chartjs-2';
import AIAuditAgent from '@/components/analytics/AIAuditAgent';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsDashboard() {
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [leadsRes, agentsRes] = await Promise.all([
                fetch('http://localhost:8081/api/v1/public/leads_demo'),
                fetch('http://localhost:8081/api/v1/public/agents')
            ]);
            
            if (!leadsRes.ok || !agentsRes.ok) throw new Error("Network Response Fail");
            
            const leadsData = await leadsRes.json();
            const agentsData = await agentsRes.json();
            
            setAllLeads(leadsData.leads || []);
            setAgents(agentsData.agents || []);
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
        const leadSource = lead.utm_logs?.[0]?.utm_source?.toLowerCase() || '';
        
        let sourceMatch = sourceFilter === 'all';
        if (sourceFilter === 'organic') {
            sourceMatch = ['direct', 'referral', 'email_marketing', ''].includes(leadSource);
        } else if (sourceFilter !== 'all') {
            sourceMatch = leadSource === sourceFilter;
        }
        
        let agentMatch = agentFilter === 'all';
        if (agentFilter !== 'all') {
            const activeAssignment = lead.assignments?.find((a: any) => a.ownership_status === 'active');
            agentMatch = activeAssignment?.agent_id === agentFilter;
        }

        return sourceMatch && agentMatch;
    });
  }, [allLeads, sourceFilter, agentFilter]);

  const stats = useMemo(() => {
    if (loading) return null;

    const cityStats = filteredLeads.reduce((acc: any, lead: any) => {
        const city = lead.city || 'Other';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
    }, {});
    const sortedCities = Object.entries(cityStats).sort((a: any, b: any) => b[1] - a[1]).slice(0, 6);

    const statusLabels = ['new', 'contacted', 'prospect', 'closing', 'lost'];
    const statusStats = filteredLeads.reduce((acc: any, lead: any) => {
        const s = lead.status?.toLowerCase() || 'unknown';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const pkgStats = filteredLeads.reduce((acc: any, lead: any) => {
        const pkgName = lead.package_id ? 'Targeted' : 'General';
        acc[pkgName] = (acc[pkgName] || 0) + 1;
        return acc;
    }, {});

    const sentimentStats = {
        hot: filteredLeads.filter(l => (l.lead_score || 0) >= 80).length,
        warm: filteredLeads.filter(l => (l.lead_score || 0) >= 50 && (l.lead_score || 0) < 80).length,
        cold: filteredLeads.filter(l => (l.lead_score || 0) < 50).length,
    };

    const hourlyStats = filteredLeads.reduce((acc: any, lead: any) => {
        const dateRaw = lead.created_at || new Date().toISOString();
        const hour = new Date(dateRaw).getHours();
        if (!isNaN(hour)) {
            acc[hour] = (acc[hour] || 0) + 1;
        }
        return acc;
    }, {});
    const hoursData = Array.from({length: 24}, (_, i) => hourlyStats[i] || 0);

    const agentWorkload = agents.reduce((acc: any, agent: any) => {
        const count = filteredLeads.filter(l => 
            l.assignments?.some((a: any) => a.agent_id === agent.id && a.ownership_status === 'active')
        ).length;
        acc[agent.email?.split('@')[0] || agent.id.slice(0, 4)] = count;
        return acc;
    }, {});

    // Separate Revenue Streams: Umrah/Pesantren (IDR) vs Haji (USD)
    const revenuePotentialIDR = filteredLeads.filter(l => (l.status !== 'closing' && l.status !== 'dp') && !l.message?.toLowerCase().includes('haji')).reduce((acc, l) => acc + (l.lead_score || 0) * 150000, 0); 
    const revenuePotentialUSD = filteredLeads.filter(l => (l.status !== 'closing' && l.status !== 'dp') && l.message?.toLowerCase().includes('haji')).reduce((acc, l) => acc + (l.lead_score || 0) * 150, 0); 

    const collectedRevenueIDR = filteredLeads.filter(l => (l.status === 'closing' || l.status === 'dp') && !l.message?.toLowerCase().includes('haji')).reduce((acc, l) => acc + (l.status === 'dp' ? 5000000 : 15000000), 0);
    const collectedRevenueUSD = filteredLeads.filter(l => (l.status === 'closing' || l.status === 'dp') && l.message?.toLowerCase().includes('haji')).reduce((acc, l) => acc + (l.status === 'dp' ? 5000 : 15000), 0);

    const funnelData = [
        { label: 'Market Reach', value: Math.max(filteredLeads.length * 4, 10), color: 'rgba(99,102,241,0.1)' },
        { label: 'Leads Captured', value: filteredLeads.length, color: 'rgba(99,102,241,0.3)' },
        { label: 'Qualified (SQL)', value: filteredLeads.filter(l => (l.lead_score || 0) > 60).length, color: 'rgba(99,102,241,0.5)' },
        { label: 'Negotiation', value: filteredLeads.filter(l => l.status === 'prospect').length, color: 'rgba(99,102,241,0.7)' },
        { label: 'Down Payment (DP)', value: filteredLeads.filter(l => l.status === 'dp').length, color: 'rgba(245, 158, 11, 0.8)' },
        { label: 'Closed (Full)', value: filteredLeads.filter(l => l.status === 'closing').length, color: 'rgba(16, 185, 129, 0.9)' },
    ];

    return { 
        sortedCities, statusLabels, statusStats, pkgStats, sentimentStats, hoursData, agentWorkload, 
        revenuePotentialIDR, revenuePotentialUSD, collectedRevenueIDR, collectedRevenueUSD, funnelData 
    };
  }, [filteredLeads, agents, loading]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: { 
        position: 'bottom' as const, 
        labels: { 
          color: '#94a3b8', 
          font: { size: 10, weight: 'bold' as any }, 
          usePointStyle: true,
          boxWidth: 6
        } 
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#64748b', font: { size: 10 } } }
    }
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
    <div className="space-y-10 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
        <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                Audience <span className="text-brand-500">DNA</span>
            </h1>
            <p className="text-slate-500 text-sm mt-3 font-medium">Behavorial mapping and geographic analysis of the current lead manifest.</p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
            <AIAuditAgent />
            <div className="flex bg-white/[0.03] border border-white/10 rounded-[2rem] p-1 luxury-glass overflow-x-auto no-scrollbar">
                {sources.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setSourceFilter(s.id)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            sourceFilter === s.id 
                            ? 'bg-brand-solid text-white shadow-xl shadow-brand-glow/30' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        <span className="text-sm">{s.icon}</span>
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {loading || !stats ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 luxury-glass rounded-[3rem]">
            <div className="w-16 h-16 border-4 border-brand-500/10 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Deciphering Gene-Pool...</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 h-[450px]">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-10 italic">Geographic Footprint</h3>
                    <div className="h-[300px]">
                        <Bar 
                            options={chartOptions}
                            data={{
                                labels: stats.sortedCities.map(c => c[0]),
                                datasets: [{
                                    label: 'Density',
                                    data: stats.sortedCities.map(c => c[1]),
                                    backgroundColor: [
                                        'rgba(99, 102, 241, 0.8)',
                                        'rgba(16, 185, 129, 0.8)',
                                        'rgba(245, 158, 11, 0.8)',
                                        'rgba(239, 68, 68, 0.8)',
                                        'rgba(139, 92, 246, 0.8)',
                                        'rgba(236, 72, 153, 0.8)',
                                    ],
                                    borderRadius: 12,
                                }]
                            }}
                        />
                    </div>
                </div>

                <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 h-[450px] flex flex-col">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-10 italic text-center">Intent Distribution</h3>
                    <div className="flex-1">
                        <PolarArea 
                            options={{
                                ...chartOptions,
                                scales: { r: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { display: false } } }
                            }}
                            data={{
                                labels: ['Hot', 'Warm', 'Cold'],
                                datasets: [{
                                    data: [stats.sentimentStats.hot, stats.sentimentStats.warm, stats.sentimentStats.cold],
                                    backgroundColor: ['rgba(239,68,68,0.6)', 'rgba(245,158,11,0.6)', 'rgba(59,130,246,0.6)'],
                                    borderWidth: 0
                                }]
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-2 p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 h-[400px]">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-8 italic">Lifecycle Status</h3>
                    <div className="h-[280px]">
                        <Bar 
                            options={{...chartOptions, indexAxis: 'y' as const}}
                            data={{
                                labels: ['New', 'Contacted', 'Prospect', 'Closing', 'Lost'],
                                datasets: [{
                                    label: 'Volume',
                                    data: stats.statusLabels.map(l => stats.statusStats[l] || 0),
                                    backgroundColor: [
                                        'rgba(99, 102, 241, 0.5)',
                                        'rgba(34, 197, 94, 0.5)',
                                        'rgba(234, 179, 8, 0.5)',
                                        'rgba(249, 115, 22, 0.5)',
                                        'rgba(239, 68, 68, 0.5)',
                                    ],
                                    borderRadius: 10,
                                }]
                            }}
                        />
                    </div>
                </div>

                <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 h-[400px] flex flex-col items-center">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-8 italic">Inquiry Focus</h3>
                    <div className="flex-1 w-full relative">
                        <Doughnut 
                            options={{...chartOptions, cutout: '80%', plugins: { ...chartOptions.plugins, legend: { display: false } }}}
                            data={{
                                labels: Object.keys(stats.pkgStats),
                                datasets: [{
                                    data: Object.values(stats.pkgStats),
                                    backgroundColor: ['#6366f1', '#10b981'],
                                    borderWidth: 0
                                }]
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-white">{filteredLeads.length}</span>
                        </div>
                    </div>
                </div>

                <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 h-[400px]">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-8 italic">Peak Surge (24h)</h3>
                    <div className="h-[240px]">
                        <Line 
                            options={{...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } }, elements: { point: { radius: 4, backgroundColor: '#10b981' } } }}
                            data={{
                                labels: Array.from({length: 12}, (_, i) => (i * 2).toString().padStart(2, '0')),
                                datasets: [{
                                    data: stats.hoursData.filter((_, i) => i % 2 === 0),
                                    borderColor: '#10b981',
                                    borderWidth: 3,
                                    fill: true,
                                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                    tension: 0.4
                                }]
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 flex flex-col gap-4">
                    {/* IDR METRICS */}
                    <div className="p-8 rounded-[2.5rem] bg-brand-500/10 border border-brand-500/20 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[8px] font-black text-brand-400 uppercase tracking-widest">IDR Pipeline</span>
                                <h4 className="text-2xl font-black text-white italic">Rp{(stats.revenuePotentialIDR / 1000000).toFixed(1)}M</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">IDR Cash</span>
                                <h4 className="text-2xl font-black text-white italic">Rp{(stats.collectedRevenueIDR / 1000000).toFixed(1)}M</h4>
                            </div>
                        </div>
                    </div>
                    
                    {/* USD METRICS */}
                    <div className="p-8 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">USD Pipeline</span>
                                <h4 className="text-2xl font-black text-white italic">${(stats.revenuePotentialUSD / 1000).toFixed(1)}K</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">USD Cash</span>
                                <h4 className="text-2xl font-black text-white italic">${(stats.collectedRevenueUSD / 1000).toFixed(1)}K</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 p-10 rounded-[3rem] bg-white/[0.01] border border-white/5 relative overflow-hidden group border-dashed hover:border-brand-500/30 transition-all">
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">Conversion Funnel Efficiency</h3>
                        <div className="text-right">
                            <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest">Global Win Rate</span>
                            <p className="text-lg font-black text-white italic">
                                {((stats.statusStats['closing'] || 0) / (filteredLeads.length || 1) * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 relative z-10">
                        {stats.funnelData.map((f, i) => (
                            <div key={i} className="flex items-center gap-4 group/funnel">
                                <div className="w-32 text-right">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter group-hover/funnel:text-slate-400 transition-colors">{f.label}</span>
                                </div>
                                <div className="flex-1 h-8 bg-white/[0.02] rounded-xl overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full transition-all duration-1000 ease-out"
                                        style={{ 
                                            width: `${(f.value / stats.funnelData[0].value) * 100}%`,
                                            backgroundColor: f.color
                                        }}
                                    />
                                </div>
                                <div className="w-16">
                                    <span className="text-sm font-black text-white italic">{f.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-10 rounded-[3rem] bg-brand-500/[0.03] border border-brand-500/10">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-[11px] font-black text-brand-400 uppercase tracking-[0.3em] mb-2">Productivity Hub</h3>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Agent Performance Matrix</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Agents</span>
                        <p className="text-2xl font-black text-white">{agents.length}</p>
                    </div>
                </div>
                
                <div className="h-[300px]">
                    <Bar 
                        options={chartOptions}
                        data={{
                            labels: Object.keys(stats.agentWorkload),
                            datasets: [{
                                label: 'Assigned Leads',
                                data: Object.values(stats.agentWorkload),
                                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                                borderRadius: 8,
                                barThickness: 40
                            }]
                        }}
                    />
                </div>
            </div>
        </>
      )}
    </div>
  );
}
