import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { toast } from 'react-toastify';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    memberId: '',
    contact: '',
    joinDate: new Date().toISOString().split('T')[0],
    duesPerMonth: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/members${searchTerm ? `?search=${searchTerm}` : ''}`);
      setMembers(response.data);
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await api.put(`/members/${editingMember._id}`, formData);
        toast.success('Member updated successfully');
      } else {
        await api.post('/members', formData);
        toast.success('Member added successfully');
      }
      setShowModal(false);
      setEditingMember(null);
      setFormData({
        name: '',
        memberId: '',
        contact: '',
        joinDate: new Date().toISOString().split('T')[0],
        duesPerMonth: ''
      });
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      memberId: member.memberId || '',
      contact: member.contact || '',
      joinDate: member.joinDate ? new Date(member.joinDate).toISOString().split('T')[0] : '',
      duesPerMonth: member.duesPerMonth
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await api.delete(`/members/${id}`);
        toast.success('Member deleted successfully');
        fetchMembers();
      } catch (error) {
        toast.error('Failed to delete member');
      }
    }
  };

  const handleViewDetails = (member) => {
    // Navigate to member details or show in modal
    const details = `
Name: ${member.name}
Member ID: ${member.memberId || 'N/A'}
Contact: ${member.contact || 'N/A'}
Join Date: ${new Date(member.joinDate).toLocaleDateString()}
Dues Per Month: ${member.duesPerMonth}
Total Paid: ${member.totalPaid}
Months Covered: ${member.monthsCovered}
Arrears: ${member.arrears}
Last Payment: ${member.lastPaymentDate ? new Date(member.lastPaymentDate).toLocaleDateString() : 'N/A'}
    `;
    alert(details);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Members</h1>
        <button
          onClick={() => {
            setEditingMember(null);
            setFormData({
              name: '',
              memberId: '',
              contact: '',
              joinDate: new Date().toISOString().split('T')[0],
              duesPerMonth: ''
            });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Add Member
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {members.map((member) => (
            <li key={member._id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                    {member.arrears > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded">
                        {member.arrears} months in arrears
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    ID: {member.memberId || 'N/A'} | Contact: {member.contact || 'N/A'} | 
                    Total Paid: {member.totalPaid} | Months Covered: {member.monthsCovered}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(member)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(member)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">
              {editingMember ? 'Edit Member' : 'Add Member'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Member ID</label>
                <input
                  type="text"
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Join Date</label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Dues Per Month *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.duesPerMonth}
                  onChange={(e) => setFormData({ ...formData, duesPerMonth: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingMember ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;

