import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api.js';
import { CheckCircle2, XCircle, Eye, Clock, AlertCircle } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

const TenantApproval = () => {
  const [pendingTenants, setPendingTenants] = useState([]);
  const [rejectedTenants, setRejectedTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPendingTenants = useCallback(async () => {
    try {
      const response = await api.get('/tenant-approval/pending');
      setPendingTenants(response.data);
    } catch (error) {
      toast.error('Failed to load pending tenants');
    }
  }, []);

  const fetchRejectedTenants = useCallback(async () => {
    try {
      const response = await api.get('/tenant-approval/rejected');
      setRejectedTenants(response.data);
    } catch (error) {
      toast.error('Failed to load rejected tenants');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPendingTenants(), fetchRejectedTenants()]);
      setLoading(false);
    };
    loadData();
  }, [fetchPendingTenants, fetchRejectedTenants]);

  const handleViewDetails = async (tenantId) => {
    try {
      const response = await api.get(`/tenant-approval/${tenantId}`);
      setSelectedTenant(response.data);
      setDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to load tenant details');
    }
  };

  const handleApprove = async (tenantId) => {
    if (!window.confirm('Are you sure you want to approve this organization?')) {
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/tenant-approval/${tenantId}/approve`);
      toast.success('Organization approved successfully');
      await Promise.all([fetchPendingTenants(), fetchRejectedTenants()]);
      if (detailModalOpen) {
        setDetailModalOpen(false);
        setSelectedTenant(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve organization');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      toast.error('Please provide a rejection reason (at least 10 characters)');
      return;
    }

    if (!selectedTenant) return;

    setProcessing(true);
    try {
      await api.post(`/tenant-approval/${selectedTenant.tenant._id}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      toast.success('Organization rejected');
      setRejectModalOpen(false);
      setRejectionReason('');
      setDetailModalOpen(false);
      setSelectedTenant(null);
      await Promise.all([fetchPendingTenants(), fetchRejectedTenants()]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject organization');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (tenant) => {
    setSelectedTenant(tenant);
    setRejectModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Organization Approvals</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review and approve or reject new organization registrations
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Clock size={18} />
              <span>Pending ({pendingTenants.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`${
                activeTab === 'rejected'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <XCircle size={18} />
              <span>Rejected ({rejectedTenants.length})</span>
            </button>
          </nav>
        </div>

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white shadow rounded-lg">
            {pendingTenants.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No pending organizations</h3>
                <p className="mt-1 text-sm text-slate-500">All organizations have been reviewed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {pendingTenants.map((tenant) => (
                  <div key={tenant._id} className="p-6 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{tenant.name}</h3>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Slug:</span> {tenant.slug}
                          </div>
                          <div>
                            <span className="font-medium">Registered:</span>{' '}
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </div>
                          {tenant.contact?.email && (
                            <div>
                              <span className="font-medium">Contact Email:</span> {tenant.contact.email}
                            </div>
                          )}
                          {tenant.contact?.phone && (
                            <div>
                              <span className="font-medium">Contact Phone:</span> {tenant.contact.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <button
                          onClick={() => handleViewDetails(tenant._id)}
                          className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                        >
                          <Eye size={16} className="mr-2" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleApprove(tenant._id)}
                          disabled={processing}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} className="mr-2" />
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rejected Tab */}
        {activeTab === 'rejected' && (
          <div className="bg-white shadow rounded-lg">
            {rejectedTenants.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No rejected organizations</h3>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {rejectedTenants.map((tenant) => (
                  <div key={tenant._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{tenant.name}</h3>
                        <div className="mt-2 space-y-1 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Slug:</span> {tenant.slug}
                          </div>
                          <div>
                            <span className="font-medium">Rejected:</span>{' '}
                            {new Date(tenant.updatedAt).toLocaleDateString()}
                          </div>
                          {tenant.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                              <span className="font-medium text-red-800">Reason:</span>
                              <p className="text-red-700 mt-1">{tenant.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tenant Details Modal */}
        <Transition show={detailModalOpen} as={React.Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setDetailModalOpen(false)}>
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
                  enterFrom="opacity-0 translate-y-4"
                  enterTo="opacity-100 translate-y-0"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-4"
                >
                  <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                    {selectedTenant && (
                      <>
                        <div className="px-6 py-4 border-b border-slate-200">
                          <Dialog.Title className="text-lg font-semibold text-slate-900">
                            Organization Details
                          </Dialog.Title>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-2">Organization Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-slate-600">Name:</span>
                                <p className="text-slate-900">{selectedTenant.tenant.name}</p>
                              </div>
                              <div>
                                <span className="font-medium text-slate-600">Slug:</span>
                                <p className="text-slate-900">{selectedTenant.tenant.slug}</p>
                              </div>
                              <div>
                                <span className="font-medium text-slate-600">Database:</span>
                                <p className="text-slate-900 font-mono text-xs">{selectedTenant.tenant.databaseName}</p>
                              </div>
                              <div>
                                <span className="font-medium text-slate-600">Registered:</span>
                                <p className="text-slate-900">
                                  {new Date(selectedTenant.tenant.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {selectedTenant.tenant.contact && (
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-2">Contact Information</h3>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {selectedTenant.tenant.contact.email && (
                                  <div>
                                    <span className="font-medium text-slate-600">Email:</span>
                                    <p className="text-slate-900">{selectedTenant.tenant.contact.email}</p>
                                  </div>
                                )}
                                {selectedTenant.tenant.contact.phone && (
                                  <div>
                                    <span className="font-medium text-slate-600">Phone:</span>
                                    <p className="text-slate-900">{selectedTenant.tenant.contact.phone}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedTenant.adminUser && (
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-2">Admin User</h3>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-slate-600">Username:</span>
                                  <p className="text-slate-900">{selectedTenant.adminUser.username}</p>
                                </div>
                                {selectedTenant.adminUser.email && (
                                  <div>
                                    <span className="font-medium text-slate-600">Email:</span>
                                    <p className="text-slate-900">{selectedTenant.adminUser.email}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedTenant.tenant.config?.branding && (
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-2">Branding</h3>
                              <div className="text-sm">
                                <span className="font-medium text-slate-600">Display Name:</span>
                                <p className="text-slate-900">
                                  {selectedTenant.tenant.config.branding.name || selectedTenant.tenant.name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setDetailModalOpen(false);
                              openRejectModal(selectedTenant);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                          >
                            <XCircle size={16} className="mr-2" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(selectedTenant.tenant._id)}
                            disabled={processing}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle2 size={16} className="mr-2" />
                            Approve
                          </button>
                        </div>
                      </>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Rejection Modal */}
        <Transition show={rejectModalOpen} as={React.Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setRejectModalOpen(false)}>
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
                  enterFrom="opacity-0 translate-y-4"
                  enterTo="opacity-100 translate-y-0"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-4"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                    <div className="px-6 py-4 border-b border-slate-200">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">
                        Reject Organization
                      </Dialog.Title>
                    </div>
                    <div className="px-6 py-4">
                      <p className="text-sm text-slate-600 mb-4">
                        Please provide a reason for rejecting this organization. This reason will be sent to the
                        organization.
                      </p>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                        placeholder="Enter rejection reason (minimum 10 characters)..."
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        {rejectionReason.length}/500 characters (minimum 10 required)
                      </p>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setRejectModalOpen(false);
                          setRejectionReason('');
                        }}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={processing || rejectionReason.trim().length < 10}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle size={16} className="mr-2" />
                        Reject Organization
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
};

export default TenantApproval;

