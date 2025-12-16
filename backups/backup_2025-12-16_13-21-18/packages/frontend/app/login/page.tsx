'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Autm.ai</p>
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="text-slate-600 text-sm">Access your org dashboard and AI assistant.</p>
      </div>
      <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800">Email</label>
          <input className="w-full rounded border border-slate-200 px-3 py-2" placeholder="you@company.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800">Password</label>
          <input className="w-full rounded border border-slate-200 px-3 py-2" placeholder="••••••••" type="password" />
        </div>
        <button type="button" className="w-full rounded bg-blue-600 px-4 py-2 text-white font-semibold">
          Continue
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
