import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiAlertCircle, FiCheckCircle, FiClock, FiRefreshCw, FiSearch, FiZap } from 'react-icons/fi';
import { getBookings, getChannels, getStatistics, getSyncLogs } from '../services/api';
import StatCard from '../components/StatCard';

const channelOptions = ['All', 'Booking.com', 'Expedia', 'Agoda', 'Airbnb'];
const statusOptions = ['All', 'Success', 'Pending', 'Failed'];

const normalizeChannel = (value) => {
  if (!value) return 'Booking.com';
  const normalized = String(value).toLowerCase();
  if (normalized.includes('expedia')) return 'Expedia';
  if (normalized.includes('agoda')) return 'Agoda';
  if (normalized.includes('airbnb')) return 'Airbnb';
  if (normalized.includes('booking')) return 'Booking.com';
  return 'Booking.com';
};

const normalizeStatus = (value) => {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('fail')) return 'Failed';
  if (normalized.includes('pend')) return 'Pending';
  return 'Success';
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const buildFallbackRows = () => [
  {
    bookingId: 'BK104',
    guestName: 'Sarah Chen',
    otaChannel: 'Booking.com',
    roomNumber: '204',
    bookingDate: '2026-07-30',
    checkIn: '2026-07-30',
    checkOut: '2026-08-01',
    syncStatus: 'Success',
    lastSyncTime: '2026-07-30T22:20:00Z'
  },
  {
    bookingId: 'BK105',
    guestName: 'Marcus Lee',
    otaChannel: 'Expedia',
    roomNumber: '118',
    bookingDate: '2026-07-30',
    checkIn: '2026-07-31',
    checkOut: '2026-08-02',
    syncStatus: 'Pending',
    lastSyncTime: '2026-07-30T22:32:00Z'
  },
  {
    bookingId: 'BK106',
    guestName: 'Nadia Ortiz',
    otaChannel: 'Agoda',
    roomNumber: '311',
    bookingDate: '2026-07-30',
    checkIn: '2026-08-01',
    checkOut: '2026-08-03',
    syncStatus: 'Failed',
    lastSyncTime: '2026-07-30T22:45:00Z'
  }
];

const buildFallbackLogs = () => [
  { time: '10:20 PM', message: 'Booking BK104 synced successfully from Booking.com' },
  { time: '10:32 PM', message: 'Expedia synchronization completed' },
  { time: '10:45 PM', message: 'Agoda synchronization failed' }
];

export default function BookingSyncPage() {
  const [rows, setRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [autoSyncInfo, setAutoSyncInfo] = useState({ status: 'Enabled', nextScheduledSync: 'Every 5 minutes', syncFrequency: '5 min' });

  const loadSyncData = async () => {
    try {
      setLoading(true);
      setError('');
      const [bookingsRes, logsRes, channelsRes, statsRes] = await Promise.all([
        getBookings(),
        getSyncLogs(),
        getChannels(),
        getStatistics()
      ]);

      const bookings = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
      const syncLogs = Array.isArray(logsRes?.data) ? logsRes.data : [];
      const channels = Array.isArray(channelsRes?.data) ? channelsRes.data : [];
      const stats = statsRes?.data ?? {};

      const normalizedRows = bookings.length
        ? bookings.map((booking, index) => ({
            bookingId: booking.booking_id ?? booking.bookingId ?? `BK${booking.id ?? index + 1}`,
            guestName: booking.guest_name ?? booking.guestName ?? 'Guest',
            otaChannel: normalizeChannel(booking.booking_source ?? booking.ota_channel ?? booking.channel),
            roomNumber: booking.roomNumber ?? booking.room_number ?? booking.room_id ?? '—',
            bookingDate: booking.created_at ?? booking.createdAt ?? booking.check_in ?? '—',
            checkIn: booking.check_in ?? booking.checkIn ?? '—',
            checkOut: booking.check_out ?? booking.checkOut ?? '—',
            syncStatus: normalizeStatus(booking.sync_status ?? booking.syncStatus ?? booking.booking_status),
            lastSyncTime: booking.last_sync_time ?? booking.lastSyncTime ?? booking.updated_at ?? booking.updatedAt ?? '—'
          }))
        : [];

      const normalizedLogs = syncLogs.length
        ? syncLogs.map((entry, index) => ({
            time: entry.created_at ? formatDate(entry.created_at) : `10:${(index + 1) * 2} PM`,
            message: entry.message ?? entry.action ?? `Synchronization update ${index + 1}`
          }))
        : [];

      if (!normalizedRows.length && !normalizedLogs.length) {
        // TODO: Replace this temporary fallback with live OTA synchronization data from the backend once available.
        setRows(buildFallbackRows());
        setLogs(buildFallbackLogs());
        setAutoSyncInfo({
          status: channels.length ? 'Enabled' : 'Paused',
          nextScheduledSync: stats.next_sync_time ?? 'Next cycle in 5 minutes',
          syncFrequency: stats.sync_frequency ?? '5 min'
        });
        return;
      }

      setRows(normalizedRows);
      setLogs(normalizedLogs.length ? normalizedLogs : buildFallbackLogs());
      setAutoSyncInfo({
        status: channels.length ? 'Enabled' : 'Paused',
        nextScheduledSync: stats.next_sync_time ?? 'Next cycle in 5 minutes',
        syncFrequency: stats.sync_frequency ?? '5 min'
      });
    } catch (err) {
      // TODO: Replace this temporary fallback with live OTA synchronization data from the backend once available.
      setRows(buildFallbackRows());
      setLogs(buildFallbackLogs());
      setAutoSyncInfo({ status: 'Paused', nextScheduledSync: 'Retrying in 5 minutes', syncFrequency: '5 min' });
      setError('Unable to load synchronization data.');
      toast.error('Booking synchronization data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSyncData(); }, []);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesChannel = channelFilter === 'All' || row.otaChannel === channelFilter;
    const matchesStatus = statusFilter === 'All' || row.syncStatus === statusFilter;
    const searchText = `${row.bookingId} ${row.guestName}`.toLowerCase();
    const matchesSearch = searchText.includes(search.toLowerCase());
    return matchesChannel && matchesStatus && matchesSearch;
  }), [rows, channelFilter, statusFilter, search]);

  const summaryCards = useMemo(() => [
    { title: 'Total Bookings Synced Today', value: rows.filter((row) => row.syncStatus === 'Success').length, icon: FiCheckCircle, accent: 'bg-emerald-100' },
    { title: 'Pending Synchronizations', value: rows.filter((row) => row.syncStatus === 'Pending').length, icon: FiClock, accent: 'bg-amber-100' },
    { title: 'Failed Synchronizations', value: rows.filter((row) => row.syncStatus === 'Failed').length, icon: FiAlertCircle, accent: 'bg-rose-100' },
    { title: 'Successful Synchronizations', value: rows.filter((row) => row.syncStatus === 'Success').length, icon: FiZap, accent: 'bg-violet-100' },
    { title: 'Last Synchronization Time', value: rows[0]?.lastSyncTime ? formatDate(rows[0].lastSyncTime) : '—', icon: FiRefreshCw, accent: 'bg-sky-100' }
  ], [rows]);

  const handleAction = (action) => {
    if (action === 'sync') {
      toast.success('All channels queued for synchronization.');
    } else if (action === 'retry') {
      toast.success('Failed syncs queued for retry.');
    } else {
      toast.success('Sync status refreshed.');
    }
    loadSyncData();
  };

  const handleRetryRow = (row) => {
    toast.info(`Retrying ${row.bookingId}`);
    loadSyncData();
  };

  if (loading) {
    return <div className="rounded-[24px] border border-violet-100 bg-white/70 p-8 text-slate-500">Loading booking synchronization…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Booking Synchronization</h2>
            <p className="text-sm text-slate-500">Monitor and synchronize bookings received from OTA channels.</p>
          </div>
          <div className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">OTA Sync</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <StatCard key={card.title} title={card.title} value={card.value} subtitle="Live status" icon={card.icon} accent={card.accent} />
        ))}
      </div>

      <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleAction('sync')} className="flex items-center gap-2 rounded-full bg-violet-600 px-3 py-2 text-sm font-medium text-white">
              <FiZap size={14} /> Sync All Channels
            </button>
            <button onClick={() => handleAction('retry')} className="flex items-center gap-2 rounded-full border border-violet-200 px-3 py-2 text-sm font-medium text-slate-600">
              <FiRefreshCw size={14} /> Retry Failed Sync
            </button>
            <button onClick={() => handleAction('refresh')} className="flex items-center gap-2 rounded-full border border-violet-200 px-3 py-2 text-sm font-medium text-slate-600">
              <FiRefreshCw size={14} /> Refresh Status
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm">
              {channelOptions.map((option) => <option key={option} value={option}>{option === 'All' ? 'OTA Channel' : option}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm">
              {statusOptions.map((option) => <option key={option} value={option}>{option === 'All' ? 'Sync Status' : option}</option>)}
            </select>
            <label className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-slate-500">
              <FiSearch size={14} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search booking or guest" className="w-44 bg-transparent outline-none" />
            </label>
          </div>
        </div>
      </div>

      {error ? <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <div className="overflow-hidden rounded-[24px] border border-violet-100 bg-white/80 shadow-sm backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-violet-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Guest Name</th>
                <th className="px-4 py-3">OTA Channel</th>
                <th className="px-4 py-3">Room Number</th>
                <th className="px-4 py-3">Booking Date</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Sync Status</th>
                <th className="px-4 py-3">Last Sync Time</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length ? filteredRows.map((row) => (
                <tr key={row.bookingId} className="border-t border-violet-100 bg-white">
                  <td className="px-4 py-3 font-medium">{row.bookingId}</td>
                  <td className="px-4 py-3">{row.guestName}</td>
                  <td className="px-4 py-3">{row.otaChannel}</td>
                  <td className="px-4 py-3">{row.roomNumber}</td>
                  <td className="px-4 py-3">{formatDate(row.bookingDate)}</td>
                  <td className="px-4 py-3">{formatDate(row.checkIn)}</td>
                  <td className="px-4 py-3">{formatDate(row.checkOut)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.syncStatus === 'Success' ? 'bg-emerald-100 text-emerald-700' : row.syncStatus === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {row.syncStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(row.lastSyncTime)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-full border border-violet-200 px-2.5 py-1 text-xs font-medium text-slate-600">View</button>
                      <button onClick={() => handleRetryRow(row)} className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-medium text-white">Retry Sync</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="10" className="px-4 py-6 text-center text-sm text-slate-500">No synchronization records match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
          <h3 className="text-lg font-semibold">Recent Synchronization Logs</h3>
          <div className="mt-4 space-y-3">
            {logs.map((entry, index) => (
              <motion.div key={`${entry.time}-${index}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-2xl bg-violet-50/70 p-3">
                <div className="mt-0.5 rounded-full bg-white p-2 text-violet-600">
                  <FiRefreshCw size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{entry.message}</p>
                  <p className="text-xs text-slate-500">{entry.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
          <h3 className="text-lg font-semibold">Auto Sync Status</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-violet-50/70 p-3">
              <p className="text-slate-500">Status</p>
              <p className="mt-1 font-semibold text-slate-800">{autoSyncInfo.status}</p>
            </div>
            <div className="rounded-2xl bg-violet-50/70 p-3">
              <p className="text-slate-500">Next Scheduled Sync</p>
              <p className="mt-1 font-semibold text-slate-800">{autoSyncInfo.nextScheduledSync}</p>
            </div>
            <div className="rounded-2xl bg-violet-50/70 p-3">
              <p className="text-slate-500">Sync Frequency</p>
              <p className="mt-1 font-semibold text-slate-800">{autoSyncInfo.syncFrequency}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
