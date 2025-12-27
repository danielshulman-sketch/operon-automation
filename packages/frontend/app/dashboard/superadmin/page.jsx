'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, Plus, X, Shield, ArrowLeft, UserPlus, Trash2, Key, MoreVertical } from 'lucide-react';

export default function SuperAdminPage() {
    const [hasAccess, setHasAccess] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [orgUsers, setOrgUsers] = useState([]);
    const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [newOrg, setNewOrg] = useState({
        name: '',
        maxUsers: 5,
        adminEmail: '',
        adminPassword: '',
        adminFirstName: '',
        adminLastName: '',
    });
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'member',
        isAdmin: false,
    });
    const [resetPassword, setResetPassword] = useState({
        userId: '',
        newPassword: '',
    });

    useEffect(() => {
        fetchOrganizations();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdownId) {
                const dropdown = event.target.closest('[data-dropdown]');
                if (!dropdown) {
                    setOpenDropdownId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

    const fetchOrganizations = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/superadmin/organizations', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setHasAccess(true);
                const data = await res.json();
                setOrganizations(data.organizations);
            } else {
                setHasAccess(false);
            }
        } catch (error) {
            setHasAccess(false);
        }
    };

    const fetchOrgUsers = async (orgId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/superadmin/organizations/${orgId}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedOrg(data.organization);
                setOrgUsers(data.users);
            } else {
                alert('Failed to fetch organization users');
            }
        } catch (error) {
            alert('Failed to fetch organization users');
        }
    };

    const handleCreateOrg = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/superadmin/organizations', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newOrg),
            });

            if (res.ok) {
                setShowCreateOrgModal(false);
                setNewOrg({
                    name: '',
                    maxUsers: 5,
                    adminEmail: '',
                    adminPassword: '',
                    adminFirstName: '',
                    adminLastName: '',
                });
                fetchOrganizations();
                alert('Organization created successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create organization');
            }
        } catch (error) {
            alert('Failed to create organization');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/superadmin/organizations/${selectedOrg.id}/users`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                setShowCreateUserModal(false);
                setNewUser({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    role: 'member',
                    isAdmin: false,
                });
                fetchOrgUsers(selectedOrg.id);
                alert('User created successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create user');
            }
        } catch (error) {
            alert('Failed to create user');
        }
    };

    const handleDeleteOrganization = async (orgId, orgName) => {
        if (!confirm(`Are you sure you want to delete "${orgName}"? This will remove all users, data, and cannot be undone!`)) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/superadmin/organizations?orgId=${orgId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                fetchOrganizations();
                if (selectedOrg?.id === orgId) {
                    setSelectedOrg(null);
                    setOrgUsers([]);
                }
                alert('Organization deleted successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete organization');
            }
        } catch (error) {
            alert('Failed to delete organization');
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!confirm(`Are you sure you want to remove ${userEmail} from this organization?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/superadmin/organizations/${selectedOrg.id}/users?userId=${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                fetchOrgUsers(selectedOrg.id);
                alert('User removed successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to remove user');
            }
        } catch (error) {
            alert('Failed to remove user');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/superadmin/organizations/${selectedOrg.id}/users`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: resetPassword.userId,
                    newPassword: resetPassword.newPassword,
                }),
            });

            if (res.ok) {
                setShowResetPasswordModal(false);
                setResetPassword({ userId: '', newPassword: '' });
                setSelectedUser(null);
                alert('Password reset successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to reset password');
            }
        } catch (error) {
            alert('Failed to reset password');
        }
    };

    const openResetPasswordModal = (user) => {
        setSelectedUser(user);
        setResetPassword({ userId: user.id, newPassword: '' });
        setShowResetPasswordModal(true);
    };

    const handleOrgClick = (org) => {
        fetchOrgUsers(org.id);
    };

    const handleBackToOrgs = () => {
        setSelectedOrg(null);
        setOrgUsers([]);
        fetchOrganizations();
    };

    if (hasAccess === null) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <Shield className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Superadmin Access Required
                </h1>
                <p className="text-gray-400">
                    You don't have permission to access this page
                </p>
            </div>
        );
    }

    // Organization Detail View
    if (selectedOrg) {
        return (
            <div className="p-8">
                <button
                    onClick={handleBackToOrgs}
                    className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Organizations
                </button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{selectedOrg.name}</h1>
                        <p className="text-gray-400">
                            {orgUsers.filter(u => u.is_active).length} / {selectedOrg.max_users} users
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateUserModal(true)}
                        className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        <UserPlus className="h-5 w-5" />
                        Add User
                    </button>
                </div>

                {/* Users Table */}
                <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-x-auto">
                    <table className="w-full min-w-[720px]">
                        <thead className="bg-[#0d0d0d] border-b border-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">User</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Joined</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Activity</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgUsers.map((user) => (
                                <tr key={user.id} className="border-b border-gray-800 hover:bg-[#0d0d0d] transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-white font-medium">
                                                {user.first_name || user.last_name
                                                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                                    : user.email}
                                            </p>
                                            {(user.first_name || user.last_name) && (
                                                <p className="text-sm text-gray-400">{user.email}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${user.is_admin
                                            ? 'bg-purple-500/10 text-purple-400'
                                            : 'bg-gray-500/10 text-gray-400'
                                            }`}>
                                            {user.is_admin ? 'Admin' : user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${user.is_active
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {new Date(user.joined_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4 text-sm">
                                            <span className="text-gray-400">
                                                {user.drafts_7d} drafts
                                            </span>
                                            <span className="text-gray-400">
                                                {user.tasks_count} tasks
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative" data-dropdown>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('Dropdown clicked, current ID:', openDropdownId, 'User ID:', user.id);
                                                    setOpenDropdownId(openDropdownId === user.id ? null : user.id);
                                                }}
                                                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                                            >
                                                <MoreVertical className="h-5 w-5 text-gray-400" />
                                            </button>
                                            {openDropdownId === user.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl z-50">
                                                    <button
                                                        onClick={() => {
                                                            setOpenDropdownId(null);
                                                            openResetPasswordModal(user);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2 rounded-t-xl"
                                                    >
                                                        <Key className="h-4 w-4" />
                                                        Reset Password
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setOpenDropdownId(null);
                                                            handleDeleteUser(user.id, user.email);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2 rounded-b-xl"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Remove User
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {orgUsers.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 mb-4">No users in this organization</p>
                            <button
                                onClick={() => setShowCreateUserModal(true)}
                                className="px-6 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                            >
                                <UserPlus className="h-4 w-4" />
                                Add First User
                            </button>
                        </div>
                    )}
                </div>

                {/* Create User Modal */}
                {showCreateUserModal && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                        onClick={() => setShowCreateUserModal(false)}
                    >
                        <div
                            className="bg-[#1a1a1a] rounded-2xl border border-gray-800 max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Add User to {selectedOrg.name}</h2>
                                <button
                                    onClick={() => setShowCreateUserModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="user@example.com"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.firstName}
                                            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.lastName}
                                            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="Min. 8 characters"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="member">Member</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isAdmin"
                                        checked={newUser.isAdmin}
                                        onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-700 bg-[#0d0d0d] text-blue-500 focus:ring-blue-500"
                                    />
                                    <label htmlFor="isAdmin" className="text-sm text-gray-400">
                                        Grant admin privileges
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                                >
                                    Add User
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Organizations List View
    return (
        <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Organizations</p>
                    <p className="text-2xl font-semibold text-white mt-2">{organizations.length}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Active Users</p>
                    <p className="text-2xl font-semibold text-white mt-2">
                        {organizations.reduce((sum, org) => sum + Number(org.active_user_count || 0), 0)}
                    </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-gray-800">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Inactive Users</p>
                    <p className="text-2xl font-semibold text-white mt-2">
                        {organizations.reduce((sum, org) => sum + Number(org.inactive_user_count || 0), 0)}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Superadmin Dashboard</h1>
                    <p className="text-gray-400">Manage all organizations and their users</p>
                </div>
                <button
                    onClick={() => setShowCreateOrgModal(true)}
                    className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Create Organization
                </button>
            </div>

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map((org) => (
                    <div
                        key={org.id}
                        className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-all relative group"
                    >
                        <div
                            onClick={() => handleOrgClick(org)}
                            className="cursor-pointer"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-white mb-1 truncate" title={org.name}>{org.name}</h3>
                                    <p className="text-sm text-gray-400">
                                        Created {new Date(org.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                                <div>
                                    <p className="text-gray-500 text-xs mb-1">Active Users</p>
                                    <p className="text-white font-semibold">{org.active_user_count || 0}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs mb-1">Inactive Users</p>
                                    <p className="text-white font-semibold">{org.inactive_user_count || 0}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                    <span>Total Users</span>
                                    <span>{org.total_user_count || 0}</span>
                                </div>
                                <div className="h-2 rounded-full bg-[#0d0d0d] overflow-hidden border border-gray-800">
                                    <div
                                        className="h-full bg-green-500/60"
                                        style={{
                                            width: org.total_user_count
                                                ? `${Math.round((org.active_user_count / org.total_user_count) * 100)}%`
                                                : '0%',
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                                    <span>Open Tasks</span>
                                    <span>{org.task_count || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrganization(org.id, org.name);
                            }}
                            className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Organization"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            {organizations.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No organizations yet</p>
                    <button
                        onClick={() => setShowCreateOrgModal(true)}
                        className="px-6 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create First Organization
                    </button>
                </div>
            )}

            {/* Create Organization Modal */}
            {showCreateOrgModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setShowCreateOrgModal(false)}
                >
                    <div
                        className="bg-[#1a1a1a] rounded-2xl border border-gray-800 max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Create Organization</h2>
                            <button
                                onClick={() => setShowCreateOrgModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrg} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Organization Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newOrg.name}
                                    onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Acme Inc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Max Users (Subscription Limit) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={newOrg.maxUsers}
                                    onChange={(e) => setNewOrg({ ...newOrg, maxUsers: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="5"
                                />
                                <p className="text-gray-500 text-xs mt-1">
                                    Number of users this organization can have
                                </p>
                            </div>

                            <div className="pt-4 border-t border-gray-800">
                                <h3 className="text-sm font-medium text-white mb-4">Admin User</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={newOrg.adminEmail}
                                            onChange={(e) => setNewOrg({ ...newOrg, adminEmail: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                            placeholder="admin@acme.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newOrg.adminFirstName}
                                                onChange={(e) => setNewOrg({ ...newOrg, adminFirstName: e.target.value })}
                                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newOrg.adminLastName}
                                                onChange={(e) => setNewOrg({ ...newOrg, adminLastName: e.target.value })}
                                                className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={newOrg.adminPassword}
                                            onChange={(e) => setNewOrg({ ...newOrg, adminPassword: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                            placeholder="Min. 8 characters"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Create Organization
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setShowResetPasswordModal(false)}
                >
                    <div
                        className="bg-[#1a1a1a] rounded-2xl border border-gray-800 max-w-md w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                Reset Password
                            </h2>
                            <button
                                onClick={() => setShowResetPasswordModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-400 mb-6">
                            Reset password for: <strong className="text-white">{selectedUser?.email}</strong>
                        </p>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    New Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={resetPassword.newPassword}
                                    onChange={(e) => setResetPassword({ ...resetPassword, newPassword: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Min. 8 characters"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Reset Password
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
