'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Circle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(false);

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
    ];

    useEffect(() => {
        fetchTasks();
    }, [filter]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const url = filter === 'all'
                ? '/api/tasks'
                : `/api/tasks?status=${filter}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
        setLoading(false);
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            fetchTasks();
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
            medium: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
            low: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
        };
        return colors[priority] || colors.medium;
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: <Circle className="h-5 w-5 text-gray-400" />,
            in_progress: <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
            completed: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
        };
        return icons[status] || icons.pending;
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Tasks
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Manage tasks extracted from your emails
                </p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-2">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-full font-plus-jakarta font-medium transition-all ${filter === f.id
                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                : 'bg-[#F3F3F3] dark:bg-[#1E1E1E] text-gray-600 dark:text-gray-400 hover:bg-[#E6E6E6] dark:hover:bg-[#333333]'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {loading && tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 font-inter">Loading tasks...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                        <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 font-inter">No tasks found</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 hover:border-black dark:hover:border-white transition-all"
                        >
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => {
                                        const nextStatus = task.status === 'completed' ? 'pending' :
                                            task.status === 'pending' ? 'in_progress' : 'completed';
                                        updateTaskStatus(task.id, nextStatus);
                                    }}
                                    className="flex-shrink-0 mt-1"
                                >
                                    {getStatusIcon(task.status)}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="font-sora font-bold text-lg text-black dark:text-white">
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {task.priority && (
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-plus-jakarta font-semibold ${getPriorityColor(
                                                        task.priority
                                                    )}`}
                                                >
                                                    {task.priority}
                                                </span>
                                            )}
                                            {task.due_date && (
                                                <span className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {task.description && (
                                        <p className="text-gray-600 dark:text-gray-400 font-inter mb-2">
                                            {task.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-500 font-inter">
                                        Created {new Date(task.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
