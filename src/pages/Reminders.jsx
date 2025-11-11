import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import {
  BellRing,
  CalendarDays,
  Download,
  Filter,
  Loader2,
  MailOpen,
  RefreshCw,
  Search,
  Send,
  Users,
  X
} from 'lucide-react';
import api from '../services/api.js';

const formatDate = (value, options = {}) =>
  value ? new Date(value).toLocaleDateString(undefined, options) : 'Not available';

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not available';

const Reminders = () => {
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, logsResponse] = await Promise.all([
        api.get('/reminders/summary'),
        api.get('/reminders?limit=500')
      ]);
      setSummary(summaryResponse.data);
      setLogs(logsResponse.data || []);
    } catch (error) {
      toast.error('Failed to load reminder data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesStatus = filters.status ? log.status === filters.status : true;
      const query = filters.search.toLowerCase();
      const matchesSearch = query
        ? [log.memberId?.name, log.email, log.scriptureRef, log.scriptureText]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query))
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [logs, filters]);

  useEffect(() => {
    setPageIndex(0);
  }, [filteredLogs.length, filters.status, filters.search]);

  const paginatedLogs = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, pageIndex, pageSize]);

  const pageCount = Math.max(1, Math.ceil((filteredLogs.length || 1) / pageSize));

  const handleSendNow = async () => {
    try {
      setSending(true);
      const response = await api.post('/reminders/send');
      toast.success('Reminder emails processed');
      if (response.data?.summary) {
        const { sent, failed } = response.data.summary;
        if (failed > 0) {
          toast.warn(`${failed} reminder${failed === 1 ? '' : 's'} failed to send.`);
        } else if (sent === 0) {
          toast.info('No reminders were sent (no outstanding dues).');
        }
      }
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading reminder data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Due reminders</h1>
          <p className="text-sm text-slate-500">
            Automate pastoral follow-up, track reminder delivery, and encourage faithful giving.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <button
            onClick={handleSendNow}
            disabled={sending}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Send reminders now
              </>
            )}
          </button>
        </div>
      </header>

      {summary && <ReminderSummary summary={summary} />}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by member, email, or scripture"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
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
            {filteredLogs.length} reminders
          </span>
        </div>

        <ReminderTable
          data={paginatedLogs}
          totalCount={filteredLogs.length}
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

      <FilterDialog
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
};

export default Reminders;

const ReminderSummary = ({ summary }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    <SummaryTile
      label="Last reminder sent"
      value={formatDateTime(summary.lastReminderSentAt)}
      icon={<MailOpen size={18} className="text-blue-500" />}
    />
    <SummaryTile
      label="Next reminder"
      value={formatDate(summary.nextReminderScheduledAt, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })}
      icon={<CalendarDays size={18} className="text-purple-500" />}
    />
    <SummaryTile
      label="Members outstanding"
      value={summary.totalOutstandingMembers || 0}
      icon={<Users size={18} className="text-rose-500" />}
    />
    <SummaryTile
      label="Total outstanding"
      value={`GHS ${(summary.totalOutstandingAmount || 0).toFixed(2)}`}
      icon={<BellRing size={18} className="text-emerald-500" />}
    />
  </div>
);

const SummaryTile = ({ label, value, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      {icon}
    </div>
    <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
  </div>
);

const ReminderTable = ({
  data,
  totalCount,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange
}) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Reminder activity</h2>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          History of automated and manual reminders
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
      >
        <Download size={14} className="mr-1.5" />
        Export view
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {['Sent at', 'Member', 'Amount owed', 'Months', 'Scripture', 'Status'].map((header) => (
              <th key={header} className="px-4 py-3 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                No reminders match the selected filters.
              </td>
            </tr>
          ) : (
            data.map((log) => (
              <tr key={log._id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-800">{formatDateTime(log.sentAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-700">{log.memberId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400">{log.email || 'No email on file'}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-rose-600">
                  GHS {(log.amountOwed || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3">{log.monthsInArrears}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-700">{log.scriptureRef}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{log.scriptureText}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={log.status} error={log.error} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
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
          {[10, 20, 30, 50].map((size) => (
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
  </div>
);

const StatusPill = ({ status, error }) => (
  <div>
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
      }`}
    >
      {status === 'sent' ? 'Sent' : 'Failed'}
    </span>
    {status === 'failed' && error && (
      <p className="mt-1 text-xs text-rose-500">{error}</p>
    )}
  </div>
);

const FilterDialog = ({ isOpen, onClose, filters, setFilters }) => (
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
                  Filter reminders
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
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">All reminders</option>
                    <option value="sent">Sent successfully</option>
                    <option value="failed">Failed to send</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Search keyword</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Member, email, or scripture"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setFilters({ status: '', search: '' })}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);


