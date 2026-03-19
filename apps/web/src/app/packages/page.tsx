"use client";

import React, { useEffect, useState, useCallback } from 'react';
import CreatePackageModal from '@/components/packages/CreatePackageModal';
import PricingEngine from '@/components/pricing/PricingEngine';
import { Package as PackageIcon, Plane, Hotel, Clock, Plus, Trash2, Settings2, ShieldCheck } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  vendor_price: number;
  platform_fee: number;
  customer_price: number;
  duration: number;
  airline: string;
  hotel_makkah: string;
  status: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const fetchPackages = useCallback(() => {
    setLoading(true);
    fetch('http://localhost:8081/api/v1/public/packages')
      .then(res => res.json())
      .then(data => {
        setPackages(data.packages || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch packages:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;
    
    try {
      const res = await fetch(`http://localhost:8081/api/v1/admin/packages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('umrah_hub_jwt')}` }
      });
      if (res.ok) fetchPackages();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white italic uppercase">Product Catalog</h1>
          <p className="text-slate-400 mt-2">Umrah & Hajj travel packages with dynamic platform fee pricing.</p>
        </div>
        <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-2xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Package
        </button>
      </div>

      {(showCreateModal || editingPackage) && (
        <CreatePackageModal 
            initialData={editingPackage}
            onClose={() => {
              setShowCreateModal(false);
              setEditingPackage(null);
            }}
            onSuccess={() => fetchPackages()}
        />
      )}

      <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-2 overflow-hidden backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {packages.map((pkg) => (
              <div key={pkg.id} className="group relative bg-[#0c0e14] border border-white/5 rounded-[40px] p-8 hover:bg-white/[0.04] transition-all hover:border-brand-500/30 overflow-hidden shadow-2xl flex flex-col h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-[60px] pointer-events-none group-hover:bg-brand-500/10 transition-all" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-500/5 blur-[80px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-brand-400 shadow-inner group-hover:scale-110 transition-transform duration-500 font-bold">
                                {pkg.name.toLowerCase().includes('haji') ? <ShieldCheck className="w-7 h-7" /> : <Plane className="w-7 h-7" />}
                            </div>
                            <div className="bg-brand-500/10 border border-brand-500/20 px-4 py-1.5 rounded-full text-[10px] font-black text-brand-400 uppercase tracking-widest shadow-lg">
                                {pkg.duration} DAYS
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight group-hover:text-brand-400 transition-colors duration-300 mb-6 drop-shadow-md">{pkg.name}</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl group-hover:bg-white/[0.05] transition-all">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <Hotel className="w-3 h-3 text-brand-500" /> Hotel
                                </p>
                                <p className="text-xs text-slate-300 font-bold leading-tight line-clamp-1">{pkg.hotel_makkah !== 'N/A' && pkg.hotel_makkah !== '' ? pkg.hotel_makkah : 'Standard Room'}</p>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 p-4 rounded-3xl group-hover:bg-white/[0.05] transition-all">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <Plane className="w-3 h-3 text-brand-500" /> Carrier
                                </p>
                                <p className="text-xs text-slate-300 font-bold leading-tight line-clamp-1">{pkg.airline !== 'N/A' && pkg.airline !== '' ? pkg.airline : 'Economy Air'}</p>
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Platform Price</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-brand-400 italic">Rp</span>
                                    <span className="text-2xl font-black text-white italic tracking-tighter">
                                        {(pkg.vendor_price + pkg.platform_fee).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditingPackage(pkg)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-brand-500 hover:border-brand-500 transition-all hover:shadow-[0_0_20px_rgba(var(--brand-500-rgb),0.3)] active:scale-90"
                                    title="Edit Logic"
                                >
                                    <Settings2 className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(pkg.id)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-90"
                                    title="Purge Package"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
              </div>
            ))}
        </div>
      </div>

      {/* ── TRIP PACKAGE ENGINE ── */}
      <div className="pt-8 border-t border-white/5">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Trip Package Engine</h2>
          <p className="text-sm text-slate-500 font-medium mt-2">Paket dengan tier kelas (VVIP/Gold/Silver), harga per tipe kamar, dan revenue pipeline terintegrasi.</p>
        </div>
        <PricingEngine />
      </div>
    </div>
  );
}
