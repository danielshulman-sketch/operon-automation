'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error('App route error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#050c1b] text-white flex flex-col items-center justify-center px-6 text-center">
            <div className="max-w-md space-y-4">
                <h1 className="text-3xl font-bold">Something went wrong</h1>
                <p className="text-white/70">
                    {error?.message || 'An unexpected error occurred. Please try again.'}
                </p>
                <button
                    type="button"
                    onClick={() => reset()}
                    className="px-6 py-3 rounded-xl bg-white text-[#050c1b] font-semibold hover:bg-gray-100 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
