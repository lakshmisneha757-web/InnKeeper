import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, EyeOff, Loader2, Mail, Phone, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';

const roleOptions = ['Admin', 'Manager', 'Receptionist'];

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { signup, loading, isAuthenticated } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'Receptionist' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordScore = useMemo(() => {
    const password = form.password;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
  }, [form.password]);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  if (isAuthenticated) {
    return null;
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.';
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.';
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      await signup({ ...form, role: form.role.toLowerCase() });
      toast.success('Account created successfully! Please sign in.');
      setLocation('/login');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Signup failed.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_35%),linear-gradient(135deg,_#fdfcf7_0%,_#f5efe5_45%,_#eef6f8_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid w-full gap-6 overflow-hidden rounded-[32px] border border-amber-100/80 bg-white/80 p-4 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <div className="flex flex-col justify-between rounded-[24px] bg-gradient-to-br from-[#1f4f6f] via-[#2f6c85] to-[#5c8f8b] p-8 text-white">
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-100">Create account</p>
              <h1 className="text-3xl font-semibold leading-tight">Open secure access for your team in minutes.</h1>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-50">
                <Sparkles className="h-4 w-4" />
                Elegant access control
              </div>
              <p className="text-sm text-amber-50/90">Set role-based permissions for admins, managers, and receptionists while keeping the front desk experience premium.</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-200/70 bg-[#fcfbf8]/90 p-6 shadow-inner shadow-amber-100/70 sm:p-8">
            <div className="mb-6 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 lg:mx-0">
                <UserRound className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-semibold text-slate-900">Join InnKeeper</h2>
              <p className="mt-2 text-sm text-slate-600">Create a polished account for your hospitality team.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Taylor Brooks" />
                {errors.name ? <p className="text-sm text-red-500">{errors.name}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="pl-10" placeholder="you@innkeeper.com" />
                </div>
                {errors.email ? <p className="text-sm text-red-500">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} className="pl-10" placeholder="+1 555 0134" />
                </div>
                {errors.phone ? <p className="text-sm text-red-500">{errors.phone}</p> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Create password" />
                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? <p className="text-sm text-red-500">{errors.password}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Confirm password" />
                    <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword ? <p className="text-sm text-red-500">{errors.confirmPassword}</p> : null}
                </div>
              </div>

              <div className="rounded-2xl border border-[#d8e8e4] bg-[#f2f8f6] p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Password strength</span>
                  <span className="text-[#2f6c85]">{['Weak', 'Fair', 'Good', 'Strong'][passwordScore - 1] || 'Weak'}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className={`h-2 flex-1 rounded-full ${index < passwordScore ? 'bg-[#2f6c85]' : 'bg-[#d8e8e4]'}`} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select id="role" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm">
                  {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              <Button type="submit" className="w-full rounded-2xl bg-[#2f6c85] text-white hover:bg-[#255a6d]" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : <>Create Account <Check className="ml-2 h-4 w-4" /></>}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account? <Link href="/login" className="font-semibold text-[#2f6c85]">Login</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
