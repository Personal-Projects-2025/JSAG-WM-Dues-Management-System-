import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import AppLogo from '../components/AppLogo.jsx';
import AuthPageShell from '../components/AuthPageShell.jsx';

const inputClass =
  'block w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white ' +
  'placeholder:text-slate-500 shadow-inner transition focus:border-fuchsia-400/50 focus:outline-none ' +
  'focus:ring-2 focus:ring-fuchsia-500/30';

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('session') !== 'invalid') return;
    toast.info('Your session is no longer valid (account or organization may have changed). Please sign in again.');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('session');
        return next;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (user?.role === 'system') {
        navigate('/multi-admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(usernameOrEmail, password);
      toast.success('Login successful!');

      if (data.user?.role === 'system' || data.isSystemUser) {
        navigate('/multi-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AuthPageShell>
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-fuchsia-400" />
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-8 shadow-[0_0_80px_-20px_rgba(217,70,239,0.35)] backdrop-blur-2xl sm:p-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-transparent blur-2xl" />
          <div className="relative">
            <Link
              to="/"
              className="mb-6 flex justify-center outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 rounded-2xl"
            >
              <AppLogo />
            </Link>
            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-[2rem]">
                Welcome back
              </h1>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" aria-hidden />
                Sign in and pick up where you left off
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label htmlFor="usernameOrEmail" className="sr-only">
                  Username or Email
                </label>
                <input
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  type="text"
                  required
                  autoComplete="username"
                  className={`${inputClass} rounded-2xl`}
                  placeholder="Username or email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                />
                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className={`${inputClass} rounded-2xl pr-12`}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 transition-colors hover:text-white focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10">{loading ? 'Signing you in…' : 'Let’s go'}</span>
              </button>

              <div className="space-y-3 pt-1 text-center text-sm">
                <Link
                  to="/forgot-password"
                  className="block font-medium text-fuchsia-300/90 transition hover:text-white"
                >
                  Forgot your password?
                </Link>
                <Link
                  to="/register"
                  className="block py-1 text-slate-400 transition hover:text-cyan-300"
                >
                  New here? <span className="font-semibold text-white">Create your org</span>
                </Link>
                <Link
                  to="/"
                  className="mt-2 inline-block text-xs text-slate-500 transition hover:text-slate-300"
                >
                  ← Back to home
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
};

export default Login;
