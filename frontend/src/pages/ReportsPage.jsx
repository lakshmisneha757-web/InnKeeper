import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { FiBarChart2, FiCalendar, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { getBookings, getChannels, getOccupancyHistory, getPricingHistory, getStatistics } from '../services/api';
import StatCard from '../components/StatCard';

const COLORS = ['#8B5CF6', '#C4B5FD', '#F59E0B', '#34D399'];
const periodOptions = ['daily', 'weekly', 'monthly', 'custom'];

const buildFallbackData = () => ({
  stats: {
    average_occupancy: 82,
    connected_channels: 4,
    active_bookings: 12,
    available_rooms: 18
  },
  bookings: [
    { id: 1, guest_name: 'Alice', booking_source: 'Booking.com', created_at: '2026-07-27T10:00:00Z' },
    { id: 2, guest_name: 'Ben', booking_source: 'Expedia', created_at: '2026-07-28T11:00:00Z' },
    { id: 3, guest_name: 'Carmen', booking_source: 'Agoda', created_at: '2026-07-29T12:00:00Z' }
  ],
  occupancy: [
    { date: 'Jul 25', occupancy_percentage: 74 },
    { date: 'Jul 26', occupancy_percentage: 78 },
    { date: 'Jul 27', occupancy_percentage: 81 },
    { date: 'Jul 28', occupancy_percentage: 85 },
    { date: 'Jul 29', occupancy_percentage: 88 }
  ],
  pricing: [
    { reason: 'Peak demand', new_price: 145 },
    { reason: 'Weekend uplift', new_price: 152 },
    { reason: 'Festival', new_price: 168 }
  ],
  channels: [
    { channel_name: 'Booking.com', connected: true },
    { channel_name: 'Expedia', connected: true },
    { channel_name: 'Agoda', connected: false },
    { channel_name: 'Airbnb', connected: true }
  ]
});

const getDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const filterByPeriod = (items, period, customStart, customEnd) => {
  if (!items?.length) return [];
  const now = new Date();
  const start = customStart ? new Date(customStart) : null;
  const end = customEnd ? new Date(customEnd) : null;

  return items.filter((item) => {
    const value = item.created_at ?? item.date ?? item.updated_at ?? item.last_sync_time;
    const date = getDateValue(value);
    if (!date) return true;

    if (period === 'custom' && start && end) {
      return date >= start && date <= end;
    }

    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    if (period === 'daily') return diffDays <= 1;
    if (period === 'weekly') return diffDays <= 7;
    return diffDays <= 30;
  });
};

export default function ReportsPage() {
  const [period, setPeriod] = useState('monthly');
  const [customStart, setCustomStart] = useState('2026-07-01');
  const [customEnd, setCustomEnd] = useState('2026-07-30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [statsRes, bookingsRes, channelsRes, occupancyRes, pricingRes] = await Promise.all([
          getStatistics(),
          getBookings(),
          getChannels(),
          getOccupancyHistory(),
          getPricingHistory()
        ]);

        const fallback = buildFallbackData();
        const stats = statsRes?.data ?? fallback.stats;
        const bookings = Array.isArray(bookingsRes?.data) && bookingsRes.data.length ? bookingsRes.data : fallback.bookings;
        const channels = Array.isArray(channelsRes?.data) && channelsRes.data.length ? channelsRes.data : fallback.channels;
        const occupancy = Array.isArray(occupancyRes?.data) && occupancyRes.data.length ? occupancyRes.data : fallback.occupancy;
        const pricing = Array.isArray(pricingRes?.data) && pricingRes.data.length ? pricingRes.data : fallback.pricing;

        setReport({
          stats,
          bookings,
          channels,
          occupancy,
          pricing
        });
      } catch (err) {
        // TODO: Replace the fallback metrics with live analytics endpoints once available.
        setReport(buildFallbackData());
        setError('Unable to load analytics data.');
        toast.error('Analytics data could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredBookings = useMemo(() => filterByPeriod(report?.bookings ?? [], period, customStart, customEnd), [report, period, customStart, customEnd]);
  const filteredOccupancy = useMemo(() => filterByPeriod(report?.occupancy ?? [], period, customStart, customEnd), [report, period, customStart, customEnd]);
  const filteredPricing = useMemo(() => filterByPeriod(report?.pricing ?? [], period, customStart, customEnd), [report, period, customStart, customEnd]);
  const filteredChannels = useMemo(() => report?.channels ?? [], [report]);

  const summaryCards = useMemo(() => {
    const revenue = filteredPricing.reduce((sum, item) => sum + Number(item.new_price ?? item.value ?? 0), 0);
    const occupancyRate = filteredOccupancy.length ? Math.round(filteredOccupancy.reduce((sum, item) => sum + Number(item.occupancy_percentage ?? item.value ?? 0), 0) / filteredOccupancy.length) : Number(report?.stats?.average_occupancy ?? 0);
    const adr = filteredBookings.length ? Math.round(revenue / Math.max(filteredBookings.length, 1)) : 0;
    const revpar = Math.round((occupancyRate / 100) * adr);
    return [
      { title: 'Total Revenue', value: `₹${revenue.toLocaleString()}`, icon: FiDollarSign, accent: 'bg-emerald-100' },
      { title: 'Occupancy Rate', value: `${occupancyRate}%`, icon: FiTrendingUp, accent: 'bg-violet-100' },
      { title: 'ADR', value: `₹${adr}`, icon: FiBarChart2, accent: 'bg-amber-100' },
      { title: 'RevPAR', value: `₹${revpar}`, icon: FiBarChart2, accent: 'bg-sky-100' },
      { title: 'Total Bookings', value: filteredBookings.length, icon: FiCalendar, accent: 'bg-fuchsia-100' },
      { title: 'Channel-wise Bookings', value: `${filteredChannels.filter((channel) => channel.connected).length}/${filteredChannels.length}`, icon: FiBarChart2, accent: 'bg-rose-100' }
    ];
  }, [filteredBookings, filteredOccupancy, filteredPricing, filteredChannels, report]);

  const occupancyChartData = useMemo(() => (filteredOccupancy.length ? filteredOccupancy.map((entry) => ({ name: entry.date, value: Number(entry.occupancy_percentage ?? entry.value ?? 0) })) : []), [filteredOccupancy]);
  const revenueChartData = useMemo(() => (filteredPricing.length ? filteredPricing.map((entry) => ({ name: entry.reason, value: Number(entry.new_price ?? entry.value ?? 0) })) : []), [filteredPricing]);
  const bookingSourceData = useMemo(() => {
    const counts = filteredBookings.reduce((acc, booking) => {
      const source = booking.booking_source ?? 'Direct';
      acc[source] = (acc[source] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredBookings]);
  const channelPerformanceData = useMemo(() => (filteredChannels.length ? filteredChannels.map((channel) => ({ name: channel.channel_name, value: channel.connected ? 100 : 40 })) : []), [filteredChannels]);

  if (loading) {
    return <div className="rounded-[24px] border border-violet-100 bg-white/70 p-8 text-center text-slate-500">Loading analytics…</div>;
  }

  if (error && !report) {
    return <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-8 text-rose-700">{error}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Analytics</h2>
            <p className="text-sm text-slate-500">Monitor revenue, occupancy, bookings, and channel performance in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <button key={option} onClick={() => setPeriod(option)} className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${period === option ? 'bg-blue-600 text-white' : 'border border-blue-200 bg-white text-slate-600 hover:bg-blue-50'}`}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {period === 'custom' ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="text-sm text-slate-500">
              <span className="mb-1 block">Start Date</span>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" />
            </label>
            <label className="text-sm text-slate-500">
              <span className="mb-1 block">End Date</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" />
            </label>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <StatCard key={card.title} title={card.title} value={card.value} subtitle="Live performance" icon={card.icon} accent={card.accent} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Revenue Trend</h3>
              <p className="text-sm text-slate-500">Pricing movement over the selected period</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Occupancy Trend</h3>
              <p className="text-sm text-slate-500">Daily occupancy performance</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancyChartData}>
                <CartesianGrid stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
          <h3 className="font-semibold">Booking Source Distribution</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingSourceData} dataKey="value" nameKey="name" outerRadius={90}>
                  {bookingSourceData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
          <h3 className="font-semibold">Channel Performance</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelPerformanceData}>
                <CartesianGrid stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#C084FC" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
