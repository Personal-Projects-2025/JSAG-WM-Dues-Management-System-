import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const TenantManagement = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    slug: '',
    status: 'active'
  });

  useEffect(() => {
    if (user?.role === 'system') {
      fetchTenants();
    }
  }, [user]);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/tenants');
      setTenants(response.data);
    } catch (error) {
      toast.error('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      await api.put(`/tenants/${tenantId}/status`, { status: newStatus });
      toast.success('Tenant status updated');
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update tenant status');
    }
  };

  const handleDelete = async (tenantId) => {
    try {
      await api.delete(`/tenants/${tenantId}`);
      toast.success('Tenant deleted');
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete tenant');
    }
  };

  const handleRestore = async (tenantId) => {
    try {
      await api.post(`/tenants/${tenantId}/restore`);
      toast.success('Tenant restored');
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to restore tenant');
    }
  };

  const handleEdit = (tenant) => {
    setSelectedTenant(tenant);
    setEditFormData({
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;

    try {
      await api.put(`/tenants/${selectedTenant._id || selectedTenant.id}`, editFormData);
      toast.success('Tenant updated successfully');
      setShowEditModal(false);
      setSelectedTenant(null);
      fetchTenants();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update tenant');
    }
  };

  if (user?.role !== 'system') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Access denied. Only System Users can view tenant management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading tenants...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tenant Management</h1>
        <p className="text-gray-600 mt-1">Manage all tenants in the system (metadata only)</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Database
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((tenant) => (
              <tr key={tenant._id || tenant.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tenant.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tenant.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tenant.databaseName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tenant.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : tenant.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(tenant)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    {tenant.status === 'active' ? (
                      <>
                        <button
                          onClick={() => handleStatusChange(tenant._id || tenant.id, 'inactive')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Deactivate
                        </button>
                        <button
                          onClick={() => handleDelete(tenant._id || tenant.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    ) : tenant.status === 'archived' ? (
                      <button
                        onClick={() => handleRestore(tenant._id || tenant.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Restore
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStatusChange(tenant._id || tenant.id, 'active')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activate
                        </button>
                        <button
                          onClick={() => handleDelete(tenant._id || tenant.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tenants found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Tenant</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.slug}
                  onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name (read-only)
                </label>
                <input
                  type="text"
                  value={selectedTenant.databaseName}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTenant(null);
                  }}
                  className="min-h-[44px] px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;


