"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Persistence & Keyboard Shortcut
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setIsCollapsed(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem("sidebar_collapsed", String(next));
        return next;
    });
  }, []);

  if (!isMounted) return <aside className="w-[240px] bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] h-screen shrink-0" />;

  return (
    <aside 
      className={`group/sidebar bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] flex flex-col transition-all duration-300 ease-in-out relative z-[100] h-screen shrink-0 ${
        isCollapsed ? "w-[64px]" : "w-[240px]"
      }`}
    >
      {/* Dynamic Toggle Button - Linear Style */}
      <button 
        onClick={toggleSidebar}
        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center text-[10px] text-[var(--text-muted)] shadow-sm opacity-0 group-hover/sidebar:opacity-100 transition-all hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] z-[110] active:scale-90`}
        title={isCollapsed ? "Expand (⌘B)" : "Collapse (⌘B)"}
      >
        {isCollapsed ? "›" : "‹"}
      </button>

      {/* Branding Header */}
      <div className="h-14 flex items-center px-4 mb-2 shrink-0">
        <Link href="/" className="flex items-center gap-3 w-full">
            <div className="w-6 h-6 rounded-md bg-[var(--brand-muted)] border border-[var(--brand-solid)]/20 flex items-center justify-center text-xs shrink-0 shadow-sm">
            🕋
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"}`}>
               <h1 className="font-semibold text-[13px] text-[var(--text-primary)] tracking-tight whitespace-nowrap">Umrah Hub</h1>
            </div>
        </Link>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
          <nav className={`flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar px-3 pb-8 ${isCollapsed ? "items-center" : ""}`}>
            <NavGroup label="Strategic" collapsed={isCollapsed}>
                <NavItem href="/" icon="📊" label="Decision HQ" active={pathname === "/"} collapsed={isCollapsed} />
                <NavItem href="/finance" icon="💰" label="Financial Core" active={pathname === "/finance"} collapsed={isCollapsed} />
                <NavItem href="/analytics" icon="🧬" label="Audience DNA" active={pathname === "/analytics"} collapsed={isCollapsed} />
                <NavItem href="/pixel-manager" icon="🛰️" label="Pixel Radar" active={pathname === "/pixel-manager"} collapsed={isCollapsed} />
            </NavGroup>

            <NavGroup label="Growth" collapsed={isCollapsed}>
                <NavItem href="/leads" icon="⚡" label="Lead Pipeline" active={pathname === "/leads"} collapsed={isCollapsed} />
                <NavItem href="/lp-hub" icon="🔗" label="LP Catalyst" active={pathname === "/lp-hub"} collapsed={isCollapsed} />
                <NavItem href="/form-hub" icon="📝" label="Capture Nodes" active={pathname === "/form-hub"} collapsed={isCollapsed} />
                <NavItem href="/marketing" icon="📢" label="Campaigns" active={pathname === "/marketing"} collapsed={isCollapsed} />
            </NavGroup>

            <NavGroup label="Inventory" collapsed={isCollapsed}>
                <NavItem href="/vendors" icon="🏢" label="Elite Vendors" active={pathname === "/vendors"} collapsed={isCollapsed} />
                <NavItem href="/packages" icon="📦" label="Sacred Inventory" active={pathname === "/packages"} collapsed={isCollapsed} />
            </NavGroup>

            <NavGroup label="System" collapsed={isCollapsed}>
                <NavItem href="/team" icon="👥" label="Staffing Core" active={pathname === "/team"} collapsed={isCollapsed} />
                <NavItem href="/api-bridge" icon="🔌" label="Quantum Bridge" active={pathname === "/api-bridge"} collapsed={isCollapsed} />
                <NavItem href="/recycle-bin" icon="🗑️" label="The Void" active={pathname === "/recycle-bin"} collapsed={isCollapsed} />
            </NavGroup>
          </nav>
      </div>
      
      {/* Footer Capacity */}
      <div className="p-3 mt-auto border-t border-[var(--border-main)] bg-[var(--bg-sidebar)]">
         {isCollapsed ? (
            <div className="w-10 h-10 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg text-[10px] font-bold text-[var(--text-muted)] cursor-default">
                84%
            </div>
         ) : (
            <div className="px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg shadow-sm animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">Ops Capacity</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-semibold">84.2%</span>
                </div>
                <div className="h-1 w-full bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--text-muted)] rounded-full" style={{ width: '84.2%' }} />
                </div>
            </div>
         )}
      </div>
    </aside>
  );
}

function NavGroup({ label, children, collapsed }: any) {
    return (
        <div className="space-y-1 w-full">
            <div className={`px-3 transition-opacity duration-300 ${collapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}>
                <h3 className="text-[11px] font-medium text-[var(--text-muted)] tracking-tight mb-2 uppercase tracking-widest leading-loose">{label}</h3>
            </div>
            <div className="space-y-0.5">
                {children}
            </div>
        </div>
    )
}

function NavItem({ href, icon, label, active = false, collapsed = false }: { href: string; icon: string; label: string; active?: boolean; collapsed?: boolean }) {
  return (
    <Link 
        href={href} 
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-200 relative group/item ${
            active 
            ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)] shadow-sm' 
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
        } ${collapsed ? 'justify-center w-10 mx-auto px-0' : 'w-full'}`}
    >
      <span className={`text-[15px] transition-transform duration-200 group-hover/item:scale-110 ${collapsed ? '' : 'grayscale group-hover/item:grayscale-0'}`}>{icon}</span>
      <div className={`overflow-hidden transition-all duration-300 flex-1 ${collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"}`}>
        <span className="text-[13px] font-medium tracking-tight whitespace-nowrap block ml-0.5">
            {label}
        </span>
      </div>
      
      {collapsed && (
          <div className="absolute left-full ml-3 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-card)] text-[11px] text-[var(--text-primary)] font-medium rounded-md opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all translate-x-1 group-hover/item:translate-x-0 z-[1000] shadow-xl whitespace-nowrap">
            {label}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-[var(--border-card)]" />
          </div>
      )}
    </Link>
  )
}
