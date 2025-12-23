'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Save, Play, Clock, MoreVertical, Trash2 } from 'lucide-react';

export default function EditAutomationPage() {
    const router = useRouter();
    const params = useParams();
    const [automation, setAutomation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [isAddStepOpen, setIsAddStepOpen] = useState(false);

    const availableActions = [
        { id: 'slack_send_message', name: 'Slack: Send Message', integration: 'slack', icon: '💬', description: 'Send messages to channels or users' },
        { id: 'slack_create_channel', name: 'Slack: Create Channel', integration: 'slack', icon: '💬', description: 'Create a new channel' },
        { id: 'google_sheets_read_rows', name: 'Google Sheets: Read Rows', integration: 'google_sheets', icon: '📊', description: 'Read data from sheets' },
        { id: 'google_sheets_append_row', name: 'Google Sheets: Append Row', integration: 'google_sheets', icon: '📊', description: 'Add new rows to sheets' },
        { id: 'notion_create_page', name: 'Notion: Create Page', integration: 'notion', icon: '📝', description: 'Create new pages in database' },
        { id: 'stripe_create_customer', name: 'Stripe: Create Customer', integration: 'stripe', icon: '💳', description: 'Create a new customer' },
        { id: 'email_send_email', name: 'Email: Send Email', integration: 'email', icon: '📧', description: 'Send emails via SMTP' },
    ];

    useEffect(() => {
        fetchAutomation();
    }, []);

    const fetchAutomation = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/automations`, { // Currently fetching all and filtering, optimization: implement GET /api/automations/[id]
                headers: { Authorization: `Bearer ${token}` }
            });

            // Note: optimization would be to have a dedicated single fetch endpoint
            // For now using the list endpoint and filtering client side or if the API supports it
            // Reviewing route.js: GET does list all. 
            // Let's rely on the list for now or implement GET [id] in API. 
            // Actually, the API structure plan had /api/automations/[id]/route.js. Let's check if it exists.
            // I haven't created [id]/route.js yet! I only created [id]/execute/route.js.
            // I need to create the GET/PUT/DELETE /api/automations/[id]/route.js as well.
            // For now, I'll assume I will create it in the next step.

            const listRes = await fetch('/api/automations', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (listRes.ok) {
                const data = await listRes.json();
                const found = data.automations.find(a => a.id === params.id);
                if (found) {
                    setAutomation({
                        ...found,
                        triggerConfig: typeof found.trigger_config === 'string' ? JSON.parse(found.trigger_config) : found.trigger_config,
                        steps: typeof found.steps === 'string' ? JSON.parse(found.steps) : found.steps
                    });
                } else {
                    alert('Automation not found');
                    router.push('/dashboard/automations');
                }
            }
        } catch (error) {
            console.error('Failed to fetch automation:', error);
        } finally {
            setLoading(false);
        }
    };

    const addStep = (actionId) => {
        setAutomation({
            ...automation,
            steps: [...automation.steps, { type: actionId, config: {} }]
        });
    };

    const removeStep = (index) => {
        setAutomation({
            ...automation,
            steps: automation.steps.filter((_, i) => i !== index)
        });
    };

    const updateStepConfig = (index, config) => {
        const newSteps = [...automation.steps];
        newSteps[index].config = config;
        setAutomation({ ...automation, steps: newSteps });
    };

    const handleSave = async () => {
        if (!automation.name) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            // We need to implement the PUT route in /api/automations/[id]
            // For now I'll create the file for it.
            const res = await fetch(`/api/automations/${params.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: automation.name,
                    description: automation.description,
                    triggerType: automation.trigger_type, // Maintain original field name from logic
                    triggerConfig: automation.triggerConfig,
                    steps: automation.steps
                }),
            });

            if (res.ok) {
                alert('Saved successfully');
            } else {
                alert('Failed to save');
            }
        } catch (error) {
            alert('Error saving');
        } finally {
            setSaving(false);
        }
    };

    const handleExecute = async () => {
        if (!confirm('Execute this automation now?')) return;
        setExecuting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/automations/${params.id}/execute`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ triggerData: {} }) // Empty trigger data for manual run
            });

            if (res.ok) {
                const data = await res.json();
                alert('Execution started! Run ID: ' + data.runId);
                // Redirect to runs page could be nice
            } else {
                alert('Execution failed to start');
            }
        } catch (e) {
            alert('Execution error');
        } finally {
            setExecuting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this automation? This cannot be undone.')) return;
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/automations/${params.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                router.push('/dashboard/automations');
            }
        } catch (e) {
            alert('Delete error');
        }
    };

    if (loading || !automation) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button
                        onClick={() => router.push('/dashboard/automations')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Automations
                    </button>
                    <h1 className="text-3xl font-sora font-bold text-black dark:text-white">
                        {automation.name}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExecute}
                        disabled={executing}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white font-inter text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <Play className="h-4 w-4" />
                        {executing ? 'Running...' : 'Run Now'}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-inter text-sm hover:bg-red-200 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 mb-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            Automation Name
                        </label>
                        <input
                            type="text"
                            value={automation.name}
                            onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            Description
                        </label>
                        <textarea
                            value={automation.description || ''}
                            onChange={(e) => setAutomation({ ...automation, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter"
                        />
                    </div>
                </div>
            </div>

            {/* Steps */}
            <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-sora font-bold text-black dark:text-white">
                        Steps
                    </h2>
                    <div className="relative">
                        <button
                            onClick={() => setIsAddStepOpen(!isAddStepOpen)}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-inter text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Step
                        </button>
                        {isAddStepOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E1E1E] border border-[#E6E6E6] dark:border-[#333333] rounded-xl shadow-2xl transition-all z-10 max-h-96 overflow-y-auto">
                                {availableActions.map((action) => (
                                    <button
                                        key={action.id}
                                        onClick={() => {
                                            addStep(action.id);
                                            setIsAddStepOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-inter text-black dark:text-white"
                                    >
                                        {action.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {automation.steps.map((step, index) => (
                        <div key={index} className="p-4 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-gray-50 dark:bg-[#0A0A0A]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                                        {index + 1}
                                    </span>
                                    <span className="font-plus-jakarta font-semibold text-black dark:text-white">
                                        {availableActions.find(a => a.id === step.type)?.name || step.type}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeStep(index)}
                                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <textarea
                                value={JSON.stringify(step.config, null, 2)}
                                onChange={(e) => {
                                    try {
                                        updateStepConfig(index, JSON.parse(e.target.value));
                                    } catch (err) { }
                                }}
                                rows={4}
                                className="w-full bg-white dark:bg-[#1E1E1E] p-3 rounded-lg font-mono text-xs border border-[#E6E6E6] dark:border-[#333333] focus:outline-none"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
                <Save className="h-5 w-5" />
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
}
