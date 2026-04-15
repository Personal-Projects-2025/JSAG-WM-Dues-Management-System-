import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle2, Loader2, Mail, Sparkles } from 'lucide-react';
import { authService } from '../services/authService.js';
import { toast } from 'react-toastify';
import AppLogo from '../components/AppLogo.jsx';
import AuthPageShell from '../components/AuthPageShell.jsx';

const OTP_LENGTH = 6;

const fieldClass =
  'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white ' +
  'placeholder:text-slate-500 shadow-inner transition focus:border-fuchsia-400/50 focus:outline-none ' +
  'focus:ring-2 focus:ring-fuchsia-500/30';

const otpBoxBase =
  'h-12 w-10 sm:w-11 text-center text-lg font-bold rounded-xl border-2 bg-white/5 transition-all ' +
  'focus:outline-none focus:ring-0 sm:h-14 sm:text-xl';

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

  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const updated = [...otp];
        updated[index] = '';
        setOtp(updated);
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
    pasted.split('').forEach((ch, i) => {
      updated[i] = ch;
    });
    setOtp(updated);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[nextIndex]?.focus();
  };

  const otpValue = otp.join('');
  const isOtpComplete = otpValue.length === OTP_LENGTH;

  const passwordStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { level: 'weak', label: 'Too short', color: 'bg-red-400', width: 'w-1/4' };
    if (pwd.length < 8) return { level: 'fair', label: 'Fair', color: 'bg-amber-400', width: 'w-2/4' };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { level: 'strong', label: 'Strong', color: 'bg-emerald-400', width: 'w-full' };
    return { level: 'good', label: 'Good', color: 'bg-cyan-400', width: 'w-3/4' };
  };

  const strength = passwordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isOtpComplete) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

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

  if (success) {
    return (
      <AuthPageShell>
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-10 text-center shadow-[0_0_80px_-20px_rgba(52,211,153,0.35)] backdrop-blur-2xl">
            <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
              <CheckCircle2 className="h-10 w-10 text-emerald-300" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-white">You&apos;re all set</h1>
            <p className="mt-2 text-sm text-slate-400">
              New password locked in. Sign in whenever you&apos;re ready.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-8 w-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 py-3.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Sign in now
            </button>
          </div>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link
            to="/"
            className="inline-flex rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60"
          >
            <AppLogo />
          </Link>
        </div>
        <Link
          to="/forgot-password"
          className="group mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-fuchsia-300"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          Back
        </Link>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-[0_0_80px_-20px_rgba(168,85,247,0.3)] backdrop-blur-2xl">
          <div className="relative border-b border-white/10 bg-gradient-to-r from-violet-600/40 via-fuchsia-600/30 to-cyan-500/30 px-8 py-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
              New password
            </h1>
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" aria-hidden />
              Code + fresh password = done
            </p>
          </div>

          <div className="px-6 py-8 sm:px-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="reset-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`${fieldClass} pl-11`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  6-digit code
                </label>
                <p className="mb-3 text-xs text-slate-500">From your email (paste works too).</p>
                <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`
                        ${otpBoxBase}
                        ${digit
                          ? 'border-fuchsia-400/70 bg-fuchsia-500/10 text-fuchsia-100'
                          : 'border-white/15 text-white focus:border-fuchsia-400/50'}
                      `}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                {isOtpComplete && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Code entered
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  New password
                </label>
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
                    className={`${fieldClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 transition-colors hover:text-white"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        strength.level === 'weak'
                          ? 'text-red-400'
                          : strength.level === 'fair'
                            ? 'text-amber-400'
                            : strength.level === 'good'
                              ? 'text-cyan-400'
                              : 'text-emerald-400'
                      }`}
                    >
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Confirm
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className={`${fieldClass} pr-12 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-red-400/40 bg-red-500/5'
                        : confirmPassword && newPassword === confirmPassword
                          ? 'border-emerald-400/40 bg-emerald-500/10'
                          : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 transition-colors hover:text-white"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">Doesn&apos;t match yet</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isOtpComplete || !newPassword || !confirmPassword}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  'Save new password'
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link to="/forgot-password" className="text-sm font-medium text-fuchsia-300/90 hover:text-white">
                Need a new code?
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-fuchsia-300/90 hover:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
};

export default ResetPassword;
