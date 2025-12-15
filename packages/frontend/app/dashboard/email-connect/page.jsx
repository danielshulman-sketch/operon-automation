'use client';

import { Mail, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function EmailConnectPage() {
    const handleGmailConnect = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/oauth/google', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                window.location.href = data.authUrl;
            }
        } catch (error) {
            console.error('Failed to initiate OAuth:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Connect Email
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Connect your email account to start managing your inbox with AI
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Gmail OAuth */}
                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center mb-6">
                        <Mail className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-2">
                        Gmail
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 font-inter mb-6">
                        Connect your Gmail account with OAuth for secure access
                    </p>
                    <button
                        onClick={handleGmailConnect}
                        className="w-full px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform"
                    >
                        Connect Gmail
                    </button>
                </div>

                {/* IMAP (Coming Soon) */}
                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-8 opacity-50">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                        <Mail className="h-8 w-8 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-2">
                        IMAP/SMTP
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 font-inter mb-6">
                        Connect any email provider using IMAP/SMTP
                    </p>
                    <button
                        disabled
                        className="w-full px-6 py-3 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-600 font-plus-jakarta font-semibold cursor-not-allowed"
                    >
                        Coming Soon
                    </button>
                </div>
            </div>
        </div>
    );
}
