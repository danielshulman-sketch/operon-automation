'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';

export default function EmailConnectPage() {
    const router = useRouter();
    const [provider, setProvider] = useState('gmail');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        imapHost: '',
        imapPort: '993',
        smtpHost: '',
        smtpPort: '587',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const providers = {
        gmail: {
            name: 'Gmail',
            imapHost: 'imap.gmail.com',
            imapPort: '993',
            smtpHost: 'smtp.gmail.com',
            smtpPort: '587',
            note: 'You need to enable "App Passwords" in your Google Account settings',
        },
        outlook: {
            name: 'Outlook/Hotmail',
            imapHost: 'outlook.office365.com',
            imapPort: '993',
            smtpHost: 'smtp.office365.com',
            smtpPort: '587',
        },
        yahoo: {
            name: 'Yahoo Mail',
            imapHost: 'imap.mail.yahoo.com',
            imapPort: '993',
            smtpHost: 'smtp.mail.yahoo.com',
            smtpPort: '587',
            note: 'You need to generate an "App Password" in Yahoo Account Security',
        },
        custom: {
            name: 'Custom IMAP/SMTP',
            imapHost: '',
            imapPort: '993',
            smtpHost: '',
            smtpPort: '587',
        },
    };

    const handleProviderChange = (newProvider) => {
        setProvider(newProvider);
        const config = providers[newProvider];
        setFormData({
            ...formData,
            imapHost: config.imapHost,
            imapPort: config.imapPort,
            smtpHost: config.smtpHost,
            smtpPort: config.smtpPort,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    provider,
                    ...formData,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/dashboard');
            } else {
                setError(data.error || 'Failed to connect email');
            }
        } catch (err) {
            setError('Failed to connect email');
        } finally {
            setLoading(false);
        }
    };

    const currentProvider = providers[provider];

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-white mb-2">Connect Your Email</h1>
                    <p className="text-gray-400">
                        Connect your email account to start managing your inbox with AI
                    </p>
                </div>

                {/* Provider Selection */}
                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Select Email Provider</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(providers).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => handleProviderChange(key)}
                                className={`p-4 rounded-xl border-2 transition-all ${provider === key
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-white" />
                                    <span className="text-white font-medium">{config.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Connection Form */}
                <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
                    <h2 className="text-lg font-semibold text-white mb-4">Email Credentials</h2>

                    {currentProvider.note && (
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-yellow-400 text-sm">{currentProvider.note}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                placeholder="your-email@example.com"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">
                                Password {provider !== 'custom' && '(App Password)'}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {/* IMAP Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">IMAP Host</label>
                                <input
                                    type="text"
                                    value={formData.imapHost}
                                    onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="imap.example.com"
                                    required
                                    disabled={provider !== 'custom'}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">IMAP Port</label>
                                <input
                                    type="number"
                                    value={formData.imapPort}
                                    onChange={(e) => setFormData({ ...formData, imapPort: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    required
                                    disabled={provider !== 'custom'}
                                />
                            </div>
                        </div>

                        {/* SMTP Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">SMTP Host</label>
                                <input
                                    type="text"
                                    value={formData.smtpHost}
                                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="smtp.example.com"
                                    required
                                    disabled={provider !== 'custom'}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">SMTP Port</label>
                                <input
                                    type="number"
                                    value={formData.smtpPort}
                                    onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    required
                                    disabled={provider !== 'custom'}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Connecting...' : 'Connect Email Account'}
                        </button>
                    </div>
                </form>

                {/* Help Text */}
                <div className="mt-6 p-4 bg-[#1a1a1a] rounded-xl border border-gray-800">
                    <h3 className="text-white font-semibold mb-2">Need Help?</h3>
                    <ul className="text-gray-400 text-sm space-y-1">
                        <li>• Gmail: Enable 2FA and create an App Password</li>
                        <li>• Outlook: Use your regular password or App Password</li>
                        <li>• Yahoo: Generate an App Password in Account Security</li>
                        <li>• Custom: Enter your IMAP/SMTP server details</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
