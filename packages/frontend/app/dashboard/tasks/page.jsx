'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Circle, CheckCircle2, Clock, AlertCircle, Plus, X } from 'lucide-react';

export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
    });
    const [creating, setCreating] = useState(false);
    const [updatingPriorityId, setUpdatingPriorityId] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);

    const statusFilters = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
    ];

    const priorityFilters = [
        { id: 'all', label: 'All Priorities' },
        { id: 'high', label: 'High' },
        { id: 'medium', label: 'Medium' },
        { id: 'low', label: 'Low' },
    ];

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (user) {
            fetchTasks();
            if (user.isAdmin) {
                fetchTeamMembers();
            }
        }
    }, [user]);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                console.log('User data loaded:', data.user);
                console.log('Is Admin:', data.user.isAdmin);
                setUser(data.user);
            } else {
                console.error('Failed to fetch user, status:', res.status);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
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
                console.log('Team members loaded:', data.users?.length || 0, 'members');
                setTeamMembers(data.users || []);
            } else {
                console.error('Failed to fetch team members, status:', res.status);
            }
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        }
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            // Always fetch all org tasks
            const url = '/api/tasks';

            console.log('Fetching tasks from:', url, 'User isAdmin:', user?.isAdmin, 'Filter:', filter);

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Tasks response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('Tasks received:', data.tasks?.length || 0, 'tasks');
                setTasks(data.tasks || []);
            } else {
                console.error('Failed to fetch tasks, status:', res.status);
                const errorData = await res.json();
                console.error('Error details:', errorData);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
        setLoading(false);
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        // Optimistically update UI using functional setState
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        ));

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                // Revert on error
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to update task:', error);
            // Revert on error
            fetchTasks();
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTask),
            });

            if (res.ok) {
                setIsCreateModalOpen(false);
                setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to create task:', error);
        }
        setCreating(false);
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
            medium: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
            low: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
        };
        return colors[priority] || colors.medium;
    };

    const updateTaskPriority = async (taskId, newPriority) => {
        // Optimistically update UI using functional setState
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId ? { ...t, priority: newPriority } : t
        ));

        setUpdatingPriorityId(taskId);
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priority: newPriority }),
            });
        } catch (error) {
            console.error('Failed to update priority:', error);
            // Revert on error
            fetchTasks();
        } finally {
            setUpdatingPriorityId(null);
        }
    };

    const updateTaskAssignment = async (taskId, userId) => {
        console.log('Assigning task:', taskId, 'to user:', userId);

        // Optimistically update UI using functional setState
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId ? { ...t, assigned_to: userId || null } : t
        ));

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ assignedTo: userId || null }),
            });

            console.log('Assignment response status:', res.status);

            if (res.ok) {
                alert('Assignment saved successfully!');
            } else {
                const errorData = await res.json();
                console.error('Assignment failed:', errorData);
                alert(`Assignment failed: ${errorData.details || errorData.error || 'Unknown error'}`);
                // Revert on error
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to update assignment:', error);
            // Revert on error
            fetchTasks();
        }
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                        Tasks
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 font-inter">
                        Manage tasks extracted from your emails
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-plus-jakarta font-semibold hover:opacity-90 transition-opacity"
                >
                    <Plus className="h-5 w-5" />
                    Create Task
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 space-y-3">
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 self-center mr-2">Status:</span>
                    {statusFilters.map((f) => (
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
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 self-center mr-2">Priority:</span>
                    {priorityFilters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setPriorityFilter(f.id)}
                            className={`px-4 py-2 rounded-full font-plus-jakarta font-medium transition-all ${priorityFilter === f.id
                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                : 'bg-[#F3F3F3] dark:bg-[#1E1E1E] text-gray-600 dark:text-gray-400 hover:bg-[#E6E6E6] dark:hover:bg-[#333333]'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {loading && tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400 font-inter">Loading tasks...</p>
                    </div>
                ) : (() => {
                    // Apply filters
                    let filteredTasks = tasks;

                    // Status filter
                    if (filter !== 'all') {
                        filteredTasks = filteredTasks.filter(task => task.status === filter);
                    }

                    // Priority filter
                    if (priorityFilter !== 'all') {
                        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
                    }

                    console.log('Filtered tasks:', filteredTasks.length, 'of', tasks.length);

                    return filteredTasks.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-400 font-inter">No tasks found</p>
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 hover:border-black dark:hover:border-white transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'completed'}
                                            onChange={(e) => updateTaskStatus(task.id, e.target.checked ? 'completed' : 'pending')}
                                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-black dark:text-white focus:ring-black dark:focus:ring-white cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-shrink-0 mt-0">
                                        <select
                                            value={task.status}
                                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-black dark:text-white text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white cursor-pointer"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-sora font-bold text-lg text-black dark:text-white">
                                                    {task.title}
                                                </h3>
                                                {user?.isAdmin && (task.user_email || task.first_name) && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        Assigned to: {task.first_name ? `${task.first_name} ${task.last_name || ''}` : task.user_email}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <select
                                                    aria-label="Task priority"
                                                    value={task.priority ? String(task.priority) : 'medium'}
                                                    onChange={(e) => {
                                                        console.log('Priority changed to:', e.target.value);
                                                        updateTaskPriority(task.id, e.target.value);
                                                    }}
                                                    disabled={updatingPriorityId === task.id}
                                                    className={`px-3 py-1 rounded-full text-xs font-plus-jakarta font-semibold focus:outline-none cursor-pointer text-black dark:text-white ${getPriorityColor(
                                                        task.priority || 'medium'
                                                    )}`}
                                                >
                                                    <option value="low" className="text-black">Low priority</option>
                                                    <option value="medium" className="text-black">Medium priority</option>
                                                    <option value="high" className="text-black">High priority</option>
                                                </select>
                                                {user?.isAdmin && (
                                                    <select
                                                        aria-label="Assign to user"
                                                        value={task.assigned_to ? String(task.assigned_to) : ''}
                                                        onChange={(e) => {
                                                            console.log('Dropdown changed, new value:', e.target.value);
                                                            updateTaskAssignment(task.id, e.target.value);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-black dark:text-white text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white cursor-pointer"
                                                    >
                                                        <option value="" className="text-black">Unassigned</option>
                                                        {teamMembers.map((member) => (
                                                            <option key={member.id} value={String(member.id)} className="text-black">
                                                                {member.first_name ? `${member.first_name} ${member.last_name || ''}` : member.email}
                                                            </option>
                                                        ))}
                                                    </select>
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
                    );
                })()}
            </div>

            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold font-sora text-black dark:text-white">New Task</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="e.g. Review Q3 Report"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                    placeholder="Add details..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-black dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }
        </div >
    );
}
