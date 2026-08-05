import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiRefreshCw, FiWifi, FiZap } from 'react-icons/fi';
import { connectChannel, disconnectChannel, getChannels, reconnectChannel, syncChannel } from '../services/api';

const getChannelInitials = (name) => name?.split(' ').slice(0, 2).map((piece) => piece[0]).join('').toUpperCase() || 'OT';

const getStatusTone = (connected, apiStatus) => {
  if (connected && apiStatus?.toLowerCase() === 'healthy') return 'bg-emerald-100 text-emerald-700';
  if (connected) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getChannels();
      setChannels(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError('Unable to load channels.');
      toast.error('Channels could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (channelId, action) => {
    try {
      if (action === 'connect') await connectChannel(channelId);
      if (action === 'disconnect') await disconnectChannel(channelId);
      if (action === 'reconnect') await reconnectChannel(channelId);
      if (action === 'sync') await syncChannel(channelId);
      setChannels((prev) => prev.map((channel) => channel.id === channelId ? { ...channel, connected: action !== 'disconnect', api_status: action === 'sync' ? 'Healthy' : channel.api_status } : channel));
      toast.success(`Channel ${action} completed`);
      await load();
    } catch (err) {
      toast.error(`Channel ${action} failed`);
    }
  };

  if (loading) {
    return <div className="rounded-[24px] border border-violet-100 bg-white/70 p-8 text-slate-500">Loading channels…</div>;
  }

  if (error) {
    return <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-8 text-rose-700">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Channel Manager</h2>
            <p className="text-sm text-slate-500">Monitor OTA connectivity, sync health, and inventory exchange across all channels.</p>
          </div>
          <button onClick={() => load()} className="flex items-center gap-2 rounded-full border border-violet-200 px-3 py-2 text-sm font-medium text-slate-600">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {channels.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {channels.map((channel) => (
            <motion.div key={channel.id} whileHover={{ y: -3 }} className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-sm font-semibold text-violet-700">
                    {getChannelInitials(channel.channel_name || channel.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{channel.channel_name || channel.name}</h3>
                    <p className="text-sm text-slate-500">{channel.connected ? 'Connected' : 'Disconnected'}</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(channel.connected, channel.api_status)}`}>{channel.connected ? 'Live' : 'Offline'}</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-violet-50/70 p-3 text-sm text-slate-600">
                  <p className="text-slate-500">API Health</p>
                  <p className="mt-1 font-semibold text-slate-800">{channel.api_status || 'Unknown'}</p>
                </div>
                <div className="rounded-2xl bg-violet-50/70 p-3 text-sm text-slate-600">
                  <p className="text-slate-500">Last Sync</p>
                  <p className="mt-1 font-semibold text-slate-800">{channel.last_sync ? new Date(channel.last_sync).toLocaleString() : 'Not synced yet'}</p>
                </div>
                <div className="rounded-2xl bg-violet-50/70 p-3 text-sm text-slate-600">
                  <p className="text-slate-500">Rooms Synced</p>
                  <p className="mt-1 font-semibold text-slate-800">{channel.rooms_synced ?? channel.roomsSynced ?? '—'}</p>
                </div>
                <div className="rounded-2xl bg-violet-50/70 p-3 text-sm text-slate-600">
                  <p className="text-slate-500">Current Rate Plan</p>
                  <p className="mt-1 font-semibold text-slate-800">{channel.rate_plan || channel.current_rate_plan || 'Standard'}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1">
                  <FiWifi size={12} /> Next Auto Sync: {channel.next_sync || '5 min'}
                </span>
                <span className="rounded-full bg-violet-50 px-2.5 py-1">{channel.connected ? 'Auto sync enabled' : 'Awaiting connection'}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {channel.connected ? (
                  <button onClick={() => handleAction(channel.id, 'disconnect')} className="rounded-full border border-violet-200 px-3 py-2 text-sm text-slate-600">Disconnect</button>
                ) : (
                  <button onClick={() => handleAction(channel.id, 'connect')} className="rounded-full border border-violet-200 px-3 py-2 text-sm text-slate-600">Connect</button>
                )}
                <button onClick={() => handleAction(channel.id, 'sync')} className="flex items-center gap-2 rounded-full bg-violet-600 px-3 py-2 text-sm font-medium text-white">
                  <FiZap size={14} /> Sync Now
                </button>
                {channel.connected ? null : <button onClick={() => handleAction(channel.id, 'reconnect')} className="rounded-full border border-violet-200 px-3 py-2 text-sm text-slate-600">Reconnect</button>}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-violet-100 bg-white/70 p-8 text-center text-slate-500">No connected channels found.</div>
      )}
    </div>
  );
}
