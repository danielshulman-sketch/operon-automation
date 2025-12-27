'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    router.replace('/login');
                    clearTimeout(timeoutId);
                    return;
                }

                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (!isMounted) return;

                if (res.ok) {
                    router.replace('/dashboard');
                } else {
                    localStorage.removeItem('auth_token');
                    router.replace('/login');
                }
            } catch (error) {
                console.error('Session check failed:', error);
                localStorage.removeItem('auth_token');
                router.replace('/login');
            } finally {
                clearTimeout(timeoutId);
            }
        };

        checkSession();

        return () => {
            isMounted = false;
        };
    }, [router]);

    return (
        <div className="min-h-screen bg-[#050c1b] flex items-center justify-center px-6">
            <div className="text-center space-y-4 text-white">
                <div>
                    <p className="font-inter tracking-[0.2em] uppercase">Checking session...</p>
                    <p className="text-sm text-white/70">
                        Hold tight while we route you to the right place.
                    </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                    <Link
                        href="/login"
                        className="px-5 py-2.5 rounded-xl bg-white text-[#050c1b] font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Go to sign in
                    </Link>
                    <Link
                        href="/account/signup"
                        className="px-5 py-2.5 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
                    >
                        Create an account
                    </Link>
                </div>
            </div>
        </div>
    );
}
