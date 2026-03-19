"use client";

import React from 'react';
import LeadCaptureForm from '@/components/forms/LeadCaptureForm';

export default function FormHubPage() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-12 animate-in fade-in duration-300 pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-main)] pb-8">
            <div>
                <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Capture Nodes</h1>
                <p className="text-[14px] text-[var(--text-secondary)] mt-1 max-w-2xl">
                    Configure and preview high-conversion ingestion points. This form automatically triggers AI scoring and geo-routing upon submission.
                </p>
            </div>
            <div className="flex gap-3">
                <button className="linear-button">Embed Code</button>
                <button className="linear-button-primary">Create New Node</button>
            </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
            {/* Form Preview Section */}
            <div className="xl:col-span-12">
               <div className="max-w-xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Live Preview</span>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)]">ID: node_v2_progressive</span>
                    </div>
                    <LeadCaptureForm />
               </div>
            </div>
        </div>

        {/* Features / Docs Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--border-main)] pt-12">
            <FeatureCard 
                icon="📍" 
                title="Location Mapping" 
                desc="Direct integration with Wilayah.id for sub-district precision. Optimized for Indonesian logistics."
            />
            <FeatureCard 
                icon="🧠" 
                title="NLP Sentiment" 
                desc="Real-time analysis of user messages to categorize intent (Hot/Warm/Cold) before CS engagement."
            />
            <FeatureCard 
                icon="♻️" 
                title="Auto-Routing" 
                desc="Submission data is instantly dispatched via Round-Robin to currently active agents."
            />
        </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <div className="linear-card group">
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{desc}</p>
        </div>
    )
}
