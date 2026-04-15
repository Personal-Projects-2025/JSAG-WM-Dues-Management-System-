import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { authService } from '../services/authService.js';
import AppLogo from '../components/AppLogo.jsx';
import AuthPageShell from '../components/AuthPageShell.jsx';

const fieldClass =
  'w-full rounded-2xl border border-white/15 bg-white/5 pl-11 pr-4 py-3.5 text-sm text-white ' +
  'placeholder:text-slate-500 shadow-inner transition focus:border-fuchsia-400/50 focus:outline-none ' +
  'focus:ring-2 focus:ring-fuchsia-500/30';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          to="/login"
          className="group mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-fuchsia-300"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
          Back to sign in
        </Link>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] shadow-[0_0_80px_-20px_rgba(34,211,238,0.25)] backdrop-blur-2xl">
          <div className="relative border-b border-white/10 bg-gradient-to-r from-fuchsia-600/40 via-violet-600/30 to-cyan-500/30 px-8 py-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
              Reset link incoming
            </h1>
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-slate-300">
              <Zap className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
              We&apos;ll email you a 6-digit code
            </p>
          </div>

          <div className="px-8 py-8">
            {!sent ? (
              <>
                <p className="mb-6 text-center text-sm leading-relaxed text-slate-400">
                  Drop the email on your account. If it&apos;s registered, you&apos;ll get a code to set a new password.
                </p>

                {error && (
                  <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="email"
                        type="email"
                        required
                        autoFocus
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Send reset code'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="py-2 text-center">
                <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                </div>
                <h2 className="font-display text-lg font-bold text-white">Check your inbox</h2>
                <p className="mt-2 text-sm text-slate-400">
                  If <span className="font-medium text-slate-200">{email}</span> is on file, a 6-digit code is headed your way.
                </p>
                <p className="mt-2 text-xs text-slate-500">Expires in 15 min — peek spam if needed.</p>
                <Link
                  to="/reset-password"
                  state={{ email }}
                  className="mt-8 flex w-full items-center justify-center rounded-full bg-white/10 py-3.5 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/15"
                >
                  Enter code →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                  className="mt-4 text-sm text-slate-500 transition hover:text-fuchsia-300"
                >
                  Use a different email
                </button>
              </div>
            )}
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

export default ForgotPassword;
