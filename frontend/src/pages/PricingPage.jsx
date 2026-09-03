import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getPricingHistory, recalculatePricing } from '../services/api';

export default function PricingPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getPricingHistory();
      setHistory(res.data);
    } catch (err) {
      setError('Unable to load pricing history.');
      toast.error('Pricing history could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRecalculate = async () => {
    try {
      await recalculatePricing('Manual pricing recalculation');
      toast.success('Pricing recalculated');
      await load();
    } catch (err) {
      toast.error('Pricing recalculation failed');
    }
  };

  if (loading) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-slate-500">Loading pricing history…</div>;
  }

  if (error) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pricing Engine</h2>
        <button onClick={handleRecalculate} className="rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors">Recalculate</button>
      </div>
      <div className="mt-4 grid gap-4">
        {history.map((entry) => (
          <div key={entry.id} className="rounded-2xl bg-violet-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{entry.reason}</p>
                <p className="text-sm text-slate-500">Old {entry.old_price} → New {entry.new_price} (Δ {entry.difference})</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-violet-700">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
