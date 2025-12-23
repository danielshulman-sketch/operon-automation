'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Plus, Settings } from 'lucide-react';

export default function AutomationsPage() {
    const router = useRouter();
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAutomations();
    }, []);

    const fetchAutomations = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/automations', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAutomations(data.automations);
            }
        } catch (error) {
            console.error('Failed to fetch automations:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Automations
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Connect your tools and automate your workflows
                </p>
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex gap-3">
                <button
                    onClick={() => router.push('/dashboard/automations/create')}
                    className="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Create Automation
                </button>
                <button
                    onClick={() => router.push('/dashboard/automations/integrations')}
                    className="px-6 py-3 rounded-full bg-blue-600 text-white font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center gap-2"
                >
                    <Settings className="h-5 w-5" />
                    Manage Integrations
                </button>
            </div>

            {/* Automations List */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-500 font-inter">Loading automations...</p>
                </div>
            ) : automations.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                    <div className="w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center mx-auto mb-6">
                        <Zap className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-2">
                        No Automations Yet
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 font-inter mb-8 max-w-md mx-auto">
                        Create your first automation to connect Slack, Google Sheets, Notion, and more
                    </p>
                    <button
                        onClick={() => router.push('/dashboard/automations/create')}
                        className="px-8 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center gap-2 mx-auto"
                    >
                        <Plus className="h-5 w-5" />
                        Create First Automation
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {automations.map((automation) => (
                        <div
                            key={automation.id}
                            onClick={() => router.push(`/dashboard/automations/${automation.id}`)}
                            className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 hover:border-black dark:hover:border-white transition-all cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-plus-jakarta font-semibold text-black dark:text-white mb-1">
                                        {automation.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-inter line-clamp-2">
                                        {automation.description || 'No description'}
                                    </p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${automation.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-inter">
                                <Zap className="h-4 w-4" />
                                {(() => {
                                    try {
                                        const steps = Array.isArray(automation.steps)
                                            ? automation.steps
                                            : JSON.parse(automation.steps || '[]');
                                        return `${steps.length} steps`;
                                    } catch (error) {
                                        return '0 steps';
                                    }
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
