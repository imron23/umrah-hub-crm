"use client";

import React, { useState, useEffect } from 'react';

interface DeletedItem {
    id: string;
    name?: string;
    deleted_at: string;
    type: 'lead' | 'package' | 'campaign' | 'lp';
}

export default function RecycleBinPage() {
    const [items, setItems] = useState<any>({ leads: [], packages: [], campaigns: [], lps: [] });
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            // In a real app, this would use the auth token
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/v1/public/recycle-bin`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });
            const data = await res.json();
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch deleted items", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: string, type: string) => {
        setRestoring(id);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/v1/public/recycle-bin/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({ id, type })
            });

            if (res.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error("Restore failed", error);
        } finally {
            setRestoring(null);
        }
    };

    const handlePurge = async (id: string, type: string) => {
        if (!confirm("Are you sure? This item will be deleted PERMANENTLY from the Quantum Realm.")) return;
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/v1/public/recycle-bin/purge/${id}?type=${type}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (res.ok) {
                fetchItems();
            }
        } catch (error) {
            console.error("Purge failed", error);
        }
    };

    const totalItems = (items.leads?.length || 0) + (items.packages?.length || 0) + (items.campaigns?.length || 0) + (items.lps?.length || 0);

    return (
        <div className="min-h-screen bg-[#020617] text-white p-6 md:p-10 space-y-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-brand-500 rounded-full" />
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase">The Void</h1>
                    </div>
                    <p className="text-slate-400 text-sm font-medium tracking-wide">Recycle Bin / <span className="text-brand-400">Quantum Storage</span></p>
                </div>
                
                <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entropy Level</p>
                            <p className="text-xl font-black text-white">{totalItems} Items</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 border border-brand-500/30">
                            🗑️
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <div className="w-12 h-12 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-500">Scanning the Void...</p>
                </div>
            ) : totalItems === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] bg-white/[0.02] rounded-[3rem] border border-dashed border-white/10">
                    <span className="text-6xl mb-6 opacity-20">🪐</span>
                    <h3 className="text-xl font-bold text-slate-400">The Void is Empty</h3>
                    <p className="text-sm text-slate-600">No signals found in the quantum storage.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEADS */}
                    {items.leads?.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-[11px] font-black text-brand-400 uppercase tracking-[0.2em] ml-2">De-materialized Leads</h2>
                            <div className="space-y-3">
                                {items.leads.map((l: any) => (
                                    <ItemCard key={l.id} item={l} type="lead" onRestore={handleRestore} onPurge={handlePurge} restoring={restoring === l.id} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PACKAGES */}
                    {items.packages?.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-[11px] font-black text-amber-400 uppercase tracking-[0.2em] ml-2">Archived Inventory</h2>
                            <div className="space-y-3">
                                {items.packages.map((p: any) => (
                                    <ItemCard key={p.id} item={p} type="package" onRestore={handleRestore} onPurge={handlePurge} restoring={restoring === p.id} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ItemCard({ item, type, onRestore, onPurge, restoring }: any) {
    const formattedDate = new Date(item.deleted_at || Date.now()).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const icons = {
        lead: '👤',
        package: '📦',
        campaign: '📢',
        lp: '🔗'
    };

    return (
        <div className="bg-[#080c14] border border-white/10 p-5 rounded-3xl hover:border-brand-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-[50px] pointer-events-none group-hover:bg-brand-500/10 transition-all" />
            
            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                        {icons[type as keyof typeof icons]}
                    </div>
                    <div>
                        <h4 className="font-bold text-white group-hover:text-brand-400 transition-colors">{item.name || item.title || 'Untitled Entity'}</h4>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Erased: {formattedDate}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onRestore(item.id, type)}
                        disabled={restoring}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${restoring ? 'bg-white/5 text-slate-600' : 'bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white shadow-lg'}`}
                    >
                        {restoring ? 'Restoring...' : 'Restore'}
                    </button>
                    <button 
                        onClick={() => onPurge(item.id, type)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        title="Purge Permanently"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
}
