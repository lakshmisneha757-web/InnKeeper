'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Role } from '@/types';
import { 
  Building2, 
  Sparkles, 
  Wrench, 
  Monitor, 
  Bell, 
  Wifi, 
  ShieldCheck, 
  UserCheck, 
  Smartphone,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';

export const Header: React.FC = () => {
  const { activeRole, setActiveRole, activeView, setActiveView, notifications } = useStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const roles: { key: Role; label: string; icon: React.ReactNode }[] = [
    { key: 'HOUSEKEEPER', label: 'Housekeeper', icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
    { key: 'MAINTENANCE_TECH', label: 'Maintenance Tech', icon: <Wrench className="w-4 h-4 text-pink-400" /> },
    { key: 'INSPECTOR', label: 'Inspector', icon: <ShieldCheck className="w-4 h-4 text-purple-400" /> },
    { key: 'FRONT_DESK', label: 'Front Desk', icon: <Monitor className="w-4 h-4 text-sky-400" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Realtime Connection Status */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">InnKeeper</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
                  Module 4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Mobile Housekeeping & Maintenance Hub</p>
            </div>
          </div>

          {/* WebSocket Status Indicator (Mobile Only) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* View Switcher Tabs (Housekeeping | Maintenance | Front Desk Command Center) */}
        <div className="flex items-center bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto justify-center">
          <button
            onClick={() => setActiveView('housekeeping')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeView === 'housekeeping'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Housekeeping
          </button>

          <button
            onClick={() => setActiveView('maintenance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeView === 'maintenance'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Maintenance Hub
          </button>

          <button
            onClick={() => setActiveView('frontdesk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              activeView === 'frontdesk'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Front Desk Live
          </button>
        </div>

        {/* Right Section: Role Switcher Simulator & Socket Status & Notification Bell */}
        <div className="hidden md:flex items-center gap-3">
          {/* Active Role Selector */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Role:</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as Role)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.key} value={r.key} className="bg-slate-900 text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Socket.IO Connected</span>
          </div>

          {/* Notification Trigger Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-rose-500/50">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <NotificationDrawer onClose={() => setIsNotifOpen(false)} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
