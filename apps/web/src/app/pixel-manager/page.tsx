"use client";

import React, { useEffect, useState } from 'react';

interface TrackingPixel {
  id?: string;
  provider: string;
  pixel_id: string;
  token: string;
  is_active: boolean;
}

const PROVIDERS = [
  { id: 'meta_pixel', label: 'Meta Pixel', icon: '📱' },
  { id: 'gtm', label: 'Google Tag Manager', icon: '🏷️' },
  { id: 'ga4', label: 'Google Analytics 4', icon: '📊' },
  { id: 'tiktok_pixel', label: 'TikTok Pixel', icon: '🎵' }
];

export default function PixelManager() {
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPixels();
  }, []);

  const fetchPixels = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/v1/public/pixels');
      const data = await res.json();
      setPixels(data.pixels || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (provider: string) => {
    setSaving(true);
    const pixel = pixels.find(p => p.provider === provider) || { provider, pixel_id: '', token: '', is_active: true };
    
    try {
      const res = await fetch('http://localhost:8081/api/v1/public/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pixel)
      });
      if (res.ok) {
        alert(`${provider} settings saved successfully!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updatePixelField = (provider: string, field: keyof TrackingPixel, value: any) => {
    const existing = pixels.find(p => p.provider === provider);
    if (existing) {
      setPixels(pixels.map(p => p.provider === provider ? { ...p, [field]: value } : p));
    } else {
      setPixels([...pixels, { provider, pixel_id: '', token: '', is_active: true, [field]: value } as TrackingPixel]);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em] mb-3 block">Tracking & Hijacking</span>
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Pixel Manager</h1>
        <p className="text-slate-400 mt-2">Manage tracking codes, analytics tags, and marketing pixels across all funnels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {PROVIDERS.map(prov => {
          const config = pixels.find(p => p.provider === prov.id) || { pixel_id: '', token: '', is_active: false };
          return (
            <div key={prov.id} className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 group hover:border-white/10 transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
                    {prov.icon}
                  </div>
                  <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status:</span>
                      <button 
                        onClick={() => updatePixelField(prov.id, 'is_active', !config.is_active)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                            config.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {config.is_active ? 'Active' : 'Disabled'}
                      </button>
                  </div>
                </div>

                <h3 className="text-2xl font-black italic uppercase italic tracking-tighter text-white mb-6 underline decoration-brand-500/30 underline-offset-8 decoration-2">{prov.label}</h3>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Pixel ID / Container ID</label>
                        <input 
                            type="text" 
                            value={config.pixel_id}
                            onChange={(e) => updatePixelField(prov.id, 'pixel_id', e.target.value)}
                            placeholder={`Enter ${prov.label} ID...`}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all text-white font-mono"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Access Token (CAPI / Secret)</label>
                        <textarea 
                            rows={3}
                            value={config.token}
                            onChange={(e) => updatePixelField(prov.id, 'token', e.target.value)}
                            placeholder="Optional: Enter access token for server-side events..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all text-white font-mono resize-none"
                        />
                    </div>
                </div>
              </div>

              <button 
                disabled={saving}
                onClick={() => handleSave(prov.id)}
                className="mt-10 w-full py-5 rounded-3xl bg-brand-500 text-white font-black uppercase tracking-widest text-[11px] hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/10 active:scale-[0.98]"
              >
                {saving ? 'Saving...' : `Update ${prov.label} Config`}
              </button>
            </div>
          )
        })}

        {/* Custom Hijack Script */}
        <div className="lg:col-span-2 bg-brand-500/5 border border-brand-500/10 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em] mb-3 block">Expert Mode</span>
                <h3 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">Custom Hijack Scripts</h3>
                <p className="text-slate-400 mt-2 italic">Inject custom Javascript snippets into the header/footer of all landing pages for advanced cross-domain tracking.</p>
            </div>
            <button className="px-10 py-5 rounded-3xl border border-brand-500/40 text-brand-500 font-black uppercase tracking-widest text-[11px] hover:bg-brand-500 hover:text-white transition-all">
                Open Script Editor
            </button>
        </div>
      </div>
    </div>
  );
}
