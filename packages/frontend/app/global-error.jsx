'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error('Global app error:', error);
    }, [error]);

    return (
        <html>
            <body className="min-h-screen bg-[#050c1b] text-white flex items-center justify-center px-6">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-3xl font-bold">Operon ran into an issue</h1>
                    <p className="text-white/70">
                        {error?.message || 'An unexpected error occurred. Refresh the page or try again.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="px-6 py-3 rounded-xl bg-white text-[#050c1b] font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Reload page
                    </button>
                </div>
            </body>
        </html>
    );
}
