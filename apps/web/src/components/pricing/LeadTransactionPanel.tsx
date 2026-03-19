"use client";

import React, { useEffect, useState } from "react";

const API = "http://localhost:8081/api/v1/public";

interface TierRoomPrice {
  id: string;
  room_type: string;
  price: number;
  quota: number;
}

interface PackageTier {
  id: string;
  tier_name: string;
  tier_label: string;
  color_code: string;
  sort_order: number;
  room_prices: TierRoomPrice[];
}

interface TripPackage {
  id: string;
  name: string;
  currency: "IDR" | "USD";
  departure_date?: string;
  status: string;
  tiers: PackageTier[];
}

interface LeadTransaction {
  id: string;
  transaction_type: "dp" | "full_payment";
  trip_package_id?: string;
  tier_id?: string;
  room_price_id?: string;
  dp_amount?: number;
  final_amount: number;
  currency: string;
  pax_count: number;
  notes: string;
  trip_package?: TripPackage;
  tier?: PackageTier;
}

// IDR Redenomination: remove 3 trailing zeros
function formatIDR(amount: number): string {
  const redenominated = Math.round(amount / 1000);
  return `Rp ${redenominated.toLocaleString("id-ID")}`;
}

function formatUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function formatCurrency(amount: number, currency: string): string {
  return currency === "IDR" ? formatIDR(amount) : formatUSD(amount);
}

interface Props {
  leadId: string;
  currentStatus: string;
  onTransactionCommit?: () => void;
}

export default function LeadTransactionPanel({ leadId, currentStatus, onTransactionCommit }: Props) {
  const [packages, setPackages] = useState<TripPackage[]>([]);
  const [existing, setExisting] = useState<LeadTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [selectedPackage, setSelectedPackage] = useState<TripPackage | null>(null);
  const [selectedTier, setSelectedTier] = useState<PackageTier | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<TierRoomPrice | null>(null);
  const [paxCount, setPaxCount] = useState(1);
  const [dpAmount, setDpAmount] = useState("");
  const [notes, setNotes] = useState("");

  const isDP = currentStatus === "dp";
  const isClosing = currentStatus === "closing";
  const isActive = isDP || isClosing;

  useEffect(() => {
    if (!isActive) return;
    const load = async () => {
      setLoading(true);
      const [pkgRes, txRes] = await Promise.all([
        fetch(`${API}/trip-packages`).then((r) => r.json()).catch(() => ({ packages: [] })),
        fetch(`${API}/leads/${leadId}/transactions`).then((r) => r.json()).catch(() => ({ transaction: null })),
      ]);
      setPackages(pkgRes.packages || []);
      setExisting(txRes.transaction || null);
      setLoading(false);
    };
    load();
  }, [leadId, isActive, currentStatus]);

  // Auto-set currency display
  const currency = selectedPackage?.currency || "IDR";

  // Compute final amount
  const pricePerPax = selectedRoom?.price || 0;
  const finalAmount = pricePerPax * paxCount;

  const handleCommit = async () => {
    if (!isActive) return;
    setIsSubmitting(true);

    const payload: any = {
      trip_package_id: selectedPackage?.id || "",
      tier_id: selectedTier?.id || "",
      room_price_id: selectedRoom?.id || "",
      transaction_type: isDP ? "dp" : "full_payment",
      pax_count: paxCount,
      notes,
    };

    if (isDP && dpAmount) {
      payload.dp_amount = parseFloat(dpAmount);
    }

    try {
      const res = await fetch(`${API}/leads/${leadId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setExisting(data.transaction);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onTransactionCommit?.();
      }
    } catch {}
    setIsSubmitting(false);
  };

  if (!isActive) {
    return (
      <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">💰</div>
        <div>
          <p className="text-[10px] font-black text-white uppercase tracking-widest">Transaction Engine</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Aktif saat status lead <span className="text-amber-400 font-black">DP</span> atau <span className="text-emerald-400 font-black">CLOSING</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-[2.5rem] border overflow-hidden transition-all ${isClosing ? "border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.05)]" : "border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.05)]"}`}>
      {/* Header */}
      <div className={`px-8 py-5 flex items-center justify-between ${isClosing ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl ${isClosing ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
            {isClosing ? "💰" : "💳"}
          </div>
          <div>
            <p className={`text-[11px] font-black uppercase tracking-widest ${isClosing ? "text-emerald-400" : "text-amber-400"}`}>
              {isClosing ? "Full Closing — Revenue Commit" : "Down Payment — DP Commit"}
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">Inject ke pipeline revenue otomatis</p>
          </div>
        </div>
        {existing && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase">Recorded</span>
          </div>
        )}
      </div>

      {/* Existing Transaction Preview */}
      {existing && (
        <div className="px-8 py-5 bg-white/[0.02] border-b border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Transaksi Tersimpan</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Paket</p>
              <p className="text-xs font-black text-white truncate">{existing.trip_package?.name || "—"}</p>
            </div>
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Tier</p>
              <p className="text-xs font-black text-white">{existing.tier?.tier_name || "—"}</p>
            </div>
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] text-slate-500 uppercase font-black mb-1">{existing.transaction_type === "dp" ? "DP Nominal" : "Final Amount"}</p>
              <p className="text-sm font-black text-white">
                {existing.transaction_type === "dp" && existing.dp_amount
                  ? formatCurrency(existing.dp_amount, existing.currency)
                  : formatCurrency(existing.final_amount, existing.currency)}
              </p>
            </div>
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Pax</p>
              <p className="text-sm font-black text-white">{existing.pax_count} orang</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="p-8 space-y-6">
        {loading ? (
          <div className="py-8 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
            <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Loading Packages...</span>
          </div>
        ) : (
          <>
            {/* Step 1: Select Package */}
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">1 · Pilih Paket Perjalanan</label>
              {packages.length === 0 ? (
                <div className="p-4 border border-dashed border-white/10 rounded-2xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold">Belum ada paket. Buat dulu di halaman Packages.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {packages.filter(p => p.status === "active" || (p as any).status !== "archived").map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => { setSelectedPackage(pkg); setSelectedTier(null); setSelectedRoom(null); }}
                      className={`text-left px-5 py-4 rounded-2xl border text-sm font-bold transition-all flex items-center justify-between ${selectedPackage?.id === pkg.id ? "bg-brand-500/20 border-brand-500/50 text-white" : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10 hover:text-white"}`}
                    >
                      <div>
                        <span className="font-black">{pkg.name}</span>
                        {pkg.departure_date && <span className="text-[9px] text-slate-500 ml-3 font-bold">{new Date(pkg.departure_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${pkg.currency === "IDR" ? "border-amber-500/30 text-amber-400" : "border-emerald-500/30 text-emerald-400"}`}>{pkg.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Select Tier */}
            {selectedPackage && (
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">2 · Pilih Tier Kelas</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(selectedPackage.tiers || []).sort((a, b) => a.sort_order - b.sort_order).map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => { setSelectedTier(tier); setSelectedRoom(null); }}
                      className={`px-4 py-4 rounded-2xl border font-black text-sm transition-all text-center ${selectedTier?.id === tier.id ? "text-white" : "text-slate-400 hover:text-white"}`}
                      style={{ borderColor: selectedTier?.id === tier.id ? tier.color_code : "rgba(255,255,255,0.08)", background: selectedTier?.id === tier.id ? tier.color_code + "25" : "transparent" }}
                    >
                      <span className="text-xs">{tier.tier_name}</span>
                      {tier.tier_label && <p className="text-[8px] font-bold mt-0.5 opacity-70">{tier.tier_label}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Select Room Type */}
            {selectedTier && (
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">3 · Pilih Tipe Kamar</label>
                <div className="grid grid-cols-2 gap-3">
                  {(selectedTier.room_prices || []).map((rp) => (
                    <button
                      key={rp.id}
                      onClick={() => setSelectedRoom(rp)}
                      className={`px-5 py-5 rounded-2xl border font-bold text-sm transition-all text-left ${selectedRoom?.id === rp.id ? "bg-brand-500/20 border-brand-500/50" : "bg-white/[0.02] border-white/5 hover:border-white/10"}`}
                    >
                      <p className="text-[10px] text-slate-500 uppercase font-black capitalize">{rp.room_type}</p>
                      <p className="text-xl font-black text-white mt-1">
                        {selectedPackage?.currency === "IDR" ? formatIDR(rp.price) : formatUSD(rp.price)}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">per orang</p>
                    </button>
                  ))}
                  {(selectedTier.room_prices || []).length === 0 && (
                    <p className="col-span-2 text-[10px] text-slate-500 text-center py-4">Belum ada harga kamar di tier ini.</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Pax Count + DP/Final */}
            {selectedRoom && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">4 · Jumlah Pax</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPaxCount(Math.max(1, paxCount - 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 transition-all">−</button>
                      <span className="text-xl font-black text-white w-8 text-center">{paxCount}</span>
                      <button onClick={() => setPaxCount(paxCount + 1)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 transition-all">+</button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Total Harga Paket</p>
                    <p className="text-xl font-black text-white">
                      {currency === "IDR" ? formatIDR(finalAmount) : formatUSD(finalAmount)}
                    </p>
                    <p className="text-[8px] text-slate-500 mt-1">{paxCount} pax × {currency === "IDR" ? formatIDR(pricePerPax) : formatUSD(pricePerPax)}</p>
                  </div>
                </div>

                {/* DP Only: Custom nominal input */}
                {isDP && (
                  <div>
                    <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-2">DP Nominal (Custom) — Bukan harga final</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">{currency === "IDR" ? "Rp" : "$"}</span>
                      <input
                        type="number"
                        value={dpAmount}
                        onChange={(e) => setDpAmount(e.target.value)}
                        placeholder={currency === "IDR" ? "5000000" : "500"}
                        className="w-full bg-amber-500/5 border border-amber-500/30 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-white outline-none focus:border-amber-500/60 transition-all"
                      />
                    </div>
                    {dpAmount && currency === "IDR" && (
                      <p className="text-[9px] text-amber-400 mt-2 font-bold">{formatIDR(parseFloat(dpAmount))} (Redenominated)</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Catatan Tambahan</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bukti transfer, bank tujuan, catatan CS..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white outline-none focus:border-white/10 transition-all"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Commit Button */}
        {selectedRoom && !loading && (
          <button
            onClick={handleCommit}
            disabled={isSubmitting || (isDP && !dpAmount)}
            className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl disabled:opacity-40 flex items-center justify-center gap-3 ${isClosing ? "bg-emerald-500 hover:brightness-110 text-white shadow-emerald-500/20" : "bg-amber-500 hover:brightness-110 text-white shadow-amber-500/20"}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Committing...
              </>
            ) : success ? (
              "✓ Revenue Committed!"
            ) : isClosing ? (
              `💰 Commit Full Closing — ${currency === "IDR" ? formatIDR(finalAmount) : formatUSD(finalAmount)}`
            ) : (
              `💳 Commit DP — ${dpAmount ? (currency === "IDR" ? formatIDR(parseFloat(dpAmount)) : formatUSD(parseFloat(dpAmount))) : "Set Nominal"}`
            )}
          </button>
        )}
      </div>
    </div>
  );
}
