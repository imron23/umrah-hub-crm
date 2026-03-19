"use client";

import React, { useState, useEffect } from 'react';

interface APIConfig {
  id?: string;
  vendor_name: string;
  provider_type: string;
  api_key: string;
  api_secret: string;
  endpoint: string;
  status: string;
  priority: number;
  config_jsonText?: string;
}

const VENDORS = [
    { name: 'Fonnte', type: 'whatsapp', icon: '💬' },
    { name: 'Wablas', type: 'whatsapp', icon: '📱' },
    { name: 'Twilio', type: 'sms', icon: '✉️' },
    { name: 'Mailgun', type: 'email', icon: '📧' },
    { name: 'SendGrid', type: 'email', icon: '📤' },
    { name: 'Byteplus AI', type: 'nlp', icon: '🧠' },
    { name: 'Meta CAPI', type: 'conversion', icon: '🎯' },
    { name: 'Custom Hook', type: 'webhook', icon: '🔗' },
];

export default function APIBridgePage() {
    const [configs, setConfigs] = useState<APIConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingConfig, setEditingConfig] = useState<APIConfig | null>(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            // Mocking data since DB table 'api_configs' handles are not yet defined
            const mockData = [
                {
                    id: "evt-byte",
                    vendor_name: "Byteplus AI",
                    provider_type: "nlp",
                    api_key: "sk-_WZk981NpEyRqeApOT1f3A",
                    api_secret: "",
                    endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
                    status: "active",
                    priority: 1
                }
            ];
            setConfigs(mockData as any);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingConfig) return;
        setSaving(true);
        try {
            const res = await fetch('http://localhost:8081/api/v1/public/api-configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingConfig)
            });
            if (res.ok) {
                setEditingConfig(null);
                fetchConfigs();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em] mb-3 block">Infrastructure layer</span>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Universal API Bridge</h1>
                    <p className="text-slate-400 mt-2">Manage redundant multi-vendor integrations with automated failover logic.</p>
                </div>
                <button 
                    onClick={() => setEditingConfig({
                        vendor_name: '',
                        provider_type: 'whatsapp',
                        api_key: '',
                        api_secret: '',
                        endpoint: '',
                        status: 'active',
                        priority: 1
                    })}
                    className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:invert transition-all"
                >
                    + Add New Provider
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* CONFIG LIST */}
                <div className="xl:col-span-2 space-y-6">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center bg-white/[0.02] rounded-[40px] border border-white/5">
                            <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {configs.map((conf) => (
                                <div key={conf.id} className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-2xl">
                                                {VENDORS.find(v => v.name === conf.vendor_name)?.icon || '🔗'}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white uppercase italic">{conf.vendor_name}</h3>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{conf.provider_type}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                conf.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                            }`}>
                                                {conf.status}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Priority {conf.priority}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Endpoint</p>
                                            <p className="text-[10px] text-slate-300 font-mono truncate">{conf.endpoint || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                                            <p className="text-[8px] text-slate-500 uppercase font-black mb-1">API Key / Token</p>
                                            <p className="text-[10px] text-slate-300 font-mono">••••••••••••••••</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setEditingConfig(conf)}
                                        className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                                    >
                                        Configure Integration
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* EDITOR SIDEBAR */}
                <div className="relative">
                    {editingConfig ? (
                        <div className="sticky top-10 p-10 rounded-[40px] bg-white/[0.03] border border-white/10 animate-in slide-in-from-right-10 duration-500">
                             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8">
                                {editingConfig.id ? 'Edit Provider' : 'Direct Inject API'}
                             </h2>
                             
                             <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Select Vendor Hub</label>
                                    <select 
                                        value={editingConfig.vendor_name}
                                        onChange={(e) => setEditingConfig({...editingConfig, vendor_name: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-brand-500/50"
                                    >
                                        <option value="">Choose Vendor...</option>
                                        {VENDORS.map(v => <option key={v.name} value={v.name}>{v.name} ({v.type})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Target Endpoint (REST/GRAPHQL)</label>
                                    <input 
                                        type="text"
                                        placeholder="https://api.vendor.com/v1/send"
                                        value={editingConfig.endpoint}
                                        onChange={(e) => setEditingConfig({...editingConfig, endpoint: e.target.value})}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-brand-500/50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">API Key</label>
                                        <input 
                                            type="password"
                                            value={editingConfig.api_key}
                                            onChange={(e) => setEditingConfig({...editingConfig, api_key: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-brand-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Secret/Token</label>
                                        <input 
                                            type="password"
                                            value={editingConfig.api_secret}
                                            onChange={(e) => setEditingConfig({...editingConfig, api_secret: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-brand-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Redundancy Priority</label>
                                        <input 
                                            type="number"
                                            value={editingConfig.priority}
                                            onChange={(e) => setEditingConfig({...editingConfig, priority: parseInt(e.target.value)})}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-brand-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Bridge Status</label>
                                        <select 
                                            value={editingConfig.status}
                                            onChange={(e) => setEditingConfig({...editingConfig, status: e.target.value})}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-brand-500/50"
                                        >
                                            <option value="active">ACTIVE (READY)</option>
                                            <option value="inactive">STANDBY</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setEditingConfig(null)}
                                        className="flex-1 py-4 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 py-4 bg-brand-500 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 transition-all disabled:opacity-50"
                                    >
                                        {saving ? 'Injecting...' : 'Save Configuration'}
                                    </button>
                                </div>
                             </form>

                             <div className="mt-10 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Failover Notice</p>
                                <p className="text-[10px] text-slate-400 italic">Priority 1 vendors are always tried first. If redundant providers are active, the system will auto-switch on 5xx errors.</p>
                             </div>
                        </div>
                    ) : (
                        <div className="h-[600px] border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center p-12 text-center">
                            <div className="text-4xl mb-6 opacity-20">🔌</div>
                            <h3 className="text-lg font-black text-white/20 uppercase italic mb-2">Bridge Interface Ready</h3>
                            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Select a provider or add a new one to inject API configuration into the aggregator layer.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
