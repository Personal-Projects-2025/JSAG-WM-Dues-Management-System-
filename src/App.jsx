import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import TenantBranding from './components/TenantBranding.jsx';
import RootRedirect from './components/RootRedirect.jsx';
import { Loader2 } from 'lucide-react';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Members = lazy(() => import('./pages/Members.jsx'));
const Payments = lazy(() => import('./pages/Payments.jsx'));
const Expenditure = lazy(() => import('./pages/Expenditure.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Subgroups = lazy(() => import('./pages/Subgroups.jsx'));
const SubgroupLeaderboard = lazy(() => import('./pages/SubgroupLeaderboard.jsx'));
const Reminders = lazy(() => import('./pages/Reminders.jsx'));
const TenantRegistration = lazy(() => import('./pages/TenantRegistration.jsx'));
const TenantManagement = lazy(() => import('./pages/TenantManagement.jsx'));
const MultiAdminDashboard = lazy(() => import('./pages/MultiAdminDashboard.jsx'));
const SystemSettings = lazy(() => import('./pages/SystemSettings.jsx'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-label="Loading" />
      <p className="text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TenantBranding>
          <Router>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/register" element={<TenantRegistration />} />
            <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Layout>
                  <Members />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Layout>
                  <Payments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenditure"
            element={
              <ProtectedRoute>
                <Layout>
                  <Expenditure />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subgroups"
            element={
              <ProtectedRoute requireSuper={true}>
                <Layout>
                  <Subgroups />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <SubgroupLeaderboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reminders />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity-logs"
            element={
              <ProtectedRoute>
                <Layout>
                  <ActivityLogs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requireSuper={true}>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/multi-admin"
            element={
              <ProtectedRoute requireSystem={true}>
                <Layout>
                  <MultiAdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenant-management"
            element={
              <ProtectedRoute requireSystem={true}>
                <Layout>
                  <TenantManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/system-settings"
            element={
              <ProtectedRoute requireSystem={true}>
                <Layout>
                  <SystemSettings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RootRedirect />} />
        </Routes>
        </Suspense>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
      </TenantBranding>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

