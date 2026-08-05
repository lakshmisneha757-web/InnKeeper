import { apiClient } from '@/lib/api';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (payload: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  signup: (payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; resetToken?: string }>;
  resetPassword: (payload: { email: string; token: string; password: string; confirmPassword: string }) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      const response = await apiClient.auth.me();
      setUser(response.data?.user ?? response.data ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const login = async (payload: { email: string; password: string; rememberMe?: boolean }) => {
    setLoading(true);
    try {
      const response = await apiClient.auth.login(payload);
      setUser(response.data?.user ?? null);
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Unable to sign in right now.';
      setUser(null);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload: { name: string; email: string; phone?: string; password: string; confirmPassword: string; role?: string }) => {
    setLoading(true);
    try {
      await apiClient.auth.signup(payload);
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Unable to create your account.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignore logout failures and still clear the local session state.
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const response = await apiClient.auth.forgotPassword(email);
      setError(null);
      return response.data as { message: string; resetToken?: string };
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Unable to process your request.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (payload: { email: string; token: string; password: string; confirmPassword: string }) => {
    setLoading(true);
    try {
      await apiClient.auth.resetPassword(payload);
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Unable to reset your password.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    error,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    refresh,
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
