"use client";

import React, { useEffect, useState, useCallback } from 'react';
import CreatePackageModal from '@/components/packages/CreatePackageModal';

interface Package {
  id: string;
  name: string;
  vendor_price: number;
  platform_fee: number;
  duration: number;
  airline: string;
  hotel_makkah: string;
}

interface ManagePackagesModalProps {
  vendorId: string;
  vendorName: string;
  onClose: () => void;
}

export default function ManagePackagesModal({ vendorId, vendorName, onClose }: ManagePackagesModalProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchPackages = useCallback(() => {
    setLoading(true);
    fetch(`http://localhost:8081/api/v1/public/vendors/${vendorId}/packages`)
      .then(res => res.json())
      .then(data => {
        setPackages(data.packages || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch packages for vendor:", err);
        setLoading(false);
      });
  }, [vendorId]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-[#0c0e14] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-10 border-b border-white/5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em] mb-2 block">Provider Portfolio</span>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{vendorName}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="p-10 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : packages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-4">
               <div className="text-4xl opacity-20">📦</div>
               <p className="font-bold uppercase tracking-widest text-xs">No active packages found for this vendor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between hover:border-brand-500/30 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-bold uppercase border border-brand-500/20">{pkg.duration} Days</span>
                        <span className="text-xl">✈️</span>
                    </div>
                    <h4 className="text-white font-bold text-lg mb-2">{pkg.name}</h4>
                    <div className="space-y-1 mb-6">
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                           <span className="opacity-50">🏨</span> {pkg.hotel_makkah}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                           <span className="opacity-50">🦅</span> {pkg.airline}
                        </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-end justify-between">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Customer Price</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter">
                            {formatCurrency(pkg.vendor_price + pkg.platform_fee)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Vendor Net</p>
                        <p className="text-sm font-bold text-slate-400">{formatCurrency(pkg.vendor_price)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
            <button 
                onClick={() => setShowAddModal(true)}
                className="px-8 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all shadow-xl"
            >
                Add New Package for this Vendor
            </button>
        </div>

        {showAddModal && (
            <CreatePackageModal 
                onClose={() => setShowAddModal(false)}
                onSuccess={() => fetchPackages()}
                preselectedVendorId={vendorId}
            />
        )}
      </div>
    </div>
  );
}
