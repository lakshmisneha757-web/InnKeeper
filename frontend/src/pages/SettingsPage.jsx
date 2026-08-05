import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiRefreshCcw, FiSave, FiSettings, FiShield, FiZap } from 'react-icons/fi';

const defaultSettings = {
  hotelName: 'Motel Admin Console',
  address: '128 Harbor Avenue',
  currency: 'USD',
  tax: 10,
  syncInterval: 30,
  autoPricing: true,
  autoSync: true,
  email: 'ops@innkeeper.com',
  bookingcom: '****-****-****-1234',
  expedia: '****-****-****-5678',
  agoda: '****-****-****-9012',
  airbnb: '****-****-****-3456',
  theme: 'Lavender Glass'
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (!settings.hotelName.trim()) nextErrors.hotelName = 'Hotel name is required';
    if (!settings.email.trim()) nextErrors.email = 'Contact email is required';
    if (!settings.currency.trim()) nextErrors.currency = 'Currency is required';
    if (!settings.syncInterval || Number(settings.syncInterval) <= 0) nextErrors.syncInterval = 'Sync interval must be greater than zero';
    if (!settings.tax || Number(settings.tax) < 0) nextErrors.tax = 'Tax must be zero or greater';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast.error('Please correct the highlighted settings before saving.');
      return;
    }
    toast.success('Settings saved successfully.');
  };

  const handleTestConnection = () => {
    if (!settings.bookingcom || !settings.expedia || !settings.agoda || !settings.airbnb) {
      toast.error('Please complete OTA credentials before testing connections.');
      return;
    }
    toast.success('OTA connection test completed successfully.');
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setErrors({});
    toast.info('Settings reset to defaults.');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Settings</h2>
            <p className="text-sm text-slate-500">Configure hotel preferences, OTA credentials, notifications, and sync behavior.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleSave} className="flex items-center gap-2 rounded-full bg-violet-600 px-3 py-2 text-sm font-medium text-white">
              <FiSave size={14} /> Save
            </button>
            <button onClick={handleTestConnection} className="flex items-center gap-2 rounded-full border border-violet-200 px-3 py-2 text-sm font-medium text-slate-600">
              <FiCheckCircle size={14} /> Test Connection
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 rounded-full border border-violet-200 px-3 py-2 text-sm font-medium text-slate-600">
              <FiRefreshCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center gap-2 text-violet-700">
              <FiSettings size={16} />
              <h3 className="font-semibold">Hotel Settings</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-600">
                <span className="mb-1 block">Hotel Name</span>
                <input value={settings.hotelName} onChange={(e) => setSettings({ ...settings, hotelName: e.target.value })} className={`w-full rounded-2xl border bg-violet-50 px-3 py-2 ${errors.hotelName ? 'border-rose-300' : 'border-violet-100'}`} />
                {errors.hotelName ? <span className="mt-1 block text-xs text-rose-600">{errors.hotelName}</span> : null}
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block">Address</span>
                <input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="w-full rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block">Default Currency</span>
                <input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className={`w-full rounded-2xl border bg-violet-50 px-3 py-2 ${errors.currency ? 'border-rose-300' : 'border-violet-100'}`} />
                {errors.currency ? <span className="mt-1 block text-xs text-rose-600">{errors.currency}</span> : null}
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block">Tax %</span>
                <input type="number" value={settings.tax} onChange={(e) => setSettings({ ...settings, tax: Number(e.target.value) })} className={`w-full rounded-2xl border bg-violet-50 px-3 py-2 ${errors.tax ? 'border-rose-300' : 'border-violet-100'}`} />
                {errors.tax ? <span className="mt-1 block text-xs text-rose-600">{errors.tax}</span> : null}
              </label>
            </div>
          </div>

          <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center gap-2 text-violet-700">
              <FiShield size={16} />
              <h3 className="font-semibold">OTA Credentials</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Booking.com', 'bookingcom'],
                ['Expedia', 'expedia'],
                ['Agoda', 'agoda'],
                ['Airbnb', 'airbnb']
              ].map(([label, key]) => (
                <label key={key} className="text-sm text-slate-600">
                  <span className="mb-1 block">{label}</span>
                  <input value={settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} className="w-full rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2" />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center gap-2 text-violet-700">
              <FiZap size={16} />
              <h3 className="font-semibold">Notification Settings</h3>
            </div>
            <div className="space-y-4 text-sm text-slate-600">
              <label className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50 px-3 py-3">
                <span>Auto Pricing</span>
                <input type="checkbox" checked={settings.autoPricing} onChange={() => setSettings({ ...settings, autoPricing: !settings.autoPricing })} />
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50 px-3 py-3">
                <span>Auto Sync</span>
                <input type="checkbox" checked={settings.autoSync} onChange={() => setSettings({ ...settings, autoSync: !settings.autoSync })} />
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block">Notification Email</span>
                <input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className={`w-full rounded-2xl border bg-violet-50 px-3 py-2 ${errors.email ? 'border-rose-300' : 'border-violet-100'}`} />
                {errors.email ? <span className="mt-1 block text-xs text-rose-600">{errors.email}</span> : null}
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block">Sync Interval (mins)</span>
                <input type="number" value={settings.syncInterval} onChange={(e) => setSettings({ ...settings, syncInterval: Number(e.target.value) })} className={`w-full rounded-2xl border bg-violet-50 px-3 py-2 ${errors.syncInterval ? 'border-rose-300' : 'border-violet-100'}`} />
                {errors.syncInterval ? <span className="mt-1 block text-xs text-rose-600">{errors.syncInterval}</span> : null}
              </label>
              <label className="text-sm text-slate-600">
                <span className="mb-1 block">Theme</span>
                <select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value })} className="w-full rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2">
                  <option value="Lavender Glass">Lavender Glass</option>
                  <option value="Classic">Classic</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-center gap-2 text-violet-700">
              <FiCheckCircle size={16} />
              <h3 className="font-semibold">Profile</h3>
            </div>
            <div className="rounded-2xl bg-violet-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Operations Manager</p>
              <p className="mt-1">Manage channel credentials, sync preferences, and alerts from this console.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
