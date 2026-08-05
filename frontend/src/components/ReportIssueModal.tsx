'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { IssueCategory, Priority } from '@/types';
import { X, Wrench, AlertTriangle, Camera, Upload, Send, Sparkles, PhoneCall } from 'lucide-react';

interface Props {
  initialRoomId?: string;
  onClose: () => void;
}

export const ReportIssueModal: React.FC<Props> = ({ initialRoomId, onClose }) => {
  const { rooms, reportMaintenanceIssue } = useStore();

  const [roomId, setRoomId] = useState(initialRoomId || (rooms[0]?.id ?? ''));
  const [category, setCategory] = useState<IssueCategory>('PLUMBING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
  ]);
  const [isUploading, setIsUploading] = useState(false);

  const categories: { key: IssueCategory; label: string; icon: string }[] = [
    { key: 'PLUMBING', label: 'Plumbing', icon: '🚰' },
    { key: 'HVAC', label: 'HVAC / AC', icon: '❄️' },
    { key: 'APPLIANCE', label: 'Appliance', icon: '📺' },
    { key: 'PROPERTY_DAMAGE', label: 'Property Damage', icon: '🛋️' },
    { key: 'ELECTRICAL', label: 'Electrical', icon: '⚡' },
    { key: 'OTHER', label: 'Other Issue', icon: '🔧' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    reportMaintenanceIssue({
      roomId,
      category,
      title,
      description,
      priority,
      images,
    });

    onClose();
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setImages((prev) => [
        ...prev,
        'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
      ]);
      setIsUploading(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden glass-panel">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Report Maintenance Issue</h2>
              <p className="text-xs text-slate-400">Triggers ticket creation & live SMS alert to Tech</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Room Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Room</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-pink-500"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.roomType}) - Current Status: {r.status}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Category Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Issue Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    category === c.key
                      ? 'bg-pink-600/20 border-pink-500 text-pink-300 shadow-md shadow-pink-500/10'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl mb-1">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority Level</label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    priority === p
                      ? p === 'URGENT'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30 animate-pulse'
                        : p === 'HIGH'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-brand-600 text-white border-brand-500'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Title & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Issue Title</label>
            <input
              type="text"
              placeholder="e.g. Bathroom sink leaking onto floor"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Provide exact details of the damage or issue so the technician arrives prepared..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              required
            />
          </div>

          {/* Attach Maintenance Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">Attach Inspection Photos</label>
              <button
                type="button"
                onClick={simulateUpload}
                disabled={isUploading}
                className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-semibold"
              >
                <Camera className="w-3.5 h-3.5" />
                {isUploading ? 'Uploading to S3...' : '+ Snap Photo'}
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                  <img src={img} alt="Issue evidence" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Auto Actions Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Automatic Workflow Actions:</span>
              1. Room status changes to <strong className="text-white font-mono">MAINTENANCE_PENDING</strong>.<br />
              2. Real-time alert broadcast to Front Desk & Tech.<br />
              {(priority === 'HIGH' || priority === 'URGENT') && (
                <span className="text-rose-300 font-bold block mt-0.5">
                  3. Twilio SMS will be dispatched to duty tech Alex Rivera instantly.
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30 hover:from-pink-500 hover:to-rose-500 transition-all"
            >
              <Send className="w-4 h-4" />
              Submit Ticket & Notify Tech
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
