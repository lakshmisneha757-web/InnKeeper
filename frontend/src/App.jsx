import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChannelsPage from './pages/ChannelsPage';
import RoomsPage from './pages/RoomsPage';
import PricingPage from './pages/PricingPage';
import DynamicPricingPage from './pages/DistributionPage';
import BookingSyncPage from './pages/BookingsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Validate session with backend
    const checkAuth = async () => {
      const token = sessionStorage.getItem('innkeeper-token');
      try {
        const res = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          setIsLoggedIn(true);
          sessionStorage.setItem('innkeeper-session', 'true');
        } else {
          setIsLoggedIn(false);
          sessionStorage.removeItem('innkeeper-session');
          sessionStorage.removeItem('innkeeper-token');
        }
      } catch (err) {
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white font-medium">
        Loading session...
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={() => setIsLoggedIn(true)} />} />
        <Route element={<Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}>
          <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={isLoggedIn ? <DashboardPage /> : <Navigate to="/login" replace />} />
          <Route path="/channel-manager" element={isLoggedIn ? <ChannelsPage /> : <Navigate to="/login" replace />} />
          <Route path="/inventory" element={isLoggedIn ? <RoomsPage /> : <Navigate to="/login" replace />} />
          <Route path="/rate-management" element={isLoggedIn ? <PricingPage /> : <Navigate to="/login" replace />} />
          <Route path="/dynamic-pricing" element={isLoggedIn ? <DynamicPricingPage /> : <Navigate to="/login" replace />} />
          <Route path="/booking-sync" element={isLoggedIn ? <BookingSyncPage /> : <Navigate to="/login" replace />} />
          <Route path="/analytics" element={isLoggedIn ? <ReportsPage /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={isLoggedIn ? <SettingsPage /> : <Navigate to="/login" replace />} />
          <Route path="/distribution" element={isLoggedIn ? <Navigate to="/dynamic-pricing" replace /> : <Navigate to="/login" replace />} />
        </Route>
      </Routes>
      <ToastContainer position="top-right" theme="light" />
    </>
  );
}

export default App;
