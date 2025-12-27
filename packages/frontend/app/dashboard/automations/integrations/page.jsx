'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, X, Shield, HelpCircle, Lock, BarChart3, TrendingUp, Users as UsersIcon, Mail, Info } from 'lucide-react';
import { supportsOAuth, supportsCredentialAuth } from '../../../lib/integrations';

export default function IntegrationsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connectingIntegration, setConnectingIntegration] = useState(null);
    const [credentials, setCredentials] = useState({});
    const [integrationStats, setIntegrationStats] = useState({});
    const [expandedStats, setExpandedStats] = useState({});
    const [expandedInstructions, setExpandedInstructions] = useState({});
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchIntegrations();
    }, []);

    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            setErrorMessage(error);
        } else {
            setErrorMessage('');
        }
    }, [searchParams]);

    const fetchIntegrations = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/integrations', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setIntegrations(data.integrations);

                // Fetch stats for connected integrations
                const connectedIntegrations = data.integrations.filter(i => i.connected);
                for (const integration of connectedIntegrations) {
                    fetchIntegrationStats(integration.id);
                }
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
                setIntegrationStats(prev => ({
                    ...prev,
                    [integrationId]: data.stats
                }));
            }
        } catch (error) {
            // Stats not available for this integration, silently fail
            console.log(`Stats not available for ${integrationId}:`, error.message);
        }
    };

    const renderStatsSummary = (stats) => {
        if (!stats || typeof stats !== 'object') {
            return null;
        }

        const items = [];

        const addItem = (label, value) => {
            if (value === undefined || value === null || value === '') return;
            items.push({ label, value });
        };

        Object.entries(stats).forEach(([key, value]) => {
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
                <div className="text-xs text-gray-500 dark:text-gray-400 font-inter">
                    No summary available.
                </div>
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

    const getInstructionsText = (integration) => {
        if (!integration?.setupInstructions) return '';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '{APP_URL}';
        return integration.setupInstructions.split('{APP_URL}').join(appUrl);
    };

    const toggleInstructions = (integrationId) => {
        setExpandedInstructions(prev => ({
            ...prev,
            [integrationId]: !prev[integrationId]
        }));
    };

    const handleConnectClick = async (integration, method = 'credentials') => {
        if (method === 'oauth2') {
            if (!integration.oauthReady) {
                setErrorMessage('OAuth configuration missing. Add Client ID/Secret in OAuth Settings.');
                return;
            }
            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch('/api/integrations/oauth/authorize', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ integration: integration.id }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.url) {
                        window.location.href = data.url;
                        return;
                    }
                }
                const error = await res.json();
                setErrorMessage(error.error || 'Failed to start OAuth flow.');
            } catch (error) {
                setErrorMessage('Failed to start OAuth flow.');
            }
            return;
        }
        setConnectingIntegration(integration);
        setCredentials({});
    };

    const handleConnectSubmit = async (e) => {
        e.preventDefault();
        if (!connectingIntegration) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/integrations/credentials', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    integrationName: connectingIntegration.id,
                    credentials: credentials
                }),
            });

            if (res.ok) {
                // alert(`${connectingIntegration.name} connected successfully!`);
                fetchIntegrations();
                setConnectingIntegration(null);
            } else {
                let message = 'Failed to connect';
                try {
                    const error = await res.json();
                    message = error.error || message;
                } catch (parseError) {
                    const text = await res.text();
                    if (text) {
                        message = text;
                    }
                }
                alert(message);
            }
        } catch (error) {
            alert(error?.message || 'Connection failed');
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
                fetchIntegrations();
            }
        } catch (error) {
            alert('Failed to disconnect');
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                    onClick={() => router.push('/dashboard/automations')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Automations
                </button>
                <div>
                    <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                        Integrations
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-inter">
                        Connect your tools to use in automations
                    </p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/automations/integrations/oauth-settings')}
                    className="inline-flex items-center justify-center rounded-xl bg-black text-white px-5 py-2.5 text-sm font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.25)] hover:brightness-110 dark:bg-white dark:text-black"
                >
                    OAuth Settings
                </button>
            </div>

            {errorMessage && (
                <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200 font-inter">
                    {errorMessage}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-500 font-inter">Loading integrations...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.map((integration) => (
                        <div
                            key={integration.id}
                            className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 flex flex-col h-full"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{integration.icon}</div>
                                    <div>
                                        <h3 className="font-plus-jakarta font-semibold text-black dark:text-white">
                                            {integration.name}
                                        </h3>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-inter line-clamp-2">
                                            {integration.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {integration.setupInstructions && (
                                        <button
                                            type="button"
                                            onClick={() => toggleInstructions(integration.id)}
                                            className="rounded-full border border-gray-200 dark:border-gray-700 p-1.5 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                            aria-label="Show setup instructions"
                                        >
                                            <Info className="h-4 w-4" />
                                        </button>
                                    )}
                                    {integration.connected ? (
                                        <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                    ) : (
                                        <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full">
                                            <X className="h-4 w-4 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {expandedInstructions[integration.id] && (
                                <div className="mb-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/20 p-3 text-xs text-blue-900 dark:text-blue-200 whitespace-pre-line">
                                    {getInstructionsText(integration)}
                                </div>
                            )}

                            {/* Stats Section */}
                            {integration.connected && integrationStats[integration.id] && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => setExpandedStats(prev => ({
                                            ...prev,
                                            [integration.id]: !prev[integration.id]
                                        }))}
                                        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-black dark:hover:text-white transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4" />
                                            Statistics
                                        </span>
                                        <TrendingUp className={`h-4 w-4 transition-transform ${expandedStats[integration.id] ? 'rotate-180' : ''}`} />
                                    </button>

                                    {expandedStats[integration.id] && (
                                        <div className="space-y-3 mt-3">
                                            {integration.id === 'mailerlite' ? (
                                                <>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Subscribers</p>
                                                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                                                {integrationStats.mailerlite?.subscribers?.total?.toLocaleString() || 0}
                                                            </p>
                                                        </div>
                                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                                            <p className="text-xs text-green-600 dark:text-green-400 mb-1">Groups</p>
                                                            <p className="text-lg font-bold text-green-700 dark:text-green-300">
                                                                {integrationStats.mailerlite?.groups?.total || 0}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                                        <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Campaigns</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                                                                {integrationStats.mailerlite?.campaigns?.total || 0}
                                                            </p>
                                                            <p className="text-xs text-purple-600 dark:text-purple-400">
                                                                {integrationStats.mailerlite?.campaigns?.sent || 0} sent
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {integrationStats.mailerlite?.groups?.list?.length > 0 && (
                                                        <div className="mt-3">
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Top Groups</p>
                                                            <div className="space-y-1.5">
                                                                {integrationStats.mailerlite.groups.list.slice(0, 3).map(group => (
                                                                    <div key={group.id} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                                                                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{group.name}</span>
                                                                        <span className="text-gray-500 dark:text-gray-400 ml-2">{group.active_count}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                renderStatsSummary(integrationStats[integration.id])
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-auto pt-4">
                                {integration.connected ? (
                                    <button
                                        onClick={() => handleDisconnect(integration)}
                                        className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-inter text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                ) : (
                                    supportsOAuth(integration) && supportsCredentialAuth(integration) ? (
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => handleConnectClick(integration, 'oauth2')}
                                                disabled={!integration.oauthReady}
                                                className="w-full py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-inter font-medium text-sm hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {integration.oauthReady ? 'Connect with OAuth' : 'Missing OAuth Config'}
                                            </button>
                                            <button
                                                onClick={() => handleConnectClick(integration, 'credentials')}
                                                className="w-full py-2.5 rounded-xl border border-black/10 dark:border-white/20 text-black dark:text-white font-inter font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                            >
                                                Connect with API Key
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleConnectClick(integration, supportsOAuth(integration) ? 'oauth2' : 'credentials')}
                                            disabled={supportsOAuth(integration) && !integration.oauthReady}
                                            className="w-full py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-inter font-medium text-sm hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {supportsOAuth(integration) && !integration.oauthReady
                                                ? 'Missing OAuth Config'
                                                : 'Connect'}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Connection Modal */}
            {connectingIntegration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-white/10 shadow-2xl relative">
                        <button
                            onClick={() => setConnectingIntegration(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="text-4xl">{connectingIntegration.icon}</div>
                            <div>
                                <h2 className="text-xl font-bold font-sora text-black dark:text-white">
                                    Connect {connectingIntegration.name}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Enter your credentials to continue
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleConnectSubmit} className="space-y-4">
                            {connectingIntegration.authFields ? (
                                connectingIntegration.authFields.map((field) => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={field.type === 'password' ? 'password' : 'text'} // Simplified for now
                                                required={field.required}
                                                value={credentials[field.name] || ''}
                                                onChange={(e) => setCredentials({
                                                    ...credentials,
                                                    [field.name]: e.target.value
                                                })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                                placeholder={`Enter ${field.label}`}
                                            />
                                            {field.type === 'password' && (
                                                <Lock className="absolute right-3 top-3.5 h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                        {field.help && (
                                            <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                <HelpCircle className="h-3 w-3" />
                                                {field.help}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-xl text-sm">
                                    No specific fields defined. Configuring this integration might require manual setup.
                                </div>
                            )}

                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setConnectingIntegration(null)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-black dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Shield className="h-4 w-4" />
                                    Save & Connect
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
