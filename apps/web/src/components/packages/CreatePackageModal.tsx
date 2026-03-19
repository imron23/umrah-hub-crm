"use client";

import React, { useState, useEffect } from 'react';

interface Vendor {
  id: string;
  vendor_name: string;
}

interface CreatePackageModalProps {
  onClose: () => void;
  onSuccess: () => void;
  preselectedVendorId?: string;
  initialData?: any;
}

export default function CreatePackageModal({ onClose, onSuccess, preselectedVendorId, initialData }: CreatePackageModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    vendor_id: initialData?.vendor_id || preselectedVendorId || '',
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    vendor_price: initialData?.vendor_price || 0,
    platform_fee: initialData?.platform_fee || 0,
    duration: initialData?.duration || 9,
    airline: initialData?.airline || '',
    hotel_makkah: initialData?.hotel_makkah || ''
  });

  useEffect(() => {
    fetch('http://localhost:8081/api/v1/public/vendors')
      .then(res => res.json())
      .then(data => {
        setVendors(data.vendors || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch vendors:", err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = isEdit 
        ? `http://localhost:8081/api/v1/admin/packages/${initialData.id}`
        : 'http://localhost:8081/api/v1/admin/packages';
      
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          vendor_price: Number(formData.vendor_price),
          platform_fee: Number(formData.platform_fee),
          duration: Number(formData.duration)
        })
      });

      if (!res.ok) throw new Error("Failed to process request");
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error processing package. Check if you are logged in as admin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0c0e14] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  {isEdit ? 'Reconfigure Product' : 'Forge New Product'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">
                  {isEdit ? 'Modify the existing gene-pool of this package' : 'Incorporate a new Umrah package into the matrix'}
                </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Provider</label>
                    <select 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                        value={formData.vendor_id}
                        onChange={e => setFormData({...formData, vendor_id: e.target.value})}
                    >
                        <option value="" className="bg-slate-900">Choose Vendor</option>
                        {vendors.map(v => <option key={v.id} value={v.id} className="bg-slate-900">{v.vendor_name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Package Name</label>
                    <input 
                        required
                        type="text"
                        placeholder="e.g. Umrah Ramadhan VIP"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vendor Price</label>
                    <input 
                        required
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                        value={formData.vendor_price}
                        onChange={e => setFormData({...formData, vendor_price: Number(e.target.value)})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Platform Fee</label>
                    <input 
                        required
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-brand-400 font-bold text-sm outline-none focus:border-brand-500/50 transition-all"
                        value={formData.platform_fee}
                        onChange={e => setFormData({...formData, platform_fee: Number(e.target.value)})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duration (Days)</label>
                    <input 
                        required
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                        value={formData.duration}
                        onChange={e => setFormData({...formData, duration: Number(e.target.value)})}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Airline Carrier</label>
                    <input 
                        type="text"
                        placeholder="e.g. Saudi Arabian Airlines"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                        value={formData.airline}
                        onChange={e => setFormData({...formData, airline: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Makkah Hotel</label>
                    <input 
                        type="text"
                        placeholder="e.g. Pullman Zamzam"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500/50 transition-all"
                        value={formData.hotel_makkah}
                        onChange={e => setFormData({...formData, hotel_makkah: e.target.value})}
                    />
                </div>
            </div>

            <button 
                disabled={submitting}
                className={`w-full py-4 mt-4 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-sm transition-all shadow-xl disabled:opacity-50 ${isEdit ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20'}`}
            >
                {submitting ? 'Constructing...' : (isEdit ? 'Execute Update' : 'Initialize Product')}
            </button>
        </form>
      </div>
    </div>
  );
}
