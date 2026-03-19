"use client";

import React, { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TierRoomPrice {
  id: string;
  tier_id: string;
  room_type: "single" | "double" | "triple" | "quad";
  price: number;
  quota: number;
}

interface PackageTier {
  id: string;
  trip_package_id: string;
  tier_name: string;
  tier_label: string;
  sort_order: number;
  color_code: string;
  includes_items: string;
  room_prices: TierRoomPrice[];
}

interface TripPackage {
  id: string;
  vendor_id?: string;
  name: string;
  description: string;
  departure_date?: string;
  return_date?: string;
  destination: string;
  duration_nights: number;
  currency: "IDR" | "USD";
  status: string;
  tiers: PackageTier[];
}

const ROOM_TYPES = ["single", "double", "triple", "quad"] as const;
const ROOM_LABELS: Record<string, string> = {
  single: "Single 🛏️",
  double: "Double 🛏🛏",
  triple: "Triple 🛏🛏🛏",
  quad: "Quad 🛏🛏🛏🛏",
};

const API = "http://localhost:8081/api/v1/public";

// ─── Revenue Formatter ───────────────────────────────────────────────────────
function formatRevenue(amount: number, currency: "IDR" | "USD" | string): string {
  if (currency === "IDR") {
    // Redenomination: remove 3 trailing zeros
    const redenominated = Math.round(amount / 1000);
    return `Rp ${redenominated.toLocaleString("id-ID")}K`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function formatFullIDR(amount: number): string {
  const redenominated = Math.round(amount / 1000);
  return `Rp ${redenominated.toLocaleString("id-ID")}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PricingEngine() {
  const [packages, setPackages] = useState<TripPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<TripPackage | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [tierModal, setTierModal] = useState<{ pkgId: string } | null>(null);

  // Revenue Stats
  const [revenue, setRevenue] = useState<{
    total_idr_committed: number;
    total_usd_committed: number;
    total_idr_dp: number;
    total_usd_dp: number;
    closing_count: number;
    dp_count: number;
  } | null>(null);

  // New package form
  const [form, setForm] = useState({
    name: "",
    description: "",
    departure_date: "",
    return_date: "",
    destination: "Makkah - Madinah",
    duration_nights: 9,
    currency: "IDR",
    status: "active",
  });

  // New tier form
  const [tierForm, setTierForm] = useState({
    tier_name: "",
    tier_label: "",
    sort_order: 0,
    color_code: "#6366f1",
  });

  // New room price forms: keyed by tier_id
  const [roomForms, setRoomForms] = useState<Record<string, { room_type: string; price: string; quota: string }>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [pkgRes, revRes] = await Promise.all([
        fetch(`${API}/trip-packages`).then((r) => r.json()),
        fetch(`${API}/revenue-stats`).then((r) => r.json()),
      ]);
      setPackages(pkgRes.packages || []);
      setRevenue(revRes.revenue || null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ─ Create Package
  const createPackage = async () => {
    const payload = { ...form, duration_nights: Number(form.duration_nights) };
    const res = await fetch(`${API}/trip-packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { setModal(null); load(); resetForm(); }
  };

  const resetForm = () => setForm({
    name: "", description: "", departure_date: "", return_date: "",
    destination: "Makkah - Madinah", duration_nights: 9, currency: "IDR", status: "active",
  });

  // ─ Add Tier
  const addTier = async (pkgId: string) => {
    const res = await fetch(`${API}/trip-packages/${pkgId}/tiers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tierForm, sort_order: Number(tierForm.sort_order) }),
    });
    if (res.ok) { setTierModal(null); load(); setTierForm({ tier_name: "", tier_label: "", sort_order: 0, color_code: "#6366f1" }); }
  };

  // ─ Add Room Price
  const addRoomPrice = async (tierId: string) => {
    const rf = roomForms[tierId];
    if (!rf?.price || !rf?.room_type) return;
    const res = await fetch(`${API}/tiers/${tierId}/room-prices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_type: rf.room_type, price: parseFloat(rf.price), quota: parseInt(rf.quota || "0") }),
    });
    if (res.ok) { load(); setRoomForms((p) => ({ ...p, [tierId]: { room_type: "double", price: "", quota: "" } })); }
  };

  const deleteTier = async (pkgId: string, tierId: string) => {
    if (!confirm("Hapus tier ini?")) return;
    await fetch(`${API}/trip-packages/${pkgId}/tiers/${tierId}`, { method: "DELETE" });
    load();
  };

  const deleteRoomPrice = async (tierId: string, priceId: string) => {
    await fetch(`${API}/tiers/${tierId}/room-prices/${priceId}`, { method: "DELETE" });
    load();
  };

  const deletePackage = async (id: string) => {
    if (!confirm("Arsipkan paket ini?")) return;
    await fetch(`${API}/trip-packages/${id}`, { method: "DELETE" });
    load();
  };

  const totalIDR = (revenue?.total_idr_committed || 0) + (revenue?.total_idr_dp || 0);
  const totalUSD = (revenue?.total_usd_committed || 0) + (revenue?.total_usd_dp || 0);
  const redenominated = Math.round((revenue?.total_idr_committed || 0) / 1000);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* ── REVENUE SUMMARY ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* IDR Closing */}
        <div className="md:col-span-2 p-10 rounded-[3rem] bg-gradient-to-br from-brand-600 to-brand-900 border border-white/20 relative overflow-hidden group shadow-2xl">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
          <span className="text-[10px] font-black text-brand-200 uppercase tracking-[0.4em] mb-4 block">IDR Committed Revenue</span>
          <h2 className="text-6xl font-black text-white italic tracking-tighter leading-none">
            Rp {redenominated.toLocaleString("id-ID")}
            <span className="text-brand-300 text-2xl ml-2 font-bold">ribu</span>
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase">{revenue?.closing_count || 0} Closing</span>
            <span className="text-brand-200 text-xs font-medium">+ Rp {Math.round((revenue?.total_idr_dp || 0) / 1000).toLocaleString("id-ID")}K DP</span>
          </div>
        </div>

        {/* USD Closing */}
        <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between hover:bg-white/[0.05] transition-all">
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">USD Committed</span>
            <h3 className="text-4xl font-black text-white italic tracking-tighter">
              ${(revenue?.total_usd_committed || 0).toLocaleString("en-US")}
            </h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase">Full Payment USD</p>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full mt-4">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: totalUSD > 0 ? "60%" : "0%" }} />
          </div>
        </div>

        {/* Stats */}
        <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between hover:bg-white/[0.05] transition-all">
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Pipeline Status</span>
            <h3 className="text-4xl font-black text-white italic tracking-tighter">{(revenue?.closing_count || 0) + (revenue?.dp_count || 0)}</h3>
            <p className="text-[10px] text-brand-400 font-bold mt-2 uppercase">Active Transactions</p>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
              <p className="text-xs font-black text-emerald-400">{revenue?.closing_count || 0}</p>
              <p className="text-[8px] text-slate-500 uppercase">Closing</p>
            </div>
            <div className="flex-1 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
              <p className="text-xs font-black text-amber-400">{revenue?.dp_count || 0}</p>
              <p className="text-[8px] text-slate-500 uppercase">DP</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PACKAGE LIST HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic">Trip Package Engine</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Paket Perjalanan + Struktur Harga Dinamis</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="px-8 py-4 bg-brand-500 hover:scale-105 active:scale-95 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_15px_30px_rgba(99,102,241,0.2)]"
        >
          + Buat Paket Baru
        </button>
      </div>

      {/* ── PACKAGE CARDS ── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 animate-pulse">Loading Packages...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-6 border border-dashed border-white/10 rounded-[3rem]">
          <div className="text-5xl">📦</div>
          <p className="text-sm font-bold text-slate-500">Belum ada paket. Buat paket pertama Anda!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl hover:border-brand-500/20 transition-all">
              {/* Package Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-8 border-b border-white/5 gap-4">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-3xl shrink-0">🕋</div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${pkg.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{pkg.status}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-500 border border-white/10 px-2 py-0.5 rounded-full">{pkg.currency}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white italic tracking-tight">{pkg.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-[10px] text-slate-500 font-bold uppercase">
                      <span>📍 {pkg.destination}</span>
                      {pkg.departure_date && <span>✈️ {new Date(pkg.departure_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      <span>🌙 {pkg.duration_nights} Malam</span>
                      <span className="text-brand-400">🏷️ {pkg.tiers?.length || 0} Tier</span>
                    </div>
                    {pkg.description && <p className="text-xs text-slate-400 mt-2 max-w-lg">{pkg.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => setTierModal({ pkgId: pkg.id })} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white transition-all">
                    + Tambah Tier
                  </button>
                  <button onClick={() => deletePackage(pkg.id)} className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all text-xs">✕</button>
                </div>
              </div>

              {/* Tiers */}
              {pkg.tiers && pkg.tiers.length > 0 && (
                <div className="p-8 space-y-6">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Struktur Tier & Harga Kamar</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pkg.tiers.sort((a, b) => a.sort_order - b.sort_order).map((tier) => (
                      <div key={tier.id} className="rounded-[2rem] border overflow-hidden transition-all hover:scale-[1.01]" style={{ borderColor: tier.color_code + "40" }}>
                        {/* Tier Header */}
                        <div className="px-6 py-5 flex items-center justify-between" style={{ background: tier.color_code + "15" }}>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: tier.color_code }} />
                              <span className="text-sm font-black text-white uppercase italic">{tier.tier_name}</span>
                            </div>
                            {tier.tier_label && <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{tier.tier_label}</p>}
                          </div>
                          <button onClick={() => deleteTier(pkg.id, tier.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">✕</button>
                        </div>

                        {/* Room Prices */}
                        <div className="p-4 space-y-2 bg-black/20">
                          {ROOM_TYPES.map((rt) => {
                            const rp = tier.room_prices?.find((r) => r.room_type === rt);
                            return (
                              <div key={rt} className={`flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${rp ? "border-white/5 bg-white/[0.03]" : "border-dashed border-white/[0.04] opacity-40"}`}>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{ROOM_LABELS[rt]}</span>
                                {rp ? (
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-white italic">
                                      {pkg.currency === "IDR"
                                        ? `Rp ${Math.round(rp.price / 1000).toLocaleString("id-ID")}K`
                                        : `$${rp.price.toLocaleString("en-US")}`}
                                    </span>
                                    <button onClick={() => deleteRoomPrice(tier.id, rp.id)} className="w-5 h-5 flex items-center justify-center text-red-400/40 hover:text-red-400 text-[9px]">✕</button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-600 italic">–</span>
                                )}
                              </div>
                            );
                          })}

                          {/* Add Room Price Form */}
                          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                            <select
                              value={roomForms[tier.id]?.room_type || "double"}
                              onChange={(e) => setRoomForms((p) => ({ ...p, [tier.id]: { ...p[tier.id], room_type: e.target.value } }))}
                              className="col-span-1 bg-surface border border-border-card rounded-xl px-3 py-2.5 text-[10px] font-black text-text-primary outline-none uppercase"
                            >
                              {ROOM_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
                            </select>
                            <input
                              type="number"
                              placeholder={pkg.currency === "IDR" ? "45000000" : "3500"}
                              value={roomForms[tier.id]?.price || ""}
                              onChange={(e) => setRoomForms((p) => ({ ...p, [tier.id]: { ...p[tier.id], price: e.target.value } }))}
                              className="col-span-1 bg-surface border border-border-card rounded-xl px-3 py-2.5 text-[10px] font-bold text-text-primary outline-none"
                            />
                            <button
                              onClick={() => addRoomPrice(tier.id)}
                              className="col-span-1 bg-brand-500/20 border border-brand-500/30 hover:bg-brand-500/40 text-brand-300 text-[9px] font-black uppercase rounded-xl transition-all"
                            >
                              + Set
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: CREATE PACKAGE ── */}
      {modal === "create" && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setModal(null)} />
          <div className="relative bg-[#0a0a0f] border border-white/10 rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">Buat Paket Baru ✨</h3>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-brand-400 uppercase tracking-widest block mb-2">Nama Paket *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Umrah Liburan Syawal 2 Juni 2026"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-brand-500/50 transition-all" />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tanggal Keberangkatan</label>
                  <input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-brand-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tanggal Return</label>
                  <input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-brand-500/50 transition-all" />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Durasi (Malam)</label>
                  <input type="number" value={form.duration_nights} onChange={(e) => setForm({ ...form, duration_nights: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-brand-500/50 transition-all" />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Mata Uang</label>
                  <div className="flex gap-3">
                    {["IDR", "USD"].map((c) => (
                      <button key={c} onClick={() => setForm({ ...form, currency: c })}
                        className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase border transition-all ${form.currency === c ? "bg-brand-500 border-brand-400 text-white shadow-lg" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
                        {c === "IDR" ? "🇮🇩 IDR" : "🇺🇸 USD"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Deskripsi Paket</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} placeholder="Hotel bintang 5 Makkah, full breakfast, visa terjamin..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium text-white/80 outline-none focus:border-brand-500/50 transition-all resize-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={createPackage} disabled={!form.name}
                className="flex-1 py-5 bg-brand-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all active:scale-95 shadow-xl">
                Simpan Paket 🚀
              </button>
              <button onClick={() => { setModal(null); resetForm(); }}
                className="px-8 py-5 border border-white/10 text-slate-400 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:text-white transition-all">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD TIER ── */}
      {tierModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setTierModal(null)} />
          <div className="relative bg-[#0a0a0f] border border-white/10 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">Tambah Tier Kelas 🏆</h3>
            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-brand-400 uppercase tracking-widest block mb-2">Nama Tier *</label>
                <input value={tierForm.tier_name} onChange={(e) => setTierForm({ ...tierForm, tier_name: e.target.value })}
                  placeholder="e.g. VVIP, Gold, Silver, Bronze"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-brand-500/50 transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Label / Sub-Nama</label>
                <input value={tierForm.tier_label} onChange={(e) => setTierForm({ ...tierForm, tier_label: e.target.value })}
                  placeholder="e.g. Full Private, Premium, Economy"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium text-white/80 outline-none focus:border-brand-500/50 transition-all" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Warna Identitas</label>
                <div className="flex items-center gap-4">
                  <input type="color" value={tierForm.color_code} onChange={(e) => setTierForm({ ...tierForm, color_code: e.target.value })}
                    className="w-16 h-12 rounded-2xl border-0 cursor-pointer bg-transparent" />
                  <span className="text-sm font-bold text-slate-400">{tierForm.color_code}</span>
                  <div className="flex gap-2">
                    {["#f59e0b", "#6366f1", "#10b981", "#ef4444", "#8b5cf6"].map((c) => (
                      <button key={c} onClick={() => setTierForm({ ...tierForm, color_code: c })}
                        className="w-8 h-8 rounded-xl border-2 border-white/20 transition-all hover:scale-110"
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => addTier(tierModal.pkgId)} disabled={!tierForm.tier_name}
                className="flex-1 py-5 bg-brand-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all active:scale-95">
                Simpan Tier 🏆
              </button>
              <button onClick={() => setTierModal(null)}
                className="px-8 py-5 border border-white/10 text-slate-400 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:text-white transition-all">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
