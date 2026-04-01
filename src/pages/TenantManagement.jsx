import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  Building2, Users, Edit2, Trash2, RotateCcw, ShieldCheck, ShieldOff,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, X
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  active:   'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300',
  inactive: 'bg-amber-100  text-amber-700  ring-1 ring-amber-300',
  archived: 'bg-red-100    text-red-700    ring-1 ring-red-300',
};

const ROLE_STYLES = {
  super: 'bg-violet-100 text-violet-700 ring-1 ring-violet-300',
  admin: 'bg-blue-100   text-blue-700   ring-1 ring-blue-300',
};

const ROLE_LABELS = { super: 'Super Admin', admin: 'Admin' };

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[status] || STATUS_STYLES.inactive}`}>
      {status === 'active' && <CheckCircle size={11} />}
      {status === 'inactive' && <XCircle size={11} />}
      {status === 'archived' && <Clock size={11} />}
      {status}
    </span>
  );
}

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${ROLE_STYLES[role] || ROLE_STYLES.admin}`}>
      {role === 'super' ? <ShieldCheck size={11} /> : <ShieldOff size={11} />}
      {ROLE_LABELS[role] || role}
    </span>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

const TenantManagement = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // edit modal
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', slug: '', status: 'active' });
  const [editSaving, setEditSaving] = useState(false);

  // users panel
  const [expandedTenantId, setExpandedTenantId] = useState(null);
  const [tenantUsers, setTenantUsers] = useState({});   // { tenantId: [...] }
  const [usersLoading, setUsersLoading] = useState({});
  const [roleUpdating, setRoleUpdating] = useState({});  // { userId: true }

  // ── data fetching ──────────────────────────────────────────────────────────

  const fetchTenants = useCallback(async () => {
    try {
      const response = await api.get('/tenants');
      setTenants(response.data);
    } catch {
      toast.error('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'system') fetchTenants();
  }, [user, fetchTenants]);

  const fetchTenantUsers = async (tenantId) => {
    if (tenantUsers[tenantId]) return; // already loaded
    setUsersLoading(p => ({ ...p, [tenantId]: true }));
    try {
      const res = await api.get(`/system/tenant-users/${tenantId}`);
      setTenantUsers(p => ({ ...p, [tenantId]: res.data }));
    } catch {
      toast.error('Failed to load users for this tenant');
    } finally {
      setUsersLoading(p => ({ ...p, [tenantId]: false }));
    }
  };

  // ── tenant actions ─────────────────────────────────────────────────────────

  const handleStatusChange = async (tenantId, newStatus) => {
    try {
      await api.put(`/tenants/${tenantId}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (tenantId) => {
    if (!window.confirm('Archive this tenant? This can be reversed later.')) return;
    try {
      await api.delete(`/tenants/${tenantId}`);
      toast.success('Tenant archived');
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to archive tenant');
    }
  };

  const handleRestore = async (tenantId) => {
    try {
      await api.post(`/tenants/${tenantId}/restore`);
      toast.success('Tenant restored');
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to restore tenant');
    }
  };

  const handleEdit = (tenant) => {
    setSelectedTenant(tenant);
    setEditFormData({ name: tenant.name, slug: tenant.slug, status: tenant.status });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setEditSaving(true);
    try {
      await api.put(`/tenants/${selectedTenant._id || selectedTenant.id}`, editFormData);
      toast.success('Tenant updated');
      setShowEditModal(false);
      setSelectedTenant(null);
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update tenant');
    } finally {
      setEditSaving(false);
    }
  };

  // ── user panel actions ─────────────────────────────────────────────────────

  const toggleUsersPanel = (tenantId) => {
    if (expandedTenantId === tenantId) {
      setExpandedTenantId(null);
    } else {
      setExpandedTenantId(tenantId);
      fetchTenantUsers(tenantId);
    }
  };

  const handleRoleChange = async (tenantId, userId, newRole) => {
    setRoleUpdating(p => ({ ...p, [userId]: true }));
    try {
      await api.patch(`/system/tenant-users/${userId}/role`, { role: newRole });
      toast.success(`Role changed to ${ROLE_LABELS[newRole]}`);
      // refresh the users list for this tenant
      setTenantUsers(p => ({ ...p, [tenantId]: undefined }));
      await fetchTenantUsers(tenantId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setRoleUpdating(p => ({ ...p, [userId]: false }));
    }
  };

  // ── guards ─────────────────────────────────────────────────────────────────

  if (user?.role !== 'system') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">Access denied. Only System users can manage tenants.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-3 text-gray-500">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading tenants…
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 size={22} className="text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tenant Management</h1>
        </div>
        <p className="text-gray-500 ml-12">
          Manage organisations and promote users to Super Admin
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: tenants.length, color: 'text-gray-700' },
          { label: 'Active', value: tenants.filter(t => t.status === 'active').length, color: 'text-emerald-600' },
          { label: 'Inactive / Archived', value: tenants.filter(t => t.status !== 'active').length, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {tenants.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>No tenants registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Organisation', 'Slug', 'Database', 'Status', 'Registered', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenants.map((tenant) => {
                  const tid = tenant._id || tenant.id;
                  const isExpanded = expandedTenantId === tid;
                  const users = tenantUsers[tid] || [];
                  const loadingUsers = usersLoading[tid];

                  return (
                    <React.Fragment key={tid}>
                      {/* ── main row ── */}
                      <tr className={`transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {tenant.name}
                        </td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                          {tenant.slug}
                        </td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                          {tenant.databaseName || '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={tenant.status} />
                        </td>
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Users toggle */}
                            <button
                              onClick={() => toggleUsersPanel(tid)}
                              title="Manage users"
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                                ${isExpanded
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                            >
                              <Users size={13} />
                              Users
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleEdit(tenant)}
                              title="Edit tenant"
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Status/archive actions */}
                            {tenant.status === 'active' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(tid, 'inactive')}
                                  title="Deactivate"
                                  className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                                >
                                  <XCircle size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(tid)}
                                  title="Archive"
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            {tenant.status === 'inactive' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(tid, 'active')}
                                  title="Activate"
                                  className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                                >
                                  <CheckCircle size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(tid)}
                                  title="Archive"
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            {tenant.status === 'archived' && (
                              <button
                                onClick={() => handleRestore(tid)}
                                title="Restore"
                                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ── expanded users panel ── */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-blue-50 px-5 pb-5 pt-0">
                            <div className="rounded-xl border border-blue-200 bg-white overflow-hidden mt-1">
                              {/* panel header */}
                              <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100 bg-blue-50">
                                <div className="flex items-center gap-2">
                                  <Users size={15} className="text-blue-600" />
                                  <span className="text-sm font-semibold text-blue-900">
                                    Users for <em className="not-italic">{tenant.name}</em>
                                  </span>
                                </div>
                                <p className="text-xs text-blue-600">
                                  Toggle a user's role between Admin and Super Admin
                                </p>
                              </div>

                              {loadingUsers ? (
                                <div className="flex items-center gap-2 p-5 text-gray-400 text-sm">
                                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                  Loading users…
                                </div>
                              ) : users.length === 0 ? (
                                <div className="p-5 text-sm text-gray-400 text-center">
                                  No admin users found for this organisation
                                </div>
                              ) : (
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-100">
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Username</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Current Role</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Last Login</th>
                                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Change Role</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {users.map(u => (
                                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                                        <td className="px-4 py-3 text-gray-500">{u.email || '—'}</td>
                                        <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          {roleUpdating[u.id] ? (
                                            <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                                              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                              Saving…
                                            </div>
                                          ) : u.role === 'admin' ? (
                                            <button
                                              onClick={() => handleRoleChange(tid, u.id, 'super')}
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
                                            >
                                              <ShieldCheck size={12} />
                                              Promote to Super Admin
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleRoleChange(tid, u.id, 'admin')}
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                              <ShieldOff size={12} />
                                              Demote to Admin
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Modal ─────────────────────────────────────────────────────────── */}
      {showEditModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Edit2 size={17} className="text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Edit Tenant</h2>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setSelectedTenant(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={editFormData.slug}
                  onChange={e => setEditFormData({ ...editFormData, slug: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database (read-only)</label>
                <input
                  type="text"
                  value={selectedTenant.databaseName || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedTenant(null); }}
                  className="min-h-[42px] px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="min-h-[42px] px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {editSaving ? 'Saving…' : 'Save changes'}
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
