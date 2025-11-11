import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Loader2,
  RefreshCw,
  Search,
  Trophy,
  Users,
  Wallet,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api.js';

const formatCurrency = (value) =>
  `GHS ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const SubgroupLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'totalCollected',
    direction: 'desc'
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subgroups/leaderboard');
      setLeaderboard(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = useMemo(() => {
    const query = filters.search.toLowerCase();
    let entries = [...leaderboard];
    if (query) {
      entries = entries.filter((entry) =>
        entry.name.toLowerCase().includes(query) || entry.leader?.name?.toLowerCase().includes(query)
      );
    }

    entries.sort((a, b) => {
      const direction = filters.direction === 'asc' ? 1 : -1;
      if (filters.sortBy === 'averagePerMember') {
        return (a.averagePerMember - b.averagePerMember) * direction;
      }
      if (filters.sortBy === 'totalMembers') {
        return (a.totalMembers - b.totalMembers) * direction;
      }
      return (a.totalCollected - b.totalCollected) * direction;
    });

    return entries;
  }, [leaderboard, filters]);

  useEffect(() => {
    setPageIndex(0);
  }, [filters.search, filters.sortBy, filters.direction]);

  const paginatedLeaderboard = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredLeaderboard.slice(start, start + pageSize);
  }, [filteredLeaderboard, pageIndex, pageSize]);

  const pageCount = Math.max(1, Math.ceil((filteredLeaderboard.length || 1) / pageSize));

  const isEmpty = !loading && leaderboard.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subgroup leaderboard</h1>
          <p className="text-sm text-slate-500">
            Minimal insights into subgroup momentum—sorted, searchable, and ready for action.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLeaderboard}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
          Refresh
        </button>
      </header>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
          Loading subgroup statistics…
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          No subgroup contributions yet. Record payments to activate the leaderboard.
        </div>
      ) : (
        <>
          <SummaryRow leaderboard={leaderboard} />

          <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search subgroups or leaders"
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
                  {filters.direction === 'asc' ? (
                    <ArrowUpWideNarrow size={16} className="mr-2" />
                  ) : (
                    <ArrowDownWideNarrow size={16} className="mr-2" />
                  )}
                  Sort & filter
                </button>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {filteredLeaderboard.length} subgroups
              </span>
            </div>

            <ChartsPanel data={filteredLeaderboard} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginatedLeaderboard.map((entry) => (
                <SubgroupCard key={entry.id} entry={entry} />
              ))}
            </div>

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
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
};

export default SubgroupLeaderboard;

const SummaryRow = ({ leaderboard }) => {
  const totalCollected = leaderboard.reduce((sum, entry) => sum + entry.totalCollected, 0);
  const totalMembers = leaderboard.reduce((sum, entry) => sum + entry.totalMembers, 0);
  const topSubgroup = leaderboard[0];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <SummaryTile
        label="Top subgroup"
        value={topSubgroup?.name || '—'}
        subtext={`${formatCurrency(topSubgroup?.totalCollected || 0)} • ${topSubgroup?.totalMembers || 0} members`}
        icon={<Trophy size={18} className="text-amber-500" />}
      />
      <SummaryTile
        label="Total collected"
        value={formatCurrency(totalCollected)}
        subtext={`${leaderboard.length} subgroups contributing`}
        icon={<Wallet size={18} className="text-blue-500" />}
      />
      <SummaryTile
        label="Members assigned"
        value={totalMembers}
        subtext="Across all tracked subgroups"
        icon={<Users size={18} className="text-emerald-500" />}
      />
    </div>
  );
};

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

const SubgroupCard = ({ entry }) => (
  <article className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Subgroup</p>
          <h3 className="text-lg font-semibold text-slate-900">{entry.name}</h3>
          <p className="text-xs uppercase tracking-wide text-slate-400 mt-3">Leader</p>
          <p className="text-sm text-slate-600">
            {entry.leader?.name || 'Not assigned'}
            {entry.leader?.memberId ? ` (${entry.leader.memberId})` : ''}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          #{entry.rank}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <CardStat label="Total" value={formatCurrency(entry.totalCollected)} />
        <CardStat label="Average" value={formatCurrency(entry.averagePerMember)} />
        <CardStat label="Members" value={entry.totalMembers} />
        <CardStat label="Compliance" value={`${Math.min(100, ((entry.totalCollected || 0) > 0 && entry.totalMembers) ? ((entry.averagePerMember || 0) / (entry.totalCollected / entry.totalMembers || 1)) * 100 : 0).toFixed(0)}%`} />
      </div>
    </div>
  </article>
);

const CardStat = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
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
        {[6, 8, 12].map((size) => (
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

const CHART_COLORS = ['#2563eb', '#10b981', '#f97316', '#6366f1', '#ec4899', '#f59e0b'];

const ChartsPanel = ({ data }) => {
  if (!data.length) return null;

  const chartData = data.map((entry) => ({
    name: entry.name,
    total: Number(entry.totalCollected.toFixed(2)),
    average: Number(entry.averagePerMember.toFixed(2))
  }));

  const pieData = data.map((entry) => ({
    id: entry.id,
    name: entry.name,
    value: entry.totalCollected
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Contributions overview</h3>
        <p className="text-xs text-slate-400 mb-3">Comparing total and average contributions</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} dy={10} fill="#64748b" />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `GHS ${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => label} />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} name="Total (GHS)" />
              <Bar dataKey="average" fill="#10b981" radius={[4, 4, 0, 0]} name="Average (GHS)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Contribution share</h3>
        <p className="text-xs text-slate-400 mb-3">Proportion of total dues per subgroup</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.id} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => label} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

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
                  Sort & filter
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
                  <label className="text-sm font-medium text-slate-700">Sort by</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="totalCollected">Total collected</option>
                    <option value="averagePerMember">Average per member</option>
                    <option value="totalMembers">Member count</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Direction</label>
                  <select
                    value={filters.direction}
                    onChange={(e) => setFilters((prev) => ({ ...prev, direction: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="desc">Highest first</option>
                    <option value="asc">Lowest first</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setFilters({ search: '', sortBy: 'totalCollected', direction: 'desc' })}
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


