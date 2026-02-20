import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const TopBar = ({ onMobileToggle, user, onLogout }) => {
  const { tenant } = useAuth();
  const initials = user?.username
    ? user.username
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onMobileToggle}
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden transition"
          >
            <Menu size={20} />
            <span className="sr-only">Open sidebar</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {tenant && (
            <div className="hidden md:block text-right border-r border-slate-200 pr-4">
              <p className="text-sm font-medium text-slate-700">
                {tenant.name}
              </p>
              <p className="text-xs text-slate-500">
                Organization
              </p>
            </div>
          )}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-700">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-slate-500 capitalize">
              {user?.role || 'admin'}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-semibold uppercase">
            {initials}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;


