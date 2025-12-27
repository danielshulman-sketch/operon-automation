'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Save } from 'lucide-react';

export default function OAuthSettingsPage() {
    const router = useRouter();
    const [integrations, setIntegrations] = useState([]);
    const [formState, setFormState] = useState({});
    const [saving, setSaving] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/integrations/oauth-settings', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setIntegrations(data.integrations || []);
            } else {
                const data = await res.json();
                setErrorMessage(data.error || 'Failed to load OAuth settings.');
            }
        } catch (error) {
            setErrorMessage('Failed to load OAuth settings.');
        }
    };

    const handleChange = (integrationId, field, value) => {
        setFormState((prev) => ({
            ...prev,
            [integrationId]: {
                ...prev[integrationId],
                [field]: value,
            },
        }));
    };

    const handleSave = async (integrationId) => {
        const values = formState[integrationId] || {};
        if (!values.clientId || !values.clientSecret) {
            setErrorMessage('Client ID and Client Secret are required.');
            return;
        }

        try {
            setSaving((prev) => ({ ...prev, [integrationId]: true }));
            setErrorMessage('');
            setSuccessMessage('');
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/integrations/oauth-settings', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    integrationName: integrationId,
                    clientId: values.clientId,
                    clientSecret: values.clientSecret,
                }),
            });

            if (res.ok) {
                setSuccessMessage('OAuth credentials saved.');
                await fetchSettings();
                setFormState((prev) => ({
                    ...prev,
                    [integrationId]: {},
                }));
            } else {
                const data = await res.json();
                setErrorMessage(data.error || 'Failed to save credentials.');
            }
        } catch (error) {
            setErrorMessage('Failed to save credentials.');
        } finally {
            setSaving((prev) => ({ ...prev, [integrationId]: false }));
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-start justify-between gap-6">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/automations/integrations')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Integrations
                    </button>
                    <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                        OAuth Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-inter">
                        Add your OAuth client credentials to enable connections.
                    </p>
                </div>
            </div>

            {(errorMessage || successMessage) && (
                <div className={`rounded-xl border px-4 py-3 text-sm font-inter ${errorMessage
                    ? 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200'
                    : 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200'
                    }`}>
                    {errorMessage || successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {integrations.map((integration) => {
                    const saved = integration.hasClientId && integration.hasClientSecret;
                    const values = formState[integration.id] || {};
                    return (
                        <div
                            key={integration.id}
                            className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 space-y-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-black dark:text-white">
                                        {integration.name}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                                        {integration.description}
                                    </p>
                                </div>
                                {saved && (
                                    <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-semibold">
                                        <CheckCircle className="h-4 w-4" />
                                        Saved
                                    </div>
                                )}
                            </div>

                            {integration.setupInstructions && (
                                <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-900/20 p-3 text-xs text-blue-900 dark:text-blue-200 whitespace-pre-line">
                                    {integration.setupInstructions.replaceAll('{APP_URL}', process.env.NEXT_PUBLIC_APP_URL || '{APP_URL}')}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Client ID
                                    </label>
                                    <input
                                        type="text"
                                        value={values.clientId || ''}
                                        onChange={(e) => handleChange(integration.id, 'clientId', e.target.value)}
                                        placeholder={saved ? 'Saved (enter to replace)' : 'Paste Client ID'}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Client Secret
                                    </label>
                                    <input
                                        type="password"
                                        value={values.clientSecret || ''}
                                        onChange={(e) => handleChange(integration.id, 'clientSecret', e.target.value)}
                                        placeholder={saved ? 'Saved (enter to replace)' : 'Paste Client Secret'}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end">
                                <button
                                    onClick={() => handleSave(integration.id)}
                                    disabled={saving[integration.id]}
                                    className="inline-flex items-center gap-2 rounded-xl bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving[integration.id] ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
