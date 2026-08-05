'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { RoomStatus } from '@/types';
import { 
  Monitor, 
  Wifi, 
  Sparkles, 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Building,
  CheckCheck
} from 'lucide-react';

export const FrontDeskLiveCenter: React.FC = () => {
  const { rooms, tickets, notifications, markRoomClean, markRoomDirty } = useStore();

  const totalRooms = rooms.length;
  const cleanCount = rooms.filter((r) => r.status === 'CLEAN').length;
  const dirtyCount = rooms.filter((r) => r.status === 'DIRTY').length;
  const cleaningCount = rooms.filter((r) => r.status === 'CLEANING_IN_PROGRESS').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'MAINTENANCE_PENDING').length;
  const inspectionCount = rooms.filter((r) => r.status === 'INSPECTION_PENDING').length;

  const readinessPercent = Math.round((cleanCount / totalRooms) * 100) || 0;

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'CLEAN':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'DIRTY':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'CLEANING_IN_PROGRESS':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse';
      case 'INSPECTION_PENDING':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'MAINTENANCE_PENDING':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/40';
      case 'OUT_OF_SERVICE':
        return 'bg-slate-700 text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Front Desk Live Command Center Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Monitor className="w-5 h-5 text-sky-400" />
            <h2 className="font-bold text-xl text-white">Front Desk Live Command Center</h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Socket Stream
            </span>
          </div>
          <p className="text-xs text-slate-400">Instant synchronized view of property readiness & operational alerts.</p>
        </div>

        {/* Readiness Meter */}
        <div className="w-full lg:w-72 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-300">Property Readiness</span>
            <span className="text-emerald-400 font-extrabold">{readinessPercent}% Ready</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center glass-card">
          <span className="text-xs text-slate-400 block mb-1">Clean & Ready</span>
          <span className="text-2xl font-extrabold text-emerald-400">{cleanCount}</span>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center glass-card">
          <span className="text-xs text-slate-400 block mb-1">Dirty / Turnaround</span>
          <span className="text-2xl font-extrabold text-rose-400">{dirtyCount}</span>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center glass-card">
          <span className="text-xs text-slate-400 block mb-1">Cleaning Active</span>
          <span className="text-2xl font-extrabold text-amber-400">{cleaningCount}</span>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center glass-card">
          <span className="text-xs text-slate-400 block mb-1">Inspection Pending</span>
          <span className="text-2xl font-extrabold text-purple-400">{inspectionCount}</span>
        </div>
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center glass-card">
          <span className="text-xs text-slate-400 block mb-1">Maintenance Held</span>
          <span className="text-2xl font-extrabold text-pink-400">{maintenanceCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Room Matrix Grid (Left 2 Columns) */}
        <div className="lg:col-span-2 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-400" />
              Live Room Matrix Grid
            </h3>
            <span className="text-xs text-slate-400">Click room for front desk quick toggle</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${getStatusColor(
                  room.status
                )}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-base text-white">{room.roomNumber}</span>
                    <span className="text-[10px] opacity-80 uppercase font-mono">{room.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-[11px] opacity-90 truncate">{room.roomType}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <span>F{room.floor} • {room.building.split(' ')[0]}</span>
                  {room.status === 'CLEAN' ? (
                    <button
                      onClick={() => markRoomDirty(room.id)}
                      className="hover:underline font-bold text-rose-300"
                    >
                      Set Dirty
                    </button>
                  ) : (
                    <button
                      onClick={() => markRoomClean(room.id)}
                      className="hover:underline font-bold text-emerald-300"
                    >
                      Set Clean
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Socket Activity Stream (Right Column) */}
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Event Feed
            </h3>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">WebSocket</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.slice(0, 8).map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{notif.title}</span>
                  <span className="text-[10px] text-slate-500">{notif.timestamp}</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">{notif.message}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
