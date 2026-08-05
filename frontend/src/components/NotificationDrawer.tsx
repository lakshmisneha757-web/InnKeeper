'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Bell, CheckCheck, X, Sparkles, Wrench, MessageSquare, AlertCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const NotificationDrawer: React.FC<Props> = ({ onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useStore();

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden glass-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-400" />
          <h3 className="font-bold text-sm text-white">Live System Alerts</h3>
          <span className="text-[10px] bg-brand-500/20 text-brand-300 font-semibold px-2 py-0.5 rounded-full">
            Realtime
          </span>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            No new alerts or notifications.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                n.isRead ? 'bg-slate-900/40 opacity-75' : 'bg-slate-800/50 hover:bg-slate-800/80'
              }`}
            >
              <div className="mt-0.5">
                {n.type === 'HOUSEKEEPING_ALERT' && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                {n.type === 'MAINTENANCE_ALERT' && (
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
                    <Wrench className="w-4 h-4" />
                  </div>
                )}
                {n.type === 'SMS_SENT' && (
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                )}
                {n.type === 'SYSTEM' && (
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-xs text-white truncate">{n.title}</span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
