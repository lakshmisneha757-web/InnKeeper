import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';

export default function ResetPasswordPage() {
  const [location, setLocation] = useLocation();
  const { resetPassword, loading } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ email: '', token: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const params = useMemo(() => new URLSearchParams(location.split('?')[1] ?? ''), [location]);

  useMemo(() => {
    const email = params.get('email') ?? '';
    const token = params.get('token') ?? '';
    if (email || token) {
      setForm((prev) => ({ ...prev, email, token }));
    }
  }, [params]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (form.password.length >= 8) score += 1;
    if (/[A-Z]/.test(form.password)) score += 1;
    if (/[0-9]/.test(form.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(form.password)) score += 1;
    return Math.min(score, 4);
  }, [form.password]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    if (!form.token.trim()) nextErrors.token = 'Reset token is required.';
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) nextErrors.password = 'Use uppercase letters and numbers.';
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      await resetPassword(form);
      toast.success('Password reset complete. Please sign in.');
      setLocation('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Reset failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_35%),linear-gradient(135deg,_#fdfcf7_0%,_#f5efe5_45%,_#eef6f8_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full rounded-[32px] border border-amber-100/80 bg-white/85 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-semibold text-slate-900">Reset your password</h2>
            <p className="mt-2 text-sm text-slate-600">Set a fresh password for your InnKeeper account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="you@innkeeper.com" />
              {errors.email ? <p className="text-sm text-red-500">{errors.email}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Reset Token</Label>
              <Input id="token" value={form.token} onChange={(e) => setForm((prev) => ({ ...prev, token: e.target.value }))} placeholder="Paste the reset token" />
              {errors.token ? <p className="text-sm text-red-500">{errors.token}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Create new password" />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <p className="text-sm text-red-500">{errors.password}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder="Confirm new password" />
                <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword ? <p className="text-sm text-red-500">{errors.confirmPassword}</p> : null}
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
            <Button type="submit" className="w-full rounded-2xl bg-[#2f6c85] text-white hover:bg-[#255a6d]" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Reset Password'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
