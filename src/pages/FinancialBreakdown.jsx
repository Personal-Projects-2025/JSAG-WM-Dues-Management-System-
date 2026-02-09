import React, { useEffect, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { BarChart2, PieChart, List, Filter, Loader2 } from 'lucide-react';
import api from '../services/api.js';
import clsx from 'clsx';

const formatCurrency = (value) =>
  typeof value === 'number'
    ? `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'GHS 0.00';

const FinancialBreakdown = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('byType');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const response = await api.get(`/contributions/breakdown?${params.toString()}`);
      setData(response.data);
    } catch (error) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakdown();
  }, [filters.startDate, filters.endDate]);

  const tabs = [
    { id: 'byType', label: 'By contribution type', icon: BarChart2 },
    { id: 'byExpense', label: 'By expense source', icon: PieChart },
    { id: 'chronological', label: 'Chronological', icon: List }
  ];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Financial breakdown</h1>
          <p className="text-sm text-slate-500">
            View contributions and expenses by type, source, and timeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <Filter size={16} className="mr-2" />
          Date filter
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {!data ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Failed to load breakdown data.
        </div>
      ) : (
        <>
          {activeTab === 'byType' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Contributions by type</h2>
                <p className="text-sm text-slate-500">Total collected per contribution type.</p>
                <div className="mt-4">
                  {data.byContributionType?.length === 0 ? (
                    <p className="text-sm text-slate-500">No contributions in the selected period.</p>
                  ) : (
                    <>
                      <div className="mt-4 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.byContributionType || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="contributionTypeName" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Total" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 space-y-2">
                        {(data.byContributionType || []).map((row) => (
                          <div
                            key={row.contributionTypeId || row.contributionTypeName}
                            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                          >
                            <span className="font-medium text-slate-800">{row.contributionTypeName}</span>
                            <span className="font-semibold text-emerald-600">{formatCurrency(row.total)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'byExpense' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Expenses by funded-by type</h2>
              <p className="text-sm text-slate-500">Total spent, grouped by which contribution type funded the expense.</p>
              <div className="mt-4 space-y-2">
                {data.byExpenseSource?.length === 0 ? (
                  <p className="text-sm text-slate-500">No expenditures in the selected period.</p>
                ) : (
                  (data.byExpenseSource || []).map((row) => (
                    <div
                      key={row.fundedByContributionTypeId ?? 'unspecified'}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-slate-800">{row.fundedByContributionTypeName}</span>
                      <span className="font-semibold text-rose-600">{formatCurrency(row.total)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'chronological' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Recent contributions</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Member</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(data.recentContributions || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                            No contributions.
                          </td>
                        </tr>
                      ) : (
                        (data.recentContributions || []).map((c) => (
                          <tr key={c._id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-600">
                              {new Date(c.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {c.contributionTypeId?.name || '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{c.memberId?.name || '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(c.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Recent expenditures</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Funded by</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(data.recentExpenditures || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                            No expenditures.
                          </td>
                        </tr>
                      ) : (
                        (data.recentExpenditures || []).map((e) => (
                          <tr key={e._id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-600">
                              {new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">{e.title}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {e.fundedByContributionTypeId?.name || '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-rose-600">{formatCurrency(e.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Date filter</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Start date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">End date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFilters({ startDate: '', endDate: '' })}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialBreakdown;
