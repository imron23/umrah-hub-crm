"use client";

import React, { useState } from 'react';

export default function BogorPromoPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    preferences: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const preferencesOptions = [
    "Program Tahfizh Mutqin",
    "Fasilitas Asrama Bersih & Nyaman",
    "Pembentukan Adab Sesuai Sunnah",
    "Ekstrakurikuler Olahraga & Berkuda",
    "Skema Cicilan Ringan"
  ];

  const handlePreferenceToggle = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(pref) 
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call to POST /api/v1/public/leads
    try {
        const payload = {
            name: formData.name,
            phone: formData.phone,
            city: formData.city,
            message: `Preferences: ${formData.preferences.join(', ')}`,
            utm: {
                source: 'landing_page',
                medium: 'direct',
                campaign: 'bogor_15jt_allin'
            }
        };

        const res = await fetch('http://localhost:8081/api/v1/public/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setIsSuccess(true);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=2070')] bg-cover bg-center">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
            <div className="relative z-10 max-w-lg w-full bg-white/5 border border-white/10 p-12 rounded-[40px] text-center backdrop-blur-md shadow-2xl">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-4xl mb-8 mx-auto shadow-lg shadow-green-500/20">✓</div>
                <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">Alhamdulillah!</h1>
                <p className="text-slate-400 leading-relaxed mb-8">
                    Data Anda telah kami terima. Tim Konsultan Pesantren kami akan menghubungi Anda melalui WhatsApp dalam waktu maksimal 24 jam untuk memberikan Brosur Digital & Jadwal Open House.
                </p>
                <button 
                    onClick={() => window.location.href = '/'}
                    className="w-full py-4 rounded-2xl bg-white text-black font-extrabold uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                    Kembali ke Beranda
                </button>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-brand-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=2024')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/60 to-slate-950" />
        </div>
        
        <div className="relative z-10 max-w-5xl px-6 text-center space-y-8">
            <span className="px-4 py-2 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-[0.3em] border border-brand-500/30 backdrop-blur-md animate-pulse">
                Pendaftaran Santri Baru 2026
            </span>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9]">
                Beri Hadiah Terbaik <br />
                <span className="text-brand-500 text-outline-white">Untuk Masanya</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-300 font-medium leading-relaxed">
                Pesantren Premium di Bogor dengan Fasilitas Bintang 5. <br />
                <span className="text-white font-bold">Rp 15.000.000 All-in.</span> Tanpa biaya tersembunyi, seumur hidup.
            </p>
            <div className="pt-8 animate-bounce">
                <div className="w-1 h-12 bg-gradient-to-b from-brand-500 to-transparent mx-auto rounded-full" />
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
            { label: "Makan 3x Sehari", desc: "Menu bergizi & higienis setiap hari.", icon: "🍱" },
            { label: "Laundry Premium", desc: "Kebersihan pakaian santri terjamin.", icon: "👔" },
            { label: "Asuransi Kesehatan", desc: "Proteksi penuh selama masa pendidikan.", icon: "🛡️" },
            { label: "Lokasi Bogor", desc: "Udara sejuk & kondusif untuk menghafal.", icon: "🏔️" }
        ].map((f, i) => (
            <div key={i} className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
                <h4 className="text-xl font-bold mb-2 text-white">{f.label}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
        ))}
      </section>

      {/* Conversion Engine (Form) */}
      <section className="max-w-4xl mx-auto px-6 py-32" id="register">
        <div className="p-12 md:p-20 rounded-[60px] bg-gradient-to-br from-brand-600/20 to-brand-900/40 border border-brand-500/20 relative overflow-hidden shadow-3xl">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand-500/10 blur-[120px] rounded-full" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-12">
                    <div className="flex gap-1">
                        {[1, 2].map(i => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-12 bg-brand-500' : 'w-4 bg-white/10'}`} />
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step {step} of 2</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {step === 1 ? (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                            <div>
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Pilih Prioritas Anda</h2>
                                <p className="text-slate-400 text-sm">Bantu kami memahami kebutuhan pendidikan putra-putri Anda.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {preferencesOptions.map((opt, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handlePreferenceToggle(opt)}
                                        className={`p-5 rounded-2xl border text-left transition-all flex justify-between items-center ${
                                            formData.preferences.includes(opt)
                                                ? 'bg-brand-500/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                                                : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'
                                        }`}
                                    >
                                        <span className="font-bold text-sm uppercase tracking-wide">{opt}</span>
                                        {formData.preferences.includes(opt) && <span className="text-brand-500">✓</span>}
                                    </button>
                                ))}
                            </div>
                            
                            <button 
                                type="button"
                                disabled={formData.preferences.length === 0}
                                onClick={() => setStep(2)}
                                className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-400 hover:text-white transition-all disabled:opacity-50"
                            >
                                Lanjutkan Pendaftaran
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                             <div>
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Informasi Kontak</h2>
                                <p className="text-slate-400 text-sm">Tim kami akan mengirimkan Brosur Lengkap & Skema Cicilan.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <InputField label="Nama Lengkap Orang Tua" placeholder="Contoh: Ahmad Subardjo" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} />
                                <InputField label="Nomor WhatsApp" placeholder="Contoh: 08123456xxxx" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
                                <InputField label="Kota Domisili" placeholder="Contoh: Jakarta Selatan" value={formData.city} onChange={(v: string) => setFormData({...formData, city: v})} />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                                >
                                    Kembali
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting || !formData.name || !formData.phone}
                                    className="flex-1 py-5 rounded-2xl bg-brand-500 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20 relative"
                                >
                                    {isSubmitting ? 'Mengirim Data...' : 'Konfirmasi Pendaftaran'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
      </section>

      {/* Trust Badges */}
      <footer className="py-20 border-t border-white/5 text-center px-6">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Didukung oleh Platform Terpercaya</p>
        <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            <span className="text-2xl font-black italic tracking-tighter hover:text-brand-500 cursor-default">KEMENAG RI</span>
            <span className="text-2xl font-black italic tracking-tighter hover:text-brand-500 cursor-default">MUI PUSAT</span>
            <span className="text-2xl font-black italic tracking-tighter hover:text-brand-500 cursor-default">BSNA</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-20">© 2026 Umrah Hub CRM. All rights Reserved for Bogor Pesantren Campaign.</p>
      </footer>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
            <input 
                type="text" 
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-medium"
            />
        </div>
    )
}
