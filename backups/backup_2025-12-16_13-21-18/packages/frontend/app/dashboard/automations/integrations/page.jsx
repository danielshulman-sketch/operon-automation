'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';

export default function IntegrationsPage() {
    const router = useRouter();
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectingIntegration, setConnectingIntegration] = useState(null);

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const fetchIntegrations = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/integrations', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setIntegrations(data.integrations);
            }
        } catch (error) {
            console.error('Failed to fetch integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (integration) => {
        if (integration.authType === 'api_key' || integration.authType === 'smtp') {
            // Show modal for API key/SMTP input
            const credentials = prompt(`Enter your ${integration.name} credentials (JSON format):`);
            if (!credentials) return;

            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch('/api/integrations/credentials', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        integrationName: integration.id,
                        credentials: JSON.parse(credentials)
                    }),
                });

                if (res.ok) {
                    alert(`${integration.name} connected successfully!`);
                    fetchIntegrations();
                } else {
                    const error = await res.json();
                    alert(error.error || 'Failed to connect');
                }
            } catch (error) {
                alert('Invalid credentials format');
            }
        } else {
            alert('OAuth2 flow coming in Phase 2!');
        }
    };

    const handleDisconnect = async (integration) => {
        if (!confirm(`Disconnect ${integration.name}?`)) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/integrations/credentials?integration=${integration.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                alert(`${integration.name} disconnected`);
                fetchIntegrations();
            }
        } catch (error) {
            alert('Failed to disconnect');
        }
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
                    Integrations
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Connect your tools to use in automations
                </p>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-500 font-inter">Loading integrations...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.map((integration) => (
                        <div
                            key={integration.id}
                            className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{integration.icon}</div>
                                    <div>
                                        <h3 className="font-plus-jakarta font-semibold text-black dark:text-white">
                                            {integration.name}
                                        </h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-inter">
                                            {integration.description}
                                        </p>
                                    </div>
                                </div>
                                {integration.connected ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                    <X className="h-5 w-5 text-gray-400" />
                                )}
                            </div>

                            <div className="mb-4">
                                <p className="text-xs text-gray-500 dark:text-gray-500 font-inter mb-2">
                                    Available actions:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {integration.actions.map((action) => (
                                        <span
                                            key={action}
                                            className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-inter text-gray-700 dark:text-gray-300"
                                        >
                                            {action.replace('_', ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {integration.connected ? (
                                <button
                                    onClick={() => handleDisconnect(integration)}
                                    className="w-full py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-inter text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleConnect(integration)}
                                    className="w-full py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-inter text-sm hover:scale-[0.98] transition-transform"
                                >
                                    Connect
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
