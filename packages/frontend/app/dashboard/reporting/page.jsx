'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Clock, Shield, Users } from 'lucide-react';

const formatMinutes = (minutes) => {
    const total = Number(minutes || 0);
    if (!total) {
        return '0h';
    }

    const hours = total / 60;
    const rounded = Math.round(hours * 10) / 10;
    const label = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
    return `${label}h`;
};

export default function ReportingPage() {
    const [hasAccess, setHasAccess] = useState(null);
    const [organizations, setOrganizations] = useState([]);

    useEffect(() => {
        fetchReporting();
    }, []);

    const fetchReporting = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/reporting/organizations', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setOrganizations(data.organizations || []);
                setHasAccess(true);
                return;
            }

            setHasAccess(false);
        } catch (error) {
            setHasAccess(false);
        }
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
                    Admin Access Required
                </h1>
                <p className="text-gray-400">
                    You don&apos;t have permission to access this page
                </p>
            </div>
        );
    }

    const totalOutstanding = organizations.reduce(
        (sum, org) => sum + Number(org.outstanding_tasks || 0),
        0
    );
    const totalActiveUsers = organizations.reduce(
        (sum, org) => sum + Number(org.active_users_7d || 0),
        0
    );
    const totalActiveMinutes = organizations.reduce(
        (sum, org) => sum + Number(org.active_minutes_7d || 0),
        0
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Reporting
                </p>
                <h1 className="text-3xl font-bold text-white">Organization Activity</h1>
                <p className="text-sm text-white/50">
                    Last 7 days of activity and outstanding work by organization.
                </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-[#0f0f0f] rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-300">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Organizations</p>
                            <p className="text-2xl font-semibold text-white">{organizations.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0f0f0f] rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-300">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Outstanding Tasks</p>
                            <p className="text-2xl font-semibold text-white">{totalOutstanding}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0f0f0f] rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-green-300">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Active Users (7d)</p>
                            <p className="text-2xl font-semibold text-white">{totalActiveUsers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0f0f0f] rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-300">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Active Time (7d)</p>
                            <p className="text-2xl font-semibold text-white">{formatMinutes(totalActiveMinutes)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <section className="bg-[#0f0f0f] rounded-2xl border border-white/5 overflow-x-auto">
                <table className="w-full min-w-[820px]">
                    <thead className="bg-[#0c0c0c] border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-white/50">
                                Organization
                            </th>
                            <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-white/50">
                                Outstanding Tasks
                            </th>
                            <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-white/50">
                                Active Users (7d)
                            </th>
                            <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-white/50">
                                Active Time (7d)
                            </th>
                            <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-white/50">
                                Last Activity
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {organizations.map((org) => {
                            const outstanding = Number(org.outstanding_tasks || 0);
                            const activeUsers = Number(org.active_users_7d || 0);
                            const activeMinutes = Number(org.active_minutes_7d || 0);
                            const lastActivity = org.last_activity_at
                                ? new Date(org.last_activity_at).toLocaleString()
                                : 'No recent activity';

                            return (
                                <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{org.name}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${outstanding
                                                ? 'bg-amber-500/15 text-amber-300'
                                                : 'bg-green-500/15 text-green-300'
                                                }`}
                                        >
                                            {outstanding}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${activeUsers
                                                ? 'bg-blue-500/15 text-blue-300'
                                                : 'bg-white/10 text-white/60'
                                                }`}
                                        >
                                            {activeUsers}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${activeMinutes
                                                ? 'bg-purple-500/15 text-purple-300'
                                                : 'bg-white/10 text-white/60'
                                                }`}
                                        >
                                            {formatMinutes(activeMinutes)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white/60">{lastActivity}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {organizations.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-white/60">No organizations found.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
