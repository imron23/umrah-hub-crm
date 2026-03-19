"use client";

import React, { useEffect, useState, useCallback } from "react";

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

interface RevenueStats {
  total_idr_committed: number;
  total_usd_committed: number;
  total_idr_dp: number;
  total_usd_dp: number;
  closing_count: number;
  dp_count: number;
}

const ROOM_TYPES = ["single", "double", "triple", "quad"] as const;
const ROOM_LABELS: Record<string, string> = {
  single: "Single 🛏️",
  double: "Double 🛏🛏",
  triple: "Triple 🛏🛏🛏",
  quad: "Quad 🛏🛏🛏🛏",
};

const TIER_PRESETS = [
  { name: "VVIP", label: "Full Private", color: "#f59e0b" },
  { name: "Gold", label: "Premium", color: "#eab308" },
  { name: "Silver", label: "Standard Plus", color: "#94a3b8" },
  { name: "Bronze", label: "Economy", color: "#b45309" },
];

const API = "http://localhost:8081/api/v1/public";

// ─── Formatter ───────────────────────────────────────────────────────────────
function fmtIDR(amount: number): string {
  // Redenomination: remove 3 trailing zeros → display in ribuan
  const r = Math.round(amount / 1000);
  return `Rp ${r.toLocaleString("id-ID")}rb`;
}
function fmtUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}
function fmtCurrency(amount: number, currency: string): string {
  return currency === "IDR" ? fmtIDR(amount) : fmtUSD(amount);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PricingEngine() {
  const [packages, setPackages] = useState<TripPackage[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals
  const [showCreatePkg, setShowCreatePkg] = useState(false);
  const [showAddTier, setShowAddTier] = useState<{ pkgId: string; pkgCurrency: string } | null>(null);
  const [savingPkg, setSavingPkg] = useState(false);
  const [savingTier, setSavingTier] = useState(false);
  const [savingRoom, setSavingRoom] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Package form
  const emptyPkg = {
    name: "", description: "", departure_date: "", return_date: "",
    destination: "Makkah - Madinah", duration_nights: 9,
    currency: "IDR", status: "active", vendor_id: ""
  };
  const [pkgForm, setPkgForm] = useState({ ...emptyPkg });

  // Tier form
  const [tierForm, setTierForm] = useState({
    tier_name: "", tier_label: "", sort_order: 0, color_code: "#f59e0b",
  });

  // Room price per tier
  const [roomForms, setRoomForms] = useState<Record<string, { room_type: string; price: string; quota: string }>>({});

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [pkgRes, revRes, vendRes] = await Promise.all([
        fetch(`${API}/trip-packages`),
        fetch(`${API}/revenue-stats`),
        fetch(`${API}/vendors`),
      ]);
      
      if (!pkgRes.ok) throw new Error(`API Error: ${pkgRes.status} ${pkgRes.statusText}`);
      
      const pkgData = await pkgRes.json();
      setPackages(pkgData.packages || []);
      
      if (revRes.ok) {
        const revData = await revRes.json();
        setRevenue(revData.revenue || null);
      }
      
      if (vendRes.ok) {
        const vendData = await vendRes.json();
        setVendors(vendData.vendors || []);
      }
    } catch (e: any) {
      setApiError(e.message || "Koneksi API gagal. Pastikan server berjalan.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── CREATE PACKAGE ────────────────────────────────────────────────────────
  const createPackage = async () => {
    if (!pkgForm.name.trim()) return showToast("Nama paket wajib diisi", "err");
    if (!pkgForm.vendor_id) return showToast("Provider vendor wajib dipilih!", "err");
    setSavingPkg(true);
    try {
      const body = {
        ...pkgForm,
        duration_nights: Number(pkgForm.duration_nights),
        departure_date: pkgForm.departure_date || null,
        return_date: pkgForm.return_date || null,
      };
      const res = await fetch(`${API}/trip-packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal simpan paket");
      showToast(`Paket "${pkgForm.name}" berhasil dibuat! ✨`);
      setShowCreatePkg(false);
      setPkgForm({ ...emptyPkg });
      load();
    } catch (e: any) {
      showToast(e.message, "err");
    }
    setSavingPkg(false);
  };

  // ─── ADD TIER ─────────────────────────────────────────────────────────────
  const addTier = async (pkgId: string) => {
    if (!tierForm.tier_name.trim()) return showToast("Nama tier wajib diisi", "err");
    setSavingTier(true);
    try {
      const res = await fetch(`${API}/trip-packages/${pkgId}/tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tierForm, sort_order: Number(tierForm.sort_order) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal tambah tier");
      showToast(`Tier "${tierForm.tier_name}" berhasil ditambahkan!`);
      setShowAddTier(null);
      setTierForm({ tier_name: "", tier_label: "", sort_order: 0, color_code: "#f59e0b" });
      load();
    } catch (e: any) {
      showToast(e.message, "err");
    }
    setSavingTier(false);
  };

  // ─── ADD ROOM PRICE ───────────────────────────────────────────────────────
  const addRoomPrice = async (tierId: string) => {
    const rf = roomForms[tierId];
    if (!rf?.price) return showToast("Masukkan harga", "err");
    setSavingRoom(tierId);
    try {
      const res = await fetch(`${API}/tiers/${tierId}/room-prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_type: rf.room_type || "double",
          price: parseFloat(rf.price),
          quota: parseInt(rf.quota || "0"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal simpan harga");
      showToast("Harga kamar berhasil disimpan!");
      setRoomForms((p) => ({ ...p, [tierId]: { room_type: "double", price: "", quota: "" } }));
      load();
    } catch (e: any) {
      showToast(e.message, "err");
    }
    setSavingRoom(null);
  };

  const deleteRoomPrice = async (tierId: string, priceId: string) => {
    await fetch(`${API}/tiers/${tierId}/room-prices/${priceId}`, { method: "DELETE" });
    load();
  };
  const deleteTier = async (pkgId: string, tierId: string) => {
    if (!confirm("Hapus tier ini?")) return;
    await fetch(`${API}/trip-packages/${pkgId}/tiers/${tierId}`, { method: "DELETE" });
    load();
  };
  const deletePackage = async (id: string, name: string) => {
    if (!confirm(`Arsipkan paket "${name}"?`)) return;
    await fetch(`${API}/trip-packages/${id}`, { method: "DELETE" });
    showToast("Paket diarsipkan");
    load();
  };

  const idrCommitted = revenue?.total_idr_committed || 0;
  const idrDP = revenue?.total_idr_dp || 0;
  const usdCommitted = revenue?.total_usd_committed || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ─── TOAST ─────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[9999] px-6 py-4 rounded-2xl text-sm font-bold shadow-2xl animate-in slide-in-from-bottom-4 transition-all ${toast.type === "ok" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* ─── REVENUE STATS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* IDR Revenue */}
        <div className="md:col-span-1 p-8 rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 border border-brand-500/30 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[60px] rounded-full" />
          <p className="text-[9px] font-black text-brand-200 uppercase tracking-[0.4em] mb-3">IDR Committed</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none">
            Rp {Math.round(idrCommitted / 1000).toLocaleString("id-ID")}
            <span className="text-brand-300 text-xl ml-1 font-bold">rb</span>
          </h2>
          <div className="mt-4 flex items-center gap-3 text-[10px]">
            <span className="px-2 py-1 bg-white/20 rounded-full font-bold text-white">{revenue?.closing_count || 0} Closing</span>
            <span className="text-brand-300">+ Rp {Math.round(idrDP / 1000).toLocaleString("id-ID")}rb DP</span>
          </div>
        </div>

        {/* USD Revenue */}
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">USD Committed</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter">${usdCommitted.toLocaleString("en-US")}</h2>
          <p className="text-[10px] text-emerald-400 font-bold mt-3 uppercase">Full Payment USD</p>
        </div>

        {/* Pipeline Count */}
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-brand-500/20 transition-all">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Pipeline Aktif</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter">{(revenue?.closing_count || 0) + (revenue?.dp_count || 0)}</h2>
          <div className="flex gap-2 mt-4">
            <div className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <p className="text-sm font-black text-emerald-400">{revenue?.closing_count || 0}</p>
              <p className="text-[8px] text-slate-500 uppercase">Closing</p>
            </div>
            <div className="flex-1 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-sm font-black text-amber-400">{revenue?.dp_count || 0}</p>
              <p className="text-[8px] text-slate-500 uppercase">DP</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Daftar Paket Trip</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{packages.length} paket aktif</p>
        </div>
        <button
          onClick={() => setShowCreatePkg(true)}
          className="px-7 py-3.5 bg-brand-500 hover:brightness-110 active:scale-95 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
        >
          <span className="text-base">+</span> Buat Paket
        </button>
      </div>

      {/* ─── API ERROR ─────────────────────────────────────────────── */}
      {apiError && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-black text-red-400 mb-1">Koneksi API Gagal</p>
            <p className="text-xs text-red-300/70">{apiError}</p>
            <button onClick={load} className="mt-3 text-[10px] font-black text-red-400 border border-red-500/30 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-all uppercase tracking-widest">
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* ─── PACKAGE LIST ──────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 animate-pulse">Memuat Paket...</p>
        </div>
      ) : packages.length === 0 && !apiError ? (
        <div className="py-20 flex flex-col items-center gap-5 border border-dashed border-white/10 rounded-[2.5rem]">
          <div className="text-5xl">🕋</div>
          <div className="text-center">
            <p className="font-black text-white text-lg">Belum ada paket trip</p>
            <p className="text-sm text-slate-500 mt-1">Klik "Buat Paket" untuk memulai</p>
          </div>
          <button onClick={() => setShowCreatePkg(true)} className="px-6 py-3 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all">
            + Buat Paket Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              roomForms={roomForms}
              setRoomForms={setRoomForms}
              savingRoom={savingRoom}
              onAddTier={() => setShowAddTier({ pkgId: pkg.id, pkgCurrency: pkg.currency })}
              onAddRoomPrice={addRoomPrice}
              onDeleteRoomPrice={deleteRoomPrice}
              onDeleteTier={deleteTier}
              onDeletePackage={() => deletePackage(pkg.id, pkg.name)}
            />
          ))}
        </div>
      )}

      {/* ─── MODAL: CREATE PACKAGE ─────────────────────────────────── */}
      {showCreatePkg && (
        <Modal title="Buat Paket Trip Baru ✨" onClose={() => { setShowCreatePkg(false); setPkgForm({ ...emptyPkg }); }}>
          <div className="space-y-5">
            {/* Vendor Select */}
            <Field label="Penyelenggara (Vendor) *" hint="Data Vendor Premium Umrah Hub">
              <div className="relative">
                <select
                  value={pkgForm.vendor_id}
                  onChange={(e) => setPkgForm({ ...pkgForm, vendor_id: e.target.value })}
                  className="w-full bg-app border border-border-card rounded-2xl py-4 px-5 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none hover:border-brand-500/30 transition-all shadow-inner"
                >
                  <option value="" disabled>Pilih Penyelenggara Resmi...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.vendor_name} ({v.tier})</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-text-muted">▼</div>
              </div>
            </Field>

            {/* Name */}
            <Field label="Nama Paket Trip *" hint="Contoh: Umrah Liburan Syawal Berkah">
              <input
                value={pkgForm.name}
                onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                placeholder="Umrah Liburan Syawal"
                className="w-full bg-app border border-border-card rounded-2xl py-4 px-5 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder:text-text-muted/50 hover:border-brand-500/30 transition-all shadow-inner"
              />
            </Field>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tanggal Berangkat">
                <input type="date" value={pkgForm.departure_date}
                  onChange={(e) => setPkgForm({ ...pkgForm, departure_date: e.target.value })}
                  className="w-full bg-app border border-border-card rounded-2xl py-4 px-5 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 hover:border-brand-500/30 transition-all shadow-inner css-invert-calendar" />
              </Field>
              <Field label="Tanggal Kembali">
                <input type="date" value={pkgForm.return_date}
                  onChange={(e) => setPkgForm({ ...pkgForm, return_date: e.target.value })}
                  className="w-full bg-app border border-border-card rounded-2xl py-4 px-5 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 hover:border-brand-500/30 transition-all shadow-inner css-invert-calendar" />
              </Field>
            </div>

            {/* Destination + Duration */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Destinasi">
                <input value={pkgForm.destination}
                  onChange={(e) => setPkgForm({ ...pkgForm, destination: e.target.value })}
                  className="w-full bg-app border border-border-card rounded-2xl py-4 px-5 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 hover:border-brand-500/30 transition-all shadow-inner" />
              </Field>
              <Field label="Durasi (Malam)">
                <input type="number" min="1" value={pkgForm.duration_nights}
                  onChange={(e) => setPkgForm({ ...pkgForm, duration_nights: parseInt(e.target.value) || 1 })}
                  className="w-full bg-app border border-border-card rounded-2xl py-4 px-5 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 hover:border-brand-500/30 transition-all shadow-inner" />
              </Field>
            </div>

            {/* Currency */}
            <Field label="Mata Uang Paket">
              <div className="flex gap-3">
                {["IDR", "USD"].map((c) => (
                  <button key={c} type="button" onClick={() => setPkgForm({ ...pkgForm, currency: c })}
                    className={`flex-1 py-3.5 rounded-2xl text-sm font-black uppercase border transition-all ${pkgForm.currency === c ? "bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/20" : "bg-white/5 border-white/8 text-slate-400 hover:text-white hover:border-white/15"}`}>
                    {c === "IDR" ? "🇮🇩 IDR (Rupiah)" : "🇺🇸 USD (Dollar)"}
                  </button>
                ))}
              </div>
              {pkgForm.currency === "IDR" && (
                <p className="text-[9px] text-amber-400 font-bold mt-2">💡 Harga IDR akan tampil dalam ribuan (Rp 45.000.000 → Rp 45.000rb)</p>
              )}
            </Field>

            {/* Description */}
            <Field label="Deskripsi Paket Utama" hint="Informasikan detail tiket hotel, maskapai, fasilitas dll.">
              <textarea value={pkgForm.description}
                onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                rows={3} placeholder="Makkah: Swissotel Al Maqam\nMadinah: Dallah Taibah\nMaskapai: Saudia Airlines Direct\nFasilitas Utama: Kereta Cepat Haramain, Full Board Meals..."
                className="w-full bg-app border border-border-card rounded-2xl py-4 px-5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder:text-text-muted/50 hover:border-brand-500/30 transition-all resize-none shadow-inner" />
            </Field>
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={createPackage} disabled={savingPkg || !pkgForm.name.trim()}
              className="flex-1 py-4 bg-brand-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2">
              {savingPkg ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Menyimpan...</> : "🚀 Simpan Paket"}
            </button>
            <button onClick={() => { setShowCreatePkg(false); setPkgForm({ ...emptyPkg }); }}
              className="px-6 py-4 border border-white/10 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:text-white transition-all">
              Batal
            </button>
          </div>
        </Modal>
      )}

      {/* ─── MODAL: ADD TIER ───────────────────────────────────────── */}
      {showAddTier && (
        <Modal title="Tambah Kelas / Tier 🏆" onClose={() => { setShowAddTier(null); setTierForm({ tier_name: "", tier_label: "", sort_order: 0, color_code: "#f59e0b" }); }}>
          {/* Quick Presets */}
          <div className="mb-6">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Preset Cepat</p>
            <div className="flex flex-wrap gap-2">
              {TIER_PRESETS.map((p) => (
                <button key={p.name} type="button"
                  onClick={() => setTierForm({ tier_name: p.name, tier_label: p.label, sort_order: 0, color_code: p.color })}
                  className="px-4 py-2 rounded-xl text-[10px] font-black border transition-all hover:scale-105"
                  style={{ borderColor: p.color + "60", background: p.color + "15", color: p.color }}>
                  {p.name}
                </button>
              ))}
              <button type="button"
                onClick={() => setTierForm({ tier_name: "Kelas 1", tier_label: "Executive", sort_order: 0, color_code: "#6366f1" })}
                className="px-4 py-2 rounded-xl text-[10px] font-black border border-brand-500/40 bg-brand-500/10 text-brand-400 transition-all hover:scale-105">
                Custom
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nama Tier *" hint="e.g. VVIP, Gold, Kelas 1">
                <input value={tierForm.tier_name}
                  onChange={(e) => setTierForm({ ...tierForm, tier_name: e.target.value })}
                  placeholder="VVIP"
                  className="w-full bg-app border border-border-card rounded-2xl py-4 px-5 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder:text-text-muted/50 hover:border-brand-500/30 transition-all shadow-inner" autoFocus />
              </Field>
              <Field label="Sub-label" hint="e.g. Full Private, Premium">
                <input value={tierForm.tier_label}
                  onChange={(e) => setTierForm({ ...tierForm, tier_label: e.target.value })}
                  placeholder="Full Private"
                  className="w-full bg-app border border-border-card rounded-2xl py-4 px-5 text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder:text-text-muted/50 hover:border-brand-500/30 transition-all shadow-inner" />
              </Field>
            </div>

            <Field label="Warna Identitas Tier">
              <div className="flex items-center gap-3">
                <input type="color" value={tierForm.color_code}
                  onChange={(e) => setTierForm({ ...tierForm, color_code: e.target.value })}
                  className="w-14 h-12 rounded-xl border-0 cursor-pointer p-0.5 bg-transparent" />
                <span className="text-sm font-bold text-slate-400">{tierForm.color_code}</span>
                <div className="flex gap-2 flex-wrap">
                  {["#f59e0b", "#eab308", "#94a3b8", "#6366f1", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"].map((c) => (
                    <button key={c} type="button" onClick={() => setTierForm({ ...tierForm, color_code: c })}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${tierForm.color_code === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </Field>

            {/* Preview */}
            {tierForm.tier_name && (
              <div className="p-4 rounded-2xl border" style={{ borderColor: tierForm.color_code + "50", background: tierForm.color_code + "10" }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: tierForm.color_code }} />
                  <span className="text-sm font-black text-white uppercase italic">{tierForm.tier_name}</span>
                  {tierForm.tier_label && <span className="text-[10px] text-slate-400 font-bold">— {tierForm.tier_label}</span>}
                </div>
                <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase">Preview tier yang akan dibuat</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={() => addTier(showAddTier.pkgId)} disabled={savingTier || !tierForm.tier_name.trim()}
              className="flex-1 py-4 bg-brand-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2">
              {savingTier ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Menyimpan...</> : "🏆 Simpan Tier"}
            </button>
            <button onClick={() => setShowAddTier(null)}
              className="px-6 py-4 border border-white/10 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:text-white transition-all">
              Batal
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Modal Wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-card border border-border-card rounded-[2.5rem] p-8 w-full max-w-2xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8 border-b border-border-card pb-5">
          <h3 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter flex items-center gap-3">
             <span className="text-brand-500">🕋</span> {title}
          </h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl border border-border-card text-text-muted hover:text-white hover:bg-card-hover hover:border-white/10 transition-all">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Field Wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[9px] font-black text-brand-400 uppercase tracking-widest block mb-2">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-slate-600 mt-1.5 font-medium">{hint}</p>}
    </div>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────────
function PackageCard({
  pkg, roomForms, setRoomForms, savingRoom, onAddTier, onAddRoomPrice, onDeleteRoomPrice, onDeleteTier, onDeletePackage
}: {
  pkg: TripPackage;
  roomForms: Record<string, any>;
  setRoomForms: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  savingRoom: string | null;
  onAddTier: () => void;
  onAddRoomPrice: (tierId: string) => void;
  onDeleteRoomPrice: (tierId: string, priceId: string) => void;
  onDeleteTier: (pkgId: string, tierId: string) => void;
  onDeletePackage: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white/[0.015] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-brand-500/20 transition-all shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-8 gap-4">
        <div className="flex items-start gap-5 cursor-pointer flex-1" onClick={() => setExpanded(!expanded)}>
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-2xl shrink-0">🕋</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${pkg.status === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"}`}>
                {pkg.status}
              </span>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${pkg.currency === "IDR" ? "border-amber-500/30 text-amber-400" : "border-emerald-500/30 text-emerald-400"}`}>
                {pkg.currency}
              </span>
              {pkg.tiers?.length > 0 && (
                <span className="text-[8px] font-bold text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">
                  {pkg.tiers.length} Tier
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-white italic tracking-tight truncate">{pkg.name}</h3>
            <div className="flex flex-wrap gap-4 mt-1.5 text-[9px] text-slate-500 font-bold uppercase">
              <span>📍 {pkg.destination}</span>
              {pkg.departure_date && <span>✈️ {new Date(pkg.departure_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>}
              <span>🌙 {pkg.duration_nights} Malam</span>
            </div>
            {pkg.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{pkg.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onAddTier} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all">
            + Tier
          </button>
          <button onClick={() => setExpanded(!expanded)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/8 text-slate-400 hover:text-white transition-all text-xs">
            {expanded ? "▲" : "▼"}
          </button>
          <button onClick={onDeletePackage} className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">
            ✕
          </button>
        </div>
      </div>

      {/* Tiers */}
      {expanded && pkg.tiers && pkg.tiers.length > 0 && (
        <div className="px-6 md:px-8 pb-8">
          <div className="border-t border-white/5 pt-6">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-5">Struktur Tier & Harga Kamar</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {pkg.tiers.sort((a, b) => a.sort_order - b.sort_order).map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  currency={pkg.currency}
                  form={roomForms[tier.id] || { room_type: "double", price: "", quota: "" }}
                  saving={savingRoom === tier.id}
                  onFormChange={(field, val) => setRoomForms((p) => ({ ...p, [tier.id]: { ...(p[tier.id] || { room_type: "double", price: "", quota: "" }), [field]: val } }))}
                  onAddPrice={() => onAddRoomPrice(tier.id)}
                  onDeletePrice={(priceId) => onDeleteRoomPrice(tier.id, priceId)}
                  onDeleteTier={() => onDeleteTier(pkg.id, tier.id)}
                />
              ))}
              {/* Add Tier Prompt */}
              <button onClick={onAddTier} className="rounded-[1.5rem] border-2 border-dashed border-white/5 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all p-8 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-brand-400 min-h-[200px]">
                <span className="text-3xl">+</span>
                <span className="text-[9px] font-black uppercase tracking-widest">Tambah Tier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {expanded && (!pkg.tiers || pkg.tiers.length === 0) && (
        <div className="px-8 pb-8">
          <button onClick={onAddTier} className="w-full py-8 border-2 border-dashed border-white/5 hover:border-brand-500/30 hover:bg-brand-500/5 rounded-[1.5rem] transition-all flex flex-col items-center gap-3 text-slate-500 hover:text-brand-400">
            <span className="text-3xl">🏆</span>
            <span className="text-xs font-bold">Tambah tier kelas pertama (VVIP, Gold, Silver, dsb)</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tier Card ─────────────────────────────────────────────────────────────────
function TierCard({
  tier, currency, form, saving, onFormChange, onAddPrice, onDeletePrice, onDeleteTier
}: {
  tier: PackageTier;
  currency: string;
  form: { room_type: string; price: string; quota: string };
  saving: boolean;
  onFormChange: (field: string, val: string) => void;
  onAddPrice: () => void;
  onDeletePrice: (priceId: string) => void;
  onDeleteTier: () => void;
}) {
  return (
    <div className="rounded-[1.5rem] border overflow-hidden" style={{ borderColor: tier.color_code + "40" }}>
      {/* Tier Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: tier.color_code + "18" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: tier.color_code }} />
          <div>
            <p className="text-sm font-black text-white uppercase italic">{tier.tier_name}</p>
            {tier.tier_label && <p className="text-[9px] text-slate-400 font-bold uppercase">{tier.tier_label}</p>}
          </div>
        </div>
        <button onClick={onDeleteTier} className="w-6 h-6 flex items-center justify-center rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all text-[10px]">✕</button>
      </div>

      {/* Room Prices */}
      <div className="p-4 space-y-2 bg-black/30">
        {ROOM_TYPES.map((rt) => {
          const rp = tier.room_prices?.find((r) => r.room_type === rt);
          return (
            <div key={rt} className={`flex justify-between items-center px-3 py-2.5 rounded-xl border text-sm transition-all ${rp ? "border-white/5 bg-white/[0.03]" : "border-dashed border-white/[0.04] opacity-40"}`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{ROOM_LABELS[rt]}</span>
              {rp ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white italic">
                    {currency === "IDR"
                      ? `Rp ${Math.round(rp.price / 1000).toLocaleString("id-ID")}rb`
                      : `$${rp.price.toLocaleString("en-US")}`}
                  </span>
                  <button onClick={() => onDeletePrice(rp.id)} className="w-5 h-5 flex items-center justify-center text-red-400/40 hover:text-red-400 text-[9px] transition-all">✕</button>
                </div>
              ) : (
                <span className="text-[9px] text-slate-600 italic">– belum diset</span>
              )}
            </div>
          );
        })}

        {/* Add Room Price */}
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.room_type || "double"}
              onChange={(e) => onFormChange("room_type", e.target.value)}
              className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-[10px] font-black text-white outline-none uppercase"
            >
              {ROOM_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
            </select>
            <input
              type="number"
              placeholder={currency === "IDR" ? "45000000" : "3500"}
              value={form.price || ""}
              onChange={(e) => onFormChange("price", e.target.value)}
              className="bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-[10px] font-bold text-white outline-none"
            />
          </div>
          {currency === "IDR" && form.price && (
            <p className="text-[9px] text-amber-400 font-bold px-1">≈ Rp {Math.round(parseFloat(form.price) / 1000).toLocaleString("id-ID")}rb / orang</p>
          )}
          <button
            onClick={onAddPrice}
            disabled={!form.price || saving}
            className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: tier.color_code + "25", border: `1px solid ${tier.color_code}50`, color: tier.color_code }}
          >
            {saving ? <div className="w-3 h-3 border-2 border-current/40 border-t-current rounded-full animate-spin" /> : null}
            {saving ? "Menyimpan..." : "Set Harga"}
          </button>
        </div>
      </div>
    </div>
  );
}
