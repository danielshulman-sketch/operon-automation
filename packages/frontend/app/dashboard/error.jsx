'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({ error, reset }) {
    useEffect(() => {
        console.error('Dashboard error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] rounded-3xl border border-white/10 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center gap-6 text-center text-white p-10">
            <div>
                <p className="text-sm uppercase tracking-[0.35em] text-white/50">Dashboard</p>
                <h1 className="text-3xl font-bold mt-2">We hit a snag loading this view</h1>
            </div>
            <p className="text-white/70 text-base max-w-lg">
                {error?.message || 'Something unexpected happened while rendering the dashboard. Try refreshing the data or return home.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="px-6 py-3 rounded-xl bg-white text-[#050c1b] font-semibold hover:bg-gray-100 transition-colors"
                >
                    Retry loading
                </button>
                <Link
                    href="/dashboard"
                    className="px-6 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                    Go to dashboard
                </Link>
            </div>
        </div>
    );
}
