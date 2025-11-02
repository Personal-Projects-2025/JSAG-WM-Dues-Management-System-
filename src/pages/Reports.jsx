import React, { useState } from 'react';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const Reports = () => {
  const [reportType, setReportType] = useState('members');
  const [format, setFormat] = useState('json');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    memberId: '',
    recordedBy: ''
  });
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.memberId) params.append('memberId', filters.memberId);
      if (filters.recordedBy) params.append('recordedBy', filters.recordedBy);

      let endpoint = '';
      let filename = '';
      if (reportType === 'members') {
        endpoint = '/reports/members';
        filename = 'members-report';
      } else {
        endpoint = '/reports/payments';
        filename = 'payments-report';
      }

      const response = await api.get(`${endpoint}?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      if (format === 'excel') {
        link.download = `${filename}.xlsx`;
      } else if (format === 'pdf') {
        link.download = `${filename}.pdf`;
      } else {
        link.download = `${filename}.json`;
      }
      
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
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="members">Members Report</option>
            <option value="payments">Payments Report</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="json">JSON</option>
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        {reportType === 'payments' && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recorded By</label>
              <input
                type="text"
                value={filters.recordedBy}
                onChange={(e) => setFilters({ ...filters, recordedBy: e.target.value })}
                placeholder="Username"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? 'Exporting...' : 'Export Report'}
        </button>
      </div>
    </div>
  );
};

export default Reports;

