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
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = useMemo(() => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/members', label: 'Members', icon: Users },
      { path: '/payments', label: 'Payments', icon: CreditCard },
      { path: '/expenditure', label: 'Expenditure', icon: Wallet },
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

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
    </div>
  );
};

export default Layout;

