import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/community');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-card">
            <Landmark size={24} aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Welcome to Civic<span className="text-accent">Voice</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {isLogin ? 'Sign in to continue to your community.' : 'Create an account to start reporting issues.'}
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex justify-center">
            <div className="tabs" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={`tab ${isLogin ? 'active' : ''}`}
                onClick={() => { setIsLogin(true); setError(''); }}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                className={`tab ${!isLogin ? 'active' : ''}`}
                onClick={() => { setIsLogin(false); setError(''); }}
              >
                Register
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={isLogin ? 'Your password' : 'At least 6 characters'}
                minLength={6}
                required
              />
            </div>

            {!isLogin && (
              <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft">
                New accounts are registered as <strong className="text-accent">Residents</strong>. Government
                Official accounts are assigned by an administrator.
              </p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Login' : 'Create Account')}
            </button>
          </form>
        </div>

        <Link to="/" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-accent">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
