"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface LPProps {
  title: string;
  subtitle: string;
  bgImage: string;
  packageId?: string;
  slug: string;
}

export default function LandingPage({ title, subtitle, bgImage, slug }: LPProps) {
  const searchParams = useSearchParams();
  const [pixels, setPixels] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    message: '',
    age: '',
    group_type: 'individual',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';
    try {
      const res = await fetch(`${apiUrl}/public/lps`);
      const data = await res.json();
      const currentLP = data.lps?.find((l: any) => l.slug === slug);
      if (currentLP && currentLP.status === 'inactive') {
        setIsActive(false);
      }

      // Fetch Tracking Pixels
      const pixRes = await fetch(`${apiUrl}/public/pixels`);
      const pixData = await pixRes.json();
      setPixels(pixData.pixels || []);
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!pixels.length) return;

    pixels.forEach(p => {
      if (!p.is_active || !p.pixel_id) return;

      if (p.provider === 'meta_pixel') {
        const script = document.createElement('script');
        script.innerHTML = `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${p.pixel_id}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      }

      if (p.provider === 'gtm') {
        const script = document.createElement('script');
        script.innerHTML = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${p.pixel_id}');
        `;
        document.head.appendChild(script);
      }
    });
  }, [pixels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const utm = {
      source: searchParams.get('utm_source') || 'direct',
      medium: searchParams.get('utm_medium') || 'organic',
      campaign: searchParams.get('utm_campaign') || 'none',
      content: slug, // This tracks which LP the lead came from
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';
      const res = await fetch(`${apiUrl}/public/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          utm,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  if (!isActive) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-8 animate-pulse">💤</div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">Campaign Paused</h1>
        <p className="text-slate-400 max-w-md leading-relaxed">
          This promotion is currently inactive. Please contact our administrator or check back later for the next session.
        </p>
        <a href="/" className="mt-8 text-brand-500 font-bold uppercase tracking-widest text-xs hover:underline">Back to Main Page</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden">
      {/* Hero Section */}
      <div 
        className="relative h-screen flex items-center justify-center p-6"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.4), rgba(2, 6, 23, 0.9)), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-amber-500 font-black tracking-[0.3em] uppercase text-xs mb-4 block">Limited Exclusive Offer</span>
            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter italic uppercase leading-none mb-6">
              {title.split(' ').map((word, i) => (
                <span key={i} className={i % 2 === 0 ? 'text-white' : 'text-white/40'}>{word} </span>
              ))}
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-8 opacity-80">
              {subtitle}
            </p>
            <div className="flex gap-4">
               <div className="px-6 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Starting From</p>
                  <p className="text-xl font-black text-amber-500 italic">Rp 12.5M</p>
               </div>
               <div className="px-6 py-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</p>
                  <p className="text-xl font-black text-white italic">09 Days</p>
               </div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-8 rounded-[40px] shadow-2xl animate-in fade-in slide-in-from-right-2 duration-300 delay-100">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-2xl font-black italic uppercase tracking-tight mb-6">Book Your Seat</h3>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Ahmad Fauzi"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">WhatsApp Number</label>
                  <input 
                    required
                    type="tel" 
                    placeholder="0812..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Your City</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Bogor"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Age (Usia)</label>
                    <input 
                      required
                      type="number" 
                      placeholder="45"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Travel Arrangement</label>
                   <select 
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                     value={formData.group_type}
                     onChange={(e) => setFormData({...formData, group_type: e.target.value})}
                   >
                     <option value="individual" className="bg-slate-900">Pergi Sendiri</option>
                     <option value="couple" className="bg-slate-900">Berdua Pasangan</option>
                     <option value="family" className="bg-slate-900">Sekeluarga (3+ Orang)</option>
                   </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Notes (Optional)</label>
                  <textarea 
                    placeholder="Preferensi hotel atau tanggal keberangkatan..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all h-24"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>
                <button 
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98]"
                >
                  {loading ? 'Processing...' : 'Secure My Spot Now'}
                </button>
                <p className="text-[10px] text-center text-slate-500 uppercase tracking-tighter opacity-60">
                   Join 1,240+ Pilgrims already registered this month.
                </p>
              </form>
            ) : (
              <div className="text-center py-12 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-green-500/20">✓</div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Registration Received!</h3>
                <p className="text-slate-400 leading-relaxed mb-8">
                  Our spiritual consultant will contact you via WhatsApp within 15 minutes to confirm your availability.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-amber-500 font-bold uppercase tracking-widest text-[10px] hover:underline"
                >
                  Register Another Person
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8 hidden lg:flex">
             {['Certified Vendor', 'Luxury Stay', 'Direct Flight', '24/7 Guide'].map(tag => (
                 <div key={tag} className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div>
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{tag}</span>
                 </div>
             ))}
        </div>
      </div>
    </div>
  );
}
