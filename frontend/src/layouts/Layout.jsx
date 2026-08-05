import { NavLink, Outlet } from 'react-router-dom';
import { FiBarChart2, FiBox, FiCalendar, FiDollarSign, FiGrid, FiLogOut, FiRadio, FiSettings, FiTrendingUp } from 'react-icons/fi';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/channel-manager', label: 'Channel Manager', icon: FiRadio },
  { to: '/inventory', label: 'Inventory', icon: FiBox },
  { to: '/rate-management', label: 'Rate Management', icon: FiDollarSign },
  { to: '/dynamic-pricing', label: 'Dynamic Pricing', icon: FiTrendingUp },
  { to: '/booking-sync', label: 'Booking Sync', icon: FiCalendar },
  { to: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/settings', label: 'Settings', icon: FiSettings }
];

export default function Layout({ isLoggedIn, setIsLoggedIn }) {
  const handleLogout = () => {
    localStorage.removeItem('innkeeper-auth');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#f8f5ff] text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-violet-100 bg-white/80 p-5 shadow-sm backdrop-blur lg:flex">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-violet-700">InnKeeper</h1>
            <p className="text-sm text-slate-500">Hotel PMS</p>
          </div>
          <nav className="space-y-1.5">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-violet-50'}`}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
            <p className="text-sm font-semibold text-violet-700">Operations Center</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Monitor channels, rooms, pricing, and guest activity from one place.</p>
            <button onClick={handleLogout} className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <FiLogOut /> Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 p-3 sm:p-4 lg:p-5">
          <div className="mb-4 flex items-center justify-between rounded-[22px] border border-violet-100 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Welcome Back</p>
              <h2 className="text-lg font-semibold text-slate-800">Motel Admin Console</h2>
            </div>
            <button onClick={handleLogout} className="rounded-full bg-violet-600 px-3.5 py-2 text-sm font-medium text-white">Logout</button>
          </div>
          <div className="rounded-[22px] border border-violet-100 bg-white/60 p-3 shadow-sm backdrop-blur sm:p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
