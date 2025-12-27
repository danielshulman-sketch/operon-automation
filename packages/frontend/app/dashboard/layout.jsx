'use client';

import { useState } from 'react';
import DashboardSidebar from '../components/DashboardSidebar';
import dynamic from 'next/dynamic';
import { Menu } from 'lucide-react';

const HelpCenterButton = dynamic(() => import('../components/HelpCenterButton'), {
    ssr: false,
});

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#050c1b] text-white">
            <DashboardSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            {isSidebarOpen && (
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    aria-label="Close navigation"
                />
            )}
            <div className="lg:ml-64">
                <div className="lg:hidden px-6 pt-6">
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white"
                        aria-label="Open navigation"
                    >
                        <Menu className="h-4 w-4" />
                        Menu
                    </button>
                </div>
                <main className="min-h-screen px-6 lg:px-10 py-8">
                    {children}
                </main>
                <HelpCenterButton />
            </div>
        </div>
    );
}
