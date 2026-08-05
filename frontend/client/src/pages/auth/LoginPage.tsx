import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock, Mail, Sparkles, DoorOpen } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, loading, isAuthenticated } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email.';
    if (!password.trim()) nextErrors.password = 'Password is required.';
    else if (password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      await login({ email, password, rememberMe });
      toast.success('Welcome back! Redirecting to your dashboard.');
      setLocation('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_35%),linear-gradient(135deg,_#fdfcf7_0%,_#f5efe5_45%,_#eef6f8_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid w-full gap-6 overflow-hidden rounded-[32px] border border-amber-100/80 bg-white/80 p-4 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div className="hidden flex-col justify-between rounded-[24px] bg-gradient-to-br from-[#1f4f6f] via-[#2f6c85] to-[#5c8f8b] p-8 text-white lg:flex">
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                <DoorOpen className="h-6 w-6" />
              </div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-100">InnKeeper PMS</p>
              <h1 className="text-3xl font-semibold leading-tight">Premium hospitality operations, secured in one place.</h1>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-50">
                <Sparkles className="h-4 w-4" />
                Smarter front desk control
              </div>
              <p className="text-sm text-amber-50/90">Use a secure sign-in experience with polished, responsive access for every hotel team member.</p>
            </div>
          </div>

          <div className="flex items-center justify-center rounded-[24px] border border-stone-200/70 bg-[#fcfbf8]/90 p-6 shadow-inner shadow-amber-100/70 sm:p-8">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9f4f2] text-[#2f6c85] lg:mx-0">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-600">Sign in to continue managing your property with comfort and confidence.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="email" type="email" placeholder="you@innkeeper.com" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }} className="pl-10" autoComplete="email" />
                  </div>
                  <AnimatePresence mode="wait">
                    {errors.email ? <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-500">{errors.email}</motion.p> : null}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }} className="pl-10 pr-10" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {errors.password ? <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-500">{errors.password}</motion.p> : null}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(Boolean(checked))} />
                    <span>Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm font-medium text-[#2f6c85] hover:text-[#24596d]">Forgot Password?</Link>
                </div>

                <Button type="submit" className="w-full rounded-2xl bg-[#2f6c85] text-white hover:bg-[#255a6d]" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : 'Login'}
                </Button>

                <Button type="button" variant="outline" className="w-full rounded-2xl border-[#d8e8e4] text-[#2f6c85] hover:bg-[#f2f8f6]" onClick={() => setLocation('/signup')}>
                  Sign Up
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                New here? <Link href="/signup" className="font-semibold text-[#2f6c85]">Create an account</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
