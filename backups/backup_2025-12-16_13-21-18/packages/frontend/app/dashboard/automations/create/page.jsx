'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Save } from 'lucide-react';

export default function CreateAutomationPage() {
    const router = useRouter();
    const [automation, setAutomation] = useState({
        name: '',
        description: '',
        triggerType: 'manual',
        triggerConfig: {},
        steps: []
    });
    const [saving, setSaving] = useState(false);

    const availableActions = [
        { id: 'slack_send_message', name: 'Slack: Send Message', integration: 'slack' },
        { id: 'slack_create_channel', name: 'Slack: Create Channel', integration: 'slack' },
        { id: 'google_sheets_read_rows', name: 'Google Sheets: Read Rows', integration: 'google_sheets' },
        { id: 'google_sheets_append_row', name: 'Google Sheets: Append Row', integration: 'google_sheets' },
        { id: 'notion_create_page', name: 'Notion: Create Page', integration: 'notion' },
        { id: 'stripe_create_customer', name: 'Stripe: Create Customer', integration: 'stripe' },
        { id: 'email_send_email', name: 'Email: Send Email', integration: 'email' },
    ];

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
        if (!automation.name) {
            alert('Name is required');
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/automations', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: automation.name,
                    description: automation.description,
                    triggerType: automation.triggerType,
                    triggerConfig: {},
                    steps: automation.steps
                }),
            });

            if (res.ok) {
                router.push('/dashboard/automations');
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to create automation');
            }
        } catch (error) {
            alert('Failed to create automation');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <button
                    onClick={() => router.push('/dashboard/automations')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Automations
                </button>
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Create Automation
                </h1>
            </div>

            {/* Basic Info */}
            <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 mb-6">
                <h2 className="text-xl font-sora font-bold text-black dark:text-white mb-4">
                    Basic Information
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            Automation Name *
                        </label>
                        <input
                            type="text"
                            value={automation.name}
                            onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                            placeholder="e.g., Send Slack notification when email arrives"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            Description
                        </label>
                        <textarea
                            value={automation.description}
                            onChange={(e) => setAutomation({ ...automation, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                            placeholder="Describe what this automation does..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                            Trigger Type *
                        </label>
                        <select
                            value={automation.triggerType}
                            onChange={(e) => setAutomation({ ...automation, triggerType: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        >
                            <option value="manual">Manual (Run manually)</option>
                            <option value="email_received">Email Received (New!)</option>
                            <option value="scheduled">Scheduled (Cron)</option>
                        </select>
                    </div>

                    {automation.triggerType === 'scheduled' && (
                        <div>
                            <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                Cron Expression *
                            </label>
                            <input
                                type="text"
                                value={automation.triggerConfig?.cron || ''}
                                onChange={(e) => setAutomation({
                                    ...automation,
                                    triggerConfig: { ...automation.triggerConfig, cron: e.target.value }
                                })}
                                className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter"
                                placeholder="e.g. * * * * * (Every minute)"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Use standard cron syntax: Minute Hour Day Month DayOfWeek
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Steps */}
            <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-sora font-bold text-black dark:text-white">
                        Automation Steps
                    </h2>
                    <div className="relative group">
                        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-inter text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Step
                        </button>
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E1E1E] border border-[#E6E6E6] dark:border-[#333333] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 max-h-96 overflow-y-auto">
                            {availableActions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => addStep(action.id)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-inter text-black dark:text-white first:rounded-t-xl last:rounded-b-xl"
                                >
                                    {action.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {automation.steps.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                        <p className="text-gray-500 dark:text-gray-500 font-inter">
                            No steps added yet. Click "Add Step" to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {automation.steps.map((step, index) => (
                            <div
                                key={index}
                                className="p-4 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-gray-50 dark:bg-[#0A0A0A]"
                            >
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

                                <div className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                                    <textarea
                                        value={JSON.stringify(step.config, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                updateStepConfig(index, JSON.parse(e.target.value));
                                            } catch (err) {
                                                // Invalid JSON, ignore
                                            }
                                        }}
                                        rows={4}
                                        className="w-full bg-white dark:bg-[#1E1E1E] p-3 rounded-lg font-mono text-xs border border-[#E6E6E6] dark:border-[#333333] focus:outline-none"
                                        placeholder='{"key": "value"}'
                                    />
                                    <p className="text-xs mt-2 text-gray-500">
                                        Configure step parameters in JSON format. Use variables like {`{{trigger.field}}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Save className="h-5 w-5" />
                    {saving ? 'Creating...' : 'Create Automation'}
                </button>
                <button
                    onClick={() => router.push('/dashboard/automations')}
                    className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
