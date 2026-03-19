"use client";

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
} from 'chart.js';
import dynamic from 'next/dynamic';
import { Line, Bar } from 'react-chartjs-2';
import LeadsTable from "@/components/leads/LeadsTable";
import HijriObserverModal from "@/components/dashboard/HijriObserverModal";
import PerformanceMetaBar from "@/components/dashboard/PerformanceMetaBar";
import FinancialPulse from "@/components/dashboard/FinancialPulse";
import CampaignEngine from "@/components/dashboard/CampaignEngine";
import GrowthMatrix from "@/components/dashboard/GrowthMatrix";

const IndonesiaHeatmap = dynamic(() => import("@/components/analytics/IndonesiaHeatmap"), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-white/5 animate-pulse rounded-[2.5rem] flex items-center justify-center text-[10px] text-slate-500 font-black uppercase tracking-widest italic leading-none">Initializing Spatial Matrix...</div>
});

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

import { useLanguage } from '@/context/LanguageContext';

export default function Dashboard() {
  const { lang, setLang, t } = useLanguage();
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);

  // Real-time Intelligence States
  const [fxRange, setFxRange] = useState('1M');
  const [usdHistory, setUsdHistory] = useState<{labels: string[], data: number[]}>({labels: [], data: []});
  const [sarHistory, setSarHistory] = useState<{labels: string[], data: number[]}>({labels: [], data: []});
  const [hoveredData, setHoveredData] = useState<{sar: number | null, usd: number | null, date: string | null}>({sar: null, usd: null, date: null});

  // Real-time Intelligence States (Feeding from Official APIs)
  const [news, setNews] = useState<any[]>([]);
  const [fxRates, setFxRates] = useState({ sar: 4215, usd: 15960 });
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any[]>([
    { name: 'MAKKAH', temp: '--', icon: '☀️' },
    { name: 'MADINAH', temp: '--', icon: '☀️' },
    { name: 'TAIF', temp: '--', icon: '⛅' },
    { name: 'AL ULA', temp: '--', icon: '☀️' },
    { name: 'BOGOR', temp: '--', icon: '⛅' },
    { name: 'JAKARTA', temp: '--', icon: '☀️' },
    { name: 'PURWOKERTO', temp: '--', icon: '⛅' },
  ]);

  useEffect(() => {
    setLoading(true);
    // 1. CRM Data
    Promise.all([
      fetch('http://localhost:8081/api/v1/public/leads_demo').then(r => r.json()),
      fetch('http://localhost:8081/api/v1/public/agents').then(r => r.json())
    ]).then(([leadsData, agentsData]) => {
      setLeads(leadsData.leads || []);
      setAgents(agentsData.agents || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    // 2. Intelligence: Weather (Open-Meteo)
    const citiesCoords = [
      { name: 'MAKKAH', lat: 21.38, lon: 39.85 },
      { name: 'MADINAH', lat: 24.46, lon: 39.60 },
      { name: 'TAIF', lat: 21.28, lon: 40.42 },
      { name: 'AL ULA', lat: 26.60, lon: 37.91 },
      { name: 'BOGOR', lat: -6.59, lon: 106.79 },
      { name: 'JAKARTA', lat: -6.20, lon: 106.84 },
      { name: 'PURWOKERTO', lat: -7.42, lon: 109.23 }
    ];

    const fetchWeather = async () => {
      const results = await Promise.all(citiesCoords.map(async (c) => {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current_weather=true`);
          const data = await res.json();
          return { name: c.name, temp: Math.round(data.current_weather.temperature), icon: data.current_weather.temperature > 30 ? '☀️' : '⛅' };
        } catch { return { name: c.name, temp: '--', icon: '☀️' }; }
      }));
      setWeatherData(results);
    };
    fetchWeather();

    // 3. Intelligence: News (RSS via Proxy)
    fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.arabnews.com/rss.xml')
      .then(r => r.json())
      .then(data => {
        const hfNews = data.items.slice(0, 5).map((n: any) => ({ title: n.title, link: n.link }));
        setNews(hfNews.length > 0 ? hfNews : [
          { title: "LIVE SIGNAL: Monitoring Global Umrah Market Liquidity...", link: "#" }
        ]);
      });

    // 4. Intelligence: FX Matrix
    fetch('https://api.exchangerate-api.com/v4/latest/SAR')
      .then(r => r.json())
      .then(data => {
        setFxRates(prev => ({ ...prev, sar: Math.round(data.rates.IDR) }));
      });
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(data => {
        setFxRates(prev => ({ ...prev, usd: Math.round(data.rates.IDR) }));
      });

    // 5. Intelligence: Prayer Makkah
    fetch('https://api.aladhan.com/v1/timingsByCity?city=Makkah&country=Saudi+Arabia&method=4')
      .then(r => r.json())
      .then(data => setPrayerTimes(data.data.timings));

  }, []);

  // 6. Intelligence: Historical FX (Crypto Style)
  useEffect(() => {
     const end = new Date();
     let start = new Date();
     if (fxRange === '7D') start.setDate(end.getDate() - 7);
     else if (fxRange === '1M') start.setDate(end.getDate() - 30);
     else if (fxRange === '3M') start.setDate(end.getDate() - 90);
     else if (fxRange === '1Y') start.setFullYear(end.getFullYear() - 1);
     else start.setDate(end.getDate() - 1); // 1D

     const startStr = start.toISOString().split('T')[0];
     fetch(`https://api.frankfurter.app/${startStr}..?from=USD&to=IDR`)
       .then(r => r.json())
       .then(data => {
           const labels = Object.keys(data.rates);
           const values = Object.values(data.rates).map((v: any) => v.IDR);
           setUsdHistory({ labels, data: values });
           
           // SAR PEG CALCULATION (Real Market Logic: 3.75 SAR = 1 USD)
           const sarValues = values.map((v: number) => Math.round(v / 3.75));
           setSarHistory({ labels, data: sarValues });
       });
  }, [fxRange]);

  const downloadBrochure = () => {
    const brochureHTML = `
      <html>
        <body style="font-family: sans-serif; padding: 40px; color: #1e293b;">
          <h1 style="color: #6366f1;">Pesantren Bogor 15jt All-in</h1>
          <p>Strategi Akusisi Santri Baru - E2E Solution</p>
          <hr/>
          <h3>Keunggulan:</h3>
          <ul>
            <li>Harga Flat 15jt Tanpa Biaya Tersembunyi</li>
            <li>Lokasi Sejuk & Sunnah Compliant</li>
            <li>Fasilitas Premium (Makan 3x, Laundry, Asuransi)</li>
          </ul>
          <p>Dijana oleh Umrah Hub Intelligence Engine</p>
        </body>
      </html>
    `;
    const blob = new Blob([brochureHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Brosur_Strategis_Bogor_15jt.html';
    a.click();
  };

  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const launchCampaign = () => {
    setCampaignStatus("Initializing Meta Pixel...");
    setTimeout(() => setCampaignStatus("Uploading 10.9% Win Rate Model..."), 1500);
    setTimeout(() => {
        setCampaignStatus("CAMPAIGN LIVE: Bogor 15jt All-in Engine Active");
        setTimeout(() => setCampaignStatus(null), 5000);
    }, 3500);
  };

  const totalLeads = leads.length;
  const highIntent = leads.filter(l => (l.lead_score || 0) >= 75).length;
  
  // High-level Revenue simulation for Director
  const collectedIDR = leads.filter(l => (l.status === 'closing' || l.status === 'dp') && !l.message?.toLowerCase().includes('haji')).reduce((acc, l) => acc + (l.status === 'dp' ? 5000000 : 15000000), 0);
  const collectedUSD = leads.filter(l => (l.status === 'closing' || l.status === 'dp') && l.message?.toLowerCase().includes('haji')).reduce((acc, l) => acc + (l.status === 'dp' ? 5000 : 15000), 0);
  
  const closingRate = totalLeads > 0 ? ((leads.filter(l => l.status === 'closing').length / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-20 animate-in fade-in duration-700 p-4 lg:p-8">
      
      {/* SACRED PERFORMANCE META-BAR */}
      <PerformanceMetaBar 
        activeDetail={activeDetail} 
        setActiveDetail={setActiveDetail} 
        weatherData={weatherData} 
      />

      {/* GLOBAL MARKET TICKER: LIVE SIGNAL MONITORING */}
      <div className="mb-12 overflow-hidden bg-brand-500/5 border-y border-white/5 py-4 backdrop-blur-sm relative rounded-3xl group cursor-pointer hover:bg-brand-500/10 transition-all">
          <div className="flex animate-marquee whitespace-nowrap min-w-full">
              {(news.length > 0 ? [...news, ...news] : []).map((item: any, idx: number) => (
                  <a 
                    key={idx} 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-black text-brand-400 uppercase italic flex items-center gap-4 px-12 hover:text-white transition-colors border-x border-white/5"
                  >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      {item.title}
                  </a>
              ))}
              {news.length === 0 && (
                  <span className="text-[10px] font-black text-slate-500 uppercase italic flex items-center gap-3 px-12 pr-48">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                      {lang === 'id' ? 'Menghubungkan ke Sinyal Pasar Tanah Suci...' : 'Connecting to Holy Land Market Signals...'}
                  </span>
              )}
          </div>
      </div>

      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
        <div>
           <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-[10px] font-black text-brand-400 uppercase tracking-widest">{lang === 'id' ? 'Visi Utama Aktif' : 'Master Vision Active'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           </div>
           <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Decision <span className="text-brand-500 underline decoration-brand-500/30 underline-offset-8">Control</span> HQ</h1>
           <p className="text-sm text-slate-500 mt-4 font-medium max-w-xl">{t.sub}</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right mr-4 hidden lg:block">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Win Rate</span>
              <p className="text-2xl font-black text-white italic">{closingRate}%</p>
           </div>
           <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-[11px] font-black text-white uppercase tracking-widest transition-all">Strategic PDF</button>
           <button className="px-8 py-4 bg-brand-500 hover:scale-105 active:scale-95 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_15px_30px_rgba(99,102,241,0.2)]">Launch Campaign</button>
        </div>
      </div>

      {/* CORE FINANCIAL PULSE - The Director's Top Priority */}
      <FinancialPulse 
        collectedIDR={collectedIDR} 
        collectedUSD={collectedUSD} 
        highIntent={highIntent} 
      />

      {/* STRATEGIC CAMPAIGN ENGINE: BOGOR 15JT ALL-IN */}
      <CampaignEngine 
        t={t} 
        campaignStatus={campaignStatus} 
        downloadBrochure={downloadBrochure} 
        launchCampaign={launchCampaign} 
      />

      {/* STRATEGIC GROWTH MATRIX */}
      <GrowthMatrix 
        leads={leads} 
        agents={agents} 
        t={t} 
        lang={lang} 
      />

      {/* GEOGRAPHICAL INTELLIGENCE MATRIX */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
           <div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] leading-none italic mb-1">Geographical Intelligence Matrix</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Real-time Acquisition Density</p>
           </div>
        </div>
        <div className="h-[500px] w-full bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
            <IndonesiaHeatmap leads={leads} />
        </div>
      </div>

      {/* RECENT STRATEGIC ACTIVITY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* FRESH ACQUISITION */}
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] leading-none italic">{t.impact}</h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase italic">{lang === 'id' ? 'Akuisisi Baru (Top 5)' : 'Fresh Acquisition (Top 5)'}</span>
            </div>
            <div className="rounded-[3rem] bg-white/[0.01] border border-white/5 overflow-hidden shadow-2xl transition-all hover:border-blue-500/20">
                <LeadsTable leadsData={leads.filter(l => l.status === 'new').slice(0, 5)} loading={loading} />
            </div>
        </div>

        {/* CONVERSION VELOCITY */}
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
                <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] leading-none italic">{t.velocity}</h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase italic">{lang === 'id' ? 'Transisi Strategis (Top 5)' : 'Strategic Transitions (Top 5)'}</span>
            </div>
            <div className="rounded-[3rem] bg-white/[0.01] border border-white/5 overflow-hidden shadow-2xl transition-all hover:border-emerald-500/20">
                <LeadsTable leadsData={leads.filter(l => l.status !== 'new').slice(0, 5)} loading={loading} />
            </div>
        </div>
      </div>

      {/* STRATEGIC INTELLIGENCE DRILL-DOWN OVERLAYS */}
      {activeDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300 backdrop-blur-sm">
           <div className="absolute inset-0 bg-black/60" onClick={() => setActiveDetail(null)} />
           
           <div className="relative w-full max-w-5xl">
              <HijriObserverModal 
                isOpen={activeDetail === 'calendar'} 
                onClose={() => setActiveDetail(null)} 
              />

              {activeDetail === 'prayer' && (
                  <div className="p-10 rounded-[3.5rem] bg-[#0a0f0d] border border-emerald-500/20 shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
                      <div className="flex justify-between items-center mb-10">
                          <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">🕋 Holy Land Prayer Matrix</h3>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest italic">Makkah Al-Mukarramah • Real-time Spiritual Sync</p>
                          </div>
                          <button onClick={() => setActiveDetail(null)} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all text-2xl">✕</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p, i) => (
                            <div key={p} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center ${p === 'Dhuhr' ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_20px_40px_rgba(16,185,129,0.1)] scale-105' : 'bg-white/[0.03] border-white/5 hover:border-emerald-500/30'}`}>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">{p}</p>
                                <p className={`text-4xl font-black italic ${p === 'Dhuhr' ? 'text-emerald-400' : 'text-white'}`}>
                                    {['04:52', '12:24', '15:48', '18:36', '20:06'][i]}
                                </p>
                                {p === 'Dhuhr' && (
                                  <div className="mt-4 flex flex-col items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mb-2" />
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Next Prayer</span>
                                  </div>
                                )}
                            </div>
                          ))}
                      </div>
                  </div>
              )}

              {activeDetail === 'fx' && (
                  <div className="p-10 rounded-[4rem] bg-[#0c0c0e] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
                      <div className="flex justify-between items-center mb-10">
                          <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">📊 Global Financial HQ</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase italic tracking-widest">Real-time Currency Intelligence Matrix • Institutional Grade</p>
                          </div>
                          
                          {/* DATE RANGE SELECTOR - CRYPTO STYLE */}
                          <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                              {['1D', '7D', '1M', '3M', '1Y'].map(range => (
                                  <button 
                                      key={range}
                                      onClick={() => setFxRange(range)}
                                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${fxRange === range ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                  >
                                      {range}
                                  </button>
                              ))}
                          </div>

                          <button onClick={() => setActiveDetail(null)} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all text-2xl">✕</button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          {/* SAR CHART (PEGGED TIME SERIES) */}
                          <div className="linear-card group bg-black/40 p-10 rounded-[3rem] border border-white/5 hover:border-red-500/20 transition-all">
                              <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">SAR / IDR Benchmarks • {fxRange} Series</p>
                                    <div className="flex flex-col">
                                        <h4 className="text-4xl font-black text-white italic">
                                            Rp {fxRates.sar.toLocaleString()} 
                                            <span className="text-red-400 text-[10px] border border-red-400/30 px-2 py-0.5 rounded-full ml-2 uppercase">Official Peg 3.75</span>
                                        </h4>
                                        {/* COMPARISON FIGURE (ONLY ON HOVER) */}
                                        <div className={`mt-2 h-6 transition-all duration-300 ${hoveredData.date ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400/50" />
                                                Historical ({hoveredData.date ? new Date(hoveredData.date).toLocaleDateString() : ''}): 
                                                <span className="text-white">Rp {hoveredData.sar?.toLocaleString()}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-14 h-14 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center justify-center text-3xl animate-pulse">📉</div>
                              </div>
                              <div className="h-64 w-full">
                                  <Line 
                                    data={{
                                        labels: sarHistory.labels,
                                        datasets: [{
                                            label: 'SAR/IDR',
                                            data: sarHistory.data,
                                            borderColor: '#f87171',
                                            borderWidth: 3,
                                            tension: 0.4,
                                            pointRadius: 0,
                                            fill: true,
                                            backgroundColor: (context) => {
                                                const ctx = context.chart.ctx;
                                                const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                                                gradient.addColorStop(0, 'rgba(248, 113, 113, 0.2)');
                                                gradient.addColorStop(1, 'rgba(248, 113, 113, 0)');
                                                return gradient;
                                            },
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        interaction: { intersect: false, mode: 'index' },
                                        onHover: (event, elements) => {
                                            if (elements && elements.length > 0) {
                                                const idx = elements[0].index;
                                                setHoveredData({
                                                    sar: sarHistory.data[idx],
                                                    usd: usdHistory.data[idx],
                                                    date: sarHistory.labels[idx]
                                                });
                                            } else {
                                                setHoveredData({ sar: null, usd: null, date: null });
                                            }
                                        },
                                        plugins: { 
                                            legend: { display: false },
                                            tooltip: { enabled: false }
                                        },
                                        scales: { 
                                            x: { 
                                                display: true,
                                                grid: { display: true, color: 'rgba(255,255,255,0.03)' },
                                                ticks: { display: false }
                                            }, 
                                            y: { 
                                                display: true,
                                                grid: { display: true, color: 'rgba(255,255,255,0.03)' },
                                                ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 9, weight: 'bold' } }
                                            } 
                                        }
                                    }}
                                  />
                              </div>
                          </div>
                          
                          {/* USD CHART (REAL-TIME TIME SERIES) */}
                          <div className="linear-card group bg-black/40 p-10 rounded-[3rem] border border-white/5 hover:border-emerald-500/20 transition-all">
                              <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">USD / IDR Liquidity • {fxRange} Series</p>
                                    <div className="flex flex-col">
                                        <h4 className="text-4xl font-black text-white italic">
                                            Rp {fxRates.usd.toLocaleString()} 
                                            <span className="text-emerald-400 text-[10px] border border-emerald-400/30 px-2 py-0.5 rounded-full ml-2 uppercase">Market Live</span>
                                        </h4>
                                        {/* COMPARISON FIGURE (ONLY ON HOVER) */}
                                        <div className={`mt-2 h-6 transition-all duration-300 ${hoveredData.date ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                                                Historical ({hoveredData.date ? new Date(hoveredData.date).toLocaleDateString() : ''}): 
                                                <span className="text-white">Rp {hoveredData.usd?.toLocaleString()}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-14 h-14 bg-emerald-400/10 border border-emerald-400/20 rounded-2xl flex items-center justify-center text-3xl">💹</div>
                              </div>
                              <div className="h-64 w-full">
                                  <Line 
                                    data={{
                                        labels: usdHistory.labels,
                                        datasets: [{
                                            label: 'USD/IDR',
                                            data: usdHistory.data,
                                            borderColor: '#10b981',
                                            borderWidth: 3,
                                            tension: 0.4,
                                            pointRadius: 0,
                                            fill: true,
                                            backgroundColor: (context) => {
                                                const ctx = context.chart.ctx;
                                                const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                                                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                                                gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                                                return gradient;
                                            },
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        interaction: { intersect: false, mode: 'index' },
                                        onHover: (event, elements) => {
                                            if (elements && elements.length > 0) {
                                                const idx = elements[0].index;
                                                setHoveredData({
                                                    sar: sarHistory.data[idx],
                                                    usd: usdHistory.data[idx],
                                                    date: sarHistory.labels[idx]
                                                });
                                            } else {
                                                setHoveredData({ sar: null, usd: null, date: null });
                                            }
                                        },
                                        plugins: { 
                                            legend: { display: false },
                                            tooltip: { enabled: false }
                                        },
                                        scales: { 
                                            x: { 
                                                display: true,
                                                grid: { display: true, color: 'rgba(255,255,255,0.03)' },
                                                ticks: { display: false }
                                            }, 
                                            y: { 
                                                display: true,
                                                grid: { display: true, color: 'rgba(255,255,255,0.05)' },
                                                ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 9, weight: 'bold' } }
                                            } 
                                        }
                                    }}
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
