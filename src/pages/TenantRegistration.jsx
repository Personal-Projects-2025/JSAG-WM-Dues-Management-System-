import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Eye, EyeOff, ChevronDown, ChevronUp,
  CheckCircle2, Building2, Shield, Loader2
} from 'lucide-react';
import clsx from 'clsx';
import api from '../services/api.js';
import AppLogo from '../components/AppLogo.jsx';

// ─── Helpers ────────────────────────────────────────────────────────────────

const generateSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map = [
    { label: 'Too short',  color: 'bg-red-400',     textColor: 'text-red-500'     },
    { label: 'Weak',       color: 'bg-red-400',     textColor: 'text-red-500'     },
    { label: 'Fair',       color: 'bg-amber-400',   textColor: 'text-amber-500'   },
    { label: 'Good',       color: 'bg-blue-400',    textColor: 'text-blue-500'    },
    { label: 'Strong',     color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  ];
  return { score, ...map[score] };
};

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Organization', icon: Building2 },
  { id: 2, label: 'Admin Account', icon: Shield    },
];

// ─── Shared style tokens ─────────────────────────────────────────────────────

const inputCls =
  'block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 ' +
  'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
  'focus:border-transparent transition';

const primaryBtn =
  'w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white ' +
  'font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const secondaryBtn =
  'py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors';

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, required, hint, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const TenantRegistration = () => {
  const [step, setStep]               = useState(1);
  const [done, setDone]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [slugTouched, setSlugTouched]   = useState(false);
  const [dbNameTouched, setDbNameTouched] = useState(false);

  const [registrationSessionId, setRegistrationSessionId] = useState(null);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);

  const [formData, setFormData] = useState({
    name:          '',
    slug:          '',
    databaseName:  '',
    adminUsername: '',
    adminPassword: '',
    adminEmail:    '',
    contactEmail:  '',
    contactPhone:  '',
    branding: {
      name:           '',
      primaryColor:   '#3B82F6',
      secondaryColor: '#1E40AF',
    },
  });

  const strength = getPasswordStrength(formData.adminPassword);

  // Simple field setter
  const set = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // Org name drives slug + dbName (unless the user has manually edited them)
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = generateSlug(name);
    setFormData((prev) => ({
      ...prev,
      name,
      slug:         slugTouched   ? prev.slug         : slug,
      databaseName: dbNameTouched ? prev.databaseName : slug.replace(/-/g, '_'),
      branding: { ...prev.branding, name: prev.branding.name || name },
    }));
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    set('slug', e.target.value);
  };

  const handleDbNameChange = (e) => {
    setDbNameTouched(true);
    set('databaseName', e.target.value);
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error('Organization name is required');
      return false;
    }
    if (!formData.slug || !/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error('Slug must use lowercase letters, numbers, and hyphens only');
      return false;
    }
    if (!formData.databaseName || !/^[a-z0-9_-]+$/.test(formData.databaseName)) {
      toast.error('Database name must use lowercase letters, numbers, underscores, and hyphens only');
      return false;
    }
    if (!formData.contactPhone?.trim()) {
      toast.error('Contact phone is required (for SMS verification)');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.adminUsername.trim()) {
      toast.error('Username is required');
      return false;
    }
    if (!formData.adminEmail.trim()) {
      toast.error('Admin email is required');
      return false;
    }
    if (!formData.contactPhone?.trim()) {
      toast.error('Contact phone is required for SMS verification');
      return false;
    }
    if (formData.adminPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (!emailVerified || !phoneVerified) {
      toast.error('Verify your email and phone with the codes we send');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (step !== 2 || registrationSessionId) return;
    (async () => {
      try {
        const { data } = await api.post('/tenant-setup/register/session');
        if (data?.sessionId) setRegistrationSessionId(data.sessionId);
      } catch (err) {
        console.error(err);
        toast.error('Could not start registration session. Refresh and try again.');
      }
    })();
  }, [step, registrationSessionId]);

  const sendEmailCode = async () => {
    if (!registrationSessionId || !formData.adminEmail.trim()) {
      toast.error('Enter admin email first');
      return;
    }
    setOtpBusy(true);
    try {
      await api.post('/tenant-setup/register/verify-email/send', {
        sessionId: registrationSessionId,
        adminEmail: formData.adminEmail.trim()
      });
      toast.success('Check your email for a verification code');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send email code');
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!emailOtp.trim()) {
      toast.error('Enter the email code');
      return;
    }
    setOtpBusy(true);
    try {
      await api.post('/tenant-setup/register/verify-email', {
        sessionId: registrationSessionId,
        adminEmail: formData.adminEmail.trim(),
        otp: emailOtp.trim()
      });
      setEmailVerified(true);
      toast.success('Email verified');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid code');
    } finally {
      setOtpBusy(false);
    }
  };

  const sendPhoneCode = async () => {
    if (!registrationSessionId || !formData.contactPhone?.trim()) {
      toast.error('Enter contact phone first');
      return;
    }
    if (!emailVerified) {
      toast.error('Verify your email first');
      return;
    }
    setOtpBusy(true);
    try {
      await api.post('/tenant-setup/register/verify-phone/send', {
        sessionId: registrationSessionId,
        contactPhone: formData.contactPhone.trim()
      });
      toast.success('Check your phone for an SMS code');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send SMS');
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (!phoneOtp.trim()) {
      toast.error('Enter the SMS code');
      return;
    }
    setOtpBusy(true);
    try {
      await api.post('/tenant-setup/register/verify-phone', {
        sessionId: registrationSessionId,
        contactPhone: formData.contactPhone.trim(),
        otp: phoneOtp.trim()
      });
      setPhoneVerified(true);
      toast.success('Phone verified');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid code');
    } finally {
      setOtpBusy(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await api.post('/tenant-setup/register', {
        ...formData,
        sessionId: registrationSessionId
      });
      setDone(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <Link to="/" className="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <AppLogo />
            </Link>
          </div>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="text-emerald-600" size={36} />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Registration Submitted!</h2>
            <p className="mt-2 text-slate-500 text-sm">
              <span className="font-semibold text-blue-600">{formData.name}</span> has been
              registered and is now pending approval.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-sm text-left space-y-2">
            <p className="font-semibold text-blue-900">What happens next?</p>
            <ul className="space-y-1.5 text-blue-700 list-disc list-inside">
              <li>Your registration is under review</li>
              <li>You will receive a confirmation email shortly</li>
              <li>Once approved, sign in with your admin credentials</li>
            </ul>
          </div>

          <Link
            to="/login"
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
            <AppLogo />
          </Link>
          <p className="mt-2 text-slate-500 text-sm">Register your organization to get started</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-8">

          {/* Step indicator */}
          <div className="flex items-center">
            {STEPS.map((s, idx) => {
              const Icon    = s.icon;
              const active  = step === s.id;
              const isDone  = step > s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                      isDone  ? 'bg-emerald-500 text-white' :
                      active  ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                                'bg-slate-100 text-slate-400'
                    )}>
                      {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                    </div>
                    <span className={clsx(
                      'text-xs font-medium whitespace-nowrap',
                      active  ? 'text-blue-600'   :
                      isDone  ? 'text-emerald-600' :
                                'text-slate-400'
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={clsx(
                      'flex-1 h-0.5 mx-3 mb-4 rounded-full transition-all duration-300',
                      step > s.id ? 'bg-emerald-500' : 'bg-slate-200'
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* ── Step 1: Organization ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Organization Details</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Tell us about your organization</p>
                </div>

                <Field label="Organization Name" required>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Grace Community Church"
                    className={inputCls}
                    autoFocus
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Contact Email">
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => set('contactEmail', e.target.value)}
                      placeholder="contact@org.com"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Contact Phone" required hint="Required — SMS verification code will be sent here">
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => set('contactPhone', e.target.value)}
                      placeholder="e.g. 0244123456"
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* Advanced toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Advanced settings
                </button>

                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <Field label="Slug" hint="Auto-generated — URL-friendly identifier (lowercase, numbers, hyphens)">
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={handleSlugChange}
                        pattern="[a-z0-9-]+"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Database Name" hint="Auto-generated from organization name (lowercase, numbers, underscores)">
                      <input
                        type="text"
                        value={formData.databaseName}
                        onChange={handleDbNameChange}
                        pattern="[a-z0-9_-]+"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => validateStep1() && setStep(2)}
                    className={primaryBtn}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Admin Account ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Admin Account</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    This will be your login to manage{' '}
                    <span className="font-medium text-blue-600">{formData.name}</span>
                  </p>
                </div>

                <Field label="Username" required>
                  <input
                    type="text"
                    value={formData.adminUsername}
                    onChange={(e) => set('adminUsername', e.target.value)}
                    placeholder="Choose a username"
                    className={inputCls}
                    autoFocus
                    autoComplete="username"
                  />
                </Field>

                <Field label="Admin email" required hint="Login email; we will send a verification code">
                  <input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => {
                      set('adminEmail', e.target.value);
                      setEmailVerified(false);
                    }}
                    placeholder="admin@yourorg.com"
                    className={inputCls}
                    autoComplete="email"
                  />
                </Field>

                <p className="text-xs text-slate-500">
                  Phone for SMS verification was entered in step 1 (Contact phone). Change it there if needed.
                </p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <p className="text-sm font-medium text-slate-800">Verify email &amp; phone</p>
                  <div className="flex flex-wrap gap-2 items-end">
                    <button
                      type="button"
                      disabled={otpBusy || !registrationSessionId}
                      onClick={sendEmailCode}
                      className="py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      Send email code
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      placeholder="Email OTP"
                      className={clsx(inputCls, 'max-w-[140px]')}
                    />
                    <button
                      type="button"
                      disabled={otpBusy || emailVerified}
                      onClick={verifyEmailCode}
                      className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {emailVerified ? 'Verified' : 'Verify email'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-end">
                    <button
                      type="button"
                      disabled={otpBusy || !emailVerified || phoneVerified}
                      onClick={sendPhoneCode}
                      className="py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      Send SMS code
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      placeholder="SMS OTP"
                      className={clsx(inputCls, 'max-w-[140px]')}
                    />
                    <button
                      type="button"
                      disabled={otpBusy || phoneVerified}
                      onClick={verifyPhoneCode}
                      className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {phoneVerified ? 'Verified' : 'Verify phone'}
                    </button>
                  </div>
                </div>

                <Field label="Password" required>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.adminPassword}
                      onChange={(e) => set('adminPassword', e.target.value)}
                      placeholder="Min. 6 characters"
                      className={clsx(inputCls, 'pr-10')}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {formData.adminPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={clsx(
                              'h-1 flex-1 rounded-full transition-all duration-200',
                              i <= strength.score ? strength.color : 'bg-slate-200'
                            )}
                          />
                        ))}
                      </div>
                      <p className={clsx('text-xs', strength.textColor)}>{strength.label}</p>
                    </div>
                  )}
                </Field>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={secondaryBtn}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={clsx(primaryBtn, 'flex-1')}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Registering…
                      </span>
                    ) : (
                      'Register Organization'
                    )}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default TenantRegistration;
