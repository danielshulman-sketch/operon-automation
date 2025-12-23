'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import InfoTooltip from '../../components/InfoTooltip';

export default function APIKeySettings() {
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [googleKey, setGoogleKey] = useState('');
    const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
    const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
    const [hasGoogleKey, setHasGoogleKey] = useState(false);
    const [provider, setProvider] = useState('openai');
    const [model, setModel] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/ai-settings', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setHasOpenAIKey(Boolean(data.settings?.hasOpenAIKey));
                setHasAnthropicKey(Boolean(data.settings?.hasAnthropicKey));
                setHasGoogleKey(Boolean(data.settings?.hasGoogleKey));
                setProvider(data.settings?.provider || 'openai');
                setModel(data.settings?.model || '');
            }
        } catch (error) {
            console.error('Failed to check API key:', error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/ai-settings', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    model,
                    openaiApiKey: openaiKey,
                    anthropicApiKey: anthropicKey,
                    googleApiKey: googleKey,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'API key saved successfully!' });
                setHasOpenAIKey(Boolean(openaiKey) || hasOpenAIKey);
                setHasAnthropicKey(Boolean(anthropicKey) || hasAnthropicKey);
                setHasGoogleKey(Boolean(googleKey) || hasGoogleKey);
                setOpenaiKey('');
                setAnthropicKey('');
                setGoogleKey('');
                setShowKey(false);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save API key' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save API key' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete all saved AI keys for this organization?')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/ai-settings', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'API keys deleted successfully' });
                setHasOpenAIKey(false);
                setHasAnthropicKey(false);
                setHasGoogleKey(false);
            } else {
                setMessage({ type: 'error', text: 'Failed to delete API keys' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete API keys' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-sora font-bold text-black dark:text-white">
                        AI Provider Settings
                    </h1>
                    <InfoTooltip
                        content="Add API keys for the AI providers you use, then choose which model to run for your organization."
                        position="right"
                    />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Configure AI provider keys and pick the default model for your organization
                </p>
            </div>

            {/* Status Card */}
            {(hasOpenAIKey || hasAnthropicKey || hasGoogleKey) && (
                <div className="mb-6 p-4 rounded-xl bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                        <p className="font-plus-jakarta font-semibold text-green-900 dark:text-green-100">
                            AI Keys Configured
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 font-inter">
                            Your organization can use AI features with the configured providers
                        </p>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-inter text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                        Delete Keys
                    </button>
                </div>
            )}

            {/* Instructions */}
            <div className="mb-8 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                <h2 className="text-xl font-sora font-bold text-black dark:text-white mb-4">
                    How to Get Your OpenAI API Key
                </h2>

                <div className="space-y-4 font-inter text-gray-700 dark:text-gray-300">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 font-bold text-blue-600 dark:text-blue-400">
                            1
                        </div>
                        <div>
                            <p className="font-semibold text-black dark:text-white mb-1">
                                Create an OpenAI Account
                            </p>
                            <p className="text-sm mb-2">
                                Go to <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                    platform.openai.com/signup <ExternalLink className="h-3 w-3" />
                                </a> and create an account if you don't have one.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 font-bold text-blue-600 dark:text-blue-400">
                            2
                        </div>
                        <div>
                            <p className="font-semibold text-black dark:text-white mb-1">
                                Add Billing Information
                            </p>
                            <p className="text-sm mb-2">
                                Go to <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                    Billing Settings <ExternalLink className="h-3 w-3" />
                                </a> and add a payment method. You'll need this to use the API.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 font-bold text-blue-600 dark:text-blue-400">
                            3
                        </div>
                        <div>
                            <p className="font-semibold text-black dark:text-white mb-1">
                                Generate API Key
                            </p>
                            <p className="text-sm mb-2">
                                Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                    API Keys Page <ExternalLink className="h-3 w-3" />
                                </a> and click "Create new secret key". Give it a name like "My Organization Chat".
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 font-bold text-blue-600 dark:text-blue-400">
                            4
                        </div>
                        <div>
                            <p className="font-semibold text-black dark:text-white mb-1">
                                Copy and Save Your Key
                            </p>
                            <p className="text-sm mb-2">
                                Copy the API key (starts with <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-xs">sk-</code>).
                                <strong className="text-orange-600 dark:text-orange-400"> You can only see it once!</strong> Paste it below.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-100 font-inter">
                            <p className="font-semibold mb-1"> Pricing Information</p>
                            <p>
                                OpenAI charges based on usage. GPT-4 costs approximately $0.03 per 1K tokens (~750 words).
                                Set usage limits in your OpenAI dashboard to control costs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* API Key Form */}
            <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                <h2 className="text-xl font-sora font-bold text-black dark:text-white mb-4">
                    Provider Keys & Model
                </h2>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            Default Provider
                        </label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="google">Google (Gemini)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            Default Model
                        </label>
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="e.g., gpt-4o-mini / claude-3-5-sonnet-20240620 / gemini-1.5-pro"
                            className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-mono text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-500 font-inter mt-1">
                            Leave blank to use the provider default.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            OpenAI API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-mono text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            Anthropic API Key
                        </label>
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={anthropicKey}
                            onChange={(e) => setAnthropicKey(e.target.value)}
                            placeholder="sk-ant-..."
                            className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-mono text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            Google AI API Key
                        </label>
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={googleKey}
                            onChange={(e) => setGoogleKey(e.target.value)}
                            placeholder="AIza..."
                            className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-mono text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg ${message.type === 'success'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            }`}>
                            <p className="text-sm font-inter">{message.text}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Key className="h-5 w-5" />
                        {isSaving ? 'Saving...' : 'Save AI Settings'}
                    </button>
                </form>
            </div>
        </div>
    );
}

