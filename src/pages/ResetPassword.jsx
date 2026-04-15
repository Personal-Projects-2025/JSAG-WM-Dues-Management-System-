import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Mail, KeyRound } from 'lucide-react';
import { authService } from '../services/authService.js';
import { toast } from 'react-toastify';
import AuthLightShell from '../components/AuthLightShell.jsx';
import AuthBrandLogo from '../components/AuthBrandLogo.jsx';

const OTP_LENGTH = 6;

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const otpRefs = useRef([]);

  useEffect(() => { otpRefs.current[0]?.focus(); }, []);

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const updated = [...otp]; updated[index] = ''; setOtp(updated);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const updated = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    setOtp(updated);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const otpValue = otp.join('');
  const isOtpComplete = otpValue.length === OTP_LENGTH;

  const strengthOf = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-400', width: 'w-1/4', text: 'text-red-500' };
    if (pwd.length < 8) return { label: 'Fair', color: 'bg-amber-400', width: 'w-2/4', text: 'text-amber-600' };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full', text: 'text-emerald-600' };
    return { label: 'Good', color: 'bg-cyan-500', width: 'w-3/4', text: 'text-cyan-600' };
  };
  const strength = strengthOf(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isOtpComplete) { setError('Please enter the complete 6-digit code.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await authService.resetPassword(email.trim().toLowerCase(), otpValue, newPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(msg);
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setOtp(Array(OTP_LENGTH).fill(''));
        otpRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (success) {
    return (
      <AuthLightShell>
        <div className="w-full max-w-[400px]">
          <div className="w-full rounded-2xl border border-white/70 bg-white/96 px-6 py-6 text-center shadow-[0_12px_48px_-12px_rgba(15,118,168,0.22)] backdrop-blur-sm">
            <AuthBrandLogo className="mb-4" imgClassName="max-h-[64px]" showHomeLink={false} />
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-sm font-bold text-slate-900">Password updated</h1>
            <p className="mt-1 text-xs text-slate-500">You can now sign in with your new password.</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-cyan-700 hover:to-blue-800"
            >
              Sign in
            </button>
          </div>
        </div>
      </AuthLightShell>
    );
  }

  /* ── Main form ── */
  return (
    <AuthLightShell>
      <div className="w-full max-w-[400px]">
        <div className="w-full rounded-2xl border border-white/70 bg-white/96 shadow-[0_12px_48px_-12px_rgba(15,118,168,0.22)] backdrop-blur-sm overflow-hidden">

          {/* Back link — inside card */}
          <div className="border-b border-slate-100 px-5 py-2.5">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </div>

          <div className="px-6 py-5">
            {/* Logo */}
            <AuthBrandLogo className="mb-3" imgClassName="max-h-[64px]" />

            {/* Title */}
            <div className="mb-4 text-center">
              <h1 className="text-sm font-bold text-slate-900">Reset password</h1>
              <p className="mt-0.5 text-xs text-slate-500">Enter your code and choose a new password</p>
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email */}
              <div>
                <label htmlFor="reset-email" className="mb-1 block text-xs font-semibold text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </div>

              {/* OTP */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  6-digit code <span className="font-normal text-slate-400">(paste works)</span>
                </label>
                <div className="flex justify-between gap-1.5" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`h-10 w-10 flex-1 text-center text-base font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-0 sm:h-11 ${
                        digit ? 'border-cyan-500 bg-cyan-50 text-cyan-950' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-400'
                      }`}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                {isOtpComplete && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Code entered
                  </p>
                )}
              </div>

              {/* New password */}
              <div>
                <label htmlFor="new-password" className="mb-1 block text-xs font-semibold text-slate-700">New password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={`${inputCls} pr-14 ${showNew ? 'border-cyan-200/70 bg-gradient-to-br from-cyan-50/80 to-blue-50/40' : ''}`}
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[11px] font-bold text-blue-700">
                    {showNew ? 'Hide' : 'Show'}
                  </button>
                </div>
                {strength && (
                  <div className="mt-1.5">
                    <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                    </div>
                    <p className={`mt-0.5 text-[11px] font-medium ${strength.text}`}>{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirm-password" className="mb-1 block text-xs font-semibold text-slate-700">Confirm password</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className={`${inputCls} pr-14 ${
                      confirmPassword && newPassword !== confirmPassword ? 'bg-red-50 border-red-200 ring-0' :
                      confirmPassword && newPassword === confirmPassword ? 'bg-emerald-50 border-emerald-200 ring-0' :
                      'border-cyan-200/70 bg-gradient-to-br from-cyan-50/80 to-blue-50/40'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[11px] font-bold text-blue-700">
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-0.5 text-[11px] text-red-600">Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isOtpComplete || !newPassword || !confirmPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:from-cyan-700 hover:to-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : 'Save new password'}
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between text-xs">
              <Link to="/forgot-password" className="font-semibold text-blue-700 hover:underline">
                Need a new code?
              </Link>
              <Link to="/login" className="text-slate-400 hover:text-slate-600">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLightShell>
  );
};

export default ResetPassword;
