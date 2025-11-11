import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  CheckCircle2,
  FileBarChart2,
  FileDown,
  FileJson,
  FileSpreadsheet,
  Filter,
  Loader2,
  Printer
} from 'lucide-react';
import api from '../services/api.js';

const Reports = () => {
  const [reportType, setReportType] = useState('members');
  const [format, setFormat] = useState('json');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    recordedBy: ''
  });
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (reportType === 'payments') {
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.recordedBy) params.append('recordedBy', filters.recordedBy);
      }

      const endpoint = reportType === 'members' ? '/reports/members' : '/reports/payments';
      const filename = `${reportType}-report`;
      const response = await api.get(`${endpoint}?${params.toString()}`, { responseType: 'blob' });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'excel' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'json';
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">
            Lightweight exports for members and payments. Choose your format and filters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
        >
          <Printer size={16} className="mr-2" />
          Print view
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryTile
          icon={<FileBarChart2 size={18} className="text-blue-500" />}
          label="Members report"
          description="Export all member records including subgroup and arrears info."
          action="members"
          current={reportType}
          onSelect={setReportType}
        />
        <SummaryTile
          icon={<FileBarChart2 size={18} className="text-emerald-500" />}
          label="Payments report"
          description="Download payment activity with filters for your finance team."
          action="payments"
          current={reportType}
          onSelect={setReportType}
        />
        <SummaryTile
          icon={<CheckCircle2 size={18} className="text-purple-500" />}
          label="Status"
          description={loading ? 'Preparing export…' : 'Ready to generate report.'}
          disabled
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Export format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="json">JSON</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </select>
            <p className="text-xs text-slate-400">Quick exports for sharing with leadership.</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Quick filter presets</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
                    endDate: new Date().toISOString().slice(0, 10),
                    recordedBy: ''
                  })
                }
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
              >
                <Filter size={14} className="mr-1" /> YTD
              </button>
              <button
                type="button"
                onClick={() => setFilters({ startDate: '', endDate: '', recordedBy: '' })}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
              >
                Clear
              </button>
            </div>
            <p className="text-xs text-slate-400">Applies to payments report only.</p>
          </div>
        </div>

        {reportType === 'payments' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Start date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">End date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Recorded by</label>
              <input
                type="text"
                value={filters.recordedBy}
                onChange={(e) => setFilters({ ...filters, recordedBy: e.target.value })}
                placeholder="Username"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Members report includes subgroup assignment, arrears and contact info.
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Exporting…
              </>
            ) : (
              <>
                {format === 'json' && <FileJson size={16} className="mr-2" />}
                {format === 'excel' && <FileSpreadsheet size={16} className="mr-2" />}
                {format === 'pdf' && <FileDown size={16} className="mr-2" />}
                Export report
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Reports;

const SummaryTile = ({ icon, label, description, action, current, onSelect, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && action && onSelect(action)}
    disabled={disabled}
    className={`text-left rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition ${
      current === action ? 'ring-2 ring-blue-200' : 'hover:shadow-md'
    } ${disabled ? 'cursor-default opacity-60' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div className="rounded-full bg-slate-50 p-2 text-slate-500">{icon}</div>
      {current === action && action && (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
          Selected
        </span>
      )}
    </div>
    <h2 className="mt-3 text-base font-semibold text-slate-900">{label}</h2>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
  </button>
);

