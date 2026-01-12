import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import {
  CalendarClock,
  Download,
  Filter,
  Search,
  ShieldCheck,
  Trash2,
  UserCircle2,
  X
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

const ActivityLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiFilters, setApiFilters] = useState({
    actor: '',
    startDate: '',
    endDate: '',
    action: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(apiFilters);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (apiFilters.actor) params.append('actor', apiFilters.actor);
      if (apiFilters.startDate) params.append('startDate', apiFilters.startDate);
      if (apiFilters.endDate) params.append('endDate', apiFilters.endDate);
      if (apiFilters.action) params.append('action', apiFilters.action);

      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data || []);
    } catch (error) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [apiFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (filterOpen) {
      setDraftFilters(apiFilters);
    }
  }, [filterOpen, apiFilters]);

  const filteredLogs = useMemo(() => {
    const query = searchTerm.toLowerCase();
    if (!query) return logs;
    return logs.filter((log) =>
      [log.actor, log.role, log.action, log.affectedMember]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [logs, searchTerm]);

  useEffect(() => {
    setPageIndex(0);
  }, [filteredLogs.length, searchTerm]);

  const paginatedLogs = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, pageIndex, pageSize]);

  const pageCount = Math.max(1, Math.ceil((filteredLogs.length || 1) / pageSize));

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (apiFilters.actor) params.append('actor', apiFilters.actor);
      if (apiFilters.startDate) params.append('startDate', apiFilters.startDate);
      if (apiFilters.endDate) params.append('endDate', apiFilters.endDate);
      if (apiFilters.action) params.append('action', apiFilters.action);

      const response = await api.get(`/logs/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'activity-logs.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  };

  const handleDelete = useCallback(async (id) => {
    try {
      await api.delete(`/logs/${id}`);
      toast.success('Log deleted successfully');
      fetchLogs();
    } catch (error) {
      toast.error('Failed to delete log');
    }
  }, [fetchLogs]);

  const uniqueActors = new Set(logs.map((log) => log.actor)).size;
  const latestLog = logs
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const adminActions = logs.filter((log) => log.role === 'admin').length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Activity logs</h1>
          <p className="text-sm text-slate-500">
            Minimal history of all recorded changes for transparency and accountability.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
        >
          <Download size={16} className="mr-2" />
          Export XLSX
        </button>
      </header>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
          Loading activity feed…
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          No activity recorded yet. Actions taken by admins and super users will appear here.
        </div>
      ) : (
        <>
          <SummaryRow total={logs.length} actors={uniqueActors} lastLog={latestLog} adminActions={adminActions} />

          <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search actor, role or action"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
                >
                  <Filter size={16} className="mr-2" />
                  Filters
                </button>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {filteredLogs.length} results
              </span>
            </div>

            <LogsTable logs={paginatedLogs} user={user} onDelete={handleDelete} />

            <PaginationBar
              pageIndex={pageIndex}
              pageSize={pageSize}
              pageCount={pageCount}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
            />
          </section>
        </>
      )}

      <FilterDialog
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        applyFilters={setApiFilters}
        isSuper={user?.role === 'super'}
      />
    </div>
  );
};

export default ActivityLogs;

const SummaryRow = ({ total, actors, lastLog, adminActions }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    <SummaryTile
      label="Total entries"
      value={total}
      subtext="Logged actions captured"
      icon={<UserCircle2 size={18} className="text-blue-500" />}
    />
    <SummaryTile
      label="Distinct actors"
      value={actors}
      subtext="Admins and super users involved"
      icon={<ShieldCheck size={18} className="text-emerald-500" />}
    />
    <SummaryTile
      label="Latest action"
      value={lastLog ? lastLog.actor : '—'}
      subtext={lastLog ? formatDateTime(lastLog.date) : 'Waiting for activity'}
      icon={<CalendarClock size={18} className="text-amber-500" />}
    />
  </div>
);

const SummaryTile = ({ label, value, subtext, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      {icon}
    </div>
    <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    <p className="text-xs text-slate-400">{subtext}</p>
  </div>
);

const LogsTable = ({ logs, user, onDelete }) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-4 py-3 text-left font-semibold">Actor</th>
          <th className="px-4 py-3 text-left font-semibold">Role</th>
          <th className="px-4 py-3 text-left font-semibold">Action</th>
          <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
          <th className="px-4 py-3 text-left font-semibold">Affected member</th>
          {user?.role === 'super' && <th className="px-4 py-3 text-left font-semibold">Manage</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
        {logs.length === 0 ? (
          <tr>
            <td colSpan={user?.role === 'super' ? 6 : 5} className="px-4 py-6 text-center text-slate-500">
              No logs match your filters.
            </td>
          </tr>
        ) : (
          logs.map((log) => (
            <tr key={log._id} className="hover:bg-slate-50 transition">
              <td className="px-4 py-3 font-medium text-slate-800">{log.actor}</td>
              <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-400">{log.role}</td>
              <td className="px-4 py-3 text-slate-600">{log.action}</td>
              <td className="px-4 py-3 text-slate-500">{formatDateTime(log.date)}</td>
              <td className="px-4 py-3 text-slate-500">{log.affectedMember || '—'}</td>
              {user?.role === 'super' && (
                <td className="px-4 py-3 text-slate-500">
                  <button
                    type="button"
                    onClick={() => onDelete(log._id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const PaginationBar = ({ pageIndex, pageSize, pageCount, onPageChange, onPageSizeChange }) => (
  <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
    <div>
      Page {pageIndex + 1} of {pageCount}
    </div>
    <div className="flex items-center gap-3">
      <label className="hidden text-xs text-slate-500 sm:block">Rows per page</label>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {[10, 20, 30].map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(pageIndex - 1, 0))}
          disabled={pageIndex === 0}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageIndex + 1, pageCount - 1))}
          disabled={pageIndex >= pageCount - 1}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  </div>
);

const FilterDialog = ({ isOpen, onClose, draftFilters, setDraftFilters, applyFilters, isSuper }) => (
  <Transition appear show={isOpen} as={React.Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child
        as={React.Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-slate-900/40" />
      </Transition.Child>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-6">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Filter logs
                </Dialog.Title>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4 px-6 py-6 text-sm">
                {isSuper && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Actor username</label>
                    <input
                      type="text"
                      value={draftFilters.actor}
                      onChange={(e) => setDraftFilters((prev) => ({ ...prev, actor: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. superadmin"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Start date</label>
                  <input
                    type="date"
                    value={draftFilters.startDate}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">End date</label>
                  <input
                    type="date"
                    value={draftFilters.endDate}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Action contains</label>
                  <input
                    type="text"
                    value={draftFilters.action}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, action: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Created member"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setDraftFilters({ actor: '', startDate: '', endDate: '', action: '' });
                    applyFilters({ actor: '', startDate: '', endDate: '', action: '' });
                    onClose();
                  }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Reset
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      applyFilters(draftFilters);
                      onClose();
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

