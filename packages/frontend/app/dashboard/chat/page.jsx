'use client';

import { MessageCircle, Sparkles } from 'lucide-react';

export default function ChatPage() {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    AI Chat Assistant
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Chat with your AI assistant to manage emails, tasks, and workflows
                </p>
            </div>

            <div className="text-center py-20 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                <div className="w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-2">
                    AI Chat Coming Soon
                </h2>
                <p className="text-gray-600 dark:text-gray-400 font-inter mb-8 max-w-md mx-auto">
                    Interact with your AI assistant using natural language to search emails, generate drafts, create tasks, and execute workflows
                </p>
                <div className="max-w-2xl mx-auto">
                    <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-[#F3F3F3] dark:bg-[#0A0A0A] p-4 flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            disabled
                            placeholder="Ask your AI assistant anything..."
                            className="flex-1 bg-transparent text-gray-500 dark:text-gray-600 font-inter focus:outline-none cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
