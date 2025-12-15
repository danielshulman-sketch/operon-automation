'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Manage your account and preferences
                </p>
            </div>

            <div className="text-center py-20 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
                    <Settings className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-2">
                    Settings Coming Soon
                </h2>
                <p className="text-gray-600 dark:text-gray-400 font-inter max-w-md mx-auto">
                    Configure your account settings, notifications, and preferences
                </p>
            </div>
        </div>
    );
}
