'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, firstName: name }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('auth_token', data.token);
                router.push('/dashboard');
            } else {
                setError(data.error || 'Sign up failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-xl relative">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/8 via-transparent to-transparent blur-3xl"
                />
                <div className="relative bg-[#111111] border border-white/5 rounded-[28px] shadow-[0_20px_80px_rgba(0,0,0,0.55)] px-10 py-12 space-y-8">
                    {/* Title */}
                    <div className="text-center space-y-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/60">Welcome</p>
                        <h1 className="text-4xl font-bold text-white">Create Account</h1>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="block text-sm text-white/70">
                                Name (optional)
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                                placeholder="shelly"
                                className="w-full px-4 py-3.5 rounded-xl bg-[#0b0b0b] border border-white/8 text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10 transition-all text-[15px] shadow-[0_10px_50px_rgba(0,0,0,0.35)]"
                            />
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-sm text-white/70">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="Enter your email"
                                className="w-full px-4 py-3.5 rounded-xl bg-[#0b0b0b] border border-white/8 text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10 transition-all text-[15px] shadow-[0_10px_50px_rgba(0,0,0,0.35)]"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm text-white/70">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                placeholder="Create a password"
                                className="w-full px-4 py-3.5 rounded-xl bg-[#0b0b0b] border border-white/8 text-white placeholder-white/30 focus:outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10 transition-all text-[15px] shadow-[0_10px_50px_rgba(0,0,0,0.35)]"
                            />
                        </div>

                        {/* Sign Up Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-b from-white to-[#dcdcdc] text-black font-semibold shadow-[0_12px_45px_rgba(0,0,0,0.35)] hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </form>

                    {/* Sign In Link */}
                    <div className="text-center pt-2">
                        <p className="text-white/60 text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-white hover:underline font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
