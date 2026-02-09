import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Settings2,
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
  contributionTypeId: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  remarks: ''
});

const Payments = () => {
  const [contributions, setContributions] = useState([]);
  const [contributionTypes, setContributionTypes] = useState([]);
  const [members, setMembers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [formState, setFormState] = useState(defaultFormState);

  const [filters, setFilters] = useState({
    contributionTypeId: '',
    memberId: '',
    startDate: '',
    endDate: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [resendingReceiptId, setResendingReceiptId] = useState(null);
  const [tablePage, setTablePage] = useState(0);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [typesModalOpen, setTypesModalOpen] = useState(false);

  const selectedType = useMemo(
    () => contributionTypes.find((t) => t._id === formState.contributionTypeId),
    [contributionTypes, formState.contributionTypeId]
  );
  const isDuesType = selectedType?.name?.toLowerCase() === 'dues';

  const fetchContributionTypes = useCallback(async () => {
    try {
      const response = await api.get('/contribution-types');
      setContributionTypes(response.data);
    } catch (error) {
      toast.error('Failed to load contribution types');
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await api.get('/members');
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to load members');
    }
  }, []);

  const fetchContributions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.contributionTypeId) params.append('contributionTypeId', filters.contributionTypeId);
      if (filters.memberId) params.append('memberId', filters.memberId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const response = await api.get(`/contributions?${params.toString()}`);
      setContributions(response.data);
    } catch (error) {
      toast.error('Failed to load contributions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchReceipts = useCallback(async () => {
    try {
      const response = await api.get('/receipts');
      setReceipts(response.data);
    } catch (error) {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchContributionTypes();
    fetchMembers();
    fetchContributions();
    fetchReceipts();
  }, [fetchContributionTypes, fetchMembers, fetchContributions, fetchReceipts]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const paginatedContributions = useMemo(() => {
    const start = tablePage * tablePageSize;
    return contributions.slice(start, start + tablePageSize);
  }, [contributions, tablePage, tablePageSize]);

  const pageCount = Math.max(1, Math.ceil((contributions.length || 1) / tablePageSize));

  const filteredMembers = useMemo(() => {
    if (!memberQuery) return members;
    const q = memberQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.memberId?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
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
    if (!formState.contributionTypeId || !formState.amount) {
      toast.warn('Please select a contribution type and enter an amount.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        contributionTypeId: formState.contributionTypeId,
        amount: formState.amount,
        date: formState.date || undefined,
        remarks: formState.remarks || undefined,
        memberId: isDuesType && selectedMember ? selectedMember._id : undefined
      };
      const response = await api.post('/contributions', payload);
      toast.success('Contribution recorded successfully');

      if (response.data.receipt) {
        setLatestReceipt({
          ...response.data.receipt,
          email: response.data.email || null
        });
        setReceiptModal(true);
      }
      if (response.data.email) {
        if (response.data.email.status === 'sent') toast.success(`Receipt emailed to ${response.data.email.to || 'member email'}`);
        else if (response.data.email.status === 'failed') toast.error('Receipt email could not be sent.');
        else if (response.data.email.status === 'missing') toast.warn('Receipt generated but no email available to send to (member or recorder).');
      }

      setFormState(defaultFormState());
      setSelectedMember(null);
      setMemberQuery('');
      fetchContributions();
      fetchMembers();
      fetchReceipts();
      fetchContributionTypes();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (receiptId) => {
    try {
      const response = await api.get(`/receipts/pdf/${receiptId}`, { responseType: 'blob' });
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

  const resetFilters = () => {
    setFilters({ contributionTypeId: '', memberId: '', startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Record Payments</h1>
          <p className="text-sm text-slate-500">
            Record contributions by type—dues, donations, offerings, and more.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTypesModalOpen(true)}
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Settings2 size={16} className="mr-2" />
            Manage types
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="col-span-1 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">New contribution</h2>
              <p className="text-sm text-slate-500">
                Select the type, amount, and optionally link to a member for dues.
              </p>
            </div>
            <CreditCard size={20} className="text-blue-500" />
          </header>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Contribution type *</label>
            <select
              required
              value={formState.contributionTypeId}
              onChange={(e) => {
                setFormState({ ...formState, contributionTypeId: e.target.value });
                if (!e.target.value || contributionTypes.find((t) => t._id === e.target.value)?.name?.toLowerCase() !== 'dues') {
                  setSelectedMember(null);
                  setMemberQuery('');
                }
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select type…</option>
              {contributionTypes.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {isDuesType && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Member (optional)</label>
              <Combobox value={selectedMember} onChange={setSelectedMember}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    displayValue={(m) => m?.name || ''}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Search by name, ID, or email…"
                  />
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Transition
                    as={React.Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setMemberQuery('')}
                  >
                    <Combobox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                      {filteredMembers.length === 0 ? (
                        <div className="px-3 py-2 text-slate-500">No members found…</div>
                      ) : (
                        filteredMembers.map((m) => (
                          <Combobox.Option
                            key={m._id}
                            value={m}
                            className={({ active }) => clsx('cursor-pointer select-none px-3 py-2', active ? 'bg-blue-50 text-blue-600' : 'text-slate-700')}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{m.name}</span>
                              <span className="text-xs text-slate-500">{m.memberId ? `${m.memberId} • ` : ''}{m.email || 'No email'}</span>
                            </div>
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Amount *</label>
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
              <label className="text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                value={formState.date}
                onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Remarks</label>
            <input
              type="text"
              value={formState.remarks}
              onChange={(e) => setFormState({ ...formState, remarks: e.target.value })}
              placeholder="Optional notes"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {isDuesType && selectedMember && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Dues summary</p>
              <ul className="mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  <span>Member: <strong>{selectedMember.name}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Wallet size={16} className="text-emerald-500" />
                  <span>Dues rate: <strong>{formatCurrency(Number(selectedMember.duesPerMonth || 0))}</strong>/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-amber-500" />
                  <span>Months covered (auto): <strong>{computedMonthsCovered}</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText size={16} className="text-rose-500" />
                  <span>Outstanding: <strong>{formatCurrency(outstandingBalance)}</strong></span>
                </li>
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">Receipts are generated for dues payments when a member is selected.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormState(defaultFormState());
                  setSelectedMember(null);
                  setMemberQuery('');
                }}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={submitting || !formState.contributionTypeId || !formState.amount}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" />Saving…</>
                ) : (
                  <><Send size={16} className="mr-2" />Record contribution</>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="col-span-1 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Member snapshot</h2>
              <p className="text-sm text-slate-500">Shown when recording dues for a member.</p>
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
                    {selectedMember.lastPaymentDate ? new Date(selectedMember.lastPaymentDate).toLocaleDateString() : 'Not recorded'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Arrears</p>
                  <p className="font-medium text-rose-600">{selectedMember.arrears || 0} months</p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total paid</p>
                <p className="text-lg font-semibold text-emerald-600">{formatCurrency(Number(selectedMember.totalPaid || 0))}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              {isDuesType ? 'Select a member above to see their dues status.' : 'Select Dues as the contribution type and optionally link a member.'}
            </div>
          )}
        </div>

        <AnalyticsPanel contributions={contributions} />
      </div>

      <ContributionHistoryTable
        loading={loading}
        contributions={paginatedContributions}
        totalCount={contributions.length}
        receipts={receipts}
        members={members}
        resendingReceiptId={resendingReceiptId}
        onDownloadReceipt={handleDownloadReceipt}
        onResendReceipt={handleResendReceipt}
        pageIndex={tablePage}
        pageSize={tablePageSize}
        pageCount={pageCount}
        onPageChange={setTablePage}
        onPageSizeChange={(size) => { setTablePageSize(size); setTablePage(0); }}
        onOpenFilters={() => setFilterOpen(true)}
      />

      <ContributionFilterDialog
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        members={members}
        contributionTypes={contributionTypes}
      />

      {receiptModal && latestReceipt && (
        <ReceiptModal
          receipt={latestReceipt}
          onClose={() => { setReceiptModal(false); setLatestReceipt(null); }}
          onDownload={handleDownloadReceipt}
        />
      )}

      <ContributionTypesModal
        isOpen={typesModalOpen}
        onClose={() => setTypesModalOpen(false)}
        contributionTypes={contributionTypes}
        onRefresh={fetchContributionTypes}
      />
    </div>
  );
};

export default Payments;

const AnalyticsPanel = ({ contributions }) => {
  const analytics = useMemo(() => {
    if (!contributions || contributions.length === 0) {
      return { totalCollected: 0, monthCollected: 0, count: 0, todayCount: 0 };
    }
    const totalCollected = contributions.reduce((s, c) => s + Number(c.amount || 0), 0);
    const now = new Date();
    let monthCollected = 0;
    let todayCount = 0;
    contributions.forEach((c) => {
      const d = new Date(c.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthCollected += Number(c.amount || 0);
      if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) todayCount++;
    });
    return { totalCollected, monthCollected, count: contributions.length, todayCount };
  }, [contributions]);

  return (
    <div className="col-span-1 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Contribution insights</h2>
          <p className="text-sm text-slate-500">Aggregated metrics from filtered contributions.</p>
        </div>
        <Receipt size={20} className="text-purple-500" />
      </header>
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-500">Total collected</p>
          <p className="mt-1 text-xl font-semibold text-blue-700">{formatCurrency(analytics.totalCollected)}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">This month</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">{formatCurrency(analytics.monthCollected)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-400">Contributions</p>
            <p className="mt-1 text-lg font-semibold text-slate-700">{analytics.count}</p>
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

const ContributionHistoryTable = ({
  loading,
  contributions,
  totalCount,
  receipts,
  members,
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
  const getReceiptForContribution = (c) => {
    if (c.receiptId) return receipts.find((r) => r.receiptId === c.receiptId);
    return null;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recent contributions</h2>
          <p className="text-sm text-slate-500">Chronological log of all recorded contributions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Filter size={14} className="mr-1.5" /> Filters
          </button>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">{totalCount} records</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Type', 'Member', 'Amount', 'Date', 'Recorded by', 'Receipt'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-600">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading…</td></tr>
            ) : totalCount === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No contributions match the filters.</td></tr>
            ) : (
              contributions.map((c) => {
                const receipt = getReceiptForContribution(c);
                const member = c.member || (c.memberId && members.find((m) => m._id === c.memberId));
                const memberEmail = member?.email;
                const typeName = c.contributionType?.name || c.contributionTypeId?.name || '—';
                return (
                  <tr key={c._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">{typeName}</td>
                    <td className="px-4 py-3">{member?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{formatCurrency(c.amount)}</td>
                    <td className="px-4 py-3">{new Date(c.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-4 py-3 text-slate-500">{c.recordedBy}</td>
                    <td className="px-4 py-3">
                      {receipt ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => onDownloadReceipt(receipt.receiptId)} className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
                            <Download size={14} className="mr-1.5" /> PDF
                          </button>
                          <button
                            onClick={() => onResendReceipt(receipt.receiptId)}
                            disabled={!memberEmail || resendingReceiptId === receipt.receiptId}
                            className="inline-flex items-center rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Mail size={14} className="mr-1.5" /> {resendingReceiptId === receipt.receiptId ? 'Sending…' : 'Email'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
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
        <div>Page {pageIndex + 1} of {pageCount}</div>
        <div className="flex items-center gap-3">
          <label className="hidden text-xs text-slate-500 sm:block">Rows per page</label>
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
            {[10, 20, 30, 50].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="inline-flex items-center gap-2">
            <button type="button" onClick={() => onPageChange(Math.max(pageIndex - 1, 0))} disabled={pageIndex === 0} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button type="button" onClick={() => onPageChange(Math.min(pageIndex + 1, pageCount - 1))} disabled={pageIndex >= pageCount - 1} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContributionFilterDialog = ({ isOpen, onClose, filters, setFilters, resetFilters, members, contributionTypes }) => (
  <Transition appear show={isOpen} as={React.Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <Transition.Child as={React.Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
        <div className="fixed inset-0 bg-slate-900/40" />
      </Transition.Child>
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child as={React.Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Filter contributions</Dialog.Title>
                <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
              </div>
              <div className="space-y-4 px-6 py-6 text-sm">
                <div>
                  <label className="font-medium text-slate-700">Contribution type</label>
                  <select value={filters.contributionTypeId} onChange={(e) => setFilters((p) => ({ ...p, contributionTypeId: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="">All types</option>
                    {contributionTypes.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700">Member</label>
                  <select value={filters.memberId} onChange={(e) => setFilters((p) => ({ ...p, memberId: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="">All members</option>
                    {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-slate-700">Start date</label>
                    <input type="date" value={filters.startDate} onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700">End date</label>
                    <input type="date" value={filters.endDate} onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button type="button" onClick={resetFilters} className="text-sm font-medium text-slate-500 hover:text-slate-700">Reset</button>
                <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Close</button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

const ReceiptModal = ({ receipt, onClose, onDownload }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm">
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Receipt size={18} className="text-blue-500" /> Receipt generated</h3>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm text-slate-600">
          <p>Contribution recorded successfully. A PDF receipt is ready for download.</p>
          {receipt.email?.status === 'sent' && <p className="flex items-center gap-2 text-emerald-600"><Mail size={16} /> Receipt emailed.</p>}
          {receipt.email?.status === 'failed' && <p className="flex items-center gap-2 text-rose-600"><Mail size={16} /> Email delivery failed.</p>}
          {receipt.email?.status === 'missing' && <p className="flex items-center gap-2 text-amber-600"><Mail size={16} /> No email available (member or recorder). Receipt ready for download.</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Later</button>
          <button type="button" onClick={() => { onDownload(receipt.receiptId); onClose(); }} className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Download size={16} className="mr-2" /> Download PDF</button>
        </div>
      </div>
    </div>
  </div>
);

const ContributionTypesModal = ({ isOpen, onClose, contributionTypes, onRefresh }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await api.post('/contribution-types', { name: name.trim(), description: description.trim() });
      toast.success('Contribution type created');
      setName('');
      setDescription('');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, typeName) => {
    if (!window.confirm(`Delete "${typeName}"? This will fail if it has contributions.`)) return;
    try {
      await api.delete(`/contribution-types/${id}`);
      toast.success('Type deleted');
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={React.Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={React.Fragment} enter="ease-out duration-200" enterFrom="opacity-0 translate-y-4" enterTo="opacity-100 translate-y-0" leave="ease-in duration-150">
              <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Manage contribution types</Dialog.Title>
                  <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
                </div>
                <div className="space-y-4 px-6 py-6">
                  <form onSubmit={handleCreate} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">New type name</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Donation" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
                      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. General donations" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <button type="submit" disabled={submitting || !name.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Add type</button>
                  </form>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Existing types</p>
                    <ul className="space-y-2">
                      {contributionTypes.map((t) => (
                        <li key={t._id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                          <div>
                            <span className="font-medium">{t.name}</span>
                            {t.isSystem && <span className="ml-2 text-xs text-slate-500">(System)</span>}
                            {t.description && <span className="ml-2 text-slate-500">— {t.description}</span>}
                          </div>
                          {!t.isSystem && (
                            <button type="button" onClick={() => handleDelete(t._id, t.name)} className="text-rose-600 hover:text-rose-700 text-xs font-medium">Delete</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Done</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
