import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/members', label: 'Members', icon: '👥' },
    { path: '/payments', label: 'Payments', icon: '💰' },
    { path: '/expenditure', label: 'Expenditure', icon: '💸' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/activity-logs', label: 'Activity Logs', icon: '📝' }
  ];

  if (user?.role === 'super') {
    navItems.splice(3, 0, { path: '/subgroups', label: 'Subgroups', icon: '🧩' });
  }

  const activityIndex = navItems.findIndex((item) => item.path === '/activity-logs');
  if (activityIndex !== -1) {
    navItems.splice(activityIndex, 0, { path: '/leaderboard', label: 'Leaderboard', icon: '🏅' });
  }

  if (user?.role === 'super') {
    navItems.push({ path: '/settings', label: 'Settings', icon: '⚙️' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-blue-600">Group Dues</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === item.path
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-4">
                {user?.username} ({user?.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;

