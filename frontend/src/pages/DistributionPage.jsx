import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiActivity, FiBox, FiClock, FiDollarSign, FiRefreshCw, FiSliders, FiWifi, FiZap } from 'react-icons/fi';
import StatCard from '../components/StatCard';

const initialRule = {
  rule_name: '',
  rule_description: '',
  rule_type: 'occupancy',
  condition: 'occupancy',
  comparison: '>',
  value: 80,
  action: 'increase',
  percentage: 15,
  priority: 1,
  enabled: true
};

export default function DistributionPage() {
  const [stats, setStats] = useState(null);
  const [channels, setChannels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ruleForm, setRuleForm] = useState(initialRule);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, channelsRes, roomsRes, rulesRes, historyRes, logsRes] = await Promise.all([
        axios.get('/api/module2/statistics'),
        axios.get('/api/module2/channels'),
        axios.get('/api/module2/rooms'),
        axios.get('/api/module2/pricing-rules'),
        axios.get('/api/module2/pricing-history'),
        axios.get('/api/module2/sync-logs')
      ]);
      setStats(statsRes.data);
      console.log("Statistics API:", statsRes.data);
      setStats(statsRes.data);
      setChannels(channelsRes.data);
      setRooms(roomsRes.data);
      setRules(rulesRes.data);
      setHistory(historyRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      toast.error('Unable to load distribution data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredRooms = useMemo(() => rooms.filter((room) => `${room.room_number} ${room.room_type}`.toLowerCase().includes(search.toLowerCase())), [rooms, search]);

  const handleSync = async (channelId) => {
    try {
      await axios.post(`/api/module2/channels/${channelId}/sync`);
      toast.success('Channel sync completed');
      await loadData();
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const handleChannelAction = async (channelId, action) => {
    try {
      await axios.post(`/api/module2/channels/${channelId}/${action}`);
      toast.success(`Channel ${action}d`);
      await loadData();
    } catch (error) {
      toast.error(`Unable to ${action} channel`);
    }
  };

  const handleAvailabilityToggle = async (room) => {
    try {
      await axios.patch(`/api/module2/rooms/${room.id}/availability`, { availability: !room.availability, current_price: room.current_price, status: !room.availability ? 'Occupied' : 'Vacant', previous_price: room.current_price, reason: 'Availability changed' });
      toast.success(`Inventory updated for ${room.room_number}`);
      await loadData();
    } catch (error) {
      toast.error('Availability update failed');
    }
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/module2/pricing-rules', ruleForm);
      toast.success('Pricing rule saved');
      setRuleForm(initialRule);
      await loadData();
    } catch (error) {
      toast.error('Rule creation failed');
    }
  };

  const handleRuleToggle = async (ruleId) => {
    try {
      await axios.patch(`/api/module2/pricing-rules/${ruleId}/toggle`);
      toast.success('Rule updated');
      await loadData();
    } catch (error) {
      toast.error('Rule update failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-[24px] bg-white/70" />)}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="h-80 animate-pulse rounded-[28px] bg-white/70" />
          <div className="h-80 animate-pulse rounded-[28px] bg-white/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-violet-100">Module 2</p>
            <h2 className="mt-2 text-3xl font-semibold">Frictionless Smart Distribution & Rate Engine</h2>
            <p className="mt-2 max-w-2xl text-sm text-violet-100">Synchronize inventory across OTA channels, react to bookings instantly, and tune pricing with live rules.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('overview')} className="rounded-full bg-white/20 px-4 py-2 text-sm">Overview</button>
            <button onClick={() => setActiveTab('channels')} className="rounded-full bg-white/20 px-4 py-2 text-sm">Channels</button>
            <button onClick={() => setActiveTab('rules')} className="rounded-full bg-white/20 px-4 py-2 text-sm">Rules</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Connected Channels" value={stats?.connectedChannels ?? 0} subtitle="Live OTA connectors" icon={FiWifi} accent="bg-violet-100" />
        <StatCard title="Rooms Synced" value={stats?.roomsSynced ?? 0} subtitle="Inventory states currently mirrored" icon={FiBox} accent="bg-fuchsia-100" />
        <StatCard title="Today's Sync Count" value={stats?.todaysSyncCount ?? 0} subtitle="Automatic distributor events" icon={FiRefreshCw} accent="bg-emerald-100" />
        <StatCard title="Average Sync Time" value={`${stats?.averageSyncTime ?? 0}s`} subtitle="Across all OTA operations" icon={FiClock} accent="bg-amber-100" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[32px] border border-violet-100 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Native Channel Manager</h3>
              <p className="text-sm text-slate-500">Instant OTA connection health and inventory distribution</p>
            </div>
            <div className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">Live</div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {channels.map((channel) => (
              <motion.div key={channel.id} whileHover={{ y: -4 }} className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{channel.channel_name}</h4>
                    <p className="text-sm text-slate-500">{channel.connected ? 'Connected' : 'Disconnected'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${channel.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{channel.api_status}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Last sync: {new Date(channel.last_sync).toLocaleString()}</p>
                  <p>Inventory count: {rooms.filter((room) => room.availability).length}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => handleSync(channel.id)} className="rounded-full bg-violet-600 px-3 py-2 text-sm font-medium text-white">Sync</button>
                  {channel.connected ? (
                    <button onClick={() => handleChannelAction(channel.id, 'disconnect')} className="rounded-full border border-violet-200 px-3 py-2 text-sm">Disconnect</button>
                  ) : (
                    <button onClick={() => handleChannelAction(channel.id, 'reconnect')} className="rounded-full border border-violet-200 px-3 py-2 text-sm">Reconnect</button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-violet-100 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Dynamic Pricing Rules</h3>
              <p className="text-sm text-slate-500">Engine rules that react to demand and time</p>
            </div>
            <div className="rounded-full bg-fuchsia-100 px-3 py-1 text-sm font-medium text-fuchsia-700">Auto</div>
          </div>
          <div className="mt-4 space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-[20px] border border-violet-100 bg-violet-50/70 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{rule.rule_name}</p>
                    <p className="text-sm text-slate-500">{rule.rule_description || rule.rule_type}</p>
                  </div>
                  <button onClick={() => handleRuleToggle(rule.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${rule.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{rule.enabled ? 'Enabled' : 'Disabled'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-violet-100 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Room Availability</h3>
              <p className="text-sm text-slate-500">Inventory and OTA sync status by room</p>
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search room" className="rounded-full border border-violet-100 bg-violet-50 px-3 py-2 text-sm" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filteredRooms.map((room) => (
              <motion.div key={room.id} whileHover={{ y: -3 }} className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">Room {room.room_number}</p>
                    <p className="text-sm text-slate-500">{room.roomType}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${room.availability ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{room.availability ? 'Available' : 'Booked'}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>${room.currentPrice}</span>
                  <span>{room.connectedChannels} channels</span>
                </div>
                <button onClick={() => handleAvailabilityToggle(room)} className="mt-4 w-full rounded-full bg-violet-600 px-3 py-2 text-sm font-medium text-white">Toggle Availability</button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-violet-100 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h3 className="text-xl font-semibold">Pricing Engine</h3>
            <form onSubmit={handleRuleSubmit} className="mt-4 space-y-3">
              <input value={ruleForm.rule_name} onChange={(e) => setRuleForm({ ...ruleForm, rule_name: e.target.value })} placeholder="Rule name" className="w-full rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" />
              <input value={ruleForm.rule_description} onChange={(e) => setRuleForm({ ...ruleForm, rule_description: e.target.value })} placeholder="Description" className="w-full rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={ruleForm.rule_type} onChange={(e) => setRuleForm({ ...ruleForm, rule_type: e.target.value })} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2">
                  <option value="occupancy">Occupancy</option>
                  <option value="time">Time</option>
                  <option value="weekend">Weekend</option>
                </select>
                <select value={ruleForm.action} onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2">
                  <option value="increase">Increase</option>
                  <option value="reduce">Reduce</option>
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input type="number" value={ruleForm.value} onChange={(e) => setRuleForm({ ...ruleForm, value: Number(e.target.value) })} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" />
                <input type="number" value={ruleForm.percentage} onChange={(e) => setRuleForm({ ...ruleForm, percentage: Number(e.target.value) })} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" />
              </div>
              <button className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-2 font-semibold text-white">Add Rule</button>
            </form>
          </div>

          <div className="rounded-[32px] border border-violet-100 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h3 className="text-xl font-semibold">Sync Logs</h3>
            <div className="mt-4 space-y-3">
              {logs.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-[20px] border border-violet-100 bg-violet-50/70 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{entry.channel}</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">{entry.status}</span>
                  </div>
                  <p className="mt-1 text-slate-500">{entry.action} • {entry.room}</p>
                  <p className="mt-1 text-xs text-slate-400">{entry.message} • {entry.response_time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-violet-100 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Pricing History</h3>
            <p className="text-sm text-slate-500">Reactive price changes across the engine</p>
          </div>
          <div className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">Tracked</div>
        </div>
        <div className="mt-6 overflow-hidden rounded-[24px] border border-violet-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-violet-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Old</th>
                <th className="px-4 py-3">New</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Triggered By</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-t border-violet-100 bg-white">
                  <td className="px-4 py-3">Room {item.room_id}</td>
                  <td className="px-4 py-3">${item.old_price}</td>
                  <td className="px-4 py-3">${item.new_price}</td>
                  <td className="px-4 py-3">{item.reason}</td>
                  <td className="px-4 py-3">{item.triggered_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
