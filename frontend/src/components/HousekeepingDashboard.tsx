'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Room, RoomStatus, Priority } from '@/types';
import { 
  Sparkles, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertOctagon, 
  RotateCcw, 
  Wrench, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Building, 
  ShieldCheck,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { ReportIssueModal } from './ReportIssueModal';
import confetti from 'canvas-confetti';

export const HousekeepingDashboard: React.FC = () => {
  const { 
    rooms, 
    startCleaning, 
    pauseCleaning, 
    resumeCleaning, 
    markRoomClean, 
    markRoomDirty, 
    markRoomInspected,
    selectedFloorFilter,
    setFloorFilter,
    selectedBuildingFilter,
    setBuildingFilter,
    selectedPriorityFilter,
    setPriorityFilter,
    selectedStatusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery
  } = useStore();

  const [activeReportRoomId, setActiveReportRoomId] = useState<string | null>(null);
  const [cleaningNotesModalRoom, setCleaningNotesModalRoom] = useState<Room | null>(null);
  const [cleaningNotesInput, setCleaningNotesInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live timer tick for cleaning duration
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    if (selectedFloorFilter !== 'ALL' && r.floor.toString() !== selectedFloorFilter) return false;
    if (selectedBuildingFilter !== 'ALL' && r.building !== selectedBuildingFilter) return false;
    if (selectedPriorityFilter !== 'ALL' && r.priority !== selectedPriorityFilter) return false;
    if (selectedStatusFilter !== 'ALL' && r.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = r.roomNumber.toLowerCase().includes(q);
      const matchType = r.roomType.toLowerCase().includes(q);
      const matchStatus = r.status.toLowerCase().includes(q);
      if (!matchNum && !matchType && !matchStatus) return false;
    }
    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const triggerCleanCompletion = (room: Room) => {
    setCleaningNotesModalRoom(room);
  };

  const submitCleanNotes = () => {
    if (cleaningNotesModalRoom) {
      markRoomClean(cleaningNotesModalRoom.id, cleaningNotesInput);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
      setCleaningNotesModalRoom(null);
      setCleaningNotesInput('');
    }
  };

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'CLEAN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-clean">✨ CLEAN</span>;
      case 'DIRTY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-dirty">🧹 DIRTY</span>;
      case 'CLEANING_IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-cleaning">⏳ IN PROGRESS</span>;
      case 'INSPECTION_PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-inspection">🔍 INSPECTION</span>;
      case 'MAINTENANCE_PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-maintenance">🔧 MAINTENANCE</span>;
      case 'OUT_OF_SERVICE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-oos">🚫 OUT OF SERVICE</span>;
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">URGENT</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">MEDIUM</span>;
      case 'LOW':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-300">LOW</span>;
    }
  };

  const calculateElapsedTimer = (startTimeStr?: string) => {
    if (!startTimeStr) return '00:00';
    const start = new Date(startTimeStr).getTime();
    const elapsedSec = Math.max(0, Math.floor((nowTick - start) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 glass-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-xl text-white">Housekeeping Operations Hub</h2>
          </div>
          <p className="text-xs text-slate-400">Mobile-optimized dashboard with live Socket.IO room status sync.</p>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/60 text-center shrink-0">
            <span className="text-xs text-slate-400 block font-medium">Clean</span>
            <span className="text-lg font-extrabold text-emerald-400">
              {rooms.filter((r) => r.status === 'CLEAN').length}
            </span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/60 text-center shrink-0">
            <span className="text-xs text-slate-400 block font-medium">Dirty</span>
            <span className="text-lg font-extrabold text-rose-400">
              {rooms.filter((r) => r.status === 'DIRTY').length}
            </span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/60 text-center shrink-0">
            <span className="text-xs text-slate-400 block font-medium">In Progress</span>
            <span className="text-lg font-extrabold text-amber-400">
              {rooms.filter((r) => r.status === 'CLEANING_IN_PROGRESS').length}
            </span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/60 text-center shrink-0">
            <span className="text-xs text-slate-400 block font-medium">Maintenance</span>
            <span className="text-lg font-extrabold text-pink-400">
              {rooms.filter((r) => r.status === 'MAINTENANCE_PENDING').length}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3 glass-card">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search room number, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Filters & Refresh Button */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {/* Floor Filter */}
            <select
              value={selectedFloorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Floors</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
            </select>

            {/* Building Filter */}
            <select
              value={selectedBuildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Buildings</option>
              <option value="Main Building">Main Building</option>
              <option value="Annex Building">Annex Building</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="DIRTY">Dirty</option>
              <option value="CLEANING_IN_PROGRESS">Cleaning</option>
              <option value="CLEAN">Clean</option>
              <option value="INSPECTION_PENDING">Inspection</option>
              <option value="MAINTENANCE_PENDING">Maintenance</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Refresh Live Button */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0"
              title="Refresh Room List"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Room Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between glass-card relative overflow-hidden group"
          >
            {/* Top Bar: Room Number & Badges */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-extrabold text-xl text-white shadow-inner">
                    {room.roomNumber}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{room.roomType}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      Floor {room.floor} • {room.building}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(room.status)}
                  {getPriorityBadge(room.priority)}
                </div>
              </div>

              {/* Guest Checkout Info & Time */}
              {room.checkoutTime && (
                <div className="mb-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-300 mb-1">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-brand-400" /> Checkout Time:
                    </span>
                    <span className="font-bold text-brand-300">{room.checkoutTime}</span>
                  </div>
                  {room.guestCheckoutInfo && (
                    <p className="text-slate-400 text-[11px] italic truncate">{room.guestCheckoutInfo}</p>
                  )}
                </div>
              )}

              {/* Live Timer if Cleaning In Progress */}
              {room.status === 'CLEANING_IN_PROGRESS' && (
                <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-semibold">Active Cleaning:</span>
                  </div>
                  <span className="font-mono font-bold text-sm tracking-wider">
                    {calculateElapsedTimer(room.cleaningStartTime)}
                  </span>
                </div>
              )}

              {/* Clean Duration if Completed */}
              {room.status === 'CLEAN' && room.cleaningDurationMinutes && (
                <p className="text-xs text-emerald-400 mb-3 flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Cleaned in {room.cleaningDurationMinutes} mins at {room.lastCleanedAt || '09:45 AM'}
                </p>
              )}

              {/* Staff Assigned */}
              {room.housekeeperName && (
                <p className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Housekeeper: <strong className="text-slate-200">{room.housekeeperName}</strong>
                </p>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              
              {/* Primary Cleaning Action Button */}
              {room.status === 'DIRTY' && (
                <button
                  onClick={() => startCleaning(room.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Start Cleaning
                </button>
              )}

              {room.status === 'CLEANING_IN_PROGRESS' && (
                <button
                  onClick={() => triggerCleanCompletion(room)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Mark Clean
                </button>
              )}

              {room.status === 'CLEAN' && (
                <button
                  onClick={() => markRoomDirty(room.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Mark Dirty
                </button>
              )}

              {room.status === 'INSPECTION_PENDING' && (
                <button
                  onClick={() => markRoomInspected(room.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Approve Inspection
                </button>
              )}

              {/* Report Maintenance Issue Button */}
              <button
                onClick={() => setActiveReportRoomId(room.id)}
                className="p-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 transition-all shrink-0"
                title="Report Maintenance Issue"
              >
                <Wrench className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Maintenance Modal */}
      {activeReportRoomId && (
        <ReportIssueModal
          initialRoomId={activeReportRoomId}
          onClose={() => setActiveReportRoomId(null)}
        />
      )}

      {/* Cleaning Notes Modal */}
      {cleaningNotesModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md glass-panel">
            <h3 className="font-bold text-base text-white mb-2">Mark Room {cleaningNotesModalRoom.roomNumber} as Clean</h3>
            <p className="text-xs text-slate-400 mb-4">Add optional cleaning notes or restock details for supervisors.</p>

            <textarea
              rows={3}
              placeholder="e.g. Changed bedsheets, sanitized minibar, restocked towels..."
              value={cleaningNotesInput}
              onChange={(e) => setCleaningNotesInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setCleaningNotesModalRoom(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={submitCleanNotes}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30"
              >
                Confirm Room Cleaned
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
