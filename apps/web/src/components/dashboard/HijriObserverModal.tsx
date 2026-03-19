"use client";

import React, { useState, useEffect } from 'react';

interface HijriObserverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const hijriMonths = [
  { name: 'Muharram', num: 1 }, { name: 'Safar', num: 2 }, { name: "Rabi' al-Awwal", num: 3 },
  { name: "Rabi' al-Thani", num: 4 }, { name: 'Jumada al-Ula', num: 5 }, { name: 'Jumada al-Akhirah', num: 6 },
  { name: 'Rajab', num: 7 }, { name: "Sha'ban", num: 8 }, { name: 'Ramadhan', num: 9 },
  { name: 'Syawal', num: 10 }, { name: "Dhu al-Qi'dah", num: 11 }, { name: 'Dhu al-Hijjah', num: 12 }
];

const SACRED_DATA = [
  { season: 'Autumn (Kharif)', temp: 32, event: 'Islamic New Year', icon: '🍂' },
  { season: 'Autumn (Kharif)', temp: 30, event: 'Ops Preparation', icon: '🍂' },
  { season: 'Winter (Shita)', temp: 24, event: 'Mawlid Celebration', icon: '❄️' },
  { season: 'Winter (Shita)', temp: 22, event: 'Winter Umrah Peak', icon: '❄️' },
  { season: 'Winter (Shita)', temp: 23, event: 'Educational Cycle', icon: '❄️' },
  { season: "Spring (Rabi')", temp: 25, event: 'Global Gathering', icon: '🌱' },
  { season: "Spring (Rabi')", temp: 27, event: "Isra' Mi'raj Quest", icon: '🌱' },
  { season: "Spring (Rabi')", temp: 28, event: "Nisfu Sha'ban Prep", icon: '🌱' },
  { season: "Spring (Rabi')", temp: 29, event: 'Ramadhan Fasting', icon: '🌱' },
  { season: 'Summer (Saif)', temp: 38, event: 'Eid al-Fitr Cycle', icon: '☀️' },
  { season: 'Summer (Saif)', temp: 42, event: 'Hajj Logistics Focus', icon: '☀️' },
  { season: 'Summer (Saif)', temp: 45, event: 'The Great Hajj Season', icon: '☀️' },
];

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function HijriObserverModal({ isOpen, onClose }: HijriObserverModalProps) {
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');
  const [timezoneMode, setTimezoneMode] = useState<'ID' | 'KSA'>('ID');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(8);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [editingNote, setEditingNote] = useState<{ day: number; text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('umrah_tactical_notes');
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') setSelectedMonthIdx(p => (p === 0 ? 11 : p - 1));
      else if (e.key === 'ArrowRight') setSelectedMonthIdx(p => (p === 11 ? 0 : p + 1));
      else if (e.key === 'Escape') editingNote ? setEditingNote(null) : onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingNote, onClose]);

  if (!isOpen) return null;

  const saveNote = () => {
    if (!editingNote) return;
    const key = `${selectedMonthIdx}-${editingNote.day}`;
    const updated = editingNote.text
      ? { ...notes, [key]: editingNote.text }
      : (() => { const n = { ...notes }; delete n[key]; return n; })();
    setNotes(updated);
    localStorage.setItem('umrah_tactical_notes', JSON.stringify(updated));
    setEditingNote(null);
  };

  const deleteNote = (day: number) => {
    const newNotes = { ...notes };
    delete newNotes[`${selectedMonthIdx}-${day}`];
    setNotes(newNotes);
    localStorage.setItem('umrah_tactical_notes', JSON.stringify(newNotes));
    setEditingNote(null);
  };

  const getGregorianDate = (hDay: number) => {
    const offset = (selectedMonthIdx - 8) * 29.53;
    const base = timezoneMode === 'ID' ? 19 : 18;
    const total = Math.round(base + hDay - 1 + offset);
    if (total <= 28) return { d: total, m: 'Feb' };
    if (total <= 59) return { d: total - 28, m: 'Mar' };
    if (total <= 89) return { d: total - 59, m: 'Apr' };
    if (total <= 120) return { d: total - 89, m: 'May' };
    if (total <= 150) return { d: total - 120, m: 'Jun' };
    return { d: total - 150, m: 'Jul' };
  };

  const currentSacred = SACRED_DATA[selectedMonthIdx];
  const noteKey = (day: number) => `${selectedMonthIdx}-${day}`;
  const isPeak = (d: number) =>
    (selectedMonthIdx === 8 && (d === 27 || d === 29)) || (selectedMonthIdx === 11 && d === 10);
  const isSpecial = (d: number) =>
    (selectedMonthIdx === 8 && d >= 21) || (selectedMonthIdx === 11 && d >= 8 && d <= 13) || (selectedMonthIdx === 9 && d === 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-md">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      <div className="relative w-full max-w-5xl animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-br from-[#131315] to-[#09090b] border border-white/10 rounded-[3rem] p-8 shadow-[0_40px_80px_rgba(0,0,0,0.7)] overflow-hidden relative">

          {/* Ambient glows */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

          {/* ── HEADER ── */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-7 relative z-10">

            {/* Month title + nav */}
            <div className="flex items-center gap-5">
              {/* Nav pill */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                <button
                  onClick={() => setSelectedMonthIdx(p => (p === 0 ? 11 : p - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-brand-500 text-white text-lg transition-all active:scale-90"
                >‹</button>
                <button
                  onClick={() => setSelectedMonthIdx(p => (p === 11 ? 0 : p + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-brand-500 text-white text-lg transition-all active:scale-90"
                >›</button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                  <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.35em] italic">Intelligence Hub Active</span>
                </div>
                <h2 className="text-4xl font-black text-white italic tracking-tight uppercase leading-none">
                  {hijriMonths[selectedMonthIdx].name}
                  <span className="text-brand-500 ml-2">Observer</span>
                </h2>
              </div>
            </div>

            {/* Season card + close */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-5 bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3 hover:border-brand-500/20 transition-all">
                <div className="flex items-center gap-3 border-r border-white/10 pr-5">
                  <span className="text-2xl">{currentSacred.icon}</span>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Season</p>
                    <p className="text-sm font-black text-white italic leading-none">{currentSacred.season}</p>
                    <p className="text-[10px] font-bold text-emerald-400 mt-1">{currentSacred.temp}°C</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Sacred Focus</p>
                  <p className="text-sm font-black text-brand-400 italic uppercase tracking-tight">{currentSacred.event}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-all hover:rotate-90 text-lg"
              >✕</button>
            </div>
          </div>

          {/* ── VIEW CONTROLS ── */}
          <div className="flex flex-wrap gap-3 mb-7 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex gap-1">
              {(['month', 'year'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setCalendarView(v)}
                  className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    calendarView === v ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-white'
                  }`}
                >{v === 'month' ? 'Modular Cycle' : 'Annual Grid'}</button>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex gap-1">
              {(['ID', 'KSA'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setTimezoneMode(mode)}
                  className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    timezoneMode === mode ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <span>{mode === 'ID' ? '🇮🇩' : '🇸🇦'}</span>
                  {mode === 'ID' ? 'Jakarta (WIB)' : 'Makkah (AST)'}
                </button>
              ))}
            </div>
          </div>

          {/* ── CALENDAR VIEWS ── */}
          {calendarView === 'month' ? (
            <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {DAY_LABELS.map(d => (
                  <div key={d} className="h-8 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 30 }, (_, i) => {
                  const day = i + 1;
                  const gDate = getGregorianDate(day);
                  const peak = isPeak(day);
                  const special = isSpecial(day);
                  const hasNote = !!notes[noteKey(day)];

                  return (
                    <div
                      key={day}
                      onClick={() => setEditingNote({ day, text: notes[noteKey(day)] || '' })}
                      className={`group relative flex flex-col items-center justify-center rounded-2xl border pt-6 pb-3 cursor-pointer transition-all duration-200 hover:scale-105 hover:-translate-y-1
                        ${peak
                          ? 'bg-brand-500 border-white/20 shadow-lg shadow-brand-500/30'
                          : special
                            ? 'bg-brand-500/10 border-brand-500/30 hover:bg-brand-500/20'
                            : 'bg-white/[0.03] border-white/5 hover:bg-white/8 hover:border-white/15'
                        }
                        ${hasNote ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#131315]' : ''}
                      `}
                    >
                      {/* Peak / Event badges */}
                      {peak && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-400 text-black text-[7px] font-black uppercase tracking-wider rounded-full whitespace-nowrap shadow-md animate-pulse">
                          Peak
                        </span>
                      )}
                      {selectedMonthIdx === 9 && day === 1 && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-brand-500 text-white text-[7px] font-black uppercase rounded-full whitespace-nowrap shadow-md">
                          Eid al-Fitr
                        </span>
                      )}
                      {selectedMonthIdx === 11 && day === 9 && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black uppercase rounded-full whitespace-nowrap shadow-md">
                          Wukuf
                        </span>
                      )}

                      {/* Note dot */}
                      {hasNote && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                      )}

                      {/* Day number */}
                      <span className={`text-xl font-black italic tracking-tight leading-none ${peak ? 'text-white' : special ? 'text-brand-400' : 'text-white/90'}`}>
                        {day}
                      </span>

                      {/* Gregorian sync */}
                      <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${peak ? 'text-white/70' : special ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {gDate.d} {gDate.m}
                      </p>

                      {/* Hover glass sheen */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  );
                })}
              </div>

              {/* Footer status */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-white/[0.025] border border-white/5 rounded-2xl px-6 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow border-2 border-emerald-500/20">
                    {timezoneMode === 'ID' ? '🇮🇩' : '🇸🇦'}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 italic">Regional Sync Hub</p>
                    <h4 className="text-sm font-black text-white italic">
                      {timezoneMode === 'ID' ? 'Kemenag RI Standard' : 'Umm al-Qura Standard'}
                    </h4>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Temporal Offset</p>
                  <p className="text-2xl font-black text-white tracking-widest">{timezoneMode === 'ID' ? 'GMT+7' : 'GMT+3'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-black text-emerald-500 italic">Active Engine</p>
                </div>
              </div>
            </div>

          ) : (
            /* ── ANNUAL GRID ── */
            <div className="relative z-10 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
              {hijriMonths.map((m, i) => (
                <div
                  key={m.name}
                  onClick={() => { setSelectedMonthIdx(i); setCalendarView('month'); }}
                  className={`group relative rounded-2xl border p-4 flex flex-col items-start justify-between cursor-pointer transition-all duration-200 hover:scale-105 hover:-translate-y-1 min-h-[110px]
                    ${i === selectedMonthIdx
                      ? 'bg-brand-500 border-brand-400 shadow-xl shadow-brand-500/30'
                      : 'bg-white/[0.03] border-white/5 hover:border-brand-500/40 hover:bg-white/6'
                    }
                  `}
                >
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${i === selectedMonthIdx ? 'text-white/60' : 'text-slate-600 group-hover:text-brand-400'}`}>
                      M.{m.num}
                    </p>
                    <h4 className={`text-[13px] font-black italic tracking-tight uppercase leading-tight ${i === selectedMonthIdx ? 'text-white' : 'text-slate-200'}`}>
                      {m.name}
                    </h4>
                  </div>

                  <span className="text-xl mt-2">{SACRED_DATA[i].icon}</span>

                  {i === selectedMonthIdx && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/25 rounded-full text-[7px] font-black text-white uppercase tracking-wider">Active</span>
                  )}

                  {(m.name === 'Ramadhan' || m.name === 'Dhu al-Hijjah') && i !== selectedMonthIdx && (
                    <div className="absolute inset-0 bg-brand-500/5 rounded-2xl pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── NOTE EDITOR ── */}
      {editingNote && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingNote(null)} />
          <div className="relative w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-300">

            <div className="flex justify-between items-start mb-7">
              <div>
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1.5 italic">Strategic Note</p>
                <h4 className="text-2xl font-black text-white italic tracking-tight">
                  Day {editingNote.day} — {hijriMonths[selectedMonthIdx].name}
                </h4>
              </div>
              <span className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-2xl flex-shrink-0">📝</span>
            </div>

            <div className="mb-6">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2 ml-1">Logistics Note</label>
              <textarea
                value={editingNote.text}
                onChange={e => setEditingNote({ ...editingNote, text: e.target.value })}
                placeholder="E.g. Charter Flight JT-887 — Bogor → Jeddah…"
                autoFocus
                className="w-full h-36 bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none resize-none placeholder:text-slate-600 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveNote}
                className="flex-1 py-4 bg-brand-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-600 transition-all active:scale-95 shadow-lg shadow-brand-500/20"
              >Save Note</button>
              {notes[noteKey(editingNote.day)] && (
                <button
                  onClick={() => deleteNote(editingNote.day)}
                  className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >Delete</button>
              )}
              <button
                onClick={() => setEditingNote(null)}
                className="px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
