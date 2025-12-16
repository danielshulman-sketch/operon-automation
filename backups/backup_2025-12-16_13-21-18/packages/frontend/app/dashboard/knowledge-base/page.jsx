'use client';

import { useState, useEffect } from 'react';
import { Book, Plus, X, Edit2, Trash2, Save, Tag } from 'lucide-react';
import InfoTooltip from '../../components/InfoTooltip';

export default function KnowledgeBasePage() {
    const [documents, setDocuments] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [newDoc, setNewDoc] = useState({
        title: '',
        content: '',
        category: '',
        tags: '',
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/knowledge-base', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                // Parse tags from JSON string to array
                const parsedDocuments = data.documents.map(doc => ({
                    ...doc,
                    tags: typeof doc.tags === 'string' ? JSON.parse(doc.tags || '[]') : (doc.tags || [])
                }));
                setDocuments(parsedDocuments);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        }
    };

    const handleCreateDocument = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const tags = newDoc.tags.split(',').map(t => t.trim()).filter(t => t);

            const res = await fetch('/api/admin/knowledge-base', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...newDoc,
                    tags,
                }),
            });

            if (res.ok) {
                setShowCreateModal(false);
                setNewDoc({ title: '', content: '', category: '', tags: '' });
                fetchDocuments();
                alert('Document created successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create document');
            }
        } catch (error) {
            alert('Failed to create document');
        }
    };

    const handleUpdateDocument = async (doc) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/knowledge-base', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(doc),
            });

            if (res.ok) {
                setEditingDoc(null);
                fetchDocuments();
                alert('Document updated successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update document');
            }
        } catch (error) {
            alert('Failed to update document');
        }
    };

    const handleDeleteDocument = async (id) => {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/knowledge-base?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                fetchDocuments();
                alert('Document deleted successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete document');
            }
        } catch (error) {
            alert('Failed to delete document');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            e.target.value = ''; // Reset input
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', ''); // Can be enhanced to ask user
        formData.append('tags', ''); // Can be enhanced to ask user

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/knowledge-base/upload', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                fetchDocuments();
                alert(data.message || 'File uploaded successfully!');
            } else {
                alert(data.error || 'Failed to upload file');
            }
        } catch (error) {
            alert('Failed to upload file');
        } finally {
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-sora font-bold text-black dark:text-white">
                        Knowledge Base
                    </h1>
                    <InfoTooltip
                        content="Create and manage company documentation, SOPs, and training materials. This content will be used to train the Business AI Assistant to answer questions specific to your organization."
                        position="right"
                    />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Manage company documentation for AI-powered assistance
                </p>
            </div>

            {/* Create and Upload Buttons */}
            <div className="mb-6 flex gap-3">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Add Document
                </button>
                <label className="px-6 py-3 rounded-full bg-blue-600 text-white font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center gap-2 cursor-pointer">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload File
                    <input
                        type="file"
                        accept=".txt,.md,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 hover:border-black dark:hover:border-white transition-all"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                <Book className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-plus-jakarta font-semibold text-black dark:text-white mb-1 truncate">
                                    {doc.title}
                                </h3>
                                {doc.category && (
                                    <span className="inline-block px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-inter text-gray-600 dark:text-gray-400">
                                        {doc.category}
                                    </span>
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-4 line-clamp-3">
                            {doc.content}
                        </p>

                        {doc.tags && doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                                {doc.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-xs font-inter text-purple-600 dark:text-purple-400"
                                    >
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-4 border-t border-[#E6E6E6] dark:border-[#333333]">
                            <button
                                onClick={() => setEditingDoc(doc)}
                                className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-inter text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit2 className="h-4 w-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="flex-1 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-inter text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-500 font-inter mt-3">
                            Updated {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                    </div>
                ))}
            </div>

            {documents.length === 0 && (
                <div className="text-center py-12 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                    <Book className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 font-inter mb-4">
                        No documents yet. Add your first document to train the Business AI Assistant.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-medium hover:scale-[0.98] transition-transform inline-flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add First Document
                    </button>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingDoc) && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => {
                        setShowCreateModal(false);
                        setEditingDoc(null);
                    }}
                >
                    <div
                        className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6E6E6] dark:border-[#333333] max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
                                {editingDoc ? 'Edit Document' : 'Add Document'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setEditingDoc(null);
                                }}
                                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form
                            onSubmit={editingDoc ? (e) => {
                                e.preventDefault();
                                handleUpdateDocument(editingDoc);
                            } : handleCreateDocument}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingDoc ? editingDoc.title : newDoc.title}
                                    onChange={(e) => editingDoc
                                        ? setEditingDoc({ ...editingDoc, title: e.target.value })
                                        : setNewDoc({ ...newDoc, title: e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="e.g., Customer Support SOP"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    value={editingDoc ? editingDoc.category : newDoc.category}
                                    onChange={(e) => editingDoc
                                        ? setEditingDoc({ ...editingDoc, category: e.target.value })
                                        : setNewDoc({ ...newDoc, category: e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="e.g., Support, Sales, HR"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Content *
                                </label>
                                <textarea
                                    required
                                    rows={10}
                                    value={editingDoc ? editingDoc.content : newDoc.content}
                                    onChange={(e) => editingDoc
                                        ? setEditingDoc({ ...editingDoc, content: e.target.value })
                                        : setNewDoc({ ...newDoc, content: e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                    placeholder="Enter detailed documentation, procedures, or information..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Tags (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={editingDoc
                                        ? (editingDoc.tags || []).join(', ')
                                        : newDoc.tags
                                    }
                                    onChange={(e) => editingDoc
                                        ? setEditingDoc({ ...editingDoc, tags: e.target.value.split(',').map(t => t.trim()) })
                                        : setNewDoc({ ...newDoc, tags: e.target.value })
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="e.g., onboarding, refunds, escalation"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                            >
                                <Save className="h-5 w-5" />
                                {editingDoc ? 'Update Document' : 'Create Document'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
