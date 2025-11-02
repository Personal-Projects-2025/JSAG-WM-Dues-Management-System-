import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [filters, setFilters] = useState({
    memberId: '',
    startDate: '',
    endDate: '',
    recordedBy: ''
  });
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchMembers();
    fetchPayments();
    fetchReceipts();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  useEffect(() => {
    // Filter members based on search query
    if (memberSearch) {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        member.memberId?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        member.contact?.toLowerCase().includes(memberSearch.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [memberSearch, members]);

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

  const fetchReceipts = async () => {
    try {
      const response = await api.get('/receipts');
      setReceipts(response.data);
    } catch (error) {
      // Silently fail if receipts can't be loaded
      console.error('Failed to load receipts:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/payments', formData);
      toast.success('Payment recorded successfully');
      setShowModal(false);
      setMemberSearch(''); // Reset search when modal closes
      
      // Store receipt info and show receipt modal
      if (response.data.receipt) {
        setLatestReceipt(response.data.receipt);
        setReceiptModal(true);
      }
      
      setFormData({
        memberId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchPayments();
      fetchMembers();
      fetchReceipts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record payment');
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

  const getReceiptForPayment = (paymentId) => {
    return receipts.find(receipt => receipt.paymentId?.toString() === paymentId?.toString());
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <button
          onClick={() => {
            setShowModal(true);
            setMemberSearch(''); // Reset search when opening modal
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Record Payment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Member</label>
            <select
              value={filters.memberId}
              onChange={(e) => setFilters({ ...filters, memberId: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Members</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Recorded By</label>
            <input
              type="text"
              value={filters.recordedBy}
              onChange={(e) => setFilters({ ...filters, recordedBy: e.target.value })}
              placeholder="Username"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Months Covered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => {
                const receipt = getReceiptForPayment(payment._id);
                return (
                  <tr key={payment._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.memberName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      GHS {payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.monthsCovered}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.recordedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {receipt ? (
                        <button
                          onClick={() => handleDownloadReceipt(receipt.receiptId)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="Download Receipt"
                        >
                          🧾 <span className="ml-1">Download</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <div className="text-center py-8 text-gray-500">No payments found</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Record Payment</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Member *</label>
                <input
                  type="text"
                  placeholder="Search by name, ID, or contact..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                />
                <select
                  required
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md max-h-40 overflow-y-auto"
                >
                  <option value="">Select Member</option>
                  {filteredMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} - Dues: GHS {member.duesPerMonth}/month {member.memberId ? `(${member.memberId})` : ''}
                    </option>
                  ))}
                </select>
                {filteredMembers.length === 0 && memberSearch && (
                  <p className="mt-1 text-sm text-red-600">No members found matching "{memberSearch}"</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Amount *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setMemberSearch(''); // Reset search when modal closes
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && latestReceipt && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">🧾 Payment Receipt</h3>
            <p className="mb-4 text-gray-700">
              Payment recorded successfully! Would you like to download the receipt?
            </p>
            <div className="bg-gray-50 p-3 rounded mb-4">
              <p className="text-sm text-gray-600">
                <strong>Receipt ID:</strong> {latestReceipt.receiptId}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setReceiptModal(false);
                  setLatestReceipt(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Later
              </button>
              <button
                onClick={() => {
                  handleDownloadReceipt(latestReceipt.receiptId);
                  setReceiptModal(false);
                  setLatestReceipt(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

