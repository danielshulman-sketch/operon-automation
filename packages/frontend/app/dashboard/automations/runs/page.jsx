'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AutomationRunsPage({ params }) {
    const router = useRouter();
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRuns();
        const interval = setInterval(fetchRuns, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchRuns = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const url = params?.id
                ? `/api/automations/runs?automationId=${params.id}`
                : `/api/automations/runs`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setRuns(data.runs);
            }
        } catch (error) {
            console.error('Failed to fetch runs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        if (status === 'failed') return <XCircle className="h-5 w-5 text-red-500" />;
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                {params?.id && (
                    <button
                        onClick={() => router.push(`/dashboard/automations/${params.id}`)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Automation
                    </button>
                )}
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Run History
                </h1>
            </div>

            {loading && runs.length === 0 ? (
                <div className="text-center py-12">Loading...</div>
            ) : runs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No runs found</div>
            ) : (
                <div className="space-y-4">
                    {runs.map(run => (
                        <div key={run.id} className="p-4 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {getStatusIcon(run.status)}
                                <div>
                                    <h3 className="font-semibold text-black dark:text-white">
                                        {run.workflow_name}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Started: {new Date(run.started_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${run.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        run.status === 'failed' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                    }`}>
                                    {run.status.toUpperCase()}
                                </span>
                                {run.error_message && (
                                    <p className="text-xs text-red-500 mt-1 max-w-md truncate">
                                        {run.error_message}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
