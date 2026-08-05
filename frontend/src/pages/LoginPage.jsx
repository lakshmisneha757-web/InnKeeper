import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@innkeeper.com');
  const [password, setPassword] = useState('admin123');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('innkeeper-auth', 'true');
    onLogin();
    navigate('/distribution');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-[32px] border border-violet-100 bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold text-violet-600">InnKeeper</h1>
          <p className="mt-2 text-sm text-slate-500">Simple Motel Admin Login</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input className="w-full rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <input type="password" className="w-full rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-white">Login</button>
        </form>
      </motion.div>
    </div>
  );
}
