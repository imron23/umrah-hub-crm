"use client";

import React, { useEffect, useState } from 'react';

export default function FinanceDashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8081/api/v1/public/transactions')
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatIDR = (val: number) => {
    // Redenomination simulation
    if (val >= 1000) {
      return (val / 1000).toLocaleString('id-ID') + 'K';
    }
    return val.toLocaleString('id-ID');
  };

  const formatUSD = (val: number) => {
    return '$ ' + val.toLocaleString('en-US');
  };

  // Aggregation
  const idrTx = transactions.filter(t => t.currency === 'IDR');
  const usdTx = transactions.filter(t => t.currency === 'USD');

  const totalIDRRev = idrTx.reduce((acc, t) => acc + (t.final_amount || 0), 0);
  const totalUSDRev = usdTx.reduce((acc, t) => acc + (t.final_amount || 0), 0);

  const totalIDRDP = idrTx.reduce((acc, t) => acc + (t.dp_amount || 0), 0);
  const totalUSDDP = usdTx.reduce((acc, t) => acc + (t.dp_amount || 0), 0);

  const totalPax = transactions.reduce((acc, t) => acc + (t.pax_count || 1), 0);

  if (loading) {
     return <div className="p-20 text-center text-text-muted">Loading Financial Data...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-app h-screen p-4 md:p-8 lg:p-12 relative animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase italic">
                Financial Core
            </h1>
            <p className="text-text-muted font-bold text-sm uppercase tracking-[0.2em]">Revenue & Transaction Metrics</p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* IDR Card */}
            <div className="bg-card p-8 border border-border-card rounded-[3rem] relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[50px] pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-6">IDR Top Line Revenue</p>
                <div className="flex items-end gap-2 text-emerald-400">
                    <span className="text-2xl font-bold mb-1 border-b-2 border-emerald-400/30">Rp</span>
                    <span className="text-5xl font-black tracking-tighter tabular-nums">{formatIDR(totalIDRRev)}</span>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-bold">DP Collected</span>
                        <span className="text-text-primary font-black tabular-nums">Rp {formatIDR(totalIDRDP)}</span>
                    </div>
                </div>
            </div>

            {/* USD Card */}
            <div className="bg-card p-8 border border-border-card rounded-[3rem] relative overflow-hidden group hover:border-brand-500/30 transition-all">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-500/10 blur-[50px] pointer-events-none group-hover:bg-brand-500/20 transition-all" />
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-6">USD Exclusive Revenue</p>
                <div className="flex items-end gap-2 text-brand-400">
                    <span className="text-5xl font-black tracking-tighter tabular-nums">{formatUSD(totalUSDRev)}</span>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-bold">DP Collected</span>
                        <span className="text-text-primary font-black tabular-nums">{formatUSD(totalUSDDP)}</span>
                    </div>
                </div>
            </div>

            {/* Volume Card */}
            <div className="bg-card p-8 border border-border-card rounded-[3rem] relative overflow-hidden flex flex-col justify-center">
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-6 text-center">Total Conversion</p>
                <div className="text-center">
                    <span className="text-7xl font-black text-text-primary tracking-tighter leading-none">{transactions.length}</span>
                    <span className="text-text-muted text-sm font-bold ml-2">Deals</span>
                </div>
                <div className="mt-6 flex justify-center">
                   <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black text-text-muted">
                        Total Pax: <span className="text-white ml-2">{totalPax} jamaah</span>
                   </div>
                </div>
            </div>

        </div>

        {/* Transaction Ledger */}
        <div className="bg-surface border border-border-card rounded-[2rem] overflow-hidden">
            <div className="p-8 border-b border-border-card flex items-center justify-between">
                <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Recent Transactions</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-card/40">
                        <tr>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest">Lead / Transaction ID</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest text-center">Type</th>
                            <th className="px-4 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest text-center">Pax</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-text-muted tracking-widest text-right">Value Generated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-card">
                        {transactions.slice().sort((a,b)=>new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(tx => (
                            <tr key={tx.id} className="hover:bg-card-hover transition-all group">
                                <td className="px-8 py-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-text-primary font-mono">{tx.id.split('-')[0]}</span>
                                        <span className="text-[10px] text-text-muted line-clamp-1 max-w-sm">{tx.notes}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-5 text-center">
                                     <span className={`px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black uppercase tracking-widest ${tx.transaction_type === 'dp' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'}`}>
                                        {tx.transaction_type.replace('_', ' ')}
                                     </span>
                                </td>
                                <td className="px-4 py-5 text-center text-sm font-bold text-text-secondary">
                                    {tx.pax_count} <span className="text-xs font-normal">pax</span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-sm font-black text-white tabular-nums">
                                            {tx.currency === 'IDR' ? `Rp ${formatIDR(tx.final_amount)}` : formatUSD(tx.final_amount)}
                                        </span>
                                        <span className="text-[10px] font-bold text-text-muted">
                                            DP: {tx.currency==='IDR'?`Rp ${formatIDR(tx.dp_amount||0)}`:formatUSD(tx.dp_amount||0)}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}
