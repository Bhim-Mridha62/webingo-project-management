import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import { fetchMe, logout } from './store/slices/authSlice';
import './index.css';

// ── Code-split pages ──────────────────────────────────────────────────────────
const LoginPage          = lazy(() => import('./pages/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'));
const InvitePage         = lazy(() => import('./pages/InvitePage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage       = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage  = lazy(() => import('./pages/ProjectDetailPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));

// ── Full-page loader ──────────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', flexDirection: 'column', gap: 16,
    background: 'var(--bg-primary)',
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: 12,
      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: 24, color: 'white',
    }}>W</div>
    <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
  </div>
);

// ── Route guards ──────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : children;
};

// ── App layout for authenticated pages ────────────────────────────────────────
const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
);

// ── Inner app — handles auth bootstrap ────────────────────────────────────────
const AppInner = () => {
  const dispatch = useDispatch();
  const { bootstrapping } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchMe());
    } else {
      // no token → mark bootstrap done
      dispatch({ type: 'auth/fetchMe/rejected' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (bootstrapping) return <PageLoader />;

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public ─────────────────────────────────────────── */}
          <Route path="/login"            element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register"         element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
          <Route path="/forgot-password"  element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Invite — handled inside page (redirects to login if no token) */}
          <Route path="/invite/:token"    element={<InvitePage />} />

          {/* ── Protected ──────────────────────────────────────── */}
          <Route path="/dashboard"  element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
          <Route path="/projects"   element={<ProtectedRoute><AppLayout><ProjectsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><AppLayout><ProjectDetailPage /></AppLayout></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />

          {/* ── Catch-all ──────────────────────────────────────── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

// ── Root ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </Provider>
  );
}

export default App;
