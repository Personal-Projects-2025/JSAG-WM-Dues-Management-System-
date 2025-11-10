import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';

const defaultForm = {
  name: '',
  leaderId: ''
};

const Subgroups = () => {
  const { user } = useAuth();
  const [subgroups, setSubgroups] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSubgroup, setSelectedSubgroup] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubgroups();
    fetchLeaders();
  }, []);

  const fetchSubgroups = async () => {
    try {
      const response = await api.get('/subgroups');
      setSubgroups(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load subgroups');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaders = async () => {
    try {
      // Prefer admins as subgroup leaders
      const response = await api.get('/members?role=admin');
      if (response.data.length === 0) {
        // fallback to all members
        const allMembers = await api.get('/members');
        setLeaders(allMembers.data);
      } else {
        setLeaders(response.data);
      }
    } catch (error) {
      toast.error('Failed to load potential leaders');
    }
  };

  const openModal = (subgroup = null) => {
    if (subgroup) {
      setSelectedSubgroup(subgroup);
      setFormData({
        name: subgroup.name,
        leaderId: subgroup.leaderId?._id || subgroup.leaderId || ''
      });
    } else {
      setSelectedSubgroup(null);
      setFormData(defaultForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSubgroup(null);
    setFormData(defaultForm);
  };

  const openDetails = async (subgroupId) => {
    try {
      const response = await api.get(`/subgroups/${subgroupId}`);
      setDetailData(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load subgroup details');
    }
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setDetailData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.leaderId) {
      toast.error('Name and leader are required');
      return;
    }

    try {
      setSaving(true);
      if (selectedSubgroup) {
        await api.put(`/subgroups/${selectedSubgroup._id}`, formData);
        toast.success('Subgroup updated successfully');
      } else {
        await api.post('/subgroups', formData);
        toast.success('Subgroup created successfully');
      }
      closeModal();
      fetchSubgroups();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save subgroup');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subgroup) => {
    if (!window.confirm(`Delete subgroup "${subgroup.name}"? Members will be set to Unassigned.`)) {
      return;
    }
    try {
      await api.delete(`/subgroups/${subgroup._id}`);
      toast.success('Subgroup deleted successfully');
      fetchSubgroups();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete subgroup');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (user?.role !== 'super') {
    return (
      <div className="px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Access Restricted</h1>
        <p className="text-gray-600">Only super administrators can manage subgroups.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subgroups</h1>
          <p className="text-gray-600 mt-1">Create and manage subgroups to track contributions competitively.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Create Subgroup
        </button>
      </div>

      {subgroups.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No subgroups yet. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subgroups.map((subgroup) => (
            <div key={subgroup._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{subgroup.name}</h2>
                  <p className="text-gray-500">
                    Leader:{' '}
                    {subgroup.leaderId
                      ? `${subgroup.leaderId.name}${subgroup.leaderId.memberId ? ` (${subgroup.leaderId.memberId})` : ''}`
                      : 'Not Assigned'}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {subgroup.memberCount} member{subgroup.memberCount === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-gray-500">Total Contributions</p>
                  <p className="text-lg font-semibold text-gray-900">
                    GHS {Number(subgroup.totalCollected || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-gray-500">Avg per Member</p>
                  <p className="text-lg font-semibold text-gray-900">
                    GHS {Number(subgroup.averagePerMember || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3 text-sm">
                <button
                  onClick={() => openDetails(subgroup._id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Details
                </button>
                <button
                  onClick={() => openModal(subgroup)}
                  className="text-green-600 hover:text-green-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(subgroup)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">
              {selectedSubgroup ? 'Edit Subgroup' : 'Create Subgroup'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subgroup Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Leader *</label>
                <select
                  required
                  value={formData.leaderId}
                  onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md max-h-40 overflow-y-auto"
                >
                  <option value="">Select Leader</option>
                  {leaders.map((leader) => (
                    <option key={leader._id} value={leader._id}>
                      {leader.name}
                      {leader.memberId ? ` (${leader.memberId})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : selectedSubgroup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && detailData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-16 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{detailData.subgroup.name}</h3>
                <p className="text-gray-600">
                  Leader:{' '}
                  {detailData.subgroup.leaderId
                    ? detailData.subgroup.leaderId.name
                    : 'Not Assigned'}
                </p>
                <p className="text-gray-500 mt-1">
                  Total Contributions: GHS {Number(detailData.stats.totalCollected || 0).toFixed(2)} | Members:{' '}
                  {detailData.stats.memberCount} | Average:{' '}
                  GHS {Number(detailData.stats.averagePerMember || 0).toFixed(2)}
                </p>
              </div>
              <button
                onClick={closeDetails}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Members</h4>
              {detailData.members.length === 0 ? (
                <p className="text-gray-500">No members assigned to this subgroup yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Member ID
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Paid
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailData.members.map((member) => (
                        <tr key={member._id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{member.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{member.memberId || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{member.contact || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            GHS {Number(member.totalPaid || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subgroups;


