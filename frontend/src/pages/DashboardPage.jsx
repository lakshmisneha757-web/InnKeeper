import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { toast } from 'react-toastify';
import { getOccupancyHistory, getPricingHistory, getStatistics, getSyncLogs } from '../services/api';

const COLORS = ['#8B5CF6', '#C4B5FD', '#F59E0B', '#34D399'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, logsRes, occupancyRes, pricingRes] = await Promise.all([
        getStatistics(),
        getSyncLogs(),
        getOccupancyHistory(),
        getPricingHistory()
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data.slice(0, 5));
      setOccupancy(occupancyRes.data);
      setPricingHistory(pricingRes.data.slice(0, 6));
    } catch (err) {
      setError('Unable to load dashboard data.');
      toast.error('Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const occupancyData = useMemo(() => occupancy.map((entry) => ({ name: entry.date, value: entry.occupancy_percentage })), [occupancy]);
  const revenueData = useMemo(() => pricingHistory.map((entry) => ({ name: entry.reason, value: entry.new_price })), [pricingHistory]);
  const channelData = useMemo(() => [
    { name: 'Connected Channels', value: stats?.connected_channels ?? 0 },
    { name: 'Active Bookings', value: stats?.active_bookings ?? 0 },
    { name: 'Available Rooms', value: stats?.available_rooms ?? 0 },
    { name: 'Rules Enabled', value: stats?.pricing_rules_enabled ?? 0 }
  ], [stats]);

  if (loading) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-slate-500">Loading dashboard…</div>;
  }

  if (error) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Connected Channels', value: stats?.connected_channels ?? 0, icon: '📡' },
          { title: 'Active Bookings', value: stats?.active_bookings ?? 0, icon: '🛏️' },
          { title: 'Available Rooms', value: stats?.available_rooms ?? 0, icon: '✨' },
          { title: 'Today Occupancy %', value: `${stats?.average_occupancy ?? 0}%`, icon: '📈' }
        ].map((card) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
            <div className="text-3xl">{card.icon}</div>
            <p className="mt-4 text-sm text-slate-500">{card.title}</p>
            <p className="text-2xl font-semibold text-slate-800">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Occupancy Trend</h3>
            <span className="text-sm text-violet-500">Live view</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={occupancyData}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Channel Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={channelData} dataKey="value" nameKey="name" outerRadius={80}>
                {channelData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold">Recent Activity</h3>
          <div className="space-y-3">
            {logs.length ? logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-2xl bg-violet-50 p-3">
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-sm text-slate-500">{log.channel} • {log.room}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-600">{log.status}</span>
              </div>
            )) : <p className="text-sm text-slate-500">No sync activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
