import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { getSyncLogs } from '../services/api';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getSyncLogs();
        setLogs(res.data);
      } catch (err) {
        setError('Unable to load logs.');
        toast.error('Sync logs could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => logs.filter((log) => {
    const matchesQuery = `${log.channel} ${log.action} ${log.room}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'all' || log.status === status;
    return matchesQuery && matchesStatus;
  }), [logs, query, status]);

  if (loading) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-slate-500">Loading sync logs…</div>;
  }

  if (error) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Channel Synchronization Logs</h2>
          <p className="text-sm text-slate-500">Search, filter, and review every sync.</p>
        </div>
        <div className="flex gap-3">
          <input placeholder="Search log" className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-violet-100">
        <table className="min-w-full text-sm">
          <thead className="bg-violet-50 text-left">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Channel</th>
              <th className="p-3">Room</th>
              <th className="p-3">Action</th>
              <th className="p-3">Status</th>
              <th className="p-3">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-t border-violet-100">
                <td className="p-3">{new Date(log.created_at).toLocaleString()}</td>
                <td className="p-3">{log.channel}</td>
                <td className="p-3">{log.room}</td>
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.status}</td>
                <td className="p-3">{log.response_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
