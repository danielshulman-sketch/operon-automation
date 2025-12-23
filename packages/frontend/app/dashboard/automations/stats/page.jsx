'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3 } from 'lucide-react';

export default function IntegrationStatsPage() {
    const router = useRouter();
    const [integrations, setIntegrations] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/integrations', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                return;
            }

            const data = await res.json();
            const connected = data.integrations.filter((item) => item.connected);
            setIntegrations(connected);

            for (const integration of connected) {
                fetchIntegrationStats(integration.id);
            }
        } catch (error) {
            console.error('Failed to fetch integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIntegrationStats = async (integrationId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/integrations/${integrationId}/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setStats((prev) => ({
                    ...prev,
                    [integrationId]: data.stats,
                }));
            }
        } catch (error) {
            console.log(`Stats not available for ${integrationId}:`, error.message);
        }
    };

    const renderStatsSummary = (summary) => {
        if (!summary || typeof summary !== 'object') {
            return (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-inter">
                    No stats available.
                </p>
            );
        }

        const items = [];

        const addItem = (label, value) => {
            if (value === undefined || value === null || value === '') return;
            items.push({ label, value });
        };

        Object.entries(summary).forEach(([key, value]) => {
            if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
                addItem(key, value);
                return;
            }

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if (typeof value.total === 'number') {
                    addItem(`${key} total`, value.total);
                }
                if (typeof value.count === 'number') {
                    addItem(`${key} count`, value.count);
                }
                if (typeof value.sent === 'number') {
                    addItem(`${key} sent`, value.sent);
                }
            }
        });

        if (items.length === 0) {
            return (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-inter">
                    No stats available.
                </p>
            );
        }

        return (
            <div className="grid grid-cols-2 gap-2">
                {items.slice(0, 6).map((item) => (
                    <div key={item.label} className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {typeof item.value === 'number' ? item.value.toLocaleString() : String(item.value)}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    const toggleExpanded = (integrationId) => {
        setExpanded((prev) => ({
            ...prev,
            [integrationId]: !prev[integrationId],
        }));
    };

    const renderStatsBreakdown = (summary) => {
        if (!summary || typeof summary !== 'object') {
            return (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-inter">
                    No detailed data available.
                </p>
            );
        }

        const lines = [];

        const addLine = (label, value) => {
            if (value === undefined || value === null || value === '') return;
            lines.push(`${label}: ${String(value)}`);
        };

        const addSummaryFields = (prefix, node) => {
            if (!node || typeof node !== 'object') return;
            if (typeof node.total === 'number') addLine(`${prefix} total`, node.total);
            if (typeof node.count === 'number') addLine(`${prefix} count`, node.count);
            if (typeof node.sent === 'number') addLine(`${prefix} sent`, node.sent);
            if (typeof node.active === 'number') addLine(`${prefix} active`, node.active);
            if (typeof node.unsubscribed === 'number') addLine(`${prefix} unsubscribed`, node.unsubscribed);
            if (typeof node.draft === 'number') addLine(`${prefix} draft`, node.draft);
        };

        Object.entries(summary).forEach(([key, value]) => {
            if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
                addLine(key, value);
                return;
            }

            if (Array.isArray(value)) {
                if (value.length > 0) {
                    addLine(`${key} count`, value.length);
                }
                return;
            }

            if (value && typeof value === 'object') {
                addSummaryFields(key, value);
            }
        });

        if (lines.length === 0) {
            return (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-inter">
                    No detailed data available.
                </p>
            );
        }

        return (
            <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-3">
                <div className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                    {lines.slice(0, 12).join('\n')}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.push('/dashboard/automations')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Automations
                </button>
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Integration Stats
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Overview of connected app activity
                </p>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-500 font-inter">Loading stats...</p>
                </div>
            ) : integrations.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                    <div className="w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center mx-auto mb-6">
                        <BarChart3 className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-2">
                        No Connected Apps
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 font-inter max-w-md mx-auto">
                        Connect an integration to start viewing stats here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.map((integration) => (
                        <div
                            key={integration.id}
                            className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6"
                        >
                            <button
                                type="button"
                                onClick={() => toggleExpanded(integration.id)}
                                className="w-full text-left"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="text-3xl">{integration.icon}</div>
                                    <div className="flex-1">
                                        <h3 className="font-plus-jakarta font-semibold text-black dark:text-white">
                                            {integration.name}
                                        </h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-inter line-clamp-2">
                                            {integration.description}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {expanded[integration.id] ? 'Hide' : 'View'} details
                                    </span>
                                </div>
                            </button>

                            {renderStatsSummary(stats[integration.id])}

                            {expanded[integration.id] && renderStatsBreakdown(stats[integration.id])}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
