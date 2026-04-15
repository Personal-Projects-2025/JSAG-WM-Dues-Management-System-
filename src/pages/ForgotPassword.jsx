import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { authService } from '../services/authService.js';
import AuthLightShell from '../components/AuthLightShell.jsx';
import AuthBrandLogo from '../components/AuthBrandLogo.jsx';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60';

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
    <AuthLightShell>
      <div className="w-full max-w-[400px]">
        <div className="w-full rounded-2xl border border-white/70 bg-white/96 shadow-[0_12px_48px_-12px_rgba(15,118,168,0.22)] backdrop-blur-sm overflow-hidden">

          {!sent ? (
            <>
              {/* Back link row — inside the card */}
              <div className="border-b border-slate-100 px-5 py-2.5">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </div>

              <div className="px-6 py-5">
                {/* Logo */}
                <AuthBrandLogo className="mb-3" imgClassName="max-h-[64px]" />

                {/* Page title */}
                <div className="mb-4 text-center">
                  <h1 className="text-sm font-bold text-slate-900">Forgot password?</h1>
                  <p className="mt-0.5 text-xs text-slate-500">We'll email you a 6-digit code</p>
                </div>

                <p className="mb-4 text-center text-xs leading-relaxed text-slate-500">
                  Enter the email on your account. If it's registered, you'll get a code to set a new password.
                </p>

                {error && (
                  <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        required
                        autoFocus
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:from-cyan-700 hover:to-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      'Send reset code'
                    )}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-slate-400">
                  Remembered it?{' '}
                  <Link to="/login" className="font-semibold text-blue-700 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Back link row */}
              <div className="border-b border-slate-100 px-5 py-2.5">
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-700"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Use a different email
                </button>
              </div>

              <div className="px-6 py-5 text-center">
                <AuthBrandLogo className="mb-4" imgClassName="max-h-[64px]" />
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Check your inbox</h2>
                <p className="mt-1.5 text-xs text-slate-600">
                  If <span className="font-semibold text-slate-800">{email}</span> is registered, a 6-digit code has been sent.
                </p>
                <p className="mt-1 text-[11px] text-slate-400">Expires in 15 min — check spam if needed.</p>
                <Link
                  to="/reset-password"
                  state={{ email }}
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-cyan-700 hover:to-blue-800"
                >
                  Enter reset code →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthLightShell>
  );
};

export default ForgotPassword;
