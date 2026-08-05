'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MaintenanceTicket, RoomStatus } from '@/types';
import { 
  Wrench, 
  CheckCircle2, 
  Play, 
  Pause, 
  XCircle, 
  Clock, 
  Camera, 
  MessageSquare, 
  User, 
  AlertTriangle,
  Building,
  Image as ImageIcon,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const MaintenanceDashboard: React.FC = () => {
  const { tickets, acceptTicket, rejectTicket, startRepair, pauseRepair, completeRepair } = useStore();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal States
  const [activeTicketForStart, setActiveTicketForStart] = useState<MaintenanceTicket | null>(null);
  const [estimatedTimeInput, setEstimatedTimeInput] = useState('1 Hour');

  const [activeTicketForComplete, setActiveTicketForComplete] = useState<MaintenanceTicket | null>(null);
  const [repairNotesInput, setRepairNotesInput] = useState('');
  const [finalStatusInput, setFinalStatusInput] = useState<RoomStatus>('DIRTY');

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  const handleStartSubmit = () => {
    if (activeTicketForStart) {
      startRepair(activeTicketForStart.id, estimatedTimeInput);
      setActiveTicketForStart(null);
    }
  };

  const handleCompleteSubmit = () => {
    if (activeTicketForComplete) {
      completeRepair(
        activeTicketForComplete.id,
        repairNotesInput,
        ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'],
        finalStatusInput
      );
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      setActiveTicketForComplete(null);
      setRepairNotesInput('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Maintenance Hub Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 glass-panel">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-white">Technician Maintenance Hub</h2>
            <p className="text-xs text-slate-400">Track, accept, repair, and complete assigned maintenance tickets.</p>
          </div>
        </div>

        {/* Filter Status Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto w-full md:w-auto">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filterStatus === st
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800/60">
            <Wrench className="w-10 h-10 mx-auto mb-2 opacity-20 text-slate-400" />
            No maintenance tickets found for this filter.
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between glass-card relative"
            >
              <div>
                {/* Ticket Top Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-pink-400 font-bold px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Room {ticket.roomNumber}</span>
                    </div>
                    <h3 className="font-bold text-base text-white">{ticket.title}</h3>
                  </div>

                  {/* Priority & Category Badges */}
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        ticket.priority === 'URGENT'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                          : ticket.priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      Category: {ticket.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mb-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 leading-relaxed">
                  {ticket.description}
                </p>

                {/* Reported Photos */}
                {ticket.images.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[11px] text-slate-400 font-semibold mb-1.5 block flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Inspection Evidence:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {ticket.images.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" className="shrink-0">
                          <img
                            src={img}
                            alt="Inspection image"
                            className="w-20 h-20 rounded-xl object-cover border border-slate-700 hover:scale-105 transition-transform"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reporter & SMS Alert Details */}
                <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Reported by:
                    </span>
                    <span className="text-slate-200 font-medium">{ticket.reporterName} ({ticket.reporterRole})</span>
                  </div>
                  {ticket.smsSentToTech && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5" /> Twilio SMS Alert sent to Duty Technician
                    </div>
                  )}
                  {ticket.assignedTechName && (
                    <div className="flex items-center justify-between text-pink-300">
                      <span>Assigned Tech:</span>
                      <span className="font-semibold">{ticket.assignedTechName}</span>
                    </div>
                  )}
                  {ticket.estimatedCompletionTime && (
                    <div className="flex items-center justify-between text-amber-300">
                      <span>Estimated Duration:</span>
                      <span className="font-bold">{ticket.estimatedCompletionTime}</span>
                    </div>
                  )}
                </div>

                {/* Completion Proof & Notes (If Resolved) */}
                {ticket.status === 'RESOLVED' && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
                    <span className="text-xs font-bold text-emerald-300 block mb-1">
                      ✅ Repair Notes & Verification Proof
                    </span>
                    <p className="text-xs text-slate-300 italic mb-2">{ticket.repairNotes || 'Repair verified completed.'}</p>
                    {ticket.completionImages && ticket.completionImages.length > 0 && (
                      <div className="flex items-center gap-2">
                        {ticket.completionImages.map((img, i) => (
                          <img key={i} src={img} alt="Repair proof" className="w-16 h-16 rounded-lg object-cover border border-emerald-500/40" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Technician Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {ticket.status === 'OPEN' && (
                  <>
                    <button
                      onClick={() => acceptTicket(ticket.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30 transition-all"
                    >
                      Accept Ticket
                    </button>
                    <button
                      onClick={() => rejectTicket(ticket.id)}
                      className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"
                    >
                      Reject
                    </button>
                  </>
                )}

                {ticket.status === 'ASSIGNED' && (
                  <button
                    onClick={() => setActiveTicketForStart(ticket)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all"
                  >
                    <Play className="w-4 h-4" /> Start Repair Work
                  </button>
                )}

                {ticket.status === 'IN_PROGRESS' && (
                  <>
                    <button
                      onClick={() => pauseRepair(ticket.id)}
                      className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => setActiveTicketForComplete(ticket)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Complete Repair
                    </button>
                  </>
                )}

                {ticket.status === 'PAUSED' && (
                  <button
                    onClick={() => startRepair(ticket.id)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-600 text-white"
                  >
                    Resume Repair
                  </button>
                )}

                {ticket.status === 'RESOLVED' && (
                  <div className="w-full text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20">
                    Resolution Complete
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Start Repair (Est Time) */}
      {activeTicketForStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md glass-panel">
            <h3 className="font-bold text-base text-white mb-2">Start Repair Work</h3>
            <p className="text-xs text-slate-400 mb-4">Set estimated completion time for Front Desk visibility.</p>

            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estimated Duration</label>
            <select
              value={estimatedTimeInput}
              onChange={(e) => setEstimatedTimeInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500 mb-5"
            >
              <option value="30 Minutes">30 Minutes</option>
              <option value="1 Hour">1 Hour</option>
              <option value="2 Hours">2 Hours</option>
              <option value="Half Day (4 Hours)">Half Day (4 Hours)</option>
            </select>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveTicketForStart(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 text-white shadow-lg"
              >
                Confirm Start Work
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Complete Repair (Notes + Photo + Room Status) */}
      {activeTicketForComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md glass-panel space-y-4">
            <h3 className="font-bold text-base text-white">Complete Ticket #{activeTicketForComplete.ticketNumber}</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Repair Notes</label>
              <textarea
                rows={3}
                placeholder="Detail the fix applied (e.g., replaced rubber seal, unclogged trap)..."
                value={repairNotesInput}
                onChange={(e) => setRepairNotesInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Set Final Room Status</label>
              <select
                value={finalStatusInput}
                onChange={(e) => setFinalStatusInput(e.target.value as RoomStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
              >
                <option value="DIRTY">DIRTY (Needs Housekeeper Cleaning)</option>
                <option value="CLEAN">CLEAN (Ready for Guest Check-in)</option>
                <option value="INSPECTION_PENDING">INSPECTION PENDING</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              📷 Completion proof image auto-attached to ticket verification history.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveTicketForComplete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
