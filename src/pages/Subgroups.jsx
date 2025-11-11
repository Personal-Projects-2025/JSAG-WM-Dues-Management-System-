import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import {
  Loader2,
  Plus,
  Users,
  Search,
  Trophy,
  Edit,
  Trash2,
  ChevronRight,
  User,
  NotepadText,
  X
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const formatCurrency = (value) =>
  typeof value === 'number'
    ? `GHS ${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    : 'GHS 0.00';

const defaultForm = {
  name: '',
  leaderId: ''
};

const Subgroups = () => {
  const { user } = useAuth();
  const [subgroups, setSubgroups] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [selectedSubgroup, setSelectedSubgroup] = useState(null);
  const [formState, setFormState] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role !== 'super') {
      setLoading(false);
      return;
    }
    fetchSubgroups();
    fetchLeaders();
  }, [user]);

  const fetchSubgroups = async () => {
    try {
      setLoading(true);
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
      const [adminsResponse, superResponse] = await Promise.all([
        api.get('/members?role=admin'),
        api.get('/members?role=super').catch(() => ({ data: [] }))
      ]);

      const leaders = [...(adminsResponse.data || []), ...(superResponse.data || [])]
        .filter(Boolean)
        .filter((leader, index, self) =>
          leader && leader._id && self.findIndex((l) => l?._id === leader._id) === index
        );

      setLeaders(leaders);
    } catch (error) {
      toast.error('Failed to load eligible subgroup leaders');
    }
  };

  const filteredSubgroups = useMemo(() => {
    if (!searchTerm) return subgroups;
    const query = searchTerm.toLowerCase();
    return subgroups.filter((sg) => sg.name.toLowerCase().includes(query));
  }, [subgroups, searchTerm]);

  const activityLog = useMemo(() => {
    return [...subgroups]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6)
      .map((sg) => ({
        id: sg._id,
        name: sg.name,
        leader: sg.leaderId?.name,
        createdAt: sg.createdAt
      }));
  }, [subgroups]);

  const openForm = (subgroup = null) => {
    if (subgroup) {
      setSelectedSubgroup(subgroup);
      setFormState({
        name: subgroup.name,
        leaderId: subgroup.leaderId?._id || subgroup.leaderId || ''
      });
    } else {
      setSelectedSubgroup(null);
      setFormState(defaultForm);
    }
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSelectedSubgroup(null);
    setFormState(defaultForm);
  };

  const openDetails = async (subgroupId) => {
    try {
      const response = await api.get(`/subgroups/${subgroupId}`);
      setDetailData(response.data);
      setDetailOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load subgroup details');
    }
  };

  const closeDetails = () => {
    setDetailOpen(false);
    setDetailData(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formState.name || !formState.leaderId) {
      toast.error('Subgroup name and leader are required');
      return;
    }
    try {
      setSaving(true);
      if (selectedSubgroup) {
        await api.put(`/subgroups/${selectedSubgroup._id}`, formState);
        toast.success('Subgroup updated successfully');
      } else {
        await api.post('/subgroups', formState);
        toast.success('Subgroup created successfully');
      }
      closeForm();
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

  if (user?.role !== 'super') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-slate-500">
        <Trophy size={36} />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700">Access restricted</h2>
          <p className="text-sm">Only super administrators can manage subgroups.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        Loading subgroup data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subgroup Management</h1>
          <p className="text-sm text-slate-500">
            Create focused teams, assign leaders, and motivate healthy contribution competition.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm()}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" />
          Create subgroup
        </button>
      </header>

      <SummaryRow subgroups={subgroups} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by subgroup name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              {filteredSubgroups.length} subgroups
            </span>
          </div>

          {filteredSubgroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
              No subgroups found. Adjust your search or create a new one.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredSubgroups.map((subgroup) => (
                <article
                  key={subgroup._id}
                  className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{subgroup.name}</h3>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Leader</p>
                        <p className="text-sm text-slate-600">
                          {subgroup.leaderId
                            ? `${subgroup.leaderId.name}${subgroup.leaderId.memberId ? ` (${subgroup.leaderId.memberId})` : ''}`
                            : 'Not assigned'}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {subgroup.memberCount} member{subgroup.memberCount === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Total collected</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {formatCurrency(Number(subgroup.totalCollected || 0))}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Average / member</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {formatCurrency(Number(subgroup.averagePerMember || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-xs font-medium text-blue-600">
                    <button
                      type="button"
                      onClick={() => openDetails(subgroup._id)}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                    >
                      View details
                      <ChevronRight size={14} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openForm(subgroup)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(subgroup)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <ActivityLog activity={activityLog} />
        </aside>
      </div>

      <SubgroupFormModal
        isOpen={formOpen}
        onClose={closeForm}
        onSubmit={handleSubmit}
        formState={formState}
        setFormState={setFormState}
        leaders={leaders}
        saving={saving}
        editing={Boolean(selectedSubgroup)}
      />

      <SubgroupDetailModal isOpen={detailOpen} onClose={closeDetails} detail={detailData} />
    </div>
  );
};

export default Subgroups;

const SummaryRow = ({ subgroups }) => {
  const totalMembers = subgroups.reduce((sum, sg) => sum + (sg.memberCount || 0), 0);
  const totalCollected = subgroups.reduce(
    (sum, sg) => sum + Number(sg.totalCollected || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Total subgroups</span>
          <Users size={20} className="text-blue-500" />
        </div>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{subgroups.length}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Members assigned</span>
          <Trophy size={20} className="text-purple-500" />
        </div>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{totalMembers}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Total collected</span>
          <NotepadText size={20} className="text-emerald-500" />
        </div>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatCurrency(totalCollected)}
        </p>
      </div>
    </div>
  );
};

const ActivityLog = ({ activity }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
        <p className="text-xs uppercase tracking-wide text-slate-400">Creation timeline</p>
      </div>
    </div>
    {activity.length === 0 ? (
      <p className="mt-4 text-sm text-slate-500">No subgroup actions recorded yet.</p>
    ) : (
      <ul className="mt-4 space-y-3 text-sm">
        {activity.map((entry) => (
          <li key={entry.id} className="flex items-start justify-between rounded-lg border border-slate-200 px-3 py-2">
            <div>
              <p className="font-medium text-slate-800">{entry.name}</p>
              <p className="text-xs text-slate-500">
                {entry.leader ? `Led by ${entry.leader}` : 'Leader not assigned'}
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {entry.createdAt
                ? new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  })
                : '—'}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const SubgroupFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formState,
  setFormState,
  leaders,
  saving,
  editing
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
            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    {editing ? 'Edit subgroup' : 'Create new subgroup'}
                  </Dialog.Title>
                  <p className="text-sm text-slate-500">
                    Subgroups empower leaders to care for members and inspire friendly competition.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={onSubmit} className="space-y-6 px-6 py-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Subgroup name *</label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Faith Builders"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Leader *</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      required
                      value={formState.leaderId}
                      onChange={(e) => setFormState({ ...formState, leaderId: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 pl-9 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      disabled={leaders.length === 0}
                    >
                      <option value="">
                        {leaders.length === 0 ? 'No eligible leaders available' : 'Select a leader…'}
                      </option>
                      {leaders.map((leader) => (
                        <option key={leader._id} value={leader._id}>
                          {leader.name || leader.username}
                          {leader.memberId ? ` (${leader.memberId})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {leaders.length === 0 && (
                    <p className="text-xs text-amber-600">
                      No admins or super users available. Promote a member to admin to use as a leader.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-400">
                    Leaders receive visibility on contribution dashboards to encourage engagement.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || leaders.length === 0}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Saving…
                        </>
                      ) : editing ? (
                        'Save changes'
                      ) : (
                        'Create subgroup'
                      )}
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

const SubgroupDetailModal = ({ isOpen, onClose, detail }) => (
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
            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {detail?.subgroup?.name || 'Subgroup details'}
                  </Dialog.Title>
                  <p className="text-sm text-slate-500">
                    Leader:{' '}
                    {detail?.subgroup?.leaderId?.name || 'Not assigned'}
                  </p>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <InfoTile
                    label="Total collected"
                    value={formatCurrency(Number(detail?.stats?.totalCollected || 0))}
                  />
                  <InfoTile
                    label="Members"
                    value={detail?.stats?.memberCount ?? 0}
                  />
                  <InfoTile
                    label="Average / member"
                    value={formatCurrency(Number(detail?.stats?.averagePerMember || 0))}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Members</h3>
                  {detail?.members?.length ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-2 text-left">Member</th>
                            <th className="px-4 py-2 text-left">Member ID</th>
                            <th className="px-4 py-2 text-left">Contact</th>
                            <th className="px-4 py-2 text-left">Total paid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-600">
                          {detail.members.map((member) => (
                            <tr key={member._id}>
                              <td className="px-4 py-2 font-medium text-slate-800">{member.name}</td>
                              <td className="px-4 py-2">{member.memberId || '—'}</td>
                              <td className="px-4 py-2">{member.contact || '—'}</td>
                              <td className="px-4 py-2 font-semibold text-slate-900">
                                {formatCurrency(Number(member.totalPaid || 0))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No members assigned to this subgroup yet.
                    </p>
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

const InfoTile = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
  </div>
);


