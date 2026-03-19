"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LeadTransactionPanel from '@/components/pricing/LeadTransactionPanel';

export default function LeadDetailModal({ leadId, onClose }: { leadId: string, onClose: () => void }) {
  const [lead, setLead] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Identity States for Personalization
  const [csIdentity, setCsIdentity] = useState({
    name: 'Ahmad Faisal',
    company: 'Umrah Hub Indonesia',
    position: 'Senior Consultant'
  });
  const [showIdentitySettings, setShowIdentitySettings] = useState(false);

  // States for Editing Lead Info
  const [editData, setEditData] = useState({ name: '', phone: '', city: '', status: '', lead_score: 0, progressNote: '' });

  // AI Outreach States
  const [voiceTone, setVoiceTone] = useState('empathetic');
  const [outreachGoal, setOutreachGoal] = useState('first_touch'); 
  const [aiTemperature, setAiTemperature] = useState(0.7);
  const [isGeneratingWA, setIsGeneratingWA] = useState(false);
  const [waDraft, setWaDraft] = useState('');
  
  const [quickNote, setQuickNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [includeSignature, setIncludeSignature] = useState(true);
  const [userRole, setUserRole] = useState<string>('cs'); 

  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'intel' | 'outreach' | 'timeline' | 'revenue'>('intel');
  const [brochureLink, setBrochureLink] = useState('https://umrahhub.id/brochure/premium-syawal-2026');

  // API Call Headers Helper
  const getHeaders = () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('umrah_hub_jwt')}`
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('syncing');

  const refreshLead = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch(`http://localhost:8081/api/v1/public/leads_demo/${leadId}`, { 
          headers: getHeaders(),
          cache: 'no-store' 
      });
      if (!res.ok) throw new Error("Sync Failed");
      const data = await res.json();
      if (data.lead) {
        setLead(data.lead);
        setEditData({
            name: data.lead.name,
            phone: data.lead.phone,
            city: data.lead.city,
            status: data.lead.status,
            lead_score: data.lead.lead_score,
            progressNote: ''
        });
        setSyncStatus('synced');
      }
    } catch (err) {
      console.error("Debug: Fetch error", err);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    setMounted(true);
    refreshLead();
    const savedRole = localStorage.getItem('user_role');
    if (savedRole) setUserRole(savedRole);
  }, [leadId]);

  if (!mounted) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
        const patchPayload = {
            name: editData.name,
            phone: editData.phone,
            city: editData.city,
            status: editData.status
        };

        const res = await fetch(`http://localhost:8081/api/v1/public/leads_demo/${leadId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(patchPayload)
        });
        
        if (res.ok) {
            // Log the progress note if the CS wrote one
            let logMsg = `Funnel status committed to ${patchPayload.status.toUpperCase()}.`;
            if (editData.progressNote.trim()) {
                logMsg += ` Daily Progress: "${editData.progressNote.trim()}"`;
            }
            await logActivity('info_update', logMsg);
            
            setIsEditing(false);
            setEditData({...editData, progressNote: ''});
            await refreshLead();
        } else {
            const error = await res.json();
            alert(`Failed to update: ${error.error || 'Unknown error'}`);
        }
    } catch (err) {
        console.error("Failed to update lead", err);
        alert("System error during update. Please check connection.");
    } finally {
        setIsUpdating(false);
    }
  };

  // Removed outside updateStatus because status changes must be explicitly committed via handleUpdate

  const handleSaveNote = async () => {
      if(!quickNote.trim()) return;
      setIsSavingNote(true);
      await logActivity('cs_note', quickNote);
      setQuickNote('');
      setOutreachGoal('custom'); // Automatically suggest custom AI context after a note is saved!
      setIsSavingNote(false);
      refreshLead(); // fetch the new activity into the lead payload
  };

  const logActivity = async (type: string, content: string) => {
    try {
        await fetch(`http://localhost:8081/api/v1/public/leads_demo/activity`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                lead_id: leadId,
                type,
                content,
                agent_name: csIdentity.name
            })
        });
    } catch (err) {
        console.error("Failed to log activity", err);
    }
  };

  const parseMessage = (msg: string) => {
    // Extracts: Form Data: Usia 45 tahun. [Sentiment Text] [Group String]
    const ageMatch = msg.match(/Usia\s(\d+)\s/i);
    const familyMatch = msg.match(/(sekeluarga \((\d+) orang\)|berdua bersama pasangan|sendiri)/i);
    
    let companions = "Individual";
    let paxCount = 1;
    if (familyMatch) {
        if (familyMatch[1].includes('sendiri')) { companions = "Individual"; paxCount = 1; }
        else if (familyMatch[1].includes('berdua')) { companions = "2 Pax (Couple)"; paxCount = 2; }
        else if (familyMatch[2]) { companions = `${familyMatch[2]} Pax (Family)`; paxCount = parseInt(familyMatch[2], 10); }
    }

    const cleanContent = msg.replace(/Form Data: Usia \d+ tahun\.\s*/i, '');

    return {
      budget: lead?.package_id ? "Paket Umrah" : "Program Perjalanan", // fallback
      age: ageMatch ? ageMatch[1] : null,
      companions: companions,
      paxCount: paxCount,
      content: cleanContent
    };
  };

  const generateWADraft = () => {
    setIsGeneratingWA(true);
    const details = parseMessage(lead?.message || "");
    
    // Aggregating up to 5 of the most recent CS notes
    const pastNotes = lead?.activities
        ?.filter((a: any) => a.type === 'cs_note' || a.type === 'wa_sent' || a.type === 'info_update')
        ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Highest to lowest
        ?.slice(0, 5) 
        ?.map((a: any) => a.content)
        ?.join("; ") || "";

    setTimeout(() => {
      const nameParts = (lead?.name || "").split(" ");
      const firstName = nameParts[0]?.toLowerCase() || "";
      
      const maleNames = ['budi', 'ahmad', 'eko', 'hendra', 'farhan', 'guntur', 'rizki', 'rizky', 'doni', 'andi', 'taufik', 'mulyono'];
      const femaleNames = ['siti', 'anisa', 'rina', 'linda', 'maya', 'eka', 'santi', 'monica', 'wulan'];

      let genderTitle = "Bapak/Ibu";
      const ageVal = details?.age ? parseInt(details.age) : 0;

      if (ageVal > 0 && ageVal < 23) {
        genderTitle = "Kak";
      } else {
        if (maleNames.includes(firstName)) genderTitle = "Bapak";
        else if (femaleNames.includes(firstName)) genderTitle = "Ibu";
      }

      let draft = "";
      const name = lead?.name || "Bapak/Ibu";
      const signature = includeSignature ? `\n\n*${csIdentity.name}*\n${csIdentity.position} - ${csIdentity.company}` : "";
      
      const isReadyToBuy = details.content.toLowerCase().includes('akhir bulan ini') || details.content.toLowerCase().includes('rekening') || details.content.toLowerCase().includes('penawaran resmi');
      const isComparing = details.content.toLowerCase().includes('mahal') || details.content.toLowerCase().includes('diskon');
      const isElderly = ageVal >= 55;
      const isFamily = details.paxCount > 1;
      
      const groupContext = isFamily ? `untuk ${details.paxCount} orang ` : "untuk keberangkatan Personal Bapak/Ibu ";
      const healthContext = isElderly ? " Terlebih usia adalah prioritas kami, seluruh infrastruktur dan tim pendamping akan memastikan kenyamanan & kesehatan fisik Bapak/Ibu 100% terjaga selama di Tanah Suci.\n\n" : "";

      let firstTouchEmpathetic = `Assalamu’alaikum Warahmatullahi Wabarakatuh, ${genderTitle} ${name}. 🙏\n\nTabarakallah, semoga ${genderTitle} ${isFamily ? 'sekeluarga' : ''} senantiasa dalam penjagaan Allah ﷻ. Kami menyambut niat mulia ${genderTitle} untuk rencana ibadah Umrah ${groupContext}berdasarkan data form yang kami terima.\n\n${healthContext}Izin, saya ingin bersilaturahmi sejenak membantu memastikan seluruh persiapan ${genderTitle} berjalan nyaman. Kapan kira-kira ada waktu luang untuk berbincang melalui telepon?${signature}`;
      
      let firstTouchProfessional = `Assalamu’alaikum, ${genderTitle} ${name}. Saya konsultan dari *${csIdentity.company}* menindaklanjuti ketertarikan ${genderTitle} pada program kami tsb.\n\n${healthContext}Sebagai biro perjalanan yang mengamalkan standar ketepatan dan amanah, kami ingin memastikan rencana logistik ${groupContext}sudah matang. Kapan kami bisa menghubungi ${genderTitle} untuk diskusi lanjutan?${signature}`;

      // If High Intent / Hot Ready to Transfer
      if (isReadyToBuy) {
          firstTouchEmpathetic = `Assalamu’alaikum, ${genderTitle} ${name}. Masya Allah tabarakallah, kami sudah menerima konfirmasi kesiapan luar biasa dari ${genderTitle} ${isFamily ? 'sekeluarga' : ''} untuk mendaftar. 🛫\n\n${healthContext}Terkait prosedur administrasi, kami persilakan ${genderTitle} mengamankan seat secepatnya. Berikut saya lampirkan panduan prosedur pembayaran rekening resmi perusahaan kami. Jika berkenan, mari telepon singkat untuk memvalidasi data pax ya, ${genderTitle}!${signature}`;
          
          firstTouchProfessional = `Assalamu’alaikum, ${genderTitle} ${name}. Menyambung antusiasme dan niat kesiapan ${genderTitle} ${groupContext}.\n\nMengingat kuota paket sangat terbatas dan kami melihat urgensi transfer dari pihak Bapak/Ibu, invoice resmi dan petunjuk rekening perusahaan telah siap dikirimkan. Balas "SIAP" agar dokumen legal bisa langsung saya siapkan. ✨${signature}`;
      }

      // If Price Comparing
      if (isComparing) {
          firstTouchEmpathetic = `Assalamu’alaikum Warahmatullahi Wabarakatuh, ${genderTitle} ${name}. 🙏\n\nBismillah, kami sangat memahami kekhawatiran ${genderTitle} mengenai perbedaan harga. Namun kami menegaskan bahwa di agensi kami, seluruh paket disusun tanpa hidden-cost demi ketenangan ibadah ${groupContext}.\n\nKami ada opsi diskon group jika berkenan. Kapan waktu yang nyaman untuk saya bantu simulasikan biayanya?${signature}`;
      }

      const goals: any = {
        first_touch: { empathetic: firstTouchEmpathetic, professional: firstTouchProfessional },
        trial_closing: {
            empathetic: `Assalamu’alaikum ${genderTitle} ${name}. Mengingat sisa kursi yang sangat menipis, saya sarankan agar ${genderTitle} ${isFamily?'sekeluarga ':''}segera mengamankan kuota. ⚡\n\nSemoga Allah mampukan jalan kita ke Tanah Suci. In Sya Allah, apakah formulir dan DP bisa kita proses hari ini?${signature}`,
            professional: `Assalamu’alaikum ${genderTitle} ${name}. Ketersediaan kursi prioritas ${groupContext}pada promo ini akan segera habis tergantikan pendaftar lain. \n\nMohon amankan *amanah* kuota ini segera dengan mengirimkan konfirmasi dokumen pembayaran. Kami terbitkan invoice-nya hari ini ya?${signature}`
        },
        custom: {
            empathetic: `Assalamu’alaikum ${genderTitle} ${name}. Semoga tetap sehat dan dalam lindungan Allah ﷻ.\n\nMemperhatikan catatan/diskusi kami sebelumnya (${pastNotes ? pastNotes.slice(0, 80) + '...' : 'terkait data form Anda'}), kami ingin memastikan apakah ${genderTitle} sudah mendapatkan opsi terbaik? Tolong kabari saya sekiranya ada bantuan tambahan dari sisi administrasi. 🙏${signature}`,
            professional: `Assalamu’alaikum ${genderTitle} ${name}. Menindaklanjuti progres pendaftaran ${genderTitle} ke Tanah Suci.\n\nSesuai catatan terakhir (${pastNotes ? pastNotes.slice(0, 80) + '...' : 'sebelumnya'}), kami perlu mengonfirmasi apakah ada hal administratif yang menahan ${genderTitle}? Kami menantikan respons positifnya demi keamanan kursi. ${signature}`
        }
      };

      const toneKey = voiceTone === 'authoritative' || voiceTone === 'professional' ? 'professional' : 'empathetic';
      draft = goals[outreachGoal]?.[toneKey] || goals.custom[toneKey];
      
      setWaDraft(draft);
      setIsGeneratingWA(false);

      const historySummary = lead.activities?.length > 0 
        ? ` (Context: Integrated ${Math.min(5, lead.activities.length)} recent notes into Custom logic.)` 
        : "";
      
      logActivity('wa_draft_generated', `AI drafted personalized message using intent module: ${outreachGoal}${historySummary}`);
    }, 600);
  };

  const copyToClipboard = () => {
    if (!lead) return;
    if (userRole === 'cs') {
        alert("Fraud Prevention: Exporting full lead dossiers is restricted to Administrative level.");
        logActivity('unauthorized_export_attempt', `CS attempted to export lead dossier for ${lead.name}.`);
        return;
    }

    const text = `
      Name: ${lead.name}\n      Phone: ${lead.phone}\n      City: ${lead.city}\n      Status: ${lead.status}\n      Score: ${lead.lead_score}\n      Message: ${lead.message}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    logActivity('data_export', `Full lead dossier for ${lead.name} exported to clipboard.`);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const details = lead ? parseMessage(lead.message || "") : null;

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 md:p-6 lg:p-10">
      <div 
        className="absolute inset-0 bg-app/95 backdrop-blur-3xl animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative bg-app border border-border-card rounded-[2rem] md:rounded-[2.5rem] max-w-6xl w-full text-text-primary shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 flex flex-col h-[95vh] ring-1 ring-border-card">
        
        {/* TOP GLOW DECOR */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[20%] bg-brand-500/20 blur-[100px] pointer-events-none" />

        {/* REFINED HEADER WITH QUICK FUNNEL LOGIC */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-8 py-5 border-b border-border-card bg-card/10 shrink-0 z-10 gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-brand-500/10 p-2 rounded-2xl border border-brand-500/20">
                     <span className="text-xl">🕋</span>
                </div>
                <div>
                    <h3 className="text-sm font-bold tracking-tight text-text-primary/90 flex gap-2 items-center">
                        Lead Dossier 
                        <span className="text-brand-400 mx-1">/</span> 
                        <span className="text-text-muted font-medium">#{leadId.slice(0,8)}</span>
                        {lead && (
                            <div className="flex items-center gap-2 ml-4">
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] uppercase font-black text-brand-300">Score: {lead.lead_score}%</span>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${syncStatus === 'synced' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : syncStatus === 'syncing' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                    <span className={`w-1 h-1 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    {syncStatus}
                                </div>
                            </div>
                        )}
                    </h3>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* READ-ONLY FUNNEL BADGE */}
                <div className="hidden md:flex items-center gap-2 mr-4 bg-app p-1 rounded-full border border-border-card pr-3">
                    <span className="px-3 text-[10px] font-black uppercase text-text-muted">Funnel:</span>
                    <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">{lead?.status || 'UNKNOWN'}</span>
                </div>

                <div className="hidden md:flex bg-card p-1 rounded-2xl border border-border-card shadow-inner">
                    <button onClick={() => setActiveTab('intel')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeTab === 'intel' ? 'bg-brand-500 text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}>📁 Intel</button>
                    <button onClick={() => setActiveTab('outreach')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeTab === 'outreach' ? 'bg-brand-500 text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}>🤖 Outreach</button>
                    <button onClick={() => setActiveTab('timeline')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${activeTab === 'timeline' ? 'bg-brand-500 text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}>🕒 History</button>
                    <button onClick={() => setActiveTab('revenue')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 relative ${activeTab === 'revenue' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-text-secondary hover:text-text-primary'}`}>
                        💰 Revenue
                        {(lead?.status === 'dp' || lead?.status === 'closing') && activeTab !== 'revenue' && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-card hover:bg-card-hover border border-border-card transition-all hover:rotate-90">✕</button>
                </div>
            </div>
        </div>

        {/* MOBILE TABS */}
        <div className="flex md:hidden px-4 py-2 border-b border-border-card gap-1 shrink-0 overflow-x-auto">
             <button onClick={() => setActiveTab('intel')} className={`flex-1 py-3 px-4 rounded-xl text-[9px] whitespace-nowrap font-black uppercase ${activeTab === 'intel' ? 'bg-brand-500 text-white' : 'bg-card text-text-muted'}`}>Intel</button>
             <button onClick={() => setActiveTab('outreach')} className={`flex-1 py-3 px-4 rounded-xl text-[9px] whitespace-nowrap font-black uppercase ${activeTab === 'outreach' ? 'bg-brand-500 text-white' : 'bg-card text-text-muted'}`}>Outreach</button>
             <button onClick={() => setActiveTab('timeline')} className={`flex-1 py-3 px-4 rounded-xl text-[9px] whitespace-nowrap font-black uppercase ${activeTab === 'timeline' ? 'bg-brand-500 text-white' : 'bg-card text-text-muted'}`}>History</button>
             <button onClick={() => setActiveTab('revenue')} className={`flex-1 py-3 px-4 rounded-xl text-[9px] whitespace-nowrap font-black uppercase ${activeTab === 'revenue' ? 'bg-emerald-500 text-white' : 'bg-card text-text-muted'}`}>💰 Revenue</button>
        </div>

        {!lead ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand-500 animate-pulse">Synchronizing Intelligence...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden relative">
              {activeTab === 'intel' && (
                <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="space-y-4 flex-1">
                       <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                            <span className="text-[11px] font-black text-brand-400 uppercase tracking-[0.2em]">Verified Prospect</span>
                       </div>
                       {isEditing ? (
                          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                            <input 
                                value={editData.name} 
                                onChange={e => setEditData({...editData, name: e.target.value})}
                                className="bg-card border border-brand-500/40 text-3xl md:text-4xl font-black italic tracking-tighter text-text-primary w-full px-6 py-4 rounded-3xl outline-none focus:ring-4 ring-brand-500/20 transition-all shadow-2xl"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="bg-surface border border-border-card text-base font-medium text-text-secondary w-full px-6 py-4 rounded-2xl outline-none focus:border-brand-500/40 transition-all" placeholder="Phone" />
                                <input value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})} className="bg-surface border border-border-card text-base font-medium text-text-secondary w-full px-6 py-4 rounded-2xl outline-none focus:border-brand-500/40 transition-all" placeholder="City" />
                            </div>
                            
                            <div className="bg-brand-500/5 p-5 rounded-2xl border border-brand-500/10 space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-400">Commit Funnel Stage</label>
                                    <select 
                                        value={editData.status}
                                        onChange={e => setEditData({...editData, status: e.target.value})}
                                        className="bg-surface border border-border-card text-sm font-black text-text-primary w-full px-6 py-4 rounded-2xl outline-none focus:border-brand-500/40 transition-all appearance-none uppercase tracking-wider"
                                    >
                                        <option value="new">🆕 NEW</option>
                                        <option value="contacted">📞 CONTACTED</option>
                                        <option value="prospect">📋 PROSPECT</option>
                                        <option value="processed">⚙️ PROCESSED</option>
                                        <option value="dp">💳 DOWN PAYMENT (DP)</option>
                                        <option value="closing">💰 FULL CLOSING</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-400">Daily Progress Note (Optional)</label>
                                    <textarea 
                                        value={editData.progressNote}
                                        onChange={e => setEditData({...editData, progressNote: e.target.value})}
                                        className="bg-surface border border-border-card text-sm font-medium text-text-secondary w-full px-6 py-4 rounded-2xl outline-none focus:border-brand-500/40 transition-all min-h-[80px] resize-none"
                                        placeholder="Catatan follow-up hari ini..."
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 pt-2">
                                <button onClick={handleUpdate} disabled={isUpdating} className="px-10 py-4 bg-brand-500 text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] shadow-xl hover:brightness-110 shadow-brand-500/20 disabled:opacity-50 transition-all active:scale-95">Commit Identity & Progress</button>
                                <button onClick={() => setIsEditing(false)} className="px-6 py-4 text-text-muted font-bold text-xs uppercase tracking-widest hover:text-text-primary transition-colors">Abort</button>
                            </div>
                          </div>
                       ) : (
                          <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500">
                             <div className="flex justify-between items-start gap-6 relative">
                                <div className="space-y-3">
                                    <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-text-primary leading-none drop-shadow-2xl">{lead.name || 'Unknown Lead'}</h2>
                                    <div className="flex items-center gap-3 text-text-muted">
                                        <span className="text-xs font-black uppercase tracking-widest">ID: {lead.id?.slice(0, 8)}</span>
                                        <span>•</span>
                                        <span className="text-xs font-black uppercase tracking-widest text-brand-400">Via App Landing Page</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditing(true)} className="px-6 py-4 rounded-2xl bg-card border border-border-card text-xs font-black uppercase tracking-widest text-text-secondary hover:text-white hover:bg-brand-500 hover:border-brand-400 transition-all shadow-xl flex items-center gap-3 group">
                                    <span>⚙️</span> Edit Dossier
                                </button>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* PHONE METRIC */}
                                <div className="bg-card/40 p-6 rounded-3xl border border-border-card hover:bg-card transition-all">
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-2">Primary Phone</p>
                                    <p className="text-xl font-bold text-text-primary tabular-nums tracking-wide">{lead.phone || 'N/A'}</p>
                                    <p className="text-[10px] text-brand-400 font-bold uppercase mt-2">Verified Mobile</p>
                                </div>
                                
                                {/* CITY METRIC */}
                                <div className="bg-card/40 p-6 rounded-3xl border border-border-card hover:bg-card transition-all">
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-2">Origin Region</p>
                                    <p className="text-xl font-bold text-text-primary tracking-wide capitalize">{lead.city || 'N/A'}</p>
                                    <p className="text-[10px] text-brand-400 font-bold uppercase mt-2">Indonesia</p>
                                </div>

                                {/* ACQUISITION METRIC */}
                                <div className="bg-card/40 p-6 rounded-3xl border border-border-card hover:bg-card transition-all relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 blur-[50px] pointer-events-none" />
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-2">Acquisition Date</p>
                                    <p className="text-sm font-bold text-text-primary tabular-nums tracking-wide mt-1">
                                        {new Date(lead.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'})}
                                    </p>
                                    <p className="text-[11px] text-emerald-400 font-black uppercase mt-1">
                                        {new Date(lead.created_at || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} WIB
                                    </p>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>

                    <div className="w-full md:w-72 shrink-0 space-y-4">
                        <div className="p-6 bg-gradient-to-br from-brand-600 to-brand-900 rounded-[2rem] relative overflow-hidden group shadow-[0_0_100px_rgba(var(--brand-500-rgb),0.2)]">
                            <p className="text-[10px] text-brand-200 font-bold uppercase tracking-[0.2em] mb-3">Intent Score</p>
                            <div className="flex items-end gap-2 text-white">
                                <span className="text-5xl font-black italic tracking-tighter leading-none">{lead.lead_score}</span><span className="text-xl mb-1">%</span>
                            </div>
                             <div className="mt-6 w-full h-1.5 bg-brand-950/50 rounded-full overflow-hidden">
                                 <div className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-1000" style={{ width: `${lead.lead_score}%` }} />
                             </div>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-10 bg-card border border-border-card rounded-[3rem] relative shadow-2xl group overflow-hidden transition-all hover:border-brand-500/30">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-[50px] group-hover:bg-brand-500/10 transition-all pointer-events-none" />
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-2xl">🎯</div>
                            <div>
                                <h4 className="text-[11px] font-black text-white uppercase tracking-widest italic leading-none">Intelligence Mapping</h4>
                                <p className="text-[9px] text-text-muted font-bold uppercase mt-1">Acquisition Meta Tags</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center group/item hover:bg-app/80 p-5 rounded-2xl border border-border-card transition-all hover:translate-x-1">
                                <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Age Insight</span>
                                <span className="text-sm font-black italic text-text-primary px-3 py-1 bg-white/5 rounded-lg">{details?.age || "-"} Y.O</span>
                            </div>
                            <div className="flex justify-between items-center group/item hover:bg-app/80 p-5 rounded-2xl border border-border-card transition-all hover:translate-x-1">
                                <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Travel Pax</span>
                                <span className="text-sm font-black italic text-text-primary px-3 py-1 bg-white/5 rounded-lg">{details?.companions || "Individual"}</span>
                            </div>
                            <div className="flex justify-between items-center bg-brand-500/5 hover:bg-brand-500/10 p-5 rounded-2xl border border-brand-500/20 transition-all hover:translate-x-1">
                                <span className="text-[10px] text-brand-400 font-black uppercase tracking-widest">Budget Tier</span>
                                <span className="text-sm font-black text-brand-300 italic px-3 py-1 bg-brand-500/10 rounded-lg">{details?.budget || "Standard"}</span>
                            </div>
                        </div>
                     </div>
  
                     <div className="p-10 bg-card/40 border border-border-card rounded-[3rem] flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 blur-[60px] pointer-events-none" />
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                            <span className="w-8 h-[1px] bg-border-card" /> Original Intent Manifestation
                        </p>
                        <blockquote className="text-xl md:text-2xl font-medium text-text-primary leading-tight italic font-serif opacity-90 border-l-4 border-emerald-500/50 pl-8 py-4 bg-emerald-500/[0.02] rounded-r-[2rem]">
                            "{details?.content || lead.message || "Consultation request for spiritual pilgrimage plans..."}"
                        </blockquote>
                        <div className="mt-8 flex items-center gap-3">
                            <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest">High Integrity Signal</div>
                            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[8px] font-black text-text-muted uppercase tracking-widest">Organic Feed</div>
                        </div>
                      </div>
                   </div>
                   {/* TRANSACTION ENGINE - Shows inline when status is dp or closing */}
                   {(lead?.status === 'dp' || lead?.status === 'closing') && (
                     <div>
                       <div className="flex items-center gap-3 mb-4">
                         <div className={`h-0.5 flex-1 ${lead?.status === 'closing' ? 'bg-emerald-500/30' : 'bg-amber-500/30'}`} />
                         <span className={`text-[9px] font-black uppercase tracking-widest ${lead?.status === 'closing' ? 'text-emerald-500' : 'text-amber-400'}`}>
                           {lead?.status === 'closing' ? '💰 Revenue Pipeline Active' : '💳 DP Commitment Mode'}
                         </span>
                         <div className={`h-0.5 flex-1 ${lead?.status === 'closing' ? 'bg-emerald-500/30' : 'bg-amber-500/30'}`} />
                       </div>
                       <LeadTransactionPanel
                         leadId={leadId}
                         currentStatus={lead?.status}
                         onTransactionCommit={refreshLead}
                       />
                     </div>
                   )}
                 </div>
               )}

              {activeTab === 'revenue' && (
                <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
                  <div className="mb-8">
                    <h3 className="text-[11px] font-black text-white uppercase tracking-widest italic">Revenue Commitment</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Rekam transaksi DP atau Full Closing</p>
                  </div>
                  <LeadTransactionPanel
                    leadId={leadId}
                    currentStatus={lead?.status}
                    onTransactionCommit={refreshLead}
                  />
                </div>
               )}
              {activeTab === 'outreach' && (
                <div className="flex-1 p-5 md:p-8 flex flex-col md:flex-row gap-8 overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">

                    {/* LEFT SIDEBAR: AGENT SETTINGS & QUICK NOTES */}
                    <div className="w-full md:w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar pr-3">

                        {/* CS Note Input */}
                        <div className="bg-card border border-border-card rounded-[2rem] p-5 shadow-lg flex flex-col gap-3 group focus-within:ring-2 ring-brand-500/30 transition-all">
                            <label className="text-[10px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-2">
                                📝 Operational Notes
                            </label>
                            <textarea
                                value={quickNote}
                                onChange={(e) => setQuickNote(e.target.value)}
                                placeholder="Write intel from phone call, constraints, or preferences... (Saves directly to Timeline)"
                                className="w-full bg-transparent text-sm text-text-primary outline-none min-h-[90px] resize-none placeholder:text-text-muted/50"
                            />
                            <div className="flex justify-end pt-2 border-t border-white/5">
                                <button 
                                    disabled={!quickNote.trim() || isSavingNote}
                                    onClick={handleSaveNote}
                                    className="px-6 py-2 bg-brand-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] active:scale-95"
                                >
                                    {isSavingNote ? '...' : 'Log It'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">AI Strategy Core</p>
                            <div className="space-y-2">
                                <span className="text-[9px] text-text-muted font-bold uppercase mx-1">Outreach Vector</span>
                                <div className="relative">
                                    <select
                                        value={outreachGoal}
                                        onChange={(e) => setOutreachGoal(e.target.value)}
                                        className="w-full bg-surface border border-border-card rounded-2xl text-[10px] font-black uppercase text-brand-300 px-5 py-4 outline-none appearance-none cursor-pointer hover:bg-card hover:border-white/10 transition-all"
                                    >
                                        <option value="first_touch">👋 First Touch</option>
                                        <option value="custom">🧠 Context-Aware (From Notes)</option>
                                        <option value="trial_closing">⚡ Trial Closing</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">▼</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[9px] text-text-muted font-bold uppercase mx-1">Tone Config</span>
                                <div className="flex bg-surface p-1 rounded-2xl border border-border-card">
                                    <button onClick={() => setVoiceTone('empathetic')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${voiceTone === 'empathetic' ? 'bg-brand-500 text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}>Warm</button>
                                    <button onClick={() => setVoiceTone('professional')} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${voiceTone === 'professional' ? 'bg-brand-500 text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}`}>Firm</button>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <button onClick={() => setShowIdentitySettings(!showIdentitySettings)} className={`w-full py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${showIdentitySettings ? 'bg-brand-500/10 border-brand-500/40 text-brand-400' : 'bg-surface border-border-card text-text-muted hover:text-text-primary'}`}>{showIdentitySettings ? 'Close Identity Layer' : 'Adjust CS Signature'}</button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: WA SIMULATION */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 bg-surface rounded-[2rem] border border-border-card overflow-hidden flex flex-col shadow-2xl relative">
                             {/* GLOW DECOR */}
                             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[100px] pointer-events-none" />

                             {/* WA Header */}
                             <div className="bg-card px-8 py-5 flex items-center justify-between shrink-0 z-10 border-b border-border-card shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center text-white text-sm font-bold">{lead.name[0]}</div>
                                    <div>
                                        <p className="text-xs font-black text-text-primary italic tracking-tight">{lead.name}</p>
                                        <p className="text-[9px] text-brand-500 font-bold uppercase tracking-widest">Client Connect</p>
                                    </div>
                                </div>
                             </div>

                             {/* WA Chat Area */}
                             <div className="flex-1 p-6 md:p-8 space-y-6 bg-surface opacity-95 overflow-y-auto custom-scrollbar flex flex-col relative z-0">
                                <div className="flex justify-center mb-6">
                                    <span className="px-4 py-1.5 bg-card/80 backdrop-blur-md text-[9px] text-text-muted rounded-xl uppercase tracking-[0.2em] font-black shadow-inner border border-white/5">Session Initialized</span>
                                </div>

                                {/* Incoming Message */}
                                <div className="flex justify-start animate-in slide-in-from-left-4 duration-500">
                                    <div className="max-w-[85%] bg-card p-5 rounded-3xl rounded-tl-none shadow-[0_5px_20px_rgba(0,0,0,0.2)] border border-border-card relative">
                                        <p className="text-[13px] text-text-primary leading-relaxed font-medium">
                                            {details?.content || lead.message}
                                        </p>
                                        <span className="absolute bottom-2 right-4 text-[8px] text-text-muted font-bold uppercase">Incoming</span>
                                    </div>
                                </div>

                                {/* AI DRAFT AREA */}
                                {isGeneratingWA ? (
                                    <div className="flex justify-end pt-4">
                                        <div className="bg-brand-500 px-6 py-4 rounded-3xl rounded-tr-none shadow-2xl flex items-center gap-4 animate-pulse">
                                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            <p className="text-[10px] text-white font-black uppercase tracking-widest">Architecting Response...</p>
                                        </div>
                                    </div>
                                ) : waDraft ? (
                                    <div className="flex justify-end pt-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="max-w-[90%] bg-brand-600 p-6 rounded-[2rem] rounded-tr-none shadow-[0_15px_30px_rgba(99,102,241,0.2)] border border-white/10 relative group">
                                            <button onClick={generateWADraft} className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-all w-10 h-10 rounded-2xl bg-card border border-border-card flex items-center justify-center hover:scale-110 shadow-xl text-xs hover:bg-brand-500">🔄</button>
                                            <p className="text-[13px] text-white leading-relaxed whitespace-pre-wrap font-medium">{waDraft}</p>
                                            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                                                <span className="text-[9px] text-brand-200 font-bold uppercase tracking-widest italic">{outreachGoal === 'custom' ? 'Context-Aware AI Gen' : 'Standard AI Gen'}</span><span className="text-[11px] text-white">✓✓</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex justify-center items-center p-10">
                                        <div className="text-center space-y-6">
                                            <div className="text-4xl">✨</div>
                                            <button onClick={generateWADraft} className="px-10 py-5 bg-brand-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-500/20">Initialize AI Response Strategy</button>
                                        </div>
                                    </div>
                                )}
                             </div>

                             {/* WA FOOTER / ACTIONS */}
                             {waDraft && !isGeneratingWA && (
                                <div className="bg-card p-5 flex flex-col md:flex-row gap-4 items-center border-t border-border-card z-10">
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(waDraft); logActivity('wa_sent', `Copied to clipboard: ${outreachGoal}`); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                                        className="w-full md:w-auto px-6 py-4 bg-app hover:bg-card-hover text-text-secondary hover:text-white text-[9px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all border border-border-card"
                                    >
                                        {copySuccess ? '✓ Saved' : '📋 Copy Draft'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const phone = lead.phone.replace(/[^0-9]/g, '');
                                            const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
                                            window.open(`https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(waDraft)}`, '_blank');
                                            logActivity('wa_sent', `Deep link executed: ${outreachGoal}`);
                                        }}
                                        className="w-full md:flex-1 py-4 bg-brand-500 hover:brightness-110 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[1.5rem] transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        Execute Sequence 🚀
                                    </button>
                                </div>
                             )}
                        </div>

                        {showIdentitySettings && (
                            <div className="mt-4 p-6 bg-card border border-border-card rounded-[2rem] grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-300">
                                <div className="space-y-2"><label className="text-[9px] text-text-muted font-black uppercase ml-1">Assigned Agent</label><input value={csIdentity.name} onChange={e => setCsIdentity({...csIdentity, name: e.target.value})} className="w-full bg-surface border border-border-card rounded-xl px-4 py-3 text-xs text-text-primary outline-none" /></div>
                                <div className="space-y-2"><label className="text-[9px] text-text-muted font-black uppercase ml-1">Firm Title</label><input value={csIdentity.position} onChange={e => setCsIdentity({...csIdentity, position: e.target.value})} className="w-full bg-surface border border-border-card rounded-xl px-4 py-3 text-xs text-text-primary outline-none" /></div>
                            </div>
                        )}
                    </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-300 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-card via-app to-app">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col mb-16 relative">
                            <span className="px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[9px] font-black uppercase tracking-[0.2em] w-fit mb-4">Historical Archive</span>
                            <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-text-primary">Event Log Intel</h3>
                        </div>

                        <div className="space-y-6 relative border-l border-white/10 ml-6 pl-12 py-4">
                            {lead.activities?.length > 0 ? (
                                lead.activities.sort((a: any, b: any)=>new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((act: any, i: number) => (
                                    <div key={act.id} className="relative animate-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="absolute -left-[69px] top-6 w-10 h-10 rounded-full bg-card border-2 border-brand-500/30 flex items-center justify-center text-xs shadow-lg ring-4 ring-app">
                                            {act.type.includes('wa') ? '💬' : act.type.includes('cs_note') ? '📝' : '⚡'}
                                        </div>
                                        <div className="p-8 bg-card border border-border-card rounded-[2rem] hover:bg-card-hover transition-all duration-300">
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${act.type==='cs_note'?'bg-emerald-500/10 text-emerald-400':act.type.includes('wa')?'bg-brand-500/10 text-brand-400':'bg-white/5 text-slate-400'}`}>
                                                    {act.type.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] text-text-muted font-medium">{new Date(act.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm md:text-base text-text-primary leading-relaxed font-medium">{act.content}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-text-muted italic">No timeline events recorded yet.</p>
                            )}
                            <div className="relative opacity-30 mt-12 py-8">
                                 <div className="absolute -left-[65px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-app border border-white/20 flex items-center justify-center">🚪</div>
                                 <div className="p-6 border border-dashed border-white/20 rounded-[2rem]">
                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-1">Manifestation Captured</p>
                                    <p className="text-xs">Lead originated from landing page.</p>
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
