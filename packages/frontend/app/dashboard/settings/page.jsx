'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Plus, Trash2, RefreshCw, User, Lock, Bell, Users, Shield, X, Sparkles } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('email');
    const [mailboxes, setMailboxes] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetUser, setResetUser] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resettingPassword, setResettingPassword] = useState(false);
    const [autoDraftSettings, setAutoDraftSettings] = useState({
        enabled: false,
        categories: [],
        loading: false,
        saving: false,
    });
    const [autoSyncSettings, setAutoSyncSettings] = useState({
        enabled: false,
        intervalMinutes: 15,
        loading: false,
        saving: false,
    });
    const [newUser, setNewUser] = useState({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'member',
        isAdmin: false
    });

    useEffect(() => {
        fetchUser();
        fetchMailboxes();
        fetchAutoDraftSettings();
        fetchAutoSyncSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'team' && (user?.isAdmin || user?.isSuperadmin)) {
            fetchTeamMembers();
        }
    }, [activeTab, user]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Settings Page User Data:', data.user); // Debug log
                console.log('Is Admin?', data.user.isAdmin); // Debug log
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

    const fetchAutoDraftSettings = async () => {
        try {
            setAutoDraftSettings((prev) => ({ ...prev, loading: true }));
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/auto-draft-settings', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAutoDraftSettings((prev) => ({
                    ...prev,
                    enabled: Boolean(data.settings?.enabled),
                    categories: data.settings?.categories || [],
                }));
            }
        } catch (error) {
            console.error('Failed to fetch auto draft settings:', error);
        } finally {
            setAutoDraftSettings((prev) => ({ ...prev, loading: false }));
        }
    };

    const fetchAutoSyncSettings = async () => {
        try {
            setAutoSyncSettings((prev) => ({ ...prev, loading: true }));
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/auto-sync-settings', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAutoSyncSettings((prev) => ({
                    ...prev,
                    enabled: Boolean(data.settings?.enabled),
                    intervalMinutes: data.settings?.interval_minutes ?? 15,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch auto sync settings:', error);
        } finally {
            setAutoSyncSettings((prev) => ({ ...prev, loading: false }));
        }
    };

    const toggleAutoDraftCategory = (category) => {
        setAutoDraftSettings((prev) => {
            const next = new Set(prev.categories);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return { ...prev, categories: Array.from(next) };
        });
    };

    const saveAutoDraftSettings = async () => {
        try {
            setAutoDraftSettings((prev) => ({ ...prev, saving: true }));
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/auto-draft-settings', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enabled: autoDraftSettings.enabled,
                    categories: autoDraftSettings.categories,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setAutoDraftSettings((prev) => ({
                    ...prev,
                    enabled: Boolean(data.settings?.enabled),
                    categories: data.settings?.categories || [],
                }));
                alert('Auto draft settings saved');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save auto draft settings');
            }
        } catch (error) {
            alert('Failed to save auto draft settings');
        } finally {
            setAutoDraftSettings((prev) => ({ ...prev, saving: false }));
        }
    };

    const saveAutoSyncSettings = async () => {
        try {
            setAutoSyncSettings((prev) => ({ ...prev, saving: true }));
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/auto-sync-settings', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enabled: autoSyncSettings.enabled,
                    interval_minutes: autoSyncSettings.intervalMinutes,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setAutoSyncSettings((prev) => ({
                    ...prev,
                    enabled: Boolean(data.settings?.enabled),
                    intervalMinutes: data.settings?.interval_minutes ?? 15,
                }));
                alert('Auto sync settings saved');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save auto sync settings');
            }
        } catch (error) {
            alert('Failed to save auto sync settings');
        } finally {
            setAutoSyncSettings((prev) => ({ ...prev, saving: false }));
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

    const fetchTeamMembers = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTeamMembers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch team:', error);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                setShowAddUserModal(false);
                setNewUser({
                    email: '',
                    firstName: '',
                    lastName: '',
                    password: '',
                    role: 'member',
                    isAdmin: false
                });
                fetchTeamMembers();
                alert('User added successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add user');
            }
        } catch (error) {
            alert('Failed to add user');
        }
    };

    const handleRemoveUser = async (userId) => {
        if (!confirm('Are you sure you want to remove this user from your organization?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                fetchTeamMembers();
                alert('User removed successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to remove user');
            }
        } catch (error) {
            alert('Failed to remove user');
        }
    };

    const openResetPasswordModal = (member) => {
        setResetUser(member);
        setResetPassword('');
        setShowResetPasswordModal(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetUser) return;
        if (resetPassword.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }

        try {
            setResettingPassword(true);
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: resetUser.id,
                    newPassword: resetPassword,
                }),
            });

            if (res.ok) {
                setShowResetPasswordModal(false);
                setResetUser(null);
                setResetPassword('');
                alert('Password reset successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to reset password');
            }
        } catch (error) {
            alert('Failed to reset password');
        } finally {
            setResettingPassword(false);
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

                {(user?.isAdmin || user?.isSuperadmin) && (
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === 'team'
                            ? 'text-white border-b-2 border-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Users className="h-4 w-4 inline mr-2" />
                        Team
                    </button>
                )}
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
                <button
                    onClick={() => setActiveTab('automations')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'automations'
                        ? 'text-white border-b-2 border-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    Automations
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
                                                <p className="text-gray-400 text-sm capitalize">{mailbox.provider || 'Custom'}</p>
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
                        <div className="flex flex-wrap gap-3">
                            <button className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                                Save Changes
                            </button>
                            <button
                                onClick={() => router.push('/dashboard/voice-training')}
                                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                            >
                                Train Voice Profile
                            </button>
                        </div>
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

            {/* Automations Tab */}
            {activeTab === 'automations' && (
                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
                    <h2 className="text-xl font-semibold text-white mb-2">Auto Draft Replies</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Automatically generate draft replies based on email categories.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Enable auto drafts</p>
                                <p className="text-gray-400 text-sm">
                                    When enabled, matching emails get a draft saved for review.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={autoDraftSettings.enabled}
                                onChange={(e) =>
                                    setAutoDraftSettings((prev) => ({
                                        ...prev,
                                        enabled: e.target.checked,
                                    }))
                                }
                                className="w-5 h-5"
                            />
                        </div>
                        <div className="pt-4 border-t border-gray-800">
                            <p className="text-white font-medium mb-3">Categories</p>
                            <div className="grid grid-cols-2 gap-3">
                                {['task', 'question', 'approval', 'meeting', 'fyi'].map((category) => (
                                    <label
                                        key={category}
                                        className="flex items-center gap-2 text-gray-300"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={autoDraftSettings.categories.includes(category)}
                                            onChange={() => toggleAutoDraftCategory(category)}
                                            className="w-4 h-4"
                                        />
                                        <span className="capitalize">{category}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={saveAutoDraftSettings}
                            disabled={autoDraftSettings.saving}
                            className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            {autoDraftSettings.saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                    <div className="mt-10 pt-8 border-t border-gray-800">
                        <h3 className="text-lg font-semibold text-white mb-2">Auto Email Sync</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            Automatically sync connected inboxes on a schedule.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">Enable auto sync</p>
                                    <p className="text-gray-400 text-sm">
                                        Sync all connected mailboxes for your account.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={autoSyncSettings.enabled}
                                    onChange={(e) =>
                                        setAutoSyncSettings((prev) => ({
                                            ...prev,
                                            enabled: e.target.checked,
                                        }))
                                    }
                                    className="w-5 h-5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Sync interval (minutes)
                                </label>
                                <select
                                    value={autoSyncSettings.intervalMinutes}
                                    onChange={(e) =>
                                        setAutoSyncSettings((prev) => ({
                                            ...prev,
                                            intervalMinutes: parseInt(e.target.value, 10),
                                        }))
                                    }
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                >
                                    {[5, 10, 15, 30, 60, 120, 240, 720, 1440].map((minutes) => (
                                        <option key={minutes} value={minutes}>
                                            Every {minutes} minutes
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={saveAutoSyncSettings}
                                disabled={autoSyncSettings.saving}
                                className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                {autoSyncSettings.saving ? 'Saving...' : 'Save Auto Sync'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Team Tab */}
            {activeTab === 'team' && (user?.isAdmin || user?.isSuperadmin) && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Team Management</h2>
                            <p className="text-gray-400 text-sm">Manage users in your organization</p>
                        </div>
                        <button
                            onClick={() => setShowAddUserModal(true)}
                            className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add User
                        </button>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead className="bg-[#0d0d0d] border-b border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">User</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Role</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamMembers.map((member) => (
                                    <tr key={member.id} className="border-b border-gray-800 last:border-0 hover:bg-[#0d0d0d] transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white font-medium">
                                                    {member.first_name ? `${member.first_name} ${member.last_name}` : member.email}
                                                </p>
                                                {member.first_name && (
                                                    <p className="text-sm text-gray-400">{member.email}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${member.is_admin
                                                ? 'bg-purple-500/10 text-purple-400'
                                                : 'bg-gray-500/10 text-gray-400'
                                                }`}>
                                                {member.is_admin ? 'Admin' : 'Member'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${member.is_active
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {member.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {member.id !== user.id && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openResetPasswordModal(member)}
                                                        className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                                                        title="Reset Password"
                                                    >
                                                        <Lock className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveUser(member.id)}
                                                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                                        title="Remove User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {teamMembers.length === 0 && (
                            <div className="p-8 text-center text-gray-400">
                                No team members found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setShowAddUserModal(false)}
                >
                    <div
                        className="bg-[#1a1a1a] rounded-2xl border border-gray-800 max-w-md w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Add Team Member</h2>
                            <button
                                onClick={() => setShowAddUserModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={newUser.firstName}
                                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={newUser.lastName}
                                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={newUser.isAdmin}
                                    onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-700 bg-[#0d0d0d]"
                                />
                                <label htmlFor="isAdmin" className="text-gray-400 cursor-pointer select-none">Grant Admin Access</label>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Add Member
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && resetUser && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setShowResetPasswordModal(false)}
                >
                    <div
                        className="bg-[#1a1a1a] rounded-2xl border border-gray-800 max-w-md w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                            <button
                                onClick={() => setShowResetPasswordModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <p className="text-gray-400 text-sm mb-6">
                            Reset password for {resetUser.email}
                        </p>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-2">At least 8 characters.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={resettingPassword}
                                className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                {resettingPassword ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
