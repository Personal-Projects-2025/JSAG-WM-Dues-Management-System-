import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import AuthLightShell from '../components/AuthLightShell.jsx';
import AuthBrandLogo from '../components/AuthBrandLogo.jsx';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400/60';

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
    toast.info('Your session is no longer valid. Please sign in again.');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('session');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(user?.role === 'system' ? '/multi-admin' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(usernameOrEmail, password);
      toast.success('Login successful!');
      navigate(data.user?.role === 'system' || data.isSystemUser ? '/multi-admin' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AuthLightShell>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-600" />
          <p className="text-xs font-medium text-slate-400">Loading…</p>
        </div>
      </AuthLightShell>
    );
  }

  return (
    <AuthLightShell>
      <div className="w-full max-w-[400px]">
        <div className="w-full rounded-2xl border border-white/70 bg-white/96 px-6 py-5 shadow-[0_12px_48px_-12px_rgba(15,118,168,0.22)] backdrop-blur-sm">

          {/* Logo */}
          <AuthBrandLogo className="mb-3" imgClassName="max-h-[64px]" />

          {/* Page heading */}
          <p className="mb-4 text-center text-xs text-slate-500">
            Sign in to manage your organization and dues
          </p>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="usernameOrEmail" className="mb-1 block text-xs font-semibold text-slate-700">
                Email or username
              </label>
              <input
                id="usernameOrEmail"
                name="usernameOrEmail"
                type="text"
                required
                autoComplete="username"
                className={inputCls}
                placeholder="you@organization.com"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className={`${inputCls} border-cyan-200/70 bg-gradient-to-br from-cyan-50/80 to-blue-50/40 pr-14`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-bold text-blue-700 hover:text-blue-950"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:from-cyan-700 hover:to-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-4 space-y-1.5 text-center text-xs">
            <Link to="/forgot-password" className="block font-semibold text-blue-700 hover:underline">
              Forgot your password?
            </Link>
            <Link to="/register" className="block text-slate-500 hover:text-blue-700">
              No account?{' '}
              <span className="font-semibold text-slate-700">Register your org</span>
            </Link>
            <Link to="/" className="block pt-0.5 text-slate-400 hover:text-slate-600">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </AuthLightShell>
  );
};

export default Login;
