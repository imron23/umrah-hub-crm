"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function LeadCaptureForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    message: '',
    budget_range: '',
    age: '',
    travel_type: 'alone', 
  });
  const [companions, setCompanions] = useState<{ relationship: string; age: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const budgetOptions = [
    { id: 'ekonomi', label: 'Ekonomi', range: '23 - 27jt', icon: '🏨' },
    { id: 'standar', label: 'Standar', range: '28 - 35jt', icon: '🌟' },
    { id: 'premium', label: 'Premium', range: '36 - 45jt', icon: '💎' },
    { id: 'enterprise', label: 'Signature', range: '50jt+', icon: '👑' },
  ];

  const companionTypes = ['Isteri', 'Suami', 'Anak', 'Orang Tua', 'Saudara'];

  useEffect(() => {
    if (search.length >= 3) {
      const timer = setTimeout(() => {
        const mocks = [
            { id: 1, name: 'Tanah Sareal, Bogor' },
            { id: 2, name: 'Bogor Barat, Bogor' },
            { id: 3, name: 'Pondok Indah, Jakarta Selatan' },
            { id: 4, name: 'Cisarua, Bogor' },
            { id: 5, name: 'Menteng, Jakarta Pusat' },
        ].filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
        setResults(mocks);
        setShowDropdown(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [search]);

  const addCompanion = () => setCompanions([...companions, { relationship: 'Isteri', age: '' }]);
  const updateCompanion = (index: number, field: string, value: string) => {
    const newComps = [...companions];
    (newComps[index] as any)[field] = value;
    setCompanions(newComps);
  };
  const removeCompanion = (index: number) => setCompanions(companions.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const companionDetails = companions.map(c => `${c.relationship} (${c.age} thn)`).join(', ');
    const complexMessage = [
        formData.budget_range ? `[Budget: ${formData.budget_range}]` : '',
        `[Umur Utama: ${formData.age} thn]`,
        companions.length > 0 ? `[Pendamping: ${companionDetails}]` : '[Berangkat Sendiri]',
        formData.message ? `[Pesan: ${formData.message}]` : ''
    ].filter(Boolean).join(' ');

    try {
      const res = await fetch('http://localhost:8081/api/v1/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          city: search,
          message: complexMessage,
          utm: { source: 'form_hub_v3', medium: 'internal' }
        })
      });
      if (res.ok) setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  if (success) {
    return (
      <div className="linear-card flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-in zoom-in-95 duration-300">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-xl mb-6 border border-emerald-500/20">✓</div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Submission Successful</h2>
          <p className="text-[13px] text-[var(--text-secondary)] max-w-xs mx-auto mb-8">Data has been synced with the CRM. Lead quality scored at 82% (High Intent).</p>
          <button 
            onClick={() => { setSuccess(false); setStep(1); setFormData({name: '', phone: '', city: '', message: '', budget_range: '', age: '', travel_type: 'alone'}); setCompanions([]); setSearch(''); }}
            className="linear-button px-8 h-9"
          >
            Reset Form
          </button>
      </div>
    );
  }

  return (
    <div className="linear-card p-0 overflow-hidden border-[var(--border-main)] shadow-xl">
      {/* Progress Line */}
      <div className="h-1 w-full bg-[var(--border-main)]/50">
          <div className="h-full bg-[var(--brand-solid)] transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      <div className="p-8 lg:p-10">
        <div className="mb-8 flex justify-between items-start">
            <div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Node Processing / 0{step}</p>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {step === 1 && "Primary Identity"}
                    {step === 2 && "Group Composition"}
                    {step === 3 && "Location & Budget"}
                    {step === 4 && "Intent Summary"}
                </h2>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-hover)] flex items-center justify-center text-base opacity-40">
                {step === 1 ? '👤' : step === 2 ? '👥' : step === 3 ? '🗺️' : '🧠'}
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-200">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-[var(--text-secondary)]">Lead Name</label>
                        <input 
                            required type="text" placeholder="e.g. Ahmad Faisal" value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="linear-input w-full h-10 px-4"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-[var(--text-secondary)]">WhatsApp</label>
                            <input 
                                required type="tel" placeholder="0812..." value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="linear-input w-full h-10 px-4"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-[var(--text-secondary)]">Primary Age</label>
                            <input 
                                required type="number" placeholder="45" value={formData.age}
                                onChange={e => setFormData({...formData, age: e.target.value})}
                                className="linear-input w-full h-10 px-4"
                            />
                        </div>
                    </div>
                    <button 
                        type="button" onClick={nextStep}
                        disabled={!formData.name || !formData.phone || !formData.age}
                        className="linear-button-primary w-full h-10 mt-4 disabled:opacity-30"
                    >
                        Save & Continue
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-2 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            type="button"
                            onClick={() => { setFormData({...formData, travel_type: 'alone'}); setCompanions([]); }}
                            className={`p-4 rounded-lg border text-left transition-all ${formData.travel_type === 'alone' ? 'bg-[var(--brand-muted)] border-[var(--brand-solid)]' : 'bg-[var(--bg-card-hover)] border-[var(--border-card)]'}`}
                        >
                            <p className="text-sm mb-1">🤲</p>
                            <p className="text-[11px] font-semibold text-[var(--text-primary)]">Solo Traveler</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Individual Departure</p>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, travel_type: 'group'})}
                            className={`p-4 rounded-lg border text-left transition-all ${formData.travel_type === 'group' ? 'bg-[var(--brand-muted)] border-[var(--brand-solid)]' : 'bg-[var(--bg-card-hover)] border-[var(--border-card)]'}`}
                        >
                            <p className="text-sm mb-1">👨‍👩‍👧‍👦</p>
                            <p className="text-[11px] font-semibold text-[var(--text-primary)]">Family Group</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Multiple Pilgrims</p>
                        </button>
                    </div>

                    {formData.travel_type === 'group' && (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {companions.map((comp, idx) => (
                                <div key={idx} className="flex items-center gap-2 animate-in fade-in duration-200">
                                    <select 
                                        value={comp.relationship}
                                        onChange={(e) => updateCompanion(idx, 'relationship', e.target.value)}
                                        className="h-9 bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-md text-[11px] font-medium text-[var(--text-primary)] px-3 outline-none focus:border-[var(--brand-solid)]"
                                    >
                                        {companionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <input 
                                        type="number" placeholder="Age" value={comp.age}
                                        onChange={(e) => updateCompanion(idx, 'age', e.target.value)}
                                        className="linear-input h-9 flex-1 px-3"
                                    />
                                    <button type="button" onClick={() => removeCompanion(idx)} className="text-[var(--text-muted)] hover:text-red-500 p-2 text-xs transition-colors">✕</button>
                                </div>
                            ))}
                            <button 
                                type="button" onClick={addCompanion}
                                className="w-full h-9 border border-dashed border-[var(--border-card)] rounded-md text-[11px] font-medium text-[var(--text-muted)] hover:border-[var(--brand-solid)] hover:text-[var(--brand-solid)] transition-all"
                            >
                                + Add Companion
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button type="button" onClick={prevStep} className="linear-button w-1/3">Back</button>
                        <button type="button" onClick={nextStep} className="linear-button-primary flex-1">Next Step</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-2 duration-200">
                    <div className="grid grid-cols-2 gap-2">
                        {budgetOptions.map(opt => (
                            <button 
                                type="button" key={opt.id} onClick={() => setFormData({...formData, budget_range: opt.label})}
                                className={`p-3 rounded-lg border text-left transition-all ${formData.budget_range === opt.label ? 'bg-[var(--brand-muted)] border-[var(--brand-solid)]' : 'bg-[var(--bg-card-hover)] border-[var(--border-card)]'}`}
                            >
                                <div className="flex justify-between items-center mb-0.5">
                                    <p className="text-[11px] font-bold text-[var(--text-primary)]">{opt.label}</p>
                                    <span className="text-xs opacity-40">{opt.icon}</span>
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)]">{opt.range}</p>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1.5 relative" ref={dropdownRef}>
                        <label className="text-[11px] font-medium text-[var(--text-secondary)]">Residency (Kecamatan)</label>
                        <input 
                            required type="text" placeholder="Type at least 3 chars..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            onFocus={() => search.length >= 3 && setShowDropdown(true)}
                            className="linear-input w-full h-10 px-4"
                        />
                        {showDropdown && results.length > 0 && (
                            <div className="absolute z-50 w-full mt-1.5 py-1 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                {results.map(res => (
                                    <div key={res.id} onClick={() => { setSearch(res.name); setShowDropdown(false); }} className="px-4 py-2 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] cursor-pointer transition-colors border-b border-white/[0.02] last:border-0">{res.name}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <button type="button" onClick={prevStep} className="linear-button w-1/3">Back</button>
                        <button type="button" onClick={nextStep} disabled={!formData.budget_range || !search} className="linear-button-primary flex-1 disabled:opacity-30">Analyze Intent</button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-2 duration-200">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-[var(--text-secondary)]">Consultation Brief</label>
                        <textarea 
                            rows={5} placeholder="Describe specific needs (e.g. wheelchair assistance, hotel proximity)..."
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                            className="linear-input w-full p-4 h-32 resize-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={prevStep} className="linear-button w-1/3">Back</button>
                        <button 
                            type="submit" disabled={submitting}
                            className="linear-button-primary flex-1 h-10"
                        >
                            {submitting ? 'Processing...' : 'Sync to Pipeline'}
                        </button>
                    </div>
                </div>
            )}
        </form>
      </div>
    </div>
  );
}
