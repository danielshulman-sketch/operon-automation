'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandMark from '../../components/BrandMark';

export default function SignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('auth_token', data.token);
                if (typeof window !== 'undefined') {
                    window.location.href = '/dashboard';
                } else {
                    router.replace('/dashboard');
                }
            } else {
                setError(data.error || 'Sign in failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="relative min-h-screen bg-[#050c1b] overflow-hidden p-6 flex items-center justify-center">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -left-10 w-72 h-72 bg-blue-600/20 blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[140px]" />
            </div>
            <div className="w-full max-w-md relative">
                <div className="flex flex-col items-center text-center text-white mb-8">
                    <BrandMark size={64} priority className="justify-center" tagline="" />
                    <p className="text-sm uppercase tracking-[0.35em] text-white/60">Operon</p>
                    <h1 className="text-3xl font-bold mt-1">Welcome back</h1>
                    <p className="text-white/70 text-sm mt-2">Sign in to continue automating your workflows</p>
                </div>
                <div className="bg-white rounded-3xl p-10 shadow-[0_30px_100px_rgba(5,12,27,0.45)] border border-white/60">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 text-left">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@company.com"
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#050c1b] focus:ring-2 focus:ring-[#1d4ed8]/40 transition-all text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#050c1b] focus:ring-2 focus:ring-[#1d4ed8]/40 transition-all text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-[#050c1b] text-white font-semibold hover:bg-[#081533] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4 text-[15px]"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-7 text-center">
                        <p className="text-gray-500 text-sm">
                            Don't have an account?{' '}
                            <Link href="/account/signup" className="text-[#050c1b] font-semibold hover:underline">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
