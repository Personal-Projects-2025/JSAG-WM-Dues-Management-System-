import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({
  navItems,
  isCollapsed,
  onCollapseToggle,
  isMobileOpen,
  onMobileClose
}) => {
  const expandedWidth = 232; // ~14.5rem

  return (
    <>
      <div
        onClick={onMobileClose}
        className={clsx(
          'fixed inset-0 z-40 bg-slate-900/50 transition-opacity lg:hidden',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 ease-out lg:shadow-none',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-20' : 'w-[232px]',
          'lg:translate-x-0'
        )}
        style={!isCollapsed ? { width: expandedWidth } : undefined}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white text-[13px] font-semibold">
              GD
            </div>
            {!isCollapsed && (
              <span className="text-sm font-semibold tracking-tight text-slate-900">Dues Accountant</span>
            )}
          </div>
          <button
            type="button"
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 lg:hidden"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <div className="space-y-1 px-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex min-h-[44px] items-center gap-3 rounded-lg px-2 py-2.5 text-[13px] font-medium transition-colors',
                      isCollapsed ? 'justify-center' : 'justify-start',
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'
                    )
                  }
                  title={isCollapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition group-hover:bg-blue-500 group-hover:text-white" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {isCollapsed && (
                    <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-slate-100 shadow-lg group-hover:block">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="hidden lg:flex items-center justify-end border-t border-slate-200 px-3 py-2.5">
          <button
            type="button"
            onClick={onCollapseToggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronsRight size={18} aria-hidden="true" /> : <ChevronsLeft size={18} aria-hidden="true" />}
            <span className="sr-only">Toggle sidebar width</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;


