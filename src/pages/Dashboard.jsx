import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  ArrowUpRight,
  BellRing,
  CircleDollarSign,
  Group,
  LineChart as LineChartIcon,
  ShieldCheck,
  Wallet,
  Users,
  Zap
} from 'lucide-react';
import api from '../services/api.js';
import { toast } from 'react-toastify';
import { StatsCardSkeleton } from '../components/LoadingSkeleton.jsx';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [reminderSummary, setReminderSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [dashboardResponse, remindersResponse] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reminders/summary')
      ]);

      const data = dashboardResponse.data;
      const mergedMonthlyData = data.monthlyIncome.map((incomeItem, index) => {
        const expenditureItem = data.monthlyExpenditure[index] || { amount: 0 };
        return {
          month: incomeItem.month,
          income: incomeItem.amount,
          expenditure: expenditureItem.amount
        };
      });

      setStats({ ...data, mergedMonthlyData });
      setReminderSummary(remindersResponse.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-96 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="h-10 w-48 bg-gray-200 animate-pulse rounded" />
        </header>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <StatsCardSkeleton key={idx} />
          ))}
        </section>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-4" />
            <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded mb-4" />
            <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
          </div>
        </section>
      </div>
    );
  }

  if (!stats) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-500">No data available.</div>;
  }

  const formatDateTime = (value) =>
    value
      ? new Date(value).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Not available';

  const subgroupStats = stats.subgroupStats || [];
  const rankedSubgroups = subgroupStats.filter((sg) => sg.id !== 'unassigned');
  const unassignedStat = subgroupStats.find((sg) => sg.id === 'unassigned');
  const topCompetitiveSubgroup = rankedSubgroups.length > 0 ? rankedSubgroups[0] : null;
  const leaderboardPreview = rankedSubgroups.slice(0, 3);
  const maxSubgroupTotal = rankedSubgroups.length > 0 ? Math.max(...rankedSubgroups.map((sg) => sg.totalCollected)) : 0;
  const outstandingMembers = reminderSummary?.totalOutstandingMembers || 0;
  const outstandingAmount = reminderSummary?.totalOutstandingAmount || 0;
  const lastReminder = reminderSummary?.lastReminderSentAt ? formatDateTime(reminderSummary.lastReminderSentAt) : 'Not sent yet';
  const nextReminder = reminderSummary?.nextReminderScheduledAt ? formatDateTime(reminderSummary.nextReminderScheduledAt) : 'TBD';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Welcome back</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Leadership overview</h1>
          <p className="text-sm text-slate-500">
            Minimal snapshot of dues health, subgroup performance, and reminders—all in one glance.
          </p>
        </div>
        <Link
          to="/payments"
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <ArrowUpRight size={16} className="mr-2" />
          Record new payment
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryTile icon={<Users size={16} className="text-blue-500" />} label="Members" value={stats.totalMembers} subtext="Active this cycle" />
        <SummaryTile icon={<CircleDollarSign size={16} className="text-emerald-500" />} label="Collected" value={`GHS ${stats.totalCollected?.toFixed(2)}`} subtext="All subgroups" />
        <SummaryTile icon={<Wallet size={16} className="text-orange-500" />} label="Spent" value={`GHS ${stats.totalSpent?.toFixed(2)}`} subtext={`Balance ${stats.balanceRemaining >= 0 ? 'healthy' : 'check spending'}`} />
        <SummaryTile icon={<LineChartIcon size={16} className="text-purple-500" />} label="Balance" value={`GHS ${stats.balanceRemaining?.toFixed(2)}`} subtext={stats.balanceRemaining >= 0 ? 'Reserve' : 'Deficit'} />
        <SummaryTile icon={<BellRing size={16} className="text-rose-500" />} label="Outstanding" value={`GHS ${outstandingAmount.toFixed(2)}`} subtext={`${outstandingMembers} member${outstandingMembers === 1 ? '' : 's'}`} />
        <SummaryTile icon={<ShieldCheck size={16} className="text-amber-500" />} label="Last reminder" value={lastReminder} subtext={`Next: ${nextReminder}`} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoTile
          icon={<Group size={18} className="text-amber-500" />}
          title="Top subgroup"
          primary={topCompetitiveSubgroup ? topCompetitiveSubgroup.name : 'Assign subgroups'}
          secondary={topCompetitiveSubgroup ? `GHS ${topCompetitiveSubgroup.totalCollected.toFixed(2)} collected` : 'Assign members to subgroups to start tracking'}
          tertiary={topCompetitiveSubgroup ? `Avg per member: GHS ${topCompetitiveSubgroup.averagePerMember.toFixed(2)}` : ''}
        />
        <InfoTile
          icon={<BellRing size={18} className="text-rose-500" />}
          title="Reminder health"
          primary={outstandingMembers ? `${outstandingMembers} member${outstandingMembers === 1 ? '' : 's'} outstanding` : 'All caught up'}
          secondary={`Outstanding: GHS ${outstandingAmount.toFixed(2)}`}
          tertiary={`Last sent: ${lastReminder} • Next: ${nextReminder}`}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Income vs expenditure" subtitle="Monthly trend over the past period">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.mergedMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => `GHS ${Number(value).toFixed(2)}`} />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="income" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Income" />
              <Bar dataKey="expenditure" fill="#f97316" radius={[6, 6, 0, 0]} name="Expenditure" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Cashflow line chart" subtitle="Quick comparison of revenue versus spend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.mergedMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip formatter={(value) => `GHS ${Number(value).toFixed(2)}`} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="income" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Income" />
              <Line type="monotone" dataKey="expenditure" stroke="#f97316" strokeWidth={2} dot={false} name="Expenditure" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Subgroup performance snapshot</h2>
            <p className="text-xs text-slate-400">Top performers ranked by total dues collected.</p>
          </div>
          <Link to="/leaderboard" className="inline-flex min-h-[44px] items-center justify-center sm:min-h-0 sm:justify-start py-2 text-xs font-semibold text-blue-600 hover:text-blue-700">
            Open leaderboard <ArrowUpRight size={14} className="ml-1" />
          </Link>
        </div>
        {rankedSubgroups.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No subgroup contributions yet. Assign members to subgroups to start collecting.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {leaderboardPreview.map((subgroup, index) => {
              const percentage = maxSubgroupTotal > 0 ? (subgroup.totalCollected / maxSubgroupTotal) * 100 : 0;
              return (
                <div key={subgroup.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>
                      #{index + 1} {subgroup.name}
                    </span>
                    <span>{`GHS ${subgroup.totalCollected.toFixed(2)}`}</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Members: {subgroup.totalMembers} • Avg: GHS {subgroup.averagePerMember.toFixed(2)}
                  </p>
                </div>
              );
            })}
            {rankedSubgroups.length > leaderboardPreview.length && (
              <p className="text-xs text-slate-400">
                +{rankedSubgroups.length - leaderboardPreview.length} more subgroup
                {rankedSubgroups.length - leaderboardPreview.length === 1 ? '' : 's'} contributing this month.
              </p>
            )}
            {unassignedStat?.totalMembers ? (
              <p className="text-xs text-slate-400">
                {unassignedStat.totalMembers} member{unassignedStat.totalMembers === 1 ? '' : 's'} currently unassigned.
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickLink to="/members" label="Add member" icon={<Users size={16} />} />
        <QuickLink to="/payments" label="Record payment" icon={<Wallet size={16} />} />
        <QuickLink to="/reports" label="Export reports" icon={<LineChartIcon size={16} />} />
        <QuickLink to="/reminders" label="Reminder center" icon={<BellRing size={16} />} />
      </section>
    </div>
  );
};

export default Dashboard;

const SummaryTile = ({ icon, label, value, subtext }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="rounded-full bg-slate-50 p-2 text-slate-500">{icon}</div>
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Now</span>
    </div>
    <p className="mt-3 text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-lg font-semibold text-slate-900 leading-tight">{value}</p>
    <p className="text-[11px] text-slate-400">{subtext}</p>
  </div>
);

const InfoTile = ({ icon, title, primary, secondary, tertiary }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-slate-50 p-3 text-slate-500">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
        <p className="text-base font-semibold text-slate-900">{primary}</p>
        <p className="text-xs text-slate-500">{secondary}</p>
        {tertiary && <p className="text-xs text-slate-400">{tertiary}</p>}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <Zap size={16} className="text-blue-400" />
    </div>
    <div className="mt-4 h-72">{children}</div>
  </div>
);

const QuickLink = ({ to, label, icon }) => (
  <Link
    to={to}
    className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
  >
    <span>{label}</span>
    <span className="rounded-full bg-slate-100 p-2 text-slate-500">{icon}</span>
  </Link>
);

