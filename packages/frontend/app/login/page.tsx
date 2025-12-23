'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sign in');
        setLoading(false);
        return;
      }

      // Store token and user info
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src="/images/operon-icon.png" alt="Operon" className="h-16 w-auto object-contain" />
        </div>
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Operon</p>
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="text-slate-600 text-sm">Access your org dashboard and AI assistant.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-200 px-3 py-2"
            placeholder="you@company.com"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-200 px-3 py-2"
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Continue'}
        </button>
      </form>
      <div className="text-center">
        <Link className="text-blue-600 font-medium" href="/dashboard">
          Skip to dashboard (demo)
        </Link>
      </div>
    </div>
  );
}
