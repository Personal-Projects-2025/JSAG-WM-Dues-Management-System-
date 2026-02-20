/**
 * App shell for protected routes. Mobile-first: see frontend/MOBILE_CHECKLIST.md for standards.
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  Layers,
  Trophy,
  BarChart2,
  Bell,
  ClipboardList,
  Settings as SettingsIcon,
  Building2,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';

const Layout = ({ children }) => {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = useMemo(() => {
    // System Users get Multi-Admin Dashboard navigation
    if (user?.role === 'system') {
      return [
        { path: '/multi-admin', label: 'Multi-Admin Dashboard', icon: LayoutDashboard },
        { path: '/tenant-approval', label: 'Organization Approvals', icon: CheckCircle2 },
        { path: '/tenant-management', label: 'Tenant Management', icon: Building2 },
        { path: '/system-settings', label: 'System Settings', icon: SettingsIcon }
      ];
    }

    // Tenant-bound users (admin/super) get regular navigation
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/members', label: 'Members', icon: Users },
      { path: '/payments', label: 'Payments', icon: CreditCard },
      { path: '/expenditure', label: 'Expenditure', icon: Wallet },
      { path: '/financial-breakdown', label: 'Financial Breakdown', icon: PieChart },
      { path: '/reminders', label: 'Reminders', icon: Bell },
      { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      { path: '/reports', label: 'Reports', icon: BarChart2 },
      { path: '/activity-logs', label: 'Activity Logs', icon: ClipboardList }
    ];

    if (user?.role === 'super') {
      baseItems.splice(4, 0, {
        path: '/subgroups',
        label: 'Subgroups',
        icon: Layers,
        roles: ['super']
      });
      baseItems.push({
        path: '/settings',
        label: 'Settings',
        icon: SettingsIcon,
        roles: ['super']
      });
    }

    return baseItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(user?.role);
    });
  }, [user]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar
        navItems={navItems}
        isCollapsed={isSidebarCollapsed}
        onCollapseToggle={toggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div
        className={clsx(
          'flex flex-1 flex-col min-h-screen transition-[margin] duration-200',
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
                  >
        <TopBar
          onMobileToggle={() => setIsMobileSidebarOpen(true)}
          user={user}
          onLogout={handleLogout}
        />

        {/* Pending Tenant Banner */}
        {tenant?.status === 'pending' && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="max-w-7xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Your organization registration is pending approval.</span>
                    {' '}You will receive an email notification once your organization has been reviewed and approved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
          </div>
    </div>
  );
};

export default Layout;

