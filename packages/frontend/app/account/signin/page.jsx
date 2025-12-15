'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
                router.push('/dashboard');
            } else {
                setError(data.error || 'Sign in failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Card Container */}
                <div className="bg-[#1a1a1a] rounded-3xl p-12 border border-gray-800/50">
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-10 text-center">
                        Sign In
                    </h1>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2.5 font-medium">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                                className="w-full px-4 py-3.5 bg-[#0d0d0d] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors text-sm"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2.5 font-medium">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                                className="w-full px-4 py-3.5 bg-[#0d0d0d] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-gray-700 transition-colors text-sm"
                            />
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 text-[15px]"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-7 text-center">
                        <p className="text-gray-500 text-sm">
                            Don't have an account?{' '}
                            <Link href="/account/signup" className="text-white hover:underline font-medium">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
