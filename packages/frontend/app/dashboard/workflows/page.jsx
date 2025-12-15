'use client';

import { Workflow, Plus } from 'lucide-react';

export default function WorkflowsPage() {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Workflows
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Automate your email operations with custom workflows
                </p>
            </div>

            <div className="text-center py-20 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                <div className="w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center mx-auto mb-6">
                    <Workflow className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-2">
                    Workflows Coming Soon
                </h2>
                <p className="text-gray-600 dark:text-gray-400 font-inter mb-8 max-w-md mx-auto">
                    Create automated workflows to classify emails, extract tasks, generate drafts, and more
                </p>
                <button
                    disabled
                    className="px-8 py-3 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-600 font-plus-jakarta font-semibold cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                    <Plus className="h-5 w-5" />
                    Create Workflow
                </button>
            </div>
        </div>
    );
}
