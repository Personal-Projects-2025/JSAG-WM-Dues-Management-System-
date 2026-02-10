import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import { toast } from 'react-toastify';
import clsx from 'clsx';
import {
  ArrowUpDown,
  BadgeAlert,
  Calendar,
  Edit,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  Users as UsersIcon,
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

const calculateOutstanding = (member) => {
  if (!member) return 0;
  const arrears = Number(member.arrears || 0);
  const dues = Number(member.duesPerMonth || 0);
  return arrears * dues;
};

const initialsFromName = (name = '') =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

const extractInitials = (name = '') => {
  if (!name) return 'ORG';
  const words = name.trim().split(/\s+/).filter(word => word.length > 0);
  if (words.length === 0) return 'ORG';
  return words.map(word => word.charAt(0).toUpperCase()).join('');
};

const MemberFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  subgroups,
  editingMember,
  tenantInfo,
  extractInitials
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
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editingMember ? 'Edit Member' : 'Add New Member'}
                  </Dialog.Title>
                  <p className="text-sm text-slate-500">
                    {editingMember
                      ? 'Update member details and dues settings.'
                      : 'Capture the details of a new group member.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  onClick={onClose}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={onSubmit} className="space-y-6 px-6 py-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Full name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Member ID</label>
                      {!editingMember && (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.autoGenerateId}
                            onChange={(e) => {
                              setFormData({ 
                                ...formData, 
                                autoGenerateId: e.target.checked,
                                memberId: e.target.checked ? '' : formData.memberId
                              });
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-600">Auto-generate</span>
                        </label>
                      )}
                    </div>
                    {formData.autoGenerateId && !editingMember ? (
                      <div className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                        {tenantInfo?.name ? (
                          <>Will be generated as: <span className="font-mono font-semibold">{extractInitials(tenantInfo.name)}-XXXXX</span></>
                        ) : (
                          'Will be auto-generated'
                        )}
                      </div>
                    ) : editingMember && editingMember.isAutoGeneratedId ? (
                      <input
                        type="text"
                        value={formData.memberId}
                        disabled
                        className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.memberId}
                        onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Email address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Phone / Contact</label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Subgroup</label>
                    <select
                      value={formData.subgroupId}
                      onChange={(e) => setFormData({ ...formData, subgroupId: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Unassigned</option>
                      {subgroups.map((subgroup) => (
                        <option key={subgroup._id} value={subgroup._id}>
                          {subgroup.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Join date</label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Dues per month *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.duesPerMonth}
                      onChange={(e) =>
                        setFormData({ ...formData, duesPerMonth: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Fields marked with * are required for email automation.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      {editingMember ? 'Save changes' : 'Create member'}
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

/** Parse pasted text: one member per line, columns = Name, Email, Phone, Subgroup (comma or tab) */
const parseBulkText = (text) => {
  if (!text || !text.trim()) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[\t,]+/).map((p) => p.trim());
      return {
        name: parts[0] || '',
        email: parts[1] || '',
        contact: parts[2] || '',
        subgroup: parts[3] || ''
      };
    })
    .filter((row) => row.name);
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result && typeof result === 'string' && result.startsWith('data:') ? result.split(',')[1] : result;
      resolve(base64 || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const BulkAddModal = ({
  isOpen,
  onClose,
  bulkMode,
  setBulkMode,
  bulkText,
  setBulkText,
  bulkFile,
  setBulkFile,
  bulkDuesPerMonth,
  setBulkDuesPerMonth,
  onPasteSubmit,
  onExcelSubmit,
  submitting,
  tenantInfo,
  extractInitials,
  onDownloadTemplate
}) => {
  const parsed = parseBulkText(bulkText);
  const canSubmitPaste = parsed.length > 0 && bulkDuesPerMonth !== '' && Number(bulkDuesPerMonth) >= 0;
  const canSubmitExcel = bulkFile && bulkDuesPerMonth !== '' && Number(bulkDuesPerMonth) >= 0;
  const canSubmit = bulkMode === 'paste' ? canSubmitPaste : canSubmitExcel;
  const submitLabel = bulkMode === 'paste' ? `Add ${parsed.length} member(s)` : (bulkFile ? `Add from ${bulkFile.name}` : 'Add from file');

  return (
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
              enterFrom="opacity-0 translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      Bulk add members
                    </Dialog.Title>
                    <p className="text-sm text-slate-500">
                      Paste a list or upload an Excel file. Columns: Name, Email, Phone, Subgroup.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    onClick={onClose}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="border-b border-slate-200 px-6">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setBulkMode('paste')}
                      className={clsx(
                        'px-4 py-2 text-sm font-medium rounded-t-lg transition',
                        bulkMode === 'paste'
                          ? 'bg-slate-100 text-slate-900 border border-b-0 border-slate-200'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      Paste
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkMode('excel')}
                      className={clsx(
                        'px-4 py-2 text-sm font-medium rounded-t-lg transition',
                        bulkMode === 'excel'
                          ? 'bg-slate-100 text-slate-900 border border-b-0 border-slate-200'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      Upload Excel
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-6 py-6">
                  {bulkMode === 'paste' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Paste list (Name, Email, Phone, Subgroup)</label>
                      <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={'John Doe, john@example.com, 0244123456, Group A\nJane Smith, jane@example.com, 0555123456, Group B\n...'}
                        rows={8}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        {parsed.length} valid row(s). Member IDs auto-generated as {tenantInfo?.name ? `${extractInitials(tenantInfo.name)}-XXXXX` : 'ORG-XXXXX'}.
                      </p>
                    </div>
                  )}
                  {bulkMode === 'excel' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <a
                          href="#"
                          onClick={(e) => { e.preventDefault(); onDownloadTemplate(); }}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Download template (.xlsx)
                        </a>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Excel file (.xlsx, max 2 MB, max 500 rows)</label>
                        <input
                          type="file"
                          accept=".xlsx"
                          onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {bulkFile && (
                          <p className="mt-1 text-xs text-slate-500">
                            {bulkFile.name} ({(bulkFile.size / 1024).toFixed(1)} KB)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="w-full max-w-xs">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dues per month (GHS) for all *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bulkDuesPerMonth}
                      onChange={(e) => setBulkDuesPerMonth(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 bg-slate-50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmit || submitting}
                    onClick={bulkMode === 'paste' ? onPasteSubmit : onExcelSubmit}
                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Adding…' : submitLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const MemberDetailPanel = ({ isOpen, onClose, member }) => {
  if (!member) return null;

  const outstanding = calculateOutstanding(member);

  return (
    <Transition show={isOpen} as={React.Fragment}>
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                      {initialsFromName(member.name)}
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        {member.name}
                      </Dialog.Title>
                      <p className="text-sm text-slate-500">
                        {member.subgroupId?.name || 'Unassigned subgroup'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6 px-6 py-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Mail size={16} />
                        <span className="text-xs uppercase tracking-wide">Email</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {member.email || 'Not provided'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Phone size={16} />
                        <span className="text-xs uppercase tracking-wide">Contact</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {member.contact || 'Not provided'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Calendar size={16} />
                        <span className="text-xs uppercase tracking-wide">Joined</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {member.joinDate
                          ? new Date(member.joinDate).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <UsersIcon size={16} />
                        <span className="text-xs uppercase tracking-wide">Subgroup</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-800">
                        {member.subgroupId?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                        Total Paid
                      </p>
                      <p className="mt-1 text-xl font-semibold text-blue-700">
                        {formatCurrency(member.totalPaid || 0)}
                      </p>
                      <p className="text-xs text-blue-500/80">
                        {member.monthsCovered || 0} months covered
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                        Outstanding Balance
                      </p>
                      <p className="mt-1 text-xl font-semibold text-amber-700">
                        {formatCurrency(outstanding)}
                      </p>
                      <p className="text-xs text-amber-600/80">
                        {member.arrears || 0} months in arrears
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                        Dues Per Month
                      </p>
                      <p className="mt-1 text-xl font-semibold text-emerald-700">
                        {formatCurrency(member.duesPerMonth || 0)}
                      </p>
                      <p className="text-xs text-emerald-600/80">
                        Last payment:{' '}
                        {member.lastPaymentDate
                          ? new Date(member.lastPaymentDate).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const Members = () => {
  const [members, setMembers] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    memberId: '',
    autoGenerateId: false,
    contact: '',
    email: '',
    joinDate: new Date().toISOString().split('T')[0],
    duesPerMonth: '',
    subgroupId: ''
  });
  const [tenantInfo, setTenantInfo] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState('paste');
  const [bulkText, setBulkText] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkDuesPerMonth, setBulkDuesPerMonth] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const fetchMembers = useCallback(async (term) => {
    try {
      setLoading(true);
      const query = term !== undefined ? term : searchTerm;
      const response = await api.get(`/members${query ? `?search=${query}` : ''}`);
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const fetchSubgroups = useCallback(async () => {
    try {
      const response = await api.get('/subgroups');
      setSubgroups(response.data);
    } catch (error) {
      toast.error('Failed to load subgroups');
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchSubgroups();
    // Fetch tenant info for member ID preview
    const fetchTenantInfo = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data?.tenant) {
          setTenantInfo(response.data.tenant);
        }
      } catch (error) {
        // Silently fail - tenant info not critical
      }
    };
    fetchTenantInfo();
  }, [fetchMembers, fetchSubgroups]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [fetchMembers]);

  const resetForm = () => {
    setFormData({
      name: '',
      memberId: '',
      autoGenerateId: false,
      contact: '',
      email: '',
      joinDate: new Date().toISOString().split('T')[0],
      duesPerMonth: '',
      subgroupId: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data for submission
      const submitData = { ...formData };
      
      // If auto-generating, don't send memberId
      if (submitData.autoGenerateId) {
        delete submitData.memberId;
      } else {
        // If not auto-generating, don't send autoGenerateId
        delete submitData.autoGenerateId;
      }
      
      if (editingMember) {
        // Don't send autoGenerateId or isAutoGeneratedId in updates
        delete submitData.autoGenerateId;
        await api.put(`/members/${editingMember._id}`, submitData);
        toast.success('Member updated successfully');
      } else {
        await api.post('/members', submitData);
        toast.success('Member added successfully');
      }
      setFormOpen(false);
      setEditingMember(null);
      resetForm();
      fetchMembers();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details?.[0]?.msg || 'Operation failed';
      toast.error(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('Member operation error:', error.response?.data);
      }
    }
  };

  const handleEdit = useCallback((member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      memberId: member.memberId || '',
      autoGenerateId: member.isAutoGeneratedId || false,
      contact: member.contact || '',
      email: member.email || '',
      joinDate: member.joinDate ? new Date(member.joinDate).toISOString().split('T')[0] : '',
      duesPerMonth: member.duesPerMonth,
      subgroupId: member.subgroupId?._id || member.subgroupId || ''
    });
    setFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id) => {
    setMemberToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleBulkPasteSubmit = useCallback(async () => {
    const parsed = parseBulkText(bulkText);
    const dues = parseFloat(bulkDuesPerMonth);
    if (parsed.length === 0 || isNaN(dues) || dues < 0) {
      toast.error('Add at least one member (name required) and a valid dues per month.');
      return;
    }
    setBulkSubmitting(true);
    try {
      const res = await api.post('/members/bulk', {
        members: parsed,
        duesPerMonth: dues
      });
      const created = res.data?.created?.length ?? 0;
      const errs = res.data?.errors;
      if (created > 0) {
        toast.success(res.data.message || `${created} member(s) added`);
        setBulkModalOpen(false);
        setBulkText('');
        setBulkDuesPerMonth('');
        fetchMembers();
      }
      if (errs && errs.length > 0) {
        toast.warning(`${errs.length} row(s) failed: ${errs.map((e) => e.message).join('; ')}`);
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Bulk add failed';
      toast.error(msg);
    } finally {
      setBulkSubmitting(false);
    }
  }, [bulkText, bulkDuesPerMonth, fetchMembers]);

  const handleBulkExcelSubmit = useCallback(async () => {
    if (!bulkFile || bulkFile.size === 0) {
      toast.error('Select an Excel file.');
      return;
    }
    const dues = parseFloat(bulkDuesPerMonth);
    if (isNaN(dues) || dues < 0) {
      toast.error('Enter a valid dues per month.');
      return;
    }
    setBulkSubmitting(true);
    try {
      const base64 = await fileToBase64(bulkFile);
      const res = await api.post('/members/bulk', {
        file: base64,
        fileName: bulkFile.name,
        duesPerMonth: dues
      });
      const created = res.data?.created?.length ?? 0;
      const errs = res.data?.errors;
      if (created > 0) {
        toast.success(res.data.message || `${created} member(s) added`);
        setBulkModalOpen(false);
        setBulkFile(null);
        setBulkDuesPerMonth('');
        fetchMembers();
      }
      if (errs && errs.length > 0) {
        toast.warning(`${errs.length} row(s) failed: ${errs.map((e) => e.message).join('; ')}`);
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Bulk add failed';
      toast.error(msg);
    } finally {
      setBulkSubmitting(false);
    }
  }, [bulkFile, bulkDuesPerMonth, fetchMembers]);

  // Backward-compatible alias for any remaining references (e.g. dependency arrays)
  const handleBulkSubmit = handleBulkPasteSubmit;

  const handleDownloadBulkTemplate = useCallback(async () => {
    try {
      const res = await api.get('/members/bulk-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'members-bulk-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      toast.error('Failed to download template');
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!memberToDelete) return;
    try {
      await api.delete(`/members/${memberToDelete}`);
      toast.success('Member deleted successfully');
      fetchMembers();
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
    } catch (error) {
      toast.error('Failed to delete member');
    }
  }, [memberToDelete, fetchMembers]);

  const openDetail = useCallback((member) => {
    setSelectedMember(member);
    setDetailOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: () => (
          <div className="flex items-center space-x-1">
            <span>Name</span>
            <ArrowUpDown size={14} className="text-slate-400" />
          </div>
        ),
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center space-x-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                {initialsFromName(member.name)}
              </div>
              <div>
                <p className="font-medium text-slate-800">{member.name}</p>
                <p className="text-xs text-slate-500">
                  ID: {member.memberId || 'N/A'}
                  {member.isAutoGeneratedId && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                      Auto
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'subgroupId.name',
        header: 'Subgroup',
        cell: ({ row }) => (
          <div className="text-sm text-slate-600">
            {row.original.subgroupId?.name || 'Unassigned'}
          </div>
        )
      },
      {
        accessorKey: 'contact',
        header: 'Contact',
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <Mail size={14} className="text-slate-400" />
                <span>{member.email || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-slate-400" />
                <span>{member.contact || 'N/A'}</span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'totalPaid',
        header: 'Total Paid',
        cell: ({ row }) => (
          <div className="text-sm font-medium text-emerald-600">
            {formatCurrency(row.original.totalPaid || 0)}
          </div>
        )
      },
      {
        accessorKey: 'arrears',
        header: 'Outstanding',
        cell: ({ row }) => {
          const member = row.original;
          const outstanding = calculateOutstanding(member);
          return (
            <div
              className={clsx(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                outstanding > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-600'
              )}
            >
              {outstanding > 0 ? (
                <>
                  <BadgeAlert size={12} className="mr-1" />
                  {formatCurrency(outstanding)}
                </>
              ) : (
                'Up to date'
              )}
            </div>
          );
        }
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openDetail(member)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => handleEdit(member)}
                className="inline-flex items-center rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 transition"
              >
                <Edit size={14} className="mr-1" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClick(member._id)}
                className="inline-flex items-center rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 size={14} className="mr-1" />
                Delete
              </button>
            </div>
          );
        }
      }
    ],
    [openDetail, handleEdit, handleDeleteClick]
  );

  const table = useReactTable({
    data: members,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize
      }
    }
  });

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Members</h1>
          <p className="text-sm text-slate-500">
            Manage the people in your group, their dues and subgroup assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Upload size={16} className="mr-2" />
            Bulk add
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingMember(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add Member
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID or contact…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500">Rows per page</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {[10, 20, 30, 40].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={clsx(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                      header.column.getCanSort() && 'cursor-pointer select-none'
                    )}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      <div className="h-5 w-full bg-gray-200 animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-slate-600">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-sm text-slate-500">
                  No members match your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-100 transition"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <button
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-100 transition"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <BulkAddModal
        isOpen={bulkModalOpen}
        onClose={() => {
          setBulkModalOpen(false);
          setBulkMode('paste');
          setBulkText('');
          setBulkFile(null);
          setBulkDuesPerMonth('');
        }}
        bulkMode={bulkMode}
        setBulkMode={setBulkMode}
        bulkText={bulkText}
        setBulkText={setBulkText}
        bulkFile={bulkFile}
        setBulkFile={setBulkFile}
        bulkDuesPerMonth={bulkDuesPerMonth}
        setBulkDuesPerMonth={setBulkDuesPerMonth}
        onPasteSubmit={handleBulkPasteSubmit}
        onExcelSubmit={handleBulkExcelSubmit}
        submitting={bulkSubmitting}
        tenantInfo={tenantInfo}
        extractInitials={extractInitials}
        onDownloadTemplate={handleDownloadBulkTemplate}
      />

      <MemberFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMember(null);
          resetForm();
        }}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        subgroups={subgroups}
        editingMember={editingMember}
        tenantInfo={tenantInfo}
        extractInitials={extractInitials}
      />

      <MemberDetailPanel
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        member={selectedMember}
      />

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Member"
        message="Are you sure you want to delete this member? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default Members;


