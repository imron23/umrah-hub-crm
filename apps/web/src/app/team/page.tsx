"use client";

import React, { useEffect, useState } from 'react';

interface Role {
  id: string;
  name: string;
  permissions: string; // JSON string
}

interface User {
  id: string;
  email: string;
  role: Role;
  status: string;
}

interface Agent {
  id: string;
  user_id: string;
  daily_capacity: number;
  current_load: number;
  status: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'view_dashboard', label: 'View Dashboard' },
  { id: 'view_leads', label: 'View Leads' },
  { id: 'edit_leads', label: 'Edit/Process Leads' },
  { id: 'manage_team', label: 'Manage Team & Roles' },
  { id: 'view_finance', label: 'View Finance Reports' },
  { id: 'manage_marketing', label: 'Manage Landing Pages' },
  { id: 'delete_data', label: 'Delete Records' }
];

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'lead_portion'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const getHeaders = () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('umrah_hub_jwt')}`
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const qs = { headers: getHeaders() };
      const [usersRes, rolesRes, agentsRes] = await Promise.all([
        fetch('http://localhost:8081/api/v1/public/users', qs),
        fetch('http://localhost:8081/api/v1/public/roles', qs),
        fetch('http://localhost:8081/api/v1/public/agents', qs)
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const agentsData = await agentsRes.json();

      setUsers(usersData.users || []);
      setRoles(rolesData.roles || []);
      setAgents(agentsData.agents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (name: string) => {
    try {
      const res = await fetch('http://localhost:8081/api/v1/public/roles', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        fetchData();
        setIsCreateRoleModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (roleId: string, status: string) => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`http://localhost:8081/api/v1/public/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ role_id: roleId, status })
      });
      if (res.ok) {
        fetchData();
        setSelectedUser(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
      if (!confirm("Are you absolutely sure you want to purge this internal account?")) return;
      try {
        const res = await fetch(`http://localhost:8081/api/v1/public/users/${userId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) {
            fetchData();
        } else {
            const data = await res.json();
            alert(`Failed: ${data.error}`);
        }
      } catch (err) {
          console.error(err);
      }
  };

  const handleInviteUser = async (payload: any) => {
      try {
        const res = await fetch('http://localhost:8081/api/v1/public/users', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            fetchData();
            setIsInviteModalOpen(false);
        } else {
            const data = await res.json();
            alert(`Failed: ${data.error}`);
        }
      } catch (err) {
          console.error(err);
      }
  };

  const handleUpdateRolePermission = async (roleId: string, permKey: string, checked: boolean) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    let perms = {};
    try { perms = JSON.parse(role.permissions || '{}'); } catch (e) {}
    
    perms = { ...perms, [permKey]: checked };
    
    try {
      const res = await fetch(`http://localhost:8081/api/v1/public/roles/${roleId}/permissions`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ permissions: JSON.stringify(perms) })
      });
      if (res.ok) {
        setRoles(roles.map(r => r.id === roleId ? { ...r, permissions: JSON.stringify(perms) } : r));
      }
    } catch (err) {
      console.error(err)
    }
  };

  const handleUpdateCapacity = async (agentId: string, capacity: number) => {
    try {
      const res = await fetch(`http://localhost:8081/api/v1/public/agents/${agentId}/capacity`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ capacity })
      });
      if (res.ok) {
        setAgents(agents.map(a => a.id === agentId ? { ...a, daily_capacity: capacity } : a));
      }
    } catch (err) {
        console.error(err)
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em] mb-3 block">Human Resource & Access</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">Team & Access Control</h1>
          <p className="text-slate-400 mt-2">Manage personnel, define granular role permissions, and balance lead portions.</p>
        </div>
        
        {activeTab === 'users' && (
            <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="group px-6 md:px-8 h-12 rounded-full bg-brand-solid hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-glow/20 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            >
                <span>✨ Invite Personnel</span>
            </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-white/5 pb-px overflow-x-auto custom-scrollbar">
        {(['users', 'roles', 'lead_portion'] as const).map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 md:px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 hover:text-white whitespace-nowrap ${
                    activeTab === tab ? 'border-brand-500 text-white' : 'border-transparent text-slate-500'
                }`}
            >
                {tab.replace('_', ' ')}
            </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'users' && (
        <div className="bg-card border border-border-card rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                            <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Identity</th>
                            <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Designated Role</th>
                            <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Network Status</th>
                            <th className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Access Logic</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, idx) => (
                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-xs font-black shadow-lg border border-white/10 transition-transform group-hover:scale-110 ${
                                            idx % 3 === 0 ? 'bg-brand-solid text-white shadow-brand-glow/40' : idx % 3 === 1 ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20'
                                        }`}>
                                            {user.email.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm tracking-tight">{user.email}</p>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">ID: UM-{user.id.slice(0, 5).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                        user.role?.name === 'super_admin' ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' : 'bg-white/5 border-white/10 text-slate-400'
                                    }`}>
                                        {user.role?.name || 'Observer'}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="flex items-center gap-2.5">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${user.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.status}</span>
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right space-x-2">
                                    <button 
                                        onClick={() => setSelectedUser(user)}
                                        className="inline-flex items-center px-5 h-10 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:border-brand-solid hover:bg-brand-solid/20 transition-all active:scale-95"
                                    >
                                        ⚙️ Configure
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="inline-flex items-center w-10 h-10 justify-center rounded-full bg-white/5 border border-white/10 text-slate-500 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95"
                                        title="Purge Personnel"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {users.length === 0 && !loading && (
                <div className="p-16 text-center">
                    <p className="text-slate-500 font-medium tracking-wide">No personnel found in the system matrix.</p>
                </div>
            )}
        </div>
      )}

      {activeTab === 'roles' && (
          <div className="space-y-8">
              <div className="flex justify-end">
                  <button 
                    onClick={() => setIsCreateRoleModalOpen(true)}
                    className="group px-8 h-12 rounded-full bg-brand-solid hover:scale-105 transition-all shadow-xl shadow-brand-glow/20 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white"
                  >
                    <span>+ Add Custom Role</span>
                  </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
              {roles.map(role => {
                  let perms = {};
                  try { perms = JSON.parse(role.permissions || '{}'); } catch(e) {}
                  return (
                      <div key={role.id} className="linear-card group hover:border-brand-500/30 transition-all transform hover:-translate-y-1">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-10 gap-4">
                              <div>
                                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">{role.name}</h3>
                                  <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mt-1">Permission Matrix</p>
                              </div>
                              <span className="text-[10px] font-black text-slate-500 tracking-widest bg-white/5 border border-white/5 px-4 py-2 rounded-full inline-block">ID: {role.id.slice(0, 8)}</span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {AVAILABLE_PERMISSIONS.map(p => {
                                  const isChecked = (perms as any)[p.id] === true;
                                  return (
                                      <label key={p.id} className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                                          isChecked ? 'border-brand-500/40 bg-brand-500/5 text-white shadow-inner' : 'border-white/5 bg-white/[0.01] text-slate-400 hover:border-brand-500/20 hover:bg-white/[0.03]'
                                      }`}>
                                          <input 
                                              type="checkbox" 
                                              checked={isChecked}
                                              onChange={(e) => handleUpdateRolePermission(role.id, p.id, e.target.checked)}
                                              className="accent-brand-500 w-4 h-4 rounded"
                                          />
                                          <span className="text-[10px] font-black uppercase tracking-wider">{p.label}</span>
                                      </label>
                                  )
                              })}
                          </div>
                      </div>
                  )
              })}
              </div>
          </div>
      )}

      {activeTab === 'lead_portion' && (
          <div className="linear-card p-0 overflow-hidden">
                <div className="p-8 md:p-10 border-b border-white/5 bg-gradient-to-r from-brand-500/10 to-transparent">
                    <h3 className="text-sm font-black text-white uppercase italic tracking-widest drop-shadow-md">Global Distribution Engine</h3>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Assign capacity quotas for inbound leads. AI Router balances via Round-Robin load limits.</p>
                </div>
                <div className="divide-y divide-white/5">
                    {agents.map((agent, i) => (
                        <div key={agent.id} className="p-8 md:p-10 flex flex-col lg:flex-row lg:items-center gap-8 hover:bg-white/[0.01] transition-colors">
                            <div className="lg:w-1/3">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-2xl shadow-inner">👤</div>
                                    <div>
                                        <p className="text-xl font-black text-white italic truncate">{users.find(u => u.id === agent.user_id)?.email || 'Unknown Agent'}</p>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 block">AGENT ID: {agent.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Daily Load Quota</span>
                                    <span className="text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full">{agent.daily_capacity} Leads / Day</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="200" 
                                    value={agent.daily_capacity}
                                    onChange={(e) => handleUpdateCapacity(agent.id, parseInt(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-full appearance-none accent-brand-500 cursor-pointer shadow-inner"
                                />
                                <div className="flex justify-between text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600">
                                    <span>0 MIN</span>
                                    <span>200 MAX CAPACITY</span>
                                </div>
                            </div>

                            <div className="lg:w-48 text-left lg:text-right pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Active Processing</p>
                                <div className="bg-white/5 rounded-2xl px-5 py-4 border border-white/5 inline-flex items-center gap-3">
                                    <span className="text-3xl font-black text-white italic leading-none">{agent.current_load}</span>
                                    <div className="text-[9px] uppercase font-bold text-slate-400 leading-tight">
                                        Assigned<br/>Leads
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
          </div>
      )}

      {/* MODALS */}
      {selectedUser && (
        <UserConfigModal 
          user={selectedUser} 
          roles={roles} 
          onClose={() => setSelectedUser(null)} 
          onSave={handleUpdateUser}
        />
      )}

      {isCreateRoleModalOpen && (
        <CreateRoleModal 
          onClose={() => setIsCreateRoleModalOpen(false)}
          onSave={handleCreateRole}
        />
      )}

      {isInviteModalOpen && (
          <InviteUserModal
            roles={roles}
            onClose={() => setIsInviteModalOpen(false)}
            onSave={handleInviteUser}
          />
      )}
    </div>
  );
}

function CreateRoleModal({ onClose, onSave }: any) {
    const [name, setName] = useState('');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[3rem] p-10 shadow-2xl overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 blur-[80px]" />

                <div className="relative z-10 space-y-8">
                    <div>
                        <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em] mb-2 block">Identity Lab</span>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">New Custom Role</h2>
                        <p className="text-slate-400 text-xs mt-2 font-medium">Define a new authority structure for your command center.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Role Designation</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Finance Admin"
                            className="linear-input w-full"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 h-14 rounded-full bg-white/5 border border-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            Cancel
                        </button>
                        <button 
                            disabled={!name}
                            onClick={() => onSave(name)}
                            className="flex-1 h-14 rounded-full bg-brand-solid text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(var(--brand-500-rgb),0.3)] disabled:opacity-50">
                            Create Identity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function UserConfigModal({ user, roles, onClose, onSave }: any) {
    const [roleId, setRoleId] = useState(user.role?.id || '');
    const [status, setStatus] = useState(user.status || 'active');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[3rem] p-10 shadow-2xl overflow-hidden ring-1 ring-white/10">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full" />
                
                <div className="relative z-10 space-y-8">
                    <div>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-2 block">HR Config</span>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Configure Access</h2>
                        <p className="text-slate-400 text-xs mt-2 font-medium">Adjusting parameters for <span className="text-white italic font-bold">{user.email}</span></p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Designated Role</label>
                            <div className="grid grid-cols-2 gap-3 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                                {roles.map((r: any) => (
                                    <button
                                        key={r.id}
                                        onClick={() => setRoleId(r.id)}
                                        className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-left transition-all border ${
                                            roleId === r.id ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-inner' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                    >
                                        {r.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Network Status</label>
                            <div className="flex gap-3">
                                {['active', 'banned'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatus(s)}
                                        className={`flex-1 px-6 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            status === s ? (s === 'active' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-red-500/20 border-red-500/50 text-red-400') : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5 mt-6">
                        <button 
                            onClick={onClose}
                            className="flex-1 h-14 rounded-full bg-white/5 border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            Discard
                        </button>
                        <button 
                            onClick={() => onSave(roleId, status)}
                            className="flex-1 h-14 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.1em] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                            Enforce Protocol
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// THE NEW INVITE PERSONNEL MODAL FOR TRUE CRUD
function InviteUserModal({ roles, onClose, onSave }: any) {
    const [payload, setPayload] = useState({ email: '', password: '', role_id: '' });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[3rem] p-10 shadow-2xl overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[80px] pointer-events-none" />

                <div className="relative z-10 space-y-8">
                    <div>
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl mb-6 shadow-inner text-emerald-400">⚡</div>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Invite Personnel</h2>
                        <p className="text-slate-400 text-xs mt-2 font-medium">Add a new operational agent to the Umrah Hub system architecture.</p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Corporate Email</label>
                            <input 
                                type="email"
                                value={payload.email}
                                onChange={(e) => setPayload({...payload, email: e.target.value})}
                                placeholder="agent@umrahhub.com"
                                className="linear-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Master Password</label>
                            <input 
                                type="password"
                                value={payload.password}
                                onChange={(e) => setPayload({...payload, password: e.target.value})}
                                placeholder="••••••••"
                                className="linear-input w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Role</label>
                            <select 
                                value={payload.role_id}
                                onChange={(e) => setPayload({...payload, role_id: e.target.value})}
                                className="linear-input w-full appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[center_right_1rem] cursor-pointer"
                            >
                                <option value="" disabled className="text-slate-800">Select Authorization Role...</option>
                                {roles.map((r: any) => (
                                    <option key={r.id} value={r.id} className="text-slate-800 font-bold">{r.name.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                        <button 
                            onClick={onClose}
                            className="flex-1 h-14 rounded-full bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            Abort
                        </button>
                        <button 
                            disabled={!payload.email || !payload.password || !payload.role_id}
                            onClick={() => onSave(payload)}
                            className="flex-1 h-14 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.1em] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 active:scale-95">
                            Authorize User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
