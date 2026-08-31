import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createPricingRule, deletePricingRule, getPricingRules, togglePricingRule, updatePricingRule } from '../services/api';

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({ rule_name: 'Weekend Boost', rule_description: 'Weekend demand lift', rule_type: 'weekend', condition: 'weekend', comparison: '>', value: 0, action: 'increase', percentage: 20, priority: 1, enabled: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getPricingRules();
      setRules(res.data);
    } catch (err) {
      setError('Unable to load pricing rules.');
      toast.error('Pricing rules could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPricingRule(form);
      toast.success('Rule created');
      await load();
    } catch (err) {
      toast.error('Rule creation failed');
    }
  };

  const handleToggle = async (ruleId) => {
    try {
      await togglePricingRule(ruleId);
      toast.success('Rule toggled');
      await load();
    } catch (err) {
      toast.error('Rule toggle failed');
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      await deletePricingRule(ruleId);
      toast.success('Rule deleted');
      await load();
    } catch (err) {
      toast.error('Rule deletion failed');
    }
  };

  if (loading) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-slate-500">Loading rules…</div>;
  }

  if (error) {
    return <div className="rounded-[32px] border border-violet-100 bg-white/70 p-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Dynamic Pricing Rules</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" placeholder="Rule name" value={form.rule_name} onChange={(e) => setForm({ ...form, rule_name: e.target.value })} />
          <input className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" placeholder="Condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} />
          <input className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" placeholder="Action" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} />
          <input type="number" className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" placeholder="Percentage" value={form.percentage} onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) })} />
          <button className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 font-semibold text-white">Save Rule</button>
        </form>
      </div>
      <div className="grid gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">{rule.rule_name}</h3>
                <p className="text-sm text-slate-500">Condition: {rule.condition} • Action: {rule.action}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleToggle(rule.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${rule.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{rule.enabled ? 'Enabled' : 'Disabled'}</button>
                <button onClick={() => handleDelete(rule.id)} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Delete</button>
              </div>
            </div>
            <p className="mt-3 text-sm">{rule.percentage}% applied across channels</p>
          </div>
        ))}
      </div>
    </div>
  );
}
