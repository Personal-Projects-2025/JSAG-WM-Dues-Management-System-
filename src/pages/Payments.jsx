import React, { useState, useEffect, useMemo } from 'react';
import { Combobox, Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import clsx from 'clsx';
import {
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  Filter,
  Loader2,
  Mail,
  Receipt,
  Search,
  Send,
  User,
  Wallet,
  X
} from 'lucide-react';
import api from '../services/api.js';

const formatCurrency = (value) =>
  typeof value === 'number'
    ? `GHS ${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    : 'GHS 0.00';

const defaultFormState = () => ({
  memberId: '',
  amount: '',
  date: new Date().toISOString().split('T')[0]
});

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [formState, setFormState] = useState(defaultFormState);

  const [filters, setFilters] = useState({
    memberId: '',
    startDate: '',
    endDate: '',
    recordedBy: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [resendingReceiptId, setResendingReceiptId] = useState(null);
  const [tablePage, setTablePage] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(10);

  useEffect(() => {
    fetchMembers();
    fetchPayments();
    fetchReceipts();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to load members');
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.memberId) params.append('memberId', filters.memberId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.recordedBy) params.append('recordedBy', filters.recordedBy);

      const response = await api.get(`/payments?${params.toString()}`);
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTablePage(0);
  }, [payments.length]);

  const paginatedPayments = useMemo(() => {
    const start = tablePage * tablePageSize;
    return payments.slice(start, start + tablePageSize);
  }, [payments, tablePage, tablePageSize]);

  const pageCount = Math.max(1, Math.ceil((payments.length || 1) / tablePageSize));

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/receipts');
      setReceipts(response.data);
    } catch (error) {
      console.error('Failed to load receipts:', error);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!memberQuery) return members;
    const query = memberQuery.toLowerCase();
    return members.filter((member) => {
      return (
        member.name.toLowerCase().includes(query) ||
        member.memberId?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
      );
    });
  }, [memberQuery, members]);

  const computedMonthsCovered = useMemo(() => {
    if (!selectedMember || !formState.amount) return 0;
    const dues = Number(selectedMember.duesPerMonth || 0);
    if (!dues) return 0;
    return (Number(formState.amount) / dues).toFixed(2);
  }, [selectedMember, formState.amount]);

  const outstandingBalance = useMemo(() => {
    if (!selectedMember) return 0;
    const arrears = Number(selectedMember.arrears || 0);
    const dues = Number(selectedMember.duesPerMonth || 0);
    return arrears * dues;
  }, [selectedMember]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      toast.warn('Please select a member first.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formState,
        memberId: selectedMember._id
      };
      const response = await api.post('/payments', payload);
      toast.success('Payment recorded successfully');

      if (response.data.receipt) {
        setLatestReceipt({
          ...response.data.receipt,
          email: response.data.email || null
        });
        setReceiptModal(true);
      }

      if (response.data.email) {
        if (response.data.email.status === 'sent') {
          toast.success(`Receipt emailed to ${response.data.email.to || 'member email'}`);
        } else if (response.data.email.status === 'failed') {
          toast.error('Receipt email could not be sent. You can resend it manually.');
        } else if (response.data.email.status === 'missing') {
          toast.warn('Member has no email on file. Receipt email was skipped.');
        }
      }

      setFormState(defaultFormState());
      setSelectedMember(null);
      setMemberQuery('');
      fetchPayments();
      fetchMembers();
      fetchReceipts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (receiptId) => {
    try {
      const response = await api.get(`/receipts/pdf/${receiptId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${receiptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Receipt downloaded successfully');
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const handleResendReceipt = async (receiptId) => {
    try {
      setResendingReceiptId(receiptId);
      await api.post(`/receipts/${receiptId}/resend`);
      toast.success('Receipt email sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send receipt email');
    } finally {
      setResendingReceiptId(null);
    }
  };

  const getReceiptForPayment = (paymentId) => {
    return receipts.find((receipt) => receipt.paymentId?.toString() === paymentId?.toString());
  };

  const resetFilters = () => {
    setFilters({
      memberId: '',
      startDate: '',
      endDate: '',
      recordedBy: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Record Payments</h1>
          <p className="text-sm text-slate-500">
            Quickly capture member dues, review payment history, and manage receipts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="col-span-1 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">New payment</h2>
              <p className="text-sm text-slate-500">
                Select a member, enter the amount received, and confirm the payment.
              </p>
            </div>
            <CreditCard size={20} className="text-blue-500" />
          </header>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Member *</label>
            <Combobox value={selectedMember} onChange={setSelectedMember}>
              <div className="relative">
                <Combobox.Input
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  displayValue={(member) => member?.name || ''}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Search by name, ID, or email…"
                  required
                />
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Transition
                  as={React.Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  afterLeave={() => setMemberQuery('')}
                >
                  <Combobox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
                    {filteredMembers.length === 0 ? (
                      <div className="px-3 py-2 text-slate-500">No members found…</div>
                    ) : (
                      filteredMembers.map((member) => (
                        <Combobox.Option
                          key={member._id}
                          value={member}
                          className={({ active }) =>
                            clsx(
                              'cursor-pointer select-none px-3 py-2',
                              active ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                            )
                          }
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-xs text-slate-500">
                              {member.memberId ? `${member.memberId} • ` : ''}
                              {member.email || 'No email'}
                            </span>
                          </div>
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </Transition>
              </div>
            </Combobox>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Amount received *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formState.amount}
                onChange={(e) => setFormState({ ...formState, amount: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Payment date</label>
              <input
                type="date"
                value={formState.date}
                onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">Payment summary</p>
            {selectedMember ? (
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  <span>
                    Member: <strong>{selectedMember.name}</strong>
                    {selectedMember.subgroupId?.name
                      ? ` • ${selectedMember.subgroupId.name}`
                      : ''}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Wallet size={16} className="text-emerald-500" />
                  <span>
                    Dues rate:{' '}
                    <strong>{formatCurrency(Number(selectedMember.duesPerMonth || 0))}</strong>
                    /month
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-amber-500" />
                  <span>
                    Months covered (auto): <strong>{computedMonthsCovered}</strong>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText size={16} className="text-rose-500" />
                  <span>
                    Outstanding balance:{' '}
                    <strong>{formatCurrency(outstandingBalance)}</strong>
                  </span>
                </li>
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Select a member to see their dues rate and outstanding balance.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">
              Receipts are automatically generated and emailed when possible.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setMemberQuery('');
                  setFormState(defaultFormState());
                }}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedMember || !formState.amount}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Record payment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="col-span-1 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Member snapshot</h2>
              <p className="text-sm text-slate-500">
                Key details of the member you are recording a payment for.
              </p>
            </div>
            <User size={20} className="text-blue-500" />
          </header>
          {selectedMember ? (
            <div className="space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                <p className="font-medium text-slate-700">{selectedMember.email || 'Not provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Last payment</p>
                  <p className="font-medium text-slate-700">
                    {selectedMember.lastPaymentDate
                      ? new Date(selectedMember.lastPaymentDate).toLocaleDateString()
                      : 'Not recorded'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Arrears</p>
                  <p className="font-medium text-rose-600">{selectedMember.arrears || 0} months</p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total paid</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(Number(selectedMember.totalPaid || 0))}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Use the search box to select a member and preview their dues status here.
            </div>
          )}
        </div>

        <AnalyticsPanel payments={payments} />
      </div>

      <PaymentHistoryTable
        loading={loading}
        payments={paginatedPayments}
        totalCount={payments.length}
        members={members}
        getReceiptForPayment={getReceiptForPayment}
        resendingReceiptId={resendingReceiptId}
        onDownloadReceipt={handleDownloadReceipt}
        onResendReceipt={handleResendReceipt}
        pageIndex={tablePage}
        pageSize={tablePageSize}
        pageCount={pageCount}
        onPageChange={setTablePage}
        onPageSizeChange={(size) => {
          setTablePageSize(size);
          setTablePage(0);
        }}
        onOpenFilters={() => setFilterOpen(true)}
      />

      <FilterDialog
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        members={members}
      />

      {receiptModal && latestReceipt && (
        <ReceiptModal
          receipt={latestReceipt}
          onClose={() => {
            setReceiptModal(false);
            setLatestReceipt(null);
          }}
          onDownload={handleDownloadReceipt}
        />
      )}
    </div>
  );
};

export default Payments;

const AnalyticsPanel = ({ payments }) => {
  const analytics = useMemo(() => {
    if (!payments || payments.length === 0) {
      return {
        totalCollected: 0,
        monthCollected: 0,
        paymentsCount: 0,
        todayCount: 0
      };
    }
    const totalCollected = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const now = new Date();
    let monthCollected = 0;
    let todayCount = 0;

    payments.forEach((payment) => {
      const paymentDate = new Date(payment.date);
      if (
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear()
      ) {
        monthCollected += Number(payment.amount || 0);
      }
      const isSameDay =
        paymentDate.getDate() === now.getDate() &&
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear();
      if (isSameDay) {
        todayCount += 1;
      }
    });

    return {
      totalCollected,
      monthCollected,
      paymentsCount: payments.length,
      todayCount
    };
  }, [payments]);

  return (
    <div className="col-span-1 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Payment insights</h2>
          <p className="text-sm text-slate-500">
            Aggregated metrics to help you monitor dues performance.
          </p>
        </div>
        <Receipt size={20} className="text-purple-500" />
      </header>
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
            Total collected
          </p>
          <p className="mt-1 text-xl font-semibold text-blue-700">
            {formatCurrency(analytics.totalCollected)}
          </p>
          <p className="text-xs text-blue-500/80">Across all recorded payments</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">
            This month
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">
            {formatCurrency(analytics.monthCollected)}
          </p>
          <p className="text-xs text-emerald-500/80">Collected this month to date</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-400">Payments logged</p>
            <p className="mt-1 text-lg font-semibold text-slate-700">
              {analytics.paymentsCount}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-400">Today</p>
            <p className="mt-1 text-lg font-semibold text-slate-700">{analytics.todayCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentHistoryTable = ({
  loading,
  payments,
  members,
  totalCount,
  getReceiptForPayment,
  resendingReceiptId,
  onDownloadReceipt,
  onResendReceipt,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
  onOpenFilters
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent payments</h2>
          <p className="text-sm text-slate-500">
            A chronological log of every payment captured in the system.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Filter size={14} className="mr-1.5" />
            Advanced filters
          </button>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
            {totalCount} records
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Member', 'Amount', 'Months', 'Date', 'Recorded by', 'Receipt'].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Loading payments…
                </td>
              </tr>
            ) : totalCount === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No payments match the selected filters.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const receipt = getReceiptForPayment(payment._id);
                const memberInfo = members.find((member) => member._id === payment.memberId);
                const memberEmail = memberInfo?.email;
                return (
                  <tr key={payment._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">{payment.memberName}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3">{payment.monthsCovered}</td>
                    <td className="px-4 py-3">
                      {new Date(payment.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{payment.recordedBy}</td>
                    <td className="px-4 py-3">
                      {receipt ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onDownloadReceipt(receipt.receiptId)}
                            className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                          >
                            <Download size={14} className="mr-1.5" />
                            PDF
                          </button>
                          <button
                            onClick={() => onResendReceipt(receipt.receiptId)}
                            disabled={!memberEmail || resendingReceiptId === receipt.receiptId}
                            className="inline-flex items-center rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Mail size={14} className="mr-1.5" />
                            {resendingReceiptId === receipt.receiptId ? 'Sending…' : 'Email'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })
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
};

const FilterDialog = ({ isOpen, onClose, filters, setFilters, resetFilters, members }) => (
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
        <div className="flex min-h-full items-center justify-center p-4">
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
                  Filter payments
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
                  <label className="font-medium text-slate-700">Member</label>
                  <select
                    value={filters.memberId}
                    onChange={(e) => setFilters((prev) => ({ ...prev, memberId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">All members</option>
                    {members.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Start date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">End date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Recorded by</label>
                  <input
                    value={filters.recordedBy}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, recordedBy: e.target.value }))
                    }
                    placeholder="Username"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Reset filters
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

const ReceiptModal = ({ receipt, onClose, onDownload }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition">
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Receipt size={18} className="text-blue-500" />
            Receipt generated
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm text-slate-600">
          <p>The payment has been recorded successfully. A PDF receipt is ready for download.</p>
          {receipt.email?.status === 'sent' && (
            <p className="flex items-center gap-2 text-emerald-600">
              <Mail size={16} />
              Receipt emailed to {receipt.email.to || 'member email'}.
            </p>
          )}
          {receipt.email?.status === 'failed' && (
            <p className="flex items-center gap-2 text-rose-600">
              <Mail size={16} />
              Automatic email delivery failed. Try sending it manually.
            </p>
          )}
          {receipt.email?.status === 'missing' && (
            <p className="flex items-center gap-2 text-amber-600">
              <Mail size={16} />
              Member has no email on file. No email was sent.
            </p>
          )}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p>
              <strong>ID:</strong> {receipt.receiptId}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => {
              onDownload(receipt.receiptId);
              onClose();
            }}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Download size={16} className="mr-2" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  </div>
);


