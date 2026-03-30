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
  ChevronDown,
  Loader2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api.js';

const formatCurrency = (value) =>
  typeof value === 'number'
    ? `GHS ${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
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
  return { name: '', periodStart: start, periodEnd: end, lines: [] };
};

// ─── Budget Page ─────────────────────────────────────────────────────────────

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
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

  // Auto-select most recent budget when list loads
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
      periodStart: budget.periodStart
        ? new Date(budget.periodStart).toISOString().split('T')[0]
        : '',
      periodEnd: budget.periodEnd
        ? new Date(budget.periodEnd).toISOString().split('T')[0]
        : '',
      lines: (budget.lines || []).map((l) => ({
        category: l.category || '',
        plannedAmount: l.plannedAmount ?? ''
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
        .map((l) => ({ category: l.category.trim(), plannedAmount: Number(l.plannedAmount) }))
    };
    try {
      setSubmitting(true);
      if (editingBudget) {
        const id = editingBudget.id || editingBudget._id;
        await api.put(`/budgets/${id}`, payload);
        toast.success('Budget updated');
        if (selectedId === id) {
          // Refresh summary
          setSelectedId(null);
          setTimeout(() => setSelectedId(id), 0);
        }
      } else {
        const res = await api.post('/budgets', payload);
        const newId = res.data.budget?.id || res.data.budget?._id;
        toast.success('Budget created');
        await fetchBudgets();
        if (newId) setSelectedId(newId);
      }
      setFormOpen(false);
      if (editingBudget) fetchBudgets();
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

  const selectedBudget = budgets.find((b) => (b.id || b._id) === selectedId);

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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Budget</h1>
          <p className="text-sm text-slate-500">
            Plan spending by category and track actual expenditure against your targets.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          New budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState onOpen={openCreate} />
      ) : (
        <>
          {/* Budget selector */}
          <BudgetSelector
            budgets={budgets}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />

          {/* Summary */}
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

      {/* Create / Edit dialog */}
      <BudgetFormDialog
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        formState={formState}
        setFormState={setFormState}
        submitting={submitting}
        editing={Boolean(editingBudget)}
      />

      {/* Delete confirmation */}
      <DeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
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
            {['Name', 'Period', 'Lines', 'Actions'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-600">
          {budgets.map((b) => {
            const id = b.id || b._id;
            const isActive = id === selectedId;
            return (
              <tr
                key={id}
                onClick={() => onSelect(id)}
                className={clsx(
                  'cursor-pointer transition',
                  isActive ? 'bg-blue-50' : 'hover:bg-slate-50'
                )}
              >
                <td className="px-4 py-3 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <PiggyBank size={15} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                    {b.name || <span className="italic text-slate-400">Untitled</span>}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(b.periodStart)} – {formatDate(b.periodEnd)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {(b.lines || []).length} {(b.lines || []).length === 1 ? 'category' : 'categories'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onEdit(b)}
                      className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Edit budget"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(b)}
                      className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete budget"
                    >
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

const SummaryPanel = ({ summary }) => {
  const { budget, lines, totals } = summary;

  const overBudgetLines = lines.filter((l) => l.actualAmount > l.plannedAmount);

  return (
    <div className="space-y-4">
      {/* Totals cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard
          label="Total planned"
          value={formatCurrency(totals.planned)}
          sub={`${formatDate(budget.periodStart)} – ${formatDate(budget.periodEnd)}`}
          icon={<PiggyBank size={18} className="text-blue-500" />}
        />
        <SummaryCard
          label="Total spent"
          value={formatCurrency(totals.actual)}
          sub="Across budgeted categories"
          icon={<TrendingDown size={18} className="text-rose-500" />}
        />
        <SummaryCard
          label="Remaining"
          value={formatCurrency(totals.variance)}
          sub={totals.variance < 0 ? 'Over budget' : 'Under budget'}
          valueClass={totals.variance < 0 ? 'text-rose-600' : 'text-emerald-600'}
          icon={totals.variance < 0
            ? <AlertTriangle size={18} className="text-rose-500" />
            : <CheckCircle2 size={18} className="text-emerald-500" />}
        />
        <SummaryCard
          label="Unbudgeted spend"
          value={formatCurrency(totals.unbudgetedActual)}
          sub="Categories not on this budget"
          icon={<TrendingUp size={18} className="text-amber-500" />}
        />
      </div>

      {overBudgetLines.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <span>
            {overBudgetLines.length} {overBudgetLines.length === 1 ? 'category is' : 'categories are'} over budget:{' '}
            <strong>{overBudgetLines.map((l) => l.category).join(', ')}</strong>
          </span>
        </div>
      )}

      {/* Per-category breakdown */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-900">Category breakdown</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {budget.name || 'Untitled budget'} · {formatDate(budget.periodStart)} – {formatDate(budget.periodEnd)}
          </p>
        </div>

        {lines.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            No budget lines defined. Edit this budget to add categories.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Category', 'Planned', 'Actual', 'Variance', '% Used', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                {lines.map((line) => {
                  const over = line.actualAmount > line.plannedAmount;
                  const nearLimit = !over && line.percentUsed !== null && line.percentUsed >= 80;
                  return (
                    <tr key={line.category} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-800">{line.category}</td>
                      <td className="px-4 py-3">{formatCurrency(line.plannedAmount)}</td>
                      <td className="px-4 py-3">{formatCurrency(line.actualAmount)}</td>
                      <td className={clsx('px-4 py-3 font-semibold', over ? 'text-rose-600' : 'text-emerald-600')}>
                        {over ? '–' : '+'}{formatCurrency(Math.abs(line.variance))}
                      </td>
                      <td className="px-4 py-3">
                        {line.percentUsed !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={clsx(
                                  'h-full rounded-full transition-all',
                                  over ? 'bg-rose-500' : nearLimit ? 'bg-amber-400' : 'bg-emerald-500'
                                )}
                                style={{ width: `${Math.min(line.percentUsed, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{line.percentUsed}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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

                {/* Totals row */}
                <tr className="bg-slate-50 font-semibold text-slate-800">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3">{formatCurrency(totals.planned)}</td>
                  <td className="px-4 py-3">{formatCurrency(totals.actual)}</td>
                  <td className={clsx('px-4 py-3', totals.variance < 0 ? 'text-rose-600' : 'text-emerald-600')}>
                    {totals.variance < 0 ? '–' : '+'}{formatCurrency(Math.abs(totals.variance))}
                  </td>
                  <td className="px-4 py-3" colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

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

const BudgetFormDialog = ({ isOpen, onClose, onSubmit, formState, setFormState, submitting, editing }) => {
  const addLine = () =>
    setFormState((prev) => ({ ...prev, lines: [...prev.lines, { category: '', plannedAmount: '' }] }));

  const removeLine = (i) =>
    setFormState((prev) => ({ ...prev, lines: prev.lines.filter((_, idx) => idx !== i) }));

  const updateLine = (i, field, value) =>
    setFormState((prev) => {
      const lines = [...prev.lines];
      lines[i] = { ...lines[i], [field]: value };
      return { ...prev, lines };
    });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editing ? 'Edit budget' : 'New budget'}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Budget name <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. March 2026 Operations"
                      value={formState.name}
                      onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Period start <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formState.periodStart}
                        onChange={(e) => setFormState((prev) => ({ ...prev, periodStart: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Period end <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formState.periodEnd}
                        onChange={(e) => setFormState((prev) => ({ ...prev, periodEnd: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">Budget lines</label>
                      <button
                        type="button"
                        onClick={addLine}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
                      >
                        <Plus size={12} />
                        Add line
                      </button>
                    </div>

                    {formState.lines.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                        No lines yet — click "Add line" to define category budgets.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-[1fr_140px_32px] gap-2 px-1">
                          <span className="text-xs font-medium text-slate-500">Category</span>
                          <span className="text-xs font-medium text-slate-500">Planned (GHS)</span>
                          <span />
                        </div>
                        {formState.lines.map((line, i) => (
                          <div key={i} className="grid grid-cols-[1fr_140px_32px] items-center gap-2">
                            <input
                              type="text"
                              placeholder="e.g. Operations"
                              value={line.category}
                              onChange={(e) => updateLine(i, 'category', e.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={line.plannedAmount}
                              onChange={(e) => updateLine(i, 'plannedAmount', e.target.value)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeLine(i)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition"
                    >
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

// ─── Delete Confirmation ──────────────────────────────────────────────────────

const DeleteDialog = ({ target, onClose, onConfirm }) => (
  <Transition appear show={Boolean(target)} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      </Transition.Child>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-base font-semibold text-slate-900 mb-2">
              Delete budget?
            </Dialog.Title>
            <p className="text-sm text-slate-500 mb-5">
              "{target?.name || 'Untitled'}" will be permanently removed. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition"
              >
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
    <p className="text-xs text-slate-400 mb-4">Create your first budget to start tracking planned vs actual spend.</p>
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
    >
      <Plus size={15} className="mr-2" />
      Create budget
    </button>
  </div>
);
