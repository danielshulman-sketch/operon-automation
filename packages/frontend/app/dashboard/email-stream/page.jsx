'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckSquare, Square, Sparkles, RefreshCw, Filter, X } from 'lucide-react';

export default function EmailStreamPage() {
    const [emails, setEmails] = useState([]);
    const [selectedEmails, setSelectedEmails] = useState(new Set());
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [bulkGenerating, setBulkGenerating] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'task', label: 'Tasks' },
        { id: 'fyi', label: 'FYI' },
        { id: 'question', label: 'Questions' },
        { id: 'approval', label: 'Approvals' },
        { id: 'meeting', label: 'Meetings' },
    ];

    useEffect(() => {
        fetchEmails();
    }, [filter]);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const url = filter === 'all'
                ? '/api/email/messages'
                : `/api/email/messages?classification=${filter}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setEmails(data.emails);
            }
        } catch (error) {
            console.error('Failed to fetch emails:', error);
        }
        setLoading(false);
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/sync', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });

            if (res.ok) {
                await fetchEmails();
            }
        } catch (error) {
            console.error('Sync failed:', error);
        }
        setLoading(false);
    };

    const toggleEmailSelection = (emailId) => {
        const newSelected = new Set(selectedEmails);
        if (newSelected.has(emailId)) {
            newSelected.delete(emailId);
        } else {
            newSelected.add(emailId);
        }
        setSelectedEmails(newSelected);
    };

    const selectAll = () => {
        setSelectedEmails(new Set(emails.map(e => e.id)));
    };

    const deselectAll = () => {
        setSelectedEmails(new Set());
    };

    const handleBulkGenerateDrafts = async () => {
        setBulkGenerating(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/drafts/bulk', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email_ids: Array.from(selectedEmails),
                    category_filter: filter !== 'all' ? filter : null,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Generated ${data.success_count} drafts!`);
                setSelectedEmails(new Set());
            }
        } catch (error) {
            console.error('Bulk draft generation failed:', error);
        }
        setBulkGenerating(false);
    };

    const classifyEmail = async (emailId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/classify', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email_id: emailId }),
            });

            if (res.ok) {
                await fetchEmails();
            }
        } catch (error) {
            console.error('Classification failed:', error);
        }
    };

    const getClassificationBadge = (classification) => {
        const badges = {
            task: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            fyi: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
            question: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
            approval: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            meeting: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        };

        return badges[classification] || badges.fyi;
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Email Stream
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Manage and classify your emails with AI
                </p>
            </div>

            {/* Filters and Actions */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
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

                <div className="flex gap-2">
                    {selectedEmails.size > 0 && (
                        <>
                            <button
                                onClick={selectAll}
                                className="px-4 py-2 rounded-full bg-[#F3F3F3] dark:bg-[#1E1E1E] text-black dark:text-white font-plus-jakarta font-medium hover:bg-[#E6E6E6] dark:hover:bg-[#333333] transition-all"
                            >
                                Select All
                            </button>
                            <button
                                onClick={deselectAll}
                                className="px-4 py-2 rounded-full bg-[#F3F3F3] dark:bg-[#1E1E1E] text-black dark:text-white font-plus-jakarta font-medium hover:bg-[#E6E6E6] dark:hover:bg-[#333333] transition-all"
                            >
                                Deselect All
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleSync}
                        disabled={loading}
                        className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-medium hover:scale-[0.98] transition-transform disabled:opacity-50 flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Sync
                    </button>
                </div>
            </div>

            {/* Email List */}
            <div className="space-y-4">
                {loading && emails.length === 0 ? (
                    <div className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 font-inter">Loading emails...</p>
                    </div>
                ) : emails.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                        <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 font-inter">No emails found</p>
                    </div>
                ) : (
                    emails.map((email) => (
                        <div
                            key={email.id}
                            className={`rounded-2xl bg-white dark:bg-[#1E1E1E] border p-6 transition-all cursor-pointer ${selectedEmails.has(email.id)
                                    ? 'border-black dark:border-white'
                                    : 'border-[#E6E6E6] dark:border-[#333333] hover:border-black dark:hover:border-white'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Checkbox */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleEmailSelection(email.id);
                                    }}
                                    className="flex-shrink-0 mt-1"
                                >
                                    {selectedEmails.has(email.id) ? (
                                        <CheckSquare className="h-5 w-5 text-black dark:text-white" />
                                    ) : (
                                        <Square className="h-5 w-5 text-[#CCCCCC]" />
                                    )}
                                </button>

                                {/* Email Content */}
                                <div className="flex-1 min-w-0" onClick={() => setSelectedEmail(email)}>
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-plus-jakarta font-semibold text-black dark:text-white truncate">
                                                {email.from_address}
                                            </p>
                                            <p className="font-sora font-bold text-lg text-black dark:text-white mt-1">
                                                {email.subject}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {email.classification && (
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-plus-jakarta font-semibold ${getClassificationBadge(
                                                        email.classification
                                                    )}`}
                                                >
                                                    {email.classification}
                                                </span>
                                            )}
                                            <span className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                                                {new Date(email.received_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 font-inter line-clamp-2">
                                        {email.body_text?.substring(0, 200)}...
                                    </p>

                                    {!email.classification && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                classifyEmail(email.id);
                                            }}
                                            className="mt-3 px-4 py-2 rounded-full bg-gradient-accent text-white font-plus-jakarta font-medium text-sm hover:scale-[0.98] transition-transform flex items-center gap-2"
                                        >
                                            <Sparkles className="h-4 w-4" />
                                            Classify
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Bar */}
            {selectedEmails.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="rounded-full bg-black dark:bg-white border-2 border-white dark:border-black shadow-2xl px-6 py-4 flex items-center gap-4">
                        <span className="text-white dark:text-black font-semibold font-plus-jakarta">
                            {selectedEmails.size} selected
                        </span>
                        <button
                            onClick={handleBulkGenerateDrafts}
                            disabled={bulkGenerating}
                            className="px-5 py-2 rounded-full bg-gradient-accent text-white font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform disabled:opacity-50 flex items-center gap-2"
                        >
                            <Sparkles className="h-4 w-4" />
                            {bulkGenerating ? 'Generating...' : 'Generate Drafts'}
                        </button>
                        <button
                            onClick={() => setSelectedEmails(new Set())}
                            className="text-white dark:text-black hover:opacity-70 transition-opacity"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Email Detail Modal */}
            {selectedEmail && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setSelectedEmail(null)}
                >
                    <div
                        className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6E6E6] dark:border-[#333333] max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-2">
                                    {selectedEmail.subject}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 font-inter">
                                    From: {selectedEmail.from_address}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap font-inter text-black dark:text-white">
                                {selectedEmail.body_text}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
