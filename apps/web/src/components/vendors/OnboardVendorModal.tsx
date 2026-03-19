"use client";

import React, { useState } from 'react';

interface OnboardVendorModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function OnboardVendorModal({ onClose, onSuccess }: OnboardVendorModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendor_name: '',
    company_name: '',
    license_number: '',
    status: 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:8081/api/v1/admin/vendors', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('umrah_hub_jwt')}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to onboard vendor");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error onboarding vendor. Check API connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#0c0e14] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-10 border-b border-white/5">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Onboard Provider</h2>
            <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-bold">Register a new Umrah travel provider into the marketplace</p>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vendor Public Name</label>
                <input 
                    required type="text" placeholder="e.g. Al-Fath Travel"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-brand-500/50 transition-all shadow-inner"
                    value={formData.vendor_name}
                    onChange={e => setFormData({...formData, vendor_name: e.target.value})}
                />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Company Name (PT)</label>
                    <input 
                        required type="text" placeholder="e.g. PT Al Fath Global"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                        value={formData.company_name}
                        onChange={e => setFormData({...formData, company_name: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kemenag License</label>
                    <input 
                        required type="text" placeholder="e.g. UM-123/2024"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                        value={formData.license_number}
                        onChange={e => setFormData({...formData, license_number: e.target.value})}
                    />
                </div>
            </div>
            <button 
                disabled={submitting}
                className="w-full py-5 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-200 transition-all shadow-xl disabled:opacity-50"
            >
                {submitting ? 'Processing...' : 'Verify & Onboard Provider'}
            </button>
        </form>
      </div>
    </div>
  );
}
