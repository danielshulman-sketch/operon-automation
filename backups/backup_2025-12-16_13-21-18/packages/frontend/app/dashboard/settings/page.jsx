'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Plus, Trash2, RefreshCw, User, Lock, Bell } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('email');
    const [mailboxes, setMailboxes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUser();
        fetchMailboxes();
    }, []);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const fetchMailboxes = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/connect', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMailboxes(data.mailboxes || []);
            }
        } catch (error) {
            console.error('Failed to fetch mailboxes:', error);
        }
    };

    const syncMailbox = async (mailboxId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ mailboxId }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Synced ${data.emailCount} emails!`);
                fetchMailboxes();
            } else {
                alert(data.error || 'Sync failed');
            }
        } catch (error) {
            alert('Sync failed');
        } finally {
            setLoading(false);
        }
    };

    const deleteMailbox = async (mailboxId) => {
        if (!confirm('Are you sure you want to remove this email account?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/email/connect/${mailboxId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchMailboxes();
            }
        } catch (error) {
            console.error('Failed to delete mailbox:', error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('email')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'email'
                            ? 'text-white border-b-2 border-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Accounts
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'profile'
                            ? 'text-white border-b-2 border-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <User className="h-4 w-4 inline mr-2" />
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'notifications'
                            ? 'text-white border-b-2 border-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Bell className="h-4 w-4 inline mr-2" />
                    Notifications
                </button>
            </div>

            {/* Email Accounts Tab */}
            {activeTab === 'email' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Connected Email Accounts</h2>
                            <p className="text-gray-400 text-sm">Manage your connected email accounts</p>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard/email-connect')}
                            className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Email Account
                        </button>
                    </div>

                    {mailboxes.length === 0 ? (
                        <div className="bg-[#1a1a1a] rounded-2xl p-12 border border-gray-800 text-center">
                            <Mail className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 mb-4">No email accounts connected</p>
                            <button
                                onClick={() => router.push('/dashboard/email-connect')}
                                className="px-6 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Connect Your First Email
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {mailboxes.map((mailbox) => (
                                <div
                                    key={mailbox.id}
                                    className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <Mail className="h-6 w-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold">{mailbox.email_address}</h3>
                                                <p className="text-gray-400 text-sm capitalize">{mailbox.provider}</p>
                                                {mailbox.last_sync_at && (
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        Last synced: {new Date(mailbox.last_sync_at).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => syncMailbox(mailbox.id)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                                Sync Now
                                            </button>
                                            <button
                                                onClick={() => deleteMailbox(mailbox.id)}
                                                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                                        <div>
                                            <p className="text-gray-500 text-xs">IMAP Server</p>
                                            <p className="text-white text-sm">{mailbox.imap_host}:{mailbox.imap_port}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">SMTP Server</p>
                                            <p className="text-white text-sm">{mailbox.smtp_host}:{mailbox.smtp_port}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
                    <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">First Name</label>
                            <input
                                type="text"
                                value={user?.first_name || ''}
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                placeholder="Your first name"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Last Name</label>
                            <input
                                type="text"
                                value={user?.last_name || ''}
                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                placeholder="Your last name"
                            />
                        </div>
                        <button className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
                    <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-white font-medium">Email Notifications</p>
                                <p className="text-gray-400 text-sm">Receive notifications for new emails</p>
                            </div>
                            <input type="checkbox" className="w-5 h-5" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-white font-medium">Task Reminders</p>
                                <p className="text-gray-400 text-sm">Get reminded about pending tasks</p>
                            </div>
                            <input type="checkbox" className="w-5 h-5" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-white font-medium">Weekly Summary</p>
                                <p className="text-gray-400 text-sm">Receive weekly activity summary</p>
                            </div>
                            <input type="checkbox" className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
