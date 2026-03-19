"use client";

import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed Check your credentials.');
      }

      // Success! Store the token securely in a standard browser cookie 
      // where the Next.js middleware can intercept it.
      document.cookie = `umrah_hub_jwt=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      
      // Also store user locally
      localStorage.setItem('umrah_hub_user', JSON.stringify(data.user));
      localStorage.setItem('umrah_hub_jwt', data.token);

      // Force a hard redirect to dashboard to clear state and run middleware
      window.location.href = '/';

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6 selection:bg-brand-500 selection:text-white">
      {/* Abstract Background Ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl mx-auto flex items-center justify-center text-brand-500 text-3xl shadow-2xl mb-6">
            ✦
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">Authentication</h1>
          <p className="text-slate-500 text-sm tracking-wide mt-2">Enter your secured credentials to access the hub.</p>
        </div>

        <form onSubmit={handleLogin} className="linear-card space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center uppercase tracking-widest">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@umrahhub.com"
              required
              className="linear-input w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Master Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="linear-input w-full"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 mt-4 flex items-center justify-center text-white rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all bg-[var(--brand-solid)] hover:brightness-110 shadow-lg shadow-brand-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-12">
          Umrah Hub CRM • Secure Edition 2026
        </p>
      </div>
    </div>
  );
}
