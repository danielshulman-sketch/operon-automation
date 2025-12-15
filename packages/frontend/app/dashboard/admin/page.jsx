'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Mail, CheckCircle2, TrendingUp, Plus, X, MoreVertical } from 'lucide-react';

export default function AdminPage() {
    const [hasAccess, setHasAccess] = useState(null);
    const [users, setUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({
        activeUsers: 0,
        drafts7d: 0,
        openTasks: 0,
        emails7d: 0,
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'member',
        isAdmin: false,
    });

    useEffect(() => {
        checkAccess();
    }, []);

    const checkAccess = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setHasAccess(true);
                const data = await res.json();
                setUsers(data.users);
                calculateStats(data.users);
                fetchActivity();
            } else {
                setHasAccess(false);
            }
        } catch (error) {
            setHasAccess(false);
        }
    };

    const calculateStats = (usersData) => {
        const activeUsers = usersData.filter(u => u.is_active).length;
        const drafts7d = usersData.reduce((sum, u) => sum + parseInt(u.drafts_7d || 0), 0);
        const openTasks = usersData.reduce((sum, u) => sum + parseInt(u.tasks_count || 0), 0);

        setStats({
            activeUsers,
            drafts7d,
            openTasks,
            emails7d: 0, // Would need separate query
        });
    };

    const fetchActivity = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/activity', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities);
            }
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewUser({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    role: 'member',
                    isAdmin: false,
                });
                checkAccess();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create user');
            }
        } catch (error) {
            alert('Failed to create user');
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    isActive: !currentStatus,
                }),
            });

            checkAccess();
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const getActivityIcon = (type) => {
        const icons = {
            user_created: '👤',
            email_connected: '📧',
            email_synced: '🔄',
            email_classified: '🏷️',
            draft_generated: '✍️',
            bulk_drafts_generated: '📝',
            voice_profile_trained: '🎤',
            user_signin: '🔑',
        };
        return icons[type] || '📌';
    };

    if (hasAccess === null) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-600 dark:text-gray-400 font-inter">Loading...</p>
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                    <Shield className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Admin Access Required
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    You don't have permission to access this page
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Manage users and monitor platform activity
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">Active Users</span>
                    </div>
                    <p className="text-3xl font-sora font-bold text-black dark:text-white">
                        {stats.activeUsers}
                    </p>
                </div>

                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">Drafts (7d)</span>
                    </div>
                    <p className="text-3xl font-sora font-bold text-black dark:text-white">
                        {stats.drafts7d}
                    </p>
                </div>

                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">Open Tasks</span>
                    </div>
                    <p className="text-3xl font-sora font-bold text-black dark:text-white">
                        {stats.openTasks}
                    </p>
                </div>

                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">Emails (7d)</span>
                    </div>
                    <p className="text-3xl font-sora font-bold text-black dark:text-white">
                        {stats.emails7d}
                    </p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Team Members */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
                            Team Members
                        </h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-medium hover:scale-[0.98] transition-transform flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create User
                        </button>
                    </div>

                    <div className="space-y-4">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-sora font-bold text-lg">
                                            {user.email[0].toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-plus-jakarta font-semibold text-black dark:text-white">
                                                {user.first_name && user.last_name
                                                    ? `${user.first_name} ${user.last_name}`
                                                    : user.email}
                                            </p>
                                            {user.is_admin && (
                                                <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-plus-jakarta font-semibold">
                                                    Admin
                                                </span>
                                            )}
                                            {!user.is_active && (
                                                <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-plus-jakarta font-semibold">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-2">
                                            {user.email}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 font-inter">
                                            {user.drafts_7d} drafts · {user.tasks_count} tasks · {user.actions_7d} actions (7d)
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                                        className="p-2 rounded-full hover:bg-[#F3F3F3] dark:hover:bg-[#333333] transition-colors"
                                    >
                                        <MoreVertical className="h-5 w-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div>
                    <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-6">
                        Activity Feed
                    </h2>

                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-4 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6"
                            >
                                <div className="text-2xl flex-shrink-0">
                                    {getActivityIcon(activity.activity_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-plus-jakarta font-medium text-black dark:text-white mb-1">
                                        {activity.first_name || activity.email}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-1">
                                        {activity.description}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 font-inter">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6E6E6] dark:border-[#333333] max-w-md w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
                                Create User
                            </h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="user@company.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newUser.firstName}
                                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newUser.lastName}
                                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="Min. 8 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Role
                                </label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                >
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={newUser.isAdmin}
                                    onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                                    className="w-4 h-4 rounded border-[#E6E6E6] dark:border-[#333333]"
                                />
                                <label htmlFor="isAdmin" className="text-sm font-inter text-black dark:text-white">
                                    Grant admin access
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform"
                            >
                                Create User
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
