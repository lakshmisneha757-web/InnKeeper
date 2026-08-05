'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Header } from '@/components/Header';
import { HousekeepingDashboard } from '@/components/HousekeepingDashboard';
import { MaintenanceDashboard } from '@/components/MaintenanceDashboard';
import { FrontDeskLiveCenter } from '@/components/FrontDeskLiveCenter';
import { Sparkles, Wrench, Monitor, Smartphone, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  const { activeView, activeRole, initRealtimeSync } = useStore();

  useEffect(() => {
    const unsub = initRealtimeSync();
    return () => unsub();
  }, [initRealtimeSync]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Dynamic View Renderer */}
        {activeView === 'housekeeping' && <HousekeepingDashboard />}
        {activeView === 'maintenance' && <MaintenanceDashboard />}
        {activeView === 'frontdesk' && <FrontDeskLiveCenter />}

      </main>

      {/* Footer & Active Session Info */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>InnKeeper System Module 4 • Production Version 1.0.0</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Role: <strong className="text-white">{activeRole}</strong></span>
            <span>Realtime Socket Engine: <strong className="text-emerald-400 font-mono">Active</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
