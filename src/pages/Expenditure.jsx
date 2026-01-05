import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import clsx from 'clsx';
import {
  CalendarDays,
  Coins,
  Edit,
  Filter,
  Loader2,
  Plus,
  Trash2,
  Wallet,
  X
} from 'lucide-react';
import api from '../services/api.js';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

const formatCurrency = (value) =>
  typeof value === 'number'
    ? `GHS ${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    : 'GHS 0.00';

const defaultFormState = () => ({
  title: '',
  amount: '',
  description: '',
  category: '',
  date: new Date().toISOString().split('T')[0]
});

const Expenditure = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpenditure, setEditingExpenditure] = useState(null);
  const [formState, setFormState] = useState(defaultFormState);
  const [submitting, setSubmitting] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenditureToDelete, setExpenditureToDelete] = useState(null);

  useEffect(() => {
    fetchExpenditures();
  }, []);

  const fetchExpenditures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenditure');
      setExpenditures(
        response.data.map((item) => ({
          ...item,
          amount: Number(item.amount || 0)
        }))
      );
    } catch (error) {
      toast.error('Failed to load expenditures');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenditures = useMemo(() => {
    return expenditures.filter((item) => {
      const date = new Date(item.date);
      if (filters.startDate && date < new Date(filters.startDate)) return false;
      if (filters.endDate && date > new Date(filters.endDate)) return false;
      if (filters.minAmount && item.amount < Number(filters.minAmount)) return false;
      if (filters.maxAmount && item.amount > Number(filters.maxAmount)) return false;
      return true;
    });
  }, [expenditures, filters]);

  useEffect(() => {
    setPageIndex(0);
  }, [filteredExpenditures.length]);

  const paginatedExpenditures = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredExpenditures.slice(start, start + pageSize);
  }, [filteredExpenditures, pageIndex, pageSize]);

  const pageCount = Math.max(1, Math.ceil((filteredExpenditures.length || 1) / pageSize));

  const resetForm = () => {
    setFormState(defaultFormState());
    setEditingExpenditure(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingExpenditure) {
        await api.put(`/expenditure/${editingExpenditure._id}`, formState);
        toast.success('Expenditure updated successfully');
      } else {
        await api.post('/expenditure', formState);
        toast.success('Expenditure added successfully');
      }
      setFormOpen(false);
      resetForm();
      fetchExpenditures();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expenditure) => {
    setEditingExpenditure(expenditure);
    setFormState({
      title: expenditure.title,
      amount: expenditure.amount,
      description: expenditure.description || '',
      category: expenditure.category || '',
      date: expenditure.date ? new Date(expenditure.date).toISOString().split('T')[0] : ''
    });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    setExpenditureToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenditureToDelete) return;
    try {
      await api.delete(`/expenditure/${expenditureToDelete}`);
      toast.success('Expenditure deleted successfully');
      fetchExpenditures();
      setDeleteConfirmOpen(false);
      setExpenditureToDelete(null);
    } catch (error) {
      toast.error('Failed to delete expenditure');
    }
  };

  const totalSpent = useMemo(() => {
    return filteredExpenditures.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenditures]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        Loading expenditure records…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Expenditure</h1>
          <p className="text-sm text-slate-500">
            Track spending, capture new expenses, and keep your financial overview fresh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add expenditure
          </button>
        </div>
      </div>

      <SummaryCards totalSpent={totalSpent} count={filteredExpenditures.length} />

      <ExpenditureTable
        data={paginatedExpenditures}
        totalCount={filteredExpenditures.length}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenFilters={() => setFilterOpen(true)}
      />

      <ExpenditureFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        formState={formState}
        setFormState={setFormState}
        editing={Boolean(editingExpenditure)}
      />

      <FilterDialog
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        onReset={() =>
          setFilters({
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: ''
          })
        }
      />
    </div>
  );
};

export default Expenditure;

const SummaryCards = ({ totalSpent, count }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">Total spent</span>
        <Wallet size={20} className="text-blue-500" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalSpent)}</p>
      <p className="text-xs text-slate-400">Across filtered records</p>
    </div>
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">Expense entries</span>
        <Coins size={20} className="text-purple-500" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{count}</p>
      <p className="text-xs text-slate-400">Matching current filters</p>
    </div>
  </div>
);

const ExpenditureTable = ({
  data,
  totalCount,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onOpenFilters
}) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent expenditure</h2>
        <p className="text-sm text-slate-500">
          A detailed log of all recorded organizational spending.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <Filter size={14} className="mr-1.5" />
          Filters
        </button>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
          {totalCount} records
        </span>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {['Title', 'Amount', 'Date', 'Category', 'Description', 'Actions'].map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                No expenditures match the selected filters.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-800">{item.title}</td>
                <td className="px-4 py-3 font-semibold text-rose-600">{formatCurrency(item.amount)}</td>
                <td className="px-4 py-3">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                      item.category ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 italic'
                    )}
                  >
                    {item.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {item.description ? item.description : <span className="italic">No notes</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item._id)}
                      className="inline-flex items-center rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </button>
                  </div>
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

const ExpenditureFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formState,
  setFormState,
  submitting,
  editing
}) => (
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
            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editing ? 'Edit expenditure' : 'Log new expenditure'}
                  </Dialog.Title>
                  <p className="text-sm text-slate-500">
                    Capture a detailed record to keep spending transparent.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={onSubmit} className="space-y-6 px-6 py-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Title *</label>
                    <input
                      type="text"
                      required
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. Venue rental"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formState.amount}
                      onChange={(e) => setFormState({ ...formState, amount: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. 150"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Date</label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={formState.date}
                        onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <input
                      type="text"
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. Facilities"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Add any relevant notes or breakdown"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-400">
                    Ensure the amount reflects the currency shown on your financial statements.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Saving…
                        </>
                      ) : editing ? (
                        'Save changes'
                      ) : (
                        'Create entry'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

const FilterDialog = ({ isOpen, onClose, filters, setFilters, onReset }) => (
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
            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Filter expenditure
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Start date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">End date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Min amount</label>
                    <div className="relative">
                      <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={filters.minAmount}
                        onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Max amount</label>
                    <div className="relative">
                      <Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={filters.maxAmount}
                        onChange={(e) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={onReset}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Reset filters
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Done
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

