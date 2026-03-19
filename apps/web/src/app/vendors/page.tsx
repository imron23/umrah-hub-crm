"use client";

import React, { useEffect, useState, useCallback } from 'react';
import ManagePackagesModal from '@/components/vendors/ManagePackagesModal';
import OnboardVendorModal from '@/components/vendors/OnboardVendorModal';

interface Vendor {
  id: string;
  vendor_name: string;
  company_name: string;
  license_number: string;
  status: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<{ id: string; name: string } | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);

  const fetchVendors = useCallback(() => {
    setLoading(true);
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

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white italic uppercase">Vendor Partners</h1>
          <p className="text-slate-400 mt-2">Manage Umrah & Hajj travel providers integrated with the marketplace.</p>
        </div>
        <button 
          onClick={() => setShowOnboardModal(true)}
          className="px-6 py-3 rounded-2xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-all shadow-xl"
        >
          Onboard New Vendor
        </button>
      </div>

      {showOnboardModal && (
        <OnboardVendorModal 
          onClose={() => setShowOnboardModal(false)}
          onSuccess={() => fetchVendors()}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-brand-500/30 transition-all group">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              🏢
            </div>
            <h3 className="text-xl font-bold mb-1 text-white">{vendor.vendor_name}</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">LICENSE: {vendor.license_number || 'N/A'}</p>
            
            <div className="mt-8 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Company</span>
                <span className="text-slate-200 font-medium">{vendor.company_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${vendor.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {vendor.status}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedVendor({ id: vendor.id, name: vendor.vendor_name })}
              className="w-full mt-8 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-brand-500 hover:border-brand-500 transition-all uppercase tracking-widest group-hover:shadow-[0_0_20px_rgba(var(--brand-500-rgb),0.2)]"
            >
              Manage Packages
            </button>
          </div>
        ))}
      </div>

      {selectedVendor && (
        <ManagePackagesModal 
          vendorId={selectedVendor.id}
          vendorName={selectedVendor.name}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  );
}
