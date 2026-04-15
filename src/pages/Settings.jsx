import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Bell,
  Users,
  Heart,
  Save,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  CalendarDays,
  Clock,
  Shield,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'appreciation', label: 'Appreciation', icon: Heart },
  { id: 'users', label: 'User Management', icon: Users },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ordinalSuffix = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const DELAY_OPTIONS = [3, 4, 5, 6];
const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => i + 1);

// ─── Main Component ───────────────────────────────────────────────────────────
const Settings = () => {
  const { user } = useAuth();
  const isSuper = user?.role === 'super' || user?.role === 'system';

  const [activeTab, setActiveTab] = useState('reminders');
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Reminder settings
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDay, setReminderDay] = useState(25);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [savingReminder, setSavingReminder] = useState(false);

  // Appreciation settings
  const [appreciationEnabled, setAppreciationEnabled] = useState(false);
  const [appreciationDelayMonths, setAppreciationDelayMonths] = useState(3);
  const [savingAppreciation, setSavingAppreciation] = useState(false);

  // User creation
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'admin' });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const { data } = await api.get('/settings');
      setReminderEnabled(data.settings.reminderEnabled ?? true);
      setReminderDay(data.settings.reminderDay ?? 25);
      setEmailNotifications(data.settings.emailNotifications ?? true);
      setSmsNotifications(data.settings.smsNotifications ?? true);
      setAppreciationEnabled(data.settings.appreciationEnabled ?? false);
      setAppreciationDelayMonths(data.settings.appreciationDelayMonths ?? 3);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveReminder = async () => {
    try {
      setSavingReminder(true);
      await api.patch('/settings', {
        reminderEnabled,
        reminderDay,
        emailNotifications,
        smsNotifications
      });
      toast.success('Reminder settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSavingReminder(false);
    }
  };

  const handleSaveAppreciation = async () => {
    try {
      setSavingAppreciation(true);
      await api.patch('/settings', { appreciationEnabled, appreciationDelayMonths });
      toast.success('Appreciation settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSavingAppreciation(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isSuper) { toast.error('Only super users can create accounts'); return; }
    if (!user?.tenantId) { toast.error('Unable to determine your tenant. Please log out and back in.'); return; }
    try {
      setCreatingUser(true);
      await api.post('/auth/register', { ...userForm, tenantId: user.tenantId });
      toast.success('User created successfully');
      setShowUserModal(false);
      setUserForm({ username: '', email: '', password: '', role: 'admin' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your organisation's notifications, scheduling, and team accounts.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── REMINDER TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'reminders' && (
        <div className="max-w-2xl space-y-5">
          <SectionCard
            icon={<Bell className="w-5 h-5 text-blue-600" />}
            title="Monthly Reminder Schedule"
            subtitle="Automated reminders are sent to members with unpaid dues on the day you choose each month."
          >
            {loadingSettings ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : (
              <div className="space-y-6">
                {/* Enable toggle */}
                <Toggle
                  label="Enable automated reminders"
                  description="When off, the scheduler will not send any automatic reminder emails."
                  enabled={reminderEnabled}
                  onChange={setReminderEnabled}
                  disabled={!isSuper}
                />

                <div className={`space-y-3 ${!reminderEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <Toggle
                    label="Send reminder emails"
                    description="Members with an email address receive the full reminder message by email."
                    enabled={emailNotifications}
                    onChange={setEmailNotifications}
                    disabled={!isSuper}
                  />
                  <Toggle
                    label="Send reminder SMS"
                    description="Members with a phone number on file receive a short SMS reminder."
                    enabled={smsNotifications}
                    onChange={setSmsNotifications}
                    disabled={!isSuper}
                  />
                </div>

                {/* Day picker */}
                <div className={`space-y-2 transition-opacity ${!reminderEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <label className="block text-sm font-medium text-slate-700">
                    Day of month to send reminders
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      value={reminderDay}
                      onChange={(e) => setReminderDay(Number(e.target.value))}
                      disabled={!isSuper || !reminderEnabled}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                    >
                      {DAY_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {ordinalSuffix(d)} of each month
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Sent at 08:00
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Days 29–31 are not available to ensure delivery every month.
                  </p>
                </div>

                {/* Preview */}
                {reminderEnabled && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Next scheduled run</p>
                      <p className="text-sm text-blue-600 mt-0.5">
                        The {ordinalSuffix(reminderDay)} of every month at 08:00.
                        Members with unpaid dues who have an email and/or phone on file will be notified (per your toggles above).
                      </p>
                    </div>
                  </div>
                )}

                {isSuper && (
                  <div className="flex justify-end">
                    <SaveButton loading={savingReminder} onClick={handleSaveReminder} />
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── APPRECIATION TAB ─────────────────────────────────────────────── */}
      {activeTab === 'appreciation' && (
        <div className="max-w-2xl space-y-5">
          <SectionCard
            icon={<Heart className="w-5 h-5 text-purple-600" />}
            title="Appreciation Emails"
            subtitle="Automatically send a heartfelt thank-you email to members who have fully paid 12 months of dues."
          >
            {loadingSettings ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : (
              <div className="space-y-6">
                {/* How it works */}
                <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 space-y-2">
                  <p className="text-sm font-semibold text-purple-800">How it works</p>
                  <ul className="space-y-1">
                    {[
                      'A member pays their dues and reaches 12 full months covered.',
                      'We record the date that milestone was reached.',
                      'After the delay you set below, a warm thank-you email is sent to that member.',
                      'Each member only ever receives one appreciation email.',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-purple-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Enable toggle */}
                <Toggle
                  label="Enable appreciation emails"
                  description="When on, qualifying members receive a thank-you email after the delay period."
                  enabled={appreciationEnabled}
                  onChange={setAppreciationEnabled}
                  disabled={!isSuper}
                />

                {/* Delay picker */}
                <div className={`space-y-2 transition-opacity ${!appreciationEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <label className="block text-sm font-medium text-slate-700">
                    Send appreciation email after
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {DELAY_OPTIONS.map((months) => (
                      <button
                        key={months}
                        type="button"
                        disabled={!isSuper || !appreciationEnabled}
                        onClick={() => setAppreciationDelayMonths(months)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                          appreciationDelayMonths === months
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {months} months
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Minimum 3 months after the 12-month milestone is reached.
                  </p>
                </div>

                {/* Preview */}
                {appreciationEnabled && (
                  <div className="rounded-xl bg-green-50 border border-green-100 p-4 flex items-start gap-3">
                    <Heart className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Example timeline</p>
                      <p className="text-sm text-green-700 mt-0.5">
                        If a member completes 12 months on <strong>1 Jan 2026</strong>, they will receive
                        their appreciation email on or after{' '}
                        <strong>
                          1 {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(0 + appreciationDelayMonths) % 12]} 2026
                        </strong>.
                      </p>
                    </div>
                  </div>
                )}

                {isSuper && (
                  <div className="flex justify-end">
                    <SaveButton loading={savingAppreciation} onClick={handleSaveAppreciation} />
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── USERS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="max-w-2xl space-y-5">
          <SectionCard
            icon={<Shield className="w-5 h-5 text-slate-600" />}
            title="User Management"
            subtitle="Create and manage admin accounts for your organisation. All activity is logged."
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 max-w-sm">
                Super users have full control over settings and users. Admin users have full operational access but cannot change settings.
              </p>
              {isSuper && (
                <button
                  onClick={() => setShowUserModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Create User
                </button>
              )}
            </div>

            {/* Role explanation cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RoleCard
                title="Super User"
                color="blue"
                perms={['Access all features', 'Create / manage users', 'Change organisation settings', 'View all reports']}
              />
              <RoleCard
                title="Admin User"
                color="slate"
                perms={['Record members & payments', 'Send reminders manually', 'View reports', 'Activity is fully logged']}
              />
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Create User Modal ─────────────────────────────────────────────── */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
              <h2 className="text-lg font-bold text-white">Create New User</h2>
              <p className="text-blue-100 text-sm mt-0.5">
                An email with login credentials will be sent automatically.
              </p>
            </div>
            <form onSubmit={handleCreateUser} className="px-6 py-6 space-y-4">
              <Field label="Username *">
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="input-base"
                  placeholder="e.g. john_doe"
                />
              </Field>
              <Field label="Email *">
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="input-base"
                  placeholder="user@example.com"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Login credentials will be sent to this address.
                </p>
              </Field>
              <Field label="Password *">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="input-base pr-10"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Role *">
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="input-base"
                >
                  <option value="admin">Admin</option>
                  <option value="super">Super User</option>
                </select>
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowUserModal(false); setUserForm({ username: '', email: '', password: '', role: 'admin' }); }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-sm font-semibold text-white transition"
                >
                  {creatingUser ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionCard = ({ icon, title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="border-b border-slate-100 px-6 py-5 flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="px-6 py-6">{children}</div>
  </div>
);

const Toggle = ({ label, description, enabled, onChange, disabled }) => (
  <div className="flex items-start gap-4">
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-slate-200'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  </div>
);

const SaveButton = ({ loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
    {loading ? 'Saving…' : 'Save Changes'}
  </button>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    {children}
  </div>
);

const RoleCard = ({ title, color, perms }) => (
  <div className={`rounded-xl border p-4 ${color === 'blue' ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
    <p className={`text-sm font-bold mb-2 ${color === 'blue' ? 'text-blue-800' : 'text-slate-700'}`}>{title}</p>
    <ul className="space-y-1">
      {perms.map((p) => (
        <li key={p} className={`flex items-center gap-1.5 text-xs ${color === 'blue' ? 'text-blue-700' : 'text-slate-500'}`}>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          {p}
        </li>
      ))}
    </ul>
  </div>
);
