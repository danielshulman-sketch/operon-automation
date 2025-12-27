'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, TrendingUp, CheckCircle, XCircle, Plus, CheckSquare } from 'lucide-react';

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0,
        urgent: 0,
    });
    const [tasks, setTasks] = useState([]);
    const [orgStats, setOrgStats] = useState([]);

    useEffect(() => {
        fetchUserData();
        fetchStats();
        fetchTasks();
    }, []);

    useEffect(() => {
        if (user?.isSuperadmin) {
            fetchOrgStats();
        }
    }, [user?.isSuperadmin]);

    const fetchUserData = async () => {
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

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/tasks', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const allTasks = data.tasks || [];
                setStats({
                    pending: allTasks.filter(t => t.status === 'pending').length,
                    inProgress: allTasks.filter(t => t.status === 'in_progress').length,
                    completed: allTasks.filter(t => t.status === 'completed').length,
                    urgent: allTasks.filter(t => t.priority === 'high').length,
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            // Admins fetch from admin endpoint to get assignment info
            const endpoint = user?.isAdmin ? '/api/admin/tasks' : '/api/tasks';
            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    };

    const fetchOrgStats = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/superadmin/organizations', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setOrgStats(data.organizations || []);
            }
        } catch (error) {
            console.error('Failed to fetch org stats:', error);
        }
    };

    const firstName = user?.first_name || 'there';

    const getPriorityBadge = (priority) => {
        const normalized = priority || 'medium';
        const styles = {
            high: 'bg-red-500/15 text-red-300',
            medium: 'bg-orange-500/15 text-orange-300',
            low: 'bg-green-500/15 text-green-300',
        };
        const labels = {
            high: 'High priority',
            medium: 'Medium priority',
            low: 'Low priority',
        };
        return {
            label: labels[normalized] || 'Medium priority',
            styles: styles[normalized] || styles.medium,
        };
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            {/* Header */}
            <header className="pt-2 space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-white/50">Dashboard</p>
                <h1 className="text-4xl font-bold text-white">
                    Welcome back{user?.firstName ? `, ${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)} ` : user?.email ? `, ${user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)} ` : ''}
                </h1>
                <p className="text-white/50 text-sm">Loading...</p>
            </header>

            {user?.isSuperadmin && (
                <section className="bg-[#0f0f0f] rounded-2xl border border-white/5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Superadmin</p>
                            <h2 className="text-2xl font-semibold text-white">Organization Activity</h2>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-white/70">
                                Active:{' '}
                                <span className="text-green-300 font-semibold">
                                    {orgStats.reduce((sum, org) => sum + Number(org.active_user_count || 0), 0)}
                                </span>
                            </div>
                            <div className="text-white/70">
                                Inactive:{' '}
                                <span className="text-red-300 font-semibold">
                                    {orgStats.reduce((sum, org) => sum + Number(org.inactive_user_count || 0), 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {orgStats.length === 0 ? (
                        <p className="text-white/60 text-sm">No organizations found.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {orgStats.map((org) => {
                                const total = Number(org.total_user_count || 0);
                                const active = Number(org.active_user_count || 0);
                                const inactive = Number(org.inactive_user_count || 0);
                                const activePercent = total ? Math.round((active / total) * 100) : 0;
                                return (
                                    <div
                                        key={org.id}
                                        className="bg-[#0c0c0c] rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{org.name}</h3>
                                                <p className="text-xs text-white/50 mt-1">
                                                    {active} active / {inactive} inactive
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-xs bg-blue-500/15 text-blue-300">
                                                {total} users
                                            </span>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                                                <span>Active share</span>
                                                <span>{activePercent}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-[#121212] overflow-hidden border border-white/5">
                                                <div
                                                    className="h-full bg-gradient-to-r from-green-500/70 to-green-300/80"
                                                    style={{ width: `${activePercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between text-xs">
                                            <span className="text-white/50">Open tasks</span>
                                            <span className="text-amber-300 font-semibold">{org.task_count || 0}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                {/* Pending Tasks */}
                <Link href="/dashboard/tasks?status=pending" className="block">
                    <div className="bg-[#0f0f0f] rounded-2xl p-6 border border-white/5 shadow-[0_15px_55px_rgba(0,0,0,0.45)] flex flex-col gap-4 hover:border-white/15 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="text-white/60 text-sm">Today</span>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-white leading-none mb-1">{stats.pending}</p>
                            <p className="text-white/50 text-sm">Pending Tasks</p>
                        </div>
                    </div>
                </Link>

                {/* In Progress */}
                <Link href="/dashboard/tasks?status=in_progress" className="block">
                    <div className="bg-[#0f0f0f] rounded-2xl p-6 border border-white/5 shadow-[0_15px_55px_rgba(0,0,0,0.45)] flex flex-col gap-4 hover:border-white/15 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <span className="text-white/60 text-sm">Active</span>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-white leading-none mb-1">{stats.inProgress}</p>
                            <p className="text-white/50 text-sm">In Progress</p>
                        </div>
                    </div>
                </Link>

                {/* Completed */}
                <Link href="/dashboard/tasks?status=completed" className="block">
                    <div className="bg-[#0f0f0f] rounded-2xl p-6 border border-white/5 shadow-[0_15px_55px_rgba(0,0,0,0.45)] flex flex-col gap-4 hover:border-white/15 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-green-500/15 flex items-center justify-center text-green-400">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <span className="text-white/60 text-sm">This week</span>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-white leading-none mb-1">{stats.completed}</p>
                            <p className="text-white/50 text-sm">Completed</p>
                        </div>
                    </div>
                </Link>

                {/* Urgent */}
                <Link href="/dashboard/tasks?priority=high" className="block">
                    <div className="bg-[#0f0f0f] rounded-2xl p-6 border border-white/5 shadow-[0_15px_55px_rgba(0,0,0,0.45)] flex flex-col gap-4 hover:border-white/15 transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400">
                                <XCircle className="h-5 w-5" />
                            </div>
                            <span className="text-white/60 text-sm">High Priority</span>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-white leading-none mb-1">{stats.urgent}</p>
                            <p className="text-white/50 text-sm">Urgent</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Tasks */}
            <section className="bg-[#0f0f0f] rounded-2xl border border-white/5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Recent Tasks</h2>
                    <button className="text-white/70 hover:text-white text-sm inline-flex items-center gap-2">
                        View all <span aria-hidden="true">-&gt;</span>
                    </button>
                </div>

                {tasks.filter(task => task.status !== 'completed').length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-white/60 mb-4">No active tasks</p>
                        <button className="px-6 py-2.5 rounded-full bg-gradient-to-b from-white to-[#dcdcdc] text-black font-semibold shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:brightness-105 transition-all inline-flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create your first task
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.filter(task => task.status !== 'completed').slice(0, 5).map((task) => {
                            const priorityBadge = getPriorityBadge(task.priority);
                            return (
                                <div
                                    key={task.id}
                                    className="bg-[#0c0c0c] rounded-xl p-4 border border-white/5 hover:border-white/15 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1 flex-1">
                                            <h3 className="text-white font-medium">{task.title}</h3>
                                            {task.description && (
                                                <p className="text-white/60 text-sm">{task.description}</p>
                                            )}
                                            {user?.isAdmin && (task.user_email || task.first_name) && (
                                                <p className="text-white/50 text-xs mt-1">
                                                    Assigned to: {task.first_name ? `${task.first_name} ${task.last_name || ''}` : task.user_email}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 text-xs rounded-full ${priorityBadge.styles}`}>
                                                {priorityBadge.label}
                                            </span>
                                            <span className={`px-2.5 py-1 text-xs rounded-full ${task.status === 'completed'
                                                ? 'bg-green-500/15 text-green-300'
                                                : task.status === 'in_progress'
                                                    ? 'bg-orange-500/15 text-orange-300'
                                                    : 'bg-blue-500/15 text-blue-300'
                                                }`}>
                                                {task.status === 'in_progress' ? 'In Progress' : task.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
