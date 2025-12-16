'use client';

import { useEffect, useState } from 'react';
import { Clock, TrendingUp, CheckCircle, XCircle, Plus } from 'lucide-react';

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        pending: 0,
        inProgress: 0,
        completed: 0,
        urgent: 0,
    });
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        fetchUserData();
        fetchStats();
        fetchTasks();
    }, []);

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
            const res = await fetch('/api/tasks', {
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

    const firstName = user?.first_name || 'there';

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            {/* Header */}
            <header className="pt-2 space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-white/50">Dashboard</p>
                <h1 className="text-4xl font-bold text-white">
                    Welcome back, {firstName}
                </h1>
                <p className="text-white/50 text-sm">Loading...</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                {/* Pending Tasks */}
                <div className="bg-[#0f0f0f] rounded-2xl p-6 border border-white/5 shadow-[0_15px_55px_rgba(0,0,0,0.45)] flex flex-col gap-4">
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

                {/* In Progress */}
                <div className="bg-[#0f0f0f] rounded-2xl p-6 border border-white/5 shadow-[0_15px_55px_rgba(0,0,0,0.45)] flex flex-col gap-4">
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

                {/* Completed */}
                <div className="bg-[#0f0f0f] rounded-2xl p-6 border border-white/5 shadow-[0_15px_55px_rgba(0,0,0,0.45)] flex flex-col gap-4">
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

                {/* Urgent */}
                <div className="bg-[#0f0f0f] rounded-2xl p-6 border border-white/5 shadow-[0_15px_55px_rgba(0,0,0,0.45)] flex flex-col gap-4">
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
            </div>

            {/* Recent Tasks */}
            <section className="bg-[#0f0f0f] rounded-2xl border border-white/5 shadow-[0_20px_70px_rgba(0,0,0,0.45)] p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Recent Tasks</h2>
                    <button className="text-white/70 hover:text-white text-sm inline-flex items-center gap-2">
                        View all <span aria-hidden="true">-&gt;</span>
                    </button>
                </div>

                {tasks.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-white/60 mb-4">No tasks yet</p>
                        <button className="px-6 py-2.5 rounded-full bg-gradient-to-b from-white to-[#dcdcdc] text-black font-semibold shadow-[0_10px_40px_rgba(0,0,0,0.35)] hover:brightness-105 transition-all inline-flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create your first task
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.slice(0, 5).map((task) => (
                            <div
                                key={task.id}
                                className="bg-[#0c0c0c] rounded-xl p-4 border border-white/5 hover:border-white/15 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-white font-medium">{task.title}</h3>
                                        {task.description && (
                                            <p className="text-white/60 text-sm">{task.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {task.priority === 'high' && (
                                            <span className="px-2.5 py-1 bg-red-500/15 text-red-300 text-xs rounded-full">
                                                Urgent
                                            </span>
                                        )}
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
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
