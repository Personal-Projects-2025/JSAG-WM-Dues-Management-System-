import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'react-toastify';
import clsx from 'clsx';
import {
  PiggyBank,
  Plus,
  Trash2,
  Edit,
  X,
  Loader2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowUpCircle
} from 'lucide-react';
import api from '../services/api.js';

const formatCurrency = (value) =>
  typeof value === 'number'
    ? `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'GHS 0.00';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const defaultPeriod = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { start, end };
};

const emptyForm = () => {
  const { start, end } = defaultPeriod();
  return { name: '', periodStart: start, periodEnd: end, lines: [], fundLines: [], revenueLines: [] };
};

// ─── Budget Page ─────────────────────────────────────────────────────────────

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [contributionTypes, setContributionTypes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState(emptyForm());

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/budgets');
      setBudgets(res.data || []);
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  useEffect(() => {
    api.get('/contribution-types')
      .then((r) => setContributionTypes(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (budgets.length > 0 && !selectedId) {
      setSelectedId(budgets[0].id || budgets[0]._id);
    }
  }, [budgets, selectedId]);

  useEffect(() => {
    if (!selectedId) { setSummary(null); return; }
    (async () => {
      setSummaryLoading(true);
      try {
        const res = await api.get(`/budgets/${selectedId}/summary`);
        setSummary(res.data);
      } catch {
        toast.error('Failed to load budget summary');
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    })();
  }, [selectedId]);

  const openCreate = () => {
    setEditingBudget(null);
    setFormState(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (budget) => {
    setEditingBudget(budget);
    setFormState({
      name: budget.name || '',
      periodStart: budget.periodStart ? new Date(budget.periodStart).toISOString().split('T')[0] : '',
      periodEnd: budget.periodEnd ? new Date(budget.periodEnd).toISOString().split('T')[0] : '',
      lines: (budget.lines || []).map((l) => ({ category: l.category || '', plannedAmount: l.plannedAmount ?? '' })),
      fundLines: (budget.fundLines || []).map((l) => ({
        contributionTypeId: (l.contributionTypeId || '').toString(),
        plannedAmount: l.plannedAmount ?? ''
      })),
      revenueLines: (budget.revenueLines || []).map((l) => ({
        contributionTypeId: (l.contributionTypeId || '').toString(),
        targetAmount: l.targetAmount ?? ''
      }))
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formState,
      lines: formState.lines
        .filter((l) => l.category.trim())
        .map((l) => ({ category: l.category.trim(), plannedAmount: Number(l.plannedAmount) })),
      fundLines: formState.fundLines
        .filter((l) => l.contributionTypeId)
        .map((l) => ({ contributionTypeId: l.contributionTypeId, plannedAmount: Number(l.plannedAmount) })),
      revenueLines: formState.revenueLines
        .filter((l) => l.contributionTypeId)
        .map((l) => ({ contributionTypeId: l.contributionTypeId, targetAmount: Number(l.targetAmount) }))
    };
    try {
      setSubmitting(true);
      if (editingBudget) {
        const id = editingBudget.id || editingBudget._id;
        await api.put(`/budgets/${id}`, payload);
        toast.success('Budget updated');
        setSelectedId(null);
        setTimeout(() => setSelectedId(id), 0);
        fetchBudgets();
      } else {
        const res = await api.post('/budgets', payload);
        const newId = res.data.budget?.id || res.data.budget?._id;
        toast.success('Budget created');
        await fetchBudgets();
        if (newId) setSelectedId(newId);
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id || deleteTarget._id;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget deleted');
      setDeleteTarget(null);
      if (selectedId === id) setSelectedId(null);
      await fetchBudgets();
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={18} />
        Loading budgets…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Budget</h1>
          <p className="text-sm text-slate-500">
            Plan spending by category and fund, set income targets, and track actuals vs planned.
          </p>
        </div>
        <button type="button" onClick={openCreate}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
          <Plus size={16} className="mr-2" />
          New budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState onOpen={openCreate} />
      ) : (
        <>
          <BudgetSelector
            budgets={budgets}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
          {summaryLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <Loader2 className="mr-2 animate-spin" size={18} />
              Loading summary…
            </div>
          ) : summary ? (
            <SummaryPanel summary={summary} />
          ) : (
            <div className="py-10 text-center text-slate-400">Select a budget to view its summary.</div>
          )}
        </>
      )}

      <BudgetFormDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        formState={formState}
        setFormState={setFormState}
        submitting={submitting}
        editing={Boolean(editingBudget)}
        contributionTypes={contributionTypes}
      />

      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default Budget;

// ─── Budget Selector ──────────────────────────────────────────────────────────

const BudgetSelector = ({ budgets, selectedId, onSelect, onEdit, onDelete }) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-6 py-4">
      <h2 className="text-base font-semibold text-slate-900">Your budgets</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {['Name', 'Period', 'Categories', 'Funds', 'Income targets', 'Actions'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-600">
          {budgets.map((b) => {
            const id = b.id || b._id;
            const isActive = id === selectedId;
            return (
              <tr key={id} onClick={() => onSelect(id)}
                className={clsx('cursor-pointer transition', isActive ? 'bg-blue-50' : 'hover:bg-slate-50')}>
                <td className="px-4 py-3 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <PiggyBank size={15} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                    {b.name || <span className="italic text-slate-400">Untitled</span>}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(b.periodStart)} – {formatDate(b.periodEnd)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {(b.lines || []).length}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    {(b.fundLines || []).length}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {(b.revenueLines || []).length}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => onEdit(b)}
                      className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                      <Edit size={14} />
                    </button>
                    <button type="button" onClick={() => onDelete(b)}
                      className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Summary Panel ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'category', label: 'By Category', icon: PiggyBank },
  { id: 'fund', label: 'By Fund', icon: Layers },
  { id: 'revenue', label: 'Revenue', icon: ArrowUpCircle }
];

const SummaryPanel = ({ summary }) => {
  const [activeTab, setActiveTab] = useState('category');
  const { budget, lines, totals, fundLines, fundTotals, revenueLines, revenueTotals } = summary;

  const overCategoryLines = lines.filter((l) => l.actualAmount > l.plannedAmount);
  const overFundLines = (fundLines || []).filter((l) => l.actualAmount > l.plannedAmount);
  const shortfallRevenueLines = (revenueLines || []).filter((l) => l.actualAmount < l.targetAmount);

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      {activeTab === 'category' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryCard label="Total planned" value={formatCurrency(totals.planned)}
            sub={`${formatDate(budget.periodStart)} – ${formatDate(budget.periodEnd)}`}
            icon={<PiggyBank size={18} className="text-blue-500" />} />
          <SummaryCard label="Total spent" value={formatCurrency(totals.actual)}
            sub="Across budgeted categories" icon={<TrendingDown size={18} className="text-rose-500" />} />
          <SummaryCard label="Remaining" value={formatCurrency(totals.variance)}
            sub={totals.variance < 0 ? 'Over budget' : 'Under budget'}
            valueClass={totals.variance < 0 ? 'text-rose-600' : 'text-emerald-600'}
            icon={totals.variance < 0
              ? <AlertTriangle size={18} className="text-rose-500" />
              : <CheckCircle2 size={18} className="text-emerald-500" />} />
          <SummaryCard label="Unbudgeted spend" value={formatCurrency(totals.unbudgetedActual)}
            sub="Categories not in this budget" icon={<TrendingUp size={18} className="text-amber-500" />} />
        </div>
      )}

      {activeTab === 'fund' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryCard label="Total planned (funds)" value={formatCurrency(fundTotals.planned)}
            sub={`${formatDate(budget.periodStart)} – ${formatDate(budget.periodEnd)}`}
            icon={<Layers size={18} className="text-violet-500" />} />
          <SummaryCard label="Total spent (funds)" value={formatCurrency(fundTotals.actual)}
            sub="Across budgeted funds" icon={<TrendingDown size={18} className="text-rose-500" />} />
          <SummaryCard label="Remaining (funds)" value={formatCurrency(fundTotals.variance)}
            sub={fundTotals.variance < 0 ? 'Over budget' : 'Under budget'}
            valueClass={fundTotals.variance < 0 ? 'text-rose-600' : 'text-emerald-600'}
            icon={fundTotals.variance < 0
              ? <AlertTriangle size={18} className="text-rose-500" />
              : <CheckCircle2 size={18} className="text-emerald-500" />} />
          <SummaryCard label="Untagged / unbudgeted" value={formatCurrency(fundTotals.unbudgetedFundActual)}
            sub="No fund or fund not in budget" icon={<TrendingUp size={18} className="text-amber-500" />} />
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SummaryCard label="Total target" value={formatCurrency(revenueTotals.target)}
            sub={`${formatDate(budget.periodStart)} – ${formatDate(budget.periodEnd)}`}
            icon={<ArrowUpCircle size={18} className="text-emerald-500" />} />
          <SummaryCard label="Total collected" value={formatCurrency(revenueTotals.actual)}
            sub="Across targeted income types" icon={<TrendingUp size={18} className="text-blue-500" />} />
          <SummaryCard label="Net variance" value={formatCurrency(Math.abs(revenueTotals.variance))}
            sub={revenueTotals.variance >= 0 ? 'Surplus — collected more' : 'Shortfall — collected less'}
            valueClass={revenueTotals.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}
            icon={revenueTotals.variance >= 0
              ? <CheckCircle2 size={18} className="text-emerald-500" />
              : <AlertTriangle size={18} className="text-rose-500" />} />
          <SummaryCard label="Untracked income" value={formatCurrency(revenueTotals.untrackedActual)}
            sub="Income types not in this budget" icon={<TrendingDown size={18} className="text-amber-500" />} />
        </div>
      )}

      {/* Alerts */}
      {activeTab === 'category' && overCategoryLines.length > 0 && (
        <OverBudgetBanner items={overCategoryLines.map((l) => l.category)}
          label="over budget" />
      )}
      {activeTab === 'fund' && overFundLines.length > 0 && (
        <OverBudgetBanner items={overFundLines.map((l) => l.contributionTypeName)}
          label="over budget" />
      )}
      {activeTab === 'revenue' && shortfallRevenueLines.length > 0 && (
        <OverBudgetBanner items={shortfallRevenueLines.map((l) => l.contributionTypeName)}
          label="below income target" color="rose" />
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {activeTab === 'category' ? 'Category breakdown'
                : activeTab === 'fund' ? 'Fund breakdown'
                : 'Revenue breakdown'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {budget.name || 'Untitled budget'} · {formatDate(budget.periodStart)} – {formatDate(budget.periodEnd)}
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 transition',
                  activeTab === id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                )}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'category' && (
          <SpendBreakdownTable
            rows={lines}
            nameKey="category"
            plannedKey="plannedAmount"
            emptyMessage="No budget lines defined. Edit this budget to add categories."
            totals={totals}
          />
        )}
        {activeTab === 'fund' && (
          <SpendBreakdownTable
            rows={fundLines || []}
            nameKey="contributionTypeName"
            plannedKey="plannedAmount"
            emptyMessage="No fund limits defined. Edit this budget to add fund spending limits."
            totals={fundTotals ? { planned: fundTotals.planned, actual: fundTotals.actual, variance: fundTotals.variance } : null}
          />
        )}
        {activeTab === 'revenue' && (
          <RevenueBreakdownTable
            rows={revenueLines || []}
            emptyMessage="No income targets defined. Edit this budget to add revenue targets."
            totals={revenueTotals}
          />
        )}
      </div>
    </div>
  );
};

// ─── Spend breakdown table (phases 1 & 2 — over = bad) ───────────────────────

const SpendBreakdownTable = ({ rows, nameKey, emptyMessage, totals }) => {
  if (rows.length === 0) return <p className="px-6 py-8 text-center text-sm text-slate-400">{emptyMessage}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {['Name', 'Planned', 'Actual', 'Variance', '% Used', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-600">
          {rows.map((line, i) => {
            const over = line.actualAmount > line.plannedAmount;
            const nearLimit = !over && line.percentUsed !== null && line.percentUsed >= 80;
            return (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-800">{line[nameKey]}</td>
                <td className="px-4 py-3">{formatCurrency(line.plannedAmount)}</td>
                <td className="px-4 py-3">{formatCurrency(line.actualAmount)}</td>
                <td className={clsx('px-4 py-3 font-semibold', over ? 'text-rose-600' : 'text-emerald-600')}>
                  {over ? '–' : '+'}{formatCurrency(Math.abs(line.variance))}
                </td>
                <td className="px-4 py-3">
                  {line.percentUsed !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className={clsx('h-full rounded-full transition-all',
                          over ? 'bg-rose-500' : nearLimit ? 'bg-amber-400' : 'bg-emerald-500')}
                          style={{ width: `${Math.min(line.percentUsed, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{line.percentUsed}%</span>
                    </div>
                  ) : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {over ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                      <AlertTriangle size={11} /> Over
                    </span>
                  ) : nearLimit ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Near limit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={11} /> On track
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          {totals && (
            <tr className="bg-slate-50 font-semibold text-slate-800">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3">{formatCurrency(totals.planned)}</td>
              <td className="px-4 py-3">{formatCurrency(totals.actual)}</td>
              <td className={clsx('px-4 py-3', totals.variance < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                {totals.variance < 0 ? '–' : '+'}{formatCurrency(Math.abs(totals.variance))}
              </td>
              <td className="px-4 py-3" colSpan={2} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ─── Revenue breakdown table (phase 3 — surplus = good, shortfall = bad) ──────

const RevenueBreakdownTable = ({ rows, emptyMessage, totals }) => {
  if (rows.length === 0) return <p className="px-6 py-8 text-center text-sm text-slate-400">{emptyMessage}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {['Income type', 'Target', 'Collected', 'Variance', '% Collected', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-600">
          {rows.map((line, i) => {
            // Revenue: surplus (actual > target) is GOOD
            const surplus = line.actualAmount >= line.targetAmount;
            const nearTarget = !surplus && line.percentCollected !== null && line.percentCollected >= 75;
            return (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-800">{line.contributionTypeName}</td>
                <td className="px-4 py-3">{formatCurrency(line.targetAmount)}</td>
                <td className="px-4 py-3">{formatCurrency(line.actualAmount)}</td>
                <td className={clsx('px-4 py-3 font-semibold', line.variance >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {line.variance >= 0 ? '+' : '–'}{formatCurrency(Math.abs(line.variance))}
                </td>
                <td className="px-4 py-3">
                  {line.percentCollected !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className={clsx('h-full rounded-full transition-all',
                          surplus ? 'bg-emerald-500' : nearTarget ? 'bg-amber-400' : 'bg-rose-400')}
                          style={{ width: `${Math.min(line.percentCollected, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{line.percentCollected}%</span>
                    </div>
                  ) : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {surplus ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={11} /> On target
                    </span>
                  ) : nearTarget ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Near target
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                      <AlertTriangle size={11} /> Shortfall
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          {totals && (
            <tr className="bg-slate-50 font-semibold text-slate-800">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3">{formatCurrency(totals.target)}</td>
              <td className="px-4 py-3">{formatCurrency(totals.actual)}</td>
              <td className={clsx('px-4 py-3', totals.variance >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                {totals.variance >= 0 ? '+' : '–'}{formatCurrency(Math.abs(totals.variance))}
              </td>
              <td className="px-4 py-3" colSpan={2} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const OverBudgetBanner = ({ items, label, color = 'amber' }) => (
  <div className={clsx(
    'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
    color === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-amber-200 bg-amber-50 text-amber-800'
  )}>
    <AlertTriangle size={16} className={clsx('mt-0.5 shrink-0', color === 'rose' ? 'text-rose-500' : 'text-amber-500')} />
    <span>
      {items.length} {items.length === 1 ? 'item is' : 'items are'} {label}:{' '}
      <strong>{items.join(', ')}</strong>
    </span>
  </div>
);

const SummaryCard = ({ label, value, sub, icon, valueClass = 'text-slate-900' }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      {icon}
    </div>
    <p className={clsx('mt-2 text-xl font-semibold', valueClass)}>{value}</p>
    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
  </div>
);

// ─── Budget Form Dialog ───────────────────────────────────────────────────────

const FORM_TABS = [
  { id: 'category', label: 'Category limits', icon: PiggyBank },
  { id: 'fund', label: 'Fund limits', icon: Layers },
  { id: 'revenue', label: 'Income targets', icon: ArrowUpCircle }
];

const BudgetFormDialog = ({
  isOpen, onClose, onSubmit, formState, setFormState, submitting, editing, contributionTypes
}) => {
  const [formTab, setFormTab] = useState('category');

  const addLine = (key, empty) =>
    setFormState((p) => ({ ...p, [key]: [...p[key], empty] }));

  const removeLine = (key, i) =>
    setFormState((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));

  const updateLine = (key, i, field, value) =>
    setFormState((p) => {
      const arr = [...p[key]];
      arr[i] = { ...arr[i], [field]: value };
      return { ...p, [key]: arr };
    });

  const selectedFundIds = new Set(formState.fundLines.map((l) => l.contributionTypeId).filter(Boolean));
  const selectedRevIds = new Set(formState.revenueLines.map((l) => l.contributionTypeId).filter(Boolean));

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editing ? 'Edit budget' : 'New budget'}
                  </Dialog.Title>
                  <button type="button" onClick={onClose}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Name & period */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Budget name <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input type="text" placeholder="e.g. March 2026 Operations"
                      value={formState.name}
                      onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Period start <span className="text-rose-500">*</span>
                      </label>
                      <input type="date" required value={formState.periodStart}
                        onChange={(e) => setFormState((p) => ({ ...p, periodStart: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Period end <span className="text-rose-500">*</span>
                      </label>
                      <input type="date" required value={formState.periodEnd}
                        onChange={(e) => setFormState((p) => ({ ...p, periodEnd: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>

                  {/* Section tabs */}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium w-full">
                    {FORM_TABS.map(({ id, label, icon: Icon }) => (
                      <button key={id} type="button" onClick={() => setFormTab(id)}
                        className={clsx(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 transition',
                          formTab === id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                        )}>
                        <Icon size={12} />{label}
                      </button>
                    ))}
                  </div>

                  {/* Category lines */}
                  {formTab === 'category' && (
                    <LinesSection
                      rows={formState.lines}
                      onAdd={() => addLine('lines', { category: '', plannedAmount: '' })}
                      onRemove={(i) => removeLine('lines', i)}
                      emptyNote='No lines yet — click "Add line" to define category budgets.'
                      addLabel="Add line"
                      addClass="bg-slate-100 text-slate-600 hover:bg-slate-200"
                      headers={['Category', 'Planned (GHS)']}
                      renderRow={(row, i) => (
                        <>
                          <input type="text" placeholder="e.g. Operations" value={row.category}
                            onChange={(e) => updateLine('lines', i, 'category', e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                          <input type="number" min="0" step="0.01" placeholder="0.00" value={row.plannedAmount}
                            onChange={(e) => updateLine('lines', i, 'plannedAmount', e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </>
                      )}
                    />
                  )}

                  {/* Fund lines */}
                  {formTab === 'fund' && (
                    <LinesSection
                      rows={formState.fundLines}
                      onAdd={() => addLine('fundLines', { contributionTypeId: '', plannedAmount: '' })}
                      onRemove={(i) => removeLine('fundLines', i)}
                      emptyNote='No fund limits yet — click "Add fund limit" to cap spending per fund.'
                      addLabel="Add fund limit"
                      addClass="bg-violet-50 text-violet-700 hover:bg-violet-100"
                      headers={['Fund (contribution type)', 'Planned (GHS)']}
                      renderRow={(row, i) => {
                        const available = contributionTypes.filter(
                          (ct) => !selectedFundIds.has((ct.id || ct._id?.toString())) ||
                            (ct.id || ct._id?.toString()) === row.contributionTypeId
                        );
                        return (
                          <>
                            <select value={row.contributionTypeId}
                              onChange={(e) => updateLine('fundLines', i, 'contributionTypeId', e.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-white">
                              <option value="">Select fund…</option>
                              {available.map((ct) => {
                                const id = ct.id || ct._id?.toString();
                                return <option key={id} value={id}>{ct.name}</option>;
                              })}
                            </select>
                            <input type="number" min="0" step="0.01" placeholder="0.00" value={row.plannedAmount}
                              onChange={(e) => updateLine('fundLines', i, 'plannedAmount', e.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
                          </>
                        );
                      }}
                    />
                  )}

                  {/* Revenue lines */}
                  {formTab === 'revenue' && (
                    <LinesSection
                      rows={formState.revenueLines}
                      onAdd={() => addLine('revenueLines', { contributionTypeId: '', targetAmount: '' })}
                      onRemove={(i) => removeLine('revenueLines', i)}
                      emptyNote='No income targets yet — click "Add target" to set collection goals.'
                      addLabel="Add target"
                      addClass="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      headers={['Income type', 'Target (GHS)']}
                      renderRow={(row, i) => {
                        const available = contributionTypes.filter(
                          (ct) => !selectedRevIds.has((ct.id || ct._id?.toString())) ||
                            (ct.id || ct._id?.toString()) === row.contributionTypeId
                        );
                        return (
                          <>
                            <select value={row.contributionTypeId}
                              onChange={(e) => updateLine('revenueLines', i, 'contributionTypeId', e.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white">
                              <option value="">Select income type…</option>
                              {available.map((ct) => {
                                const id = ct.id || ct._id?.toString();
                                return <option key={id} value={id}>{ct.name}</option>;
                              })}
                            </select>
                            <input type="number" min="0" step="0.01" placeholder="0.00" value={row.targetAmount}
                              onChange={(e) => updateLine('revenueLines', i, 'targetAmount', e.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                          </>
                        );
                      }}
                    />
                  )}

                  {contributionTypes.length === 0 && (formTab === 'fund' || formTab === 'revenue') && (
                    <p className="text-xs text-amber-600">
                      No contribution types found. Create some under Contributions first.
                    </p>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition">
                      {submitting && <Loader2 size={14} className="mr-2 animate-spin" />}
                      {editing ? 'Save changes' : 'Create budget'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Reusable section within the form for adding/removing rows
const LinesSection = ({ rows, onAdd, onRemove, emptyNote, addLabel, addClass, headers, renderRow }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-slate-700">{headers[0]}</span>
      <button type="button" onClick={onAdd}
        className={clsx('inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition', addClass)}>
        <Plus size={12} />{addLabel}
      </button>
    </div>
    {rows.length === 0 ? (
      <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
        {emptyNote}
      </p>
    ) : (
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_140px_32px] gap-2 px-1">
          {headers.map((h) => <span key={h} className="text-xs font-medium text-slate-500">{h}</span>)}
          <span />
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_140px_32px] items-center gap-2">
            {renderRow(row, i)}
            <button type="button" onClick={() => onRemove(i)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Delete Confirmation ──────────────────────────────────────────────────────

const DeleteDialog = ({ target, onClose, onConfirm }) => (
  <Transition appear show={Boolean(target)} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child as={Fragment}
        enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
        leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      </Transition.Child>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Transition.Child as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
          leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-base font-semibold text-slate-900 mb-2">Delete budget?</Dialog.Title>
            <p className="text-sm text-slate-500 mb-5">
              "{target?.name || 'Untitled'}" will be permanently removed along with all its lines and targets. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="button" onClick={onConfirm}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition">
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ onOpen }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16">
    <PiggyBank size={40} className="text-slate-300 mb-3" />
    <p className="text-sm font-medium text-slate-500">No budgets yet</p>
    <p className="text-xs text-slate-400 mb-4">
      Create your first budget to plan spending by category and fund, and set income collection targets.
    </p>
    <button type="button" onClick={onOpen}
      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
      <Plus size={15} className="mr-2" />
      Create budget
    </button>
  </div>
);
