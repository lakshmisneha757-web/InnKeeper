import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiUser, FiPhone, FiCheck, FiX, FiEye, FiEyeOff, FiArrowRight, FiShield, FiCheckCircle } from 'react-icons/fi';

const DEFAULT_ADMIN = {
  fullName: 'Motel Admin',
  email: 'admin@innkeeper.com',
  password: 'Password123!',
  phone: '(555) 019-2831'
};

const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem('innkeeper_users');
    if (!raw) {
      const initial = [DEFAULT_ADMIN];
      localStorage.setItem('innkeeper_users', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [DEFAULT_ADMIN];
  }
};

const saveUser = (newUser) => {
  const users = getStoredUsers();
  users.push(newUser);
  localStorage.setItem('innkeeper_users', JSON.stringify(users));
};

const COUNTRY_CODES = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', digitsLength: 10, regex: /^[6-9][0-9]{9}$/, placeholder: '9876543210', errorMessage: 'Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', digitsLength: 10, regex: /^[2-9][0-9]{9}$/, placeholder: '2025550143', errorMessage: 'Phone number must be a valid 10-digit US phone number starting with 2-9.' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', digitsLength: 10, regex: /^[0-9]{10}$/, placeholder: '7911123456', errorMessage: 'Phone number must be a valid 10-digit UK phone number.' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', digitsLength: 10, regex: /^[2-9][0-9]{9}$/, placeholder: '4165550123', errorMessage: 'Phone number must be a valid 10-digit Canadian phone number.' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', digitsLength: 9, regex: /^[0-9]{9}$/, placeholder: '412345678', errorMessage: 'Phone number must be a valid 9-digit Australian mobile number.' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971', digitsLength: 9, regex: /^[0-9]{9}$/, placeholder: '501234567', errorMessage: 'Phone number must be a valid 9-digit UAE phone number.' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', digitsLength: 8, regex: /^[89][0-9]{7}$/, placeholder: '81234567', errorMessage: 'Phone number must be a valid 8-digit Singapore number starting with 8 or 9.' }
];

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'

  // Common State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // Default India +91

  // Sign In Form State
  const [signInData, setSignInData] = useState({ email: 'admin@innkeeper.com', password: 'Password123!' });
  const [signInTouched, setSignInTouched] = useState({});

  // Create Account Form State
  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [signUpTouched, setSignUpTouched] = useState({});

  // Format Phone Number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  // Real-time Validations for Sign In
  const signInErrors = useMemo(() => {
    const errors = {};
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!signInData.email) errors.email = 'Email is required.';
    else if (!emailRegex.test(signInData.email.trim())) errors.email = 'Please enter a valid email address (e.g. username@domain.com).';

    if (!signInData.password) errors.password = 'Password is required.';
    else if (signInData.password.length < 6) errors.password = 'Password must be at least 6 characters.';

    return errors;
  }, [signInData]);

  // Password Strength Checklist for Create Account
  const passwordCriteria = useMemo(() => {
    const p = signUpData.password;
    return {
      minLength: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasLower: /[a-z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)
    };
  }, [signUpData.password]);

  const passwordScore = useMemo(() => {
    return Object.values(passwordCriteria).filter(Boolean).length;
  }, [passwordCriteria]);

  // Real-time Validations for Create Account
  const signUpErrors = useMemo(() => {
    const errors = {};
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!signUpData.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (!nameRegex.test(signUpData.fullName.trim())) {
      errors.fullName = 'Full name must contain only letters and spaces (minimum 2 characters).';
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!signUpData.email) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(signUpData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. username@domain.com).';
    } else {
      const existingUsers = getStoredUsers();
      if (existingUsers.some((u) => u.email.toLowerCase() === signUpData.email.trim().toLowerCase())) {
        errors.email = 'An account with this email address already exists.';
      }
    }

    if (!signUpData.phone) {
      errors.phone = 'Phone number is required.';
    } else {
      const cleanDigits = signUpData.phone.replace(/\D/g, '');
      if (!selectedCountry.regex.test(cleanDigits)) {
        errors.phone = selectedCountry.errorMessage;
      }
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!signUpData.password) {
      errors.password = 'Password is required.';
    } else if (!strongPasswordRegex.test(signUpData.password)) {
      errors.password = 'Password must be at least 8 characters and contain one uppercase letter, one lowercase letter, one number, and one special character.';
    }

    if (!signUpData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (signUpData.confirmPassword !== signUpData.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!signUpData.agreeTerms) {
      errors.agreeTerms = 'You must agree to the Terms of Service & Privacy Policy.';
    }

    return errors;
  }, [signUpData, passwordScore]);

  // Handle Form Submissions
  const handleSignInSubmit = (e) => {
    e.preventDefault();
    setSignInTouched({ email: true, password: true });

    if (Object.keys(signInErrors).length > 0) {
      toast.error('Please fix the errors before signing in.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const users = getStoredUsers();
      const matched = users.find(
        (u) => u.email.toLowerCase() === signInData.email.trim().toLowerCase() && u.password === signInData.password
      );

      if (matched) {
        sessionStorage.setItem('innkeeper-session', 'true');
        sessionStorage.setItem(
          'innkeeper-user-info',
          JSON.stringify({ fullName: matched.fullName, email: matched.email })
        );
        toast.success(`Welcome back, ${matched.fullName}!`);
        onLogin();
        navigate('/dashboard');
      } else {
        toast.error('Invalid email address or password.');
        setIsSubmitting(false);
      }
    }, 600);
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    setSignUpTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true
    });

    if (Object.keys(signUpErrors).length > 0) {
      toast.error('Please fulfill all format constraints to create your account.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newUser = {
        fullName: signUpData.fullName.trim(),
        email: signUpData.email.trim().toLowerCase(),
        phone: signUpData.phone,
        password: signUpData.password
      };
      saveUser(newUser);
      setIsSubmitting(false);

      // Pre-fill email in Sign In form and navigate to Sign In page/tab
      setSignInData({ email: newUser.email, password: '' });
      setSignInTouched({});
      setMode('signin');
      toast.success('Account created successfully! Please sign in with your password.');
    }, 700);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-white/95 backdrop-blur-xl shadow-2xl"
      >
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
            <FiShield size={28} className="text-white" />
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">InnKeeper</h1>
          <p className="mt-1 text-sm text-violet-100 font-medium">Real-Time Motel Operations & Portal</p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="p-6 pb-2 sm:p-8 sm:pb-3">
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`rounded-xl py-3 text-sm font-semibold transition-all ${mode === 'signin' ? 'bg-white text-violet-700 shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-xl py-3 text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white text-violet-700 shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Animated Form Body */}
        <div className="p-6 sm:p-8 pt-2">
          <AnimatePresence mode="wait">
            {mode === 'signin' ? (
              /* SIGN IN FORM */
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignInSubmit}
                className="space-y-5"
                noValidate
              >
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type="email"
                      placeholder="name@domain.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      onBlur={() => setSignInTouched({ ...signInTouched, email: true })}
                      className={`w-full rounded-2xl border bg-slate-50/50 pl-11 pr-10 py-3.5 text-sm font-medium outline-none transition ${signInTouched.email && signInErrors.email
                          ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                          : signInTouched.email && !signInErrors.email
                            ? 'border-emerald-400 focus:border-emerald-500'
                            : 'border-slate-200 focus:border-violet-500 focus:bg-white'
                        }`}
                    />
                    {signInTouched.email && (
                      <span className="absolute right-3.5 top-3.5">
                        {signInErrors.email ? (
                          <FiX className="text-rose-500" size={18} />
                        ) : (
                          <FiCheck className="text-emerald-500" size={18} />
                        )}
                      </span>
                    )}
                  </div>
                  {signInTouched.email && signInErrors.email && (
                    <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <FiX size={13} /> {signInErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      onBlur={() => setSignInTouched({ ...signInTouched, password: true })}
                      className={`w-full rounded-2xl border bg-slate-50/50 pl-11 pr-11 py-3.5 text-sm font-medium outline-none transition ${signInTouched.password && signInErrors.password
                          ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                          : signInTouched.password && !signInErrors.password
                            ? 'border-emerald-400 focus:border-emerald-500'
                            : 'border-slate-200 focus:border-violet-500 focus:bg-white'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {signInTouched.password && signInErrors.password && (
                    <p className="mt-1.5 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <FiX size={13} /> {signInErrors.password}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-violet-800 mb-0.5">Demo Admin Credentials:</p>
                  <p>Email: <span className="font-mono font-medium text-slate-800">admin@innkeeper.com</span></p>
                  <p>Password: <span className="font-mono font-medium text-slate-800">Password123!</span></p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Signing in…</span>
                  ) : (
                    <>
                      Sign In <FiArrowRight size={18} />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              /* CREATE ACCOUNT FORM */
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignUpSubmit}
                className="space-y-4"
                noValidate
              >
                {/* Full Name */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                      onBlur={() => setSignUpTouched({ ...signUpTouched, fullName: true })}
                      className={`w-full rounded-2xl border bg-slate-50/50 pl-11 pr-10 py-3 text-sm font-medium outline-none transition ${signUpTouched.fullName && signUpErrors.fullName
                          ? 'border-rose-400 bg-rose-50/30 text-rose-900'
                          : signUpTouched.fullName && !signUpErrors.fullName
                            ? 'border-emerald-400'
                            : 'border-slate-200 focus:border-violet-500 focus:bg-white'
                        }`}
                    />
                    {signUpTouched.fullName && (
                      <span className="absolute right-3.5 top-3.5">
                        {signUpErrors.fullName ? <FiX className="text-rose-500" size={18} /> : <FiCheck className="text-emerald-500" size={18} />}
                      </span>
                    )}
                  </div>
                  {signUpTouched.fullName && signUpErrors.fullName && (
                    <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <FiX size={13} /> {signUpErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      onBlur={() => setSignUpTouched({ ...signUpTouched, email: true })}
                      className={`w-full rounded-2xl border bg-slate-50/50 pl-11 pr-10 py-3 text-sm font-medium outline-none transition ${signUpTouched.email && signUpErrors.email
                          ? 'border-rose-400 bg-rose-50/30 text-rose-900'
                          : signUpTouched.email && !signUpErrors.email
                            ? 'border-emerald-400'
                            : 'border-slate-200 focus:border-violet-500 focus:bg-white'
                        }`}
                    />
                    {signUpTouched.email && (
                      <span className="absolute right-3.5 top-3.5">
                        {signUpErrors.email ? <FiX className="text-rose-500" size={18} /> : <FiCheck className="text-emerald-500" size={18} />}
                      </span>
                    )}
                  </div>
                  {signUpTouched.email && signUpErrors.email && (
                    <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <FiX size={13} /> {signUpErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone Number with Country Code Dropdown */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex rounded-2xl border bg-slate-50/50 overflow-hidden focus-within:bg-white focus-within:border-violet-500 transition">
                    <select
                      value={selectedCountry.code}
                      onChange={(e) => {
                        const newC = COUNTRY_CODES.find((c) => c.code === e.target.value) || COUNTRY_CODES[0];
                        setSelectedCountry(newC);
                      }}
                      className="border-r border-slate-200 bg-slate-100/80 px-3 py-3 text-xs font-bold outline-none cursor-pointer hover:bg-slate-200/80 text-slate-700"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.dialCode} ({c.name})
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1">
                      <input
                        type="tel"
                        maxLength={selectedCountry.digitsLength + 2}
                        placeholder={`e.g. ${selectedCountry.placeholder}`}
                        value={signUpData.phone}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, selectedCountry.digitsLength);
                          setSignUpData({ ...signUpData, phone: digitsOnly });
                        }}
                        onBlur={() => setSignUpTouched({ ...signUpTouched, phone: true })}
                        className="w-full bg-transparent px-4 py-3 text-sm font-medium outline-none"
                      />
                      {signUpTouched.phone && (
                        <span className="absolute right-3.5 top-3.5">
                          {signUpErrors.phone ? <FiX className="text-rose-500" size={18} /> : <FiCheck className="text-emerald-500" size={18} />}
                        </span>
                      )}
                    </div>
                  </div>
                  {signUpTouched.phone && signUpErrors.phone && (
                    <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <FiX size={13} /> {signUpErrors.phone}
                    </p>
                  )}
                </div>

                {/* Password & Strength Meter */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      onBlur={() => setSignUpTouched({ ...signUpTouched, password: true })}
                      className={`w-full rounded-2xl border bg-slate-50/50 pl-11 pr-11 py-3 text-sm font-medium outline-none transition ${signUpTouched.password && signUpErrors.password
                          ? 'border-rose-400 bg-rose-50/30 text-rose-900'
                          : signUpTouched.password && !signUpErrors.password
                            ? 'border-emerald-400'
                            : 'border-slate-200 focus:border-violet-500 focus:bg-white'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Checklist */}
                  {signUpData.password && (
                    <div className="mt-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-600">Password Strength:</span>
                        <span
                          className={`font-semibold ${passwordScore <= 2
                              ? 'text-rose-500'
                              : passwordScore <= 4
                                ? 'text-amber-500'
                                : 'text-emerald-600'
                            }`}
                        >
                          {passwordScore <= 2 ? 'Weak' : passwordScore <= 4 ? 'Medium' : 'Strong'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordScore <= 2
                              ? 'w-1/3 bg-rose-500'
                              : passwordScore <= 4
                                ? 'w-2/3 bg-amber-500'
                                : 'w-full bg-emerald-500'
                            }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                        <span className={`flex items-center gap-1 ${passwordCriteria.minLength ? 'text-emerald-600 font-semibold' : ''}`}>
                          <FiCheckCircle size={12} /> Min 8 characters
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasUpper ? 'text-emerald-600 font-semibold' : ''}`}>
                          <FiCheckCircle size={12} /> 1 Uppercase letter
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasLower ? 'text-emerald-600 font-semibold' : ''}`}>
                          <FiCheckCircle size={12} /> 1 Lowercase letter
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? 'text-emerald-600 font-semibold' : ''}`}>
                          <FiCheckCircle size={12} /> 1 Number (0-9)
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasSpecial ? 'text-emerald-600 font-semibold' : ''}`}>
                          <FiCheckCircle size={12} /> 1 Special character
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      onBlur={() => setSignUpTouched({ ...signUpTouched, confirmPassword: true })}
                      className={`w-full rounded-2xl border bg-slate-50/50 pl-11 pr-11 py-3 text-sm font-medium outline-none transition ${signUpTouched.confirmPassword && signUpErrors.confirmPassword
                          ? 'border-rose-400 bg-rose-50/30 text-rose-900'
                          : signUpTouched.confirmPassword && !signUpErrors.confirmPassword
                            ? 'border-emerald-400'
                            : 'border-slate-200 focus:border-violet-500 focus:bg-white'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {signUpTouched.confirmPassword && signUpErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <FiX size={13} /> {signUpErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Terms Agreement */}
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={signUpData.agreeTerms}
                      onChange={(e) => setSignUpData({ ...signUpData, agreeTerms: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span>
                      I agree to the <span className="font-semibold text-violet-700">Terms of Service</span> and{' '}
                      <span className="font-semibold text-violet-700">Privacy Policy</span>.
                    </span>
                  </label>
                  {signUpTouched.agreeTerms && signUpErrors.agreeTerms && (
                    <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                      <FiX size={13} /> {signUpErrors.agreeTerms}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Creating Account…</span>
                  ) : (
                    <>
                      Create Account <FiArrowRight size={18} />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
