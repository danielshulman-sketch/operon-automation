'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Briefcase, Plus, Loader2, Trash2 } from 'lucide-react';
import InfoTooltip from '../../components/InfoTooltip';

export default function ChatPage() {
    const [chatType, setChatType] = useState('general'); // 'general' | 'business' | 'persona'
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationFilter, setConversationFilter] = useState('all'); // 'all' | 'general' | 'business'
    const [isDeleting, setIsDeleting] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (currentConversation) {
            fetchMessages(currentConversation);
        }
    }, [currentConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/chat', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/chat/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');
        setIsLoading(true);

        // Optimistically add user message
        const tempUserMsg = {
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId: currentConversation,
                    message: userMessage,
                    chatType,
                }),
            });

            if (res.ok) {
                const data = await res.json();

                // Add assistant response
                const assistantMsg = {
                    role: 'assistant',
                    content: data.message,
                    created_at: new Date().toISOString(),
                };
                setMessages(prev => [...prev, assistantMsg]);

                // Update current conversation ID if new
                if (!currentConversation) {
                    setCurrentConversation(data.conversationId);
                    fetchConversations();
                }
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to send message');
                // Remove optimistic message on error
                setMessages(prev => prev.slice(0, -1));
            }
        } catch (error) {
            console.error('Send message error:', error);
            alert('Failed to send message');
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const startNewConversation = () => {
        setCurrentConversation(null);
        setMessages([]);
    };

    const handleChatTypeChange = (type) => {
        setChatType(type);
        setConversationFilter(type);
        startNewConversation();
    };

    const deleteConversation = async (conversationId) => {
        if (isDeleting) return;
        const confirmDelete = window.confirm('Delete this conversation? This action cannot be undone.');
        if (!confirmDelete) return;

        try {
            setIsDeleting(true);
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/chat/${conversationId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.error || 'Failed to delete conversation');
                return;
            }

            setConversations(prev => prev.filter(c => c.id !== conversationId));
            if (currentConversation === conversationId) {
                setCurrentConversation(null);
                setMessages([]);
            }
            await fetchConversations();
        } catch (error) {
            console.error('Delete conversation error:', error);
            alert('Failed to delete conversation');
        } finally {
            setIsDeleting(false);
        }
    };

    const conversationFilters = [
        { id: 'all', label: 'All chats' },
        { id: 'general', label: 'General AI' },
        { id: 'business', label: 'Business AI' },
        { id: 'persona', label: 'Persona AI' },
    ];

    const filteredConversations = conversations.filter((c) =>
        conversationFilter === 'all' ? true : c.chat_type === conversationFilter
    );

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-12rem)]">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-sora font-bold text-black dark:text-white">
                        AI Assistant
                    </h1>
                    <InfoTooltip
                        content="Chat with AI assistants. General AI helps with any questions. Business AI is trained on your company's knowledge base. Persona AI responds in your writing voice."
                        position="right"
                    />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Get instant help from AI-powered assistants
                </p>
            </div>

            {/* Chat Type Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => handleChatTypeChange('general')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-plus-jakarta font-semibold transition-all ${chatType === 'general'
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    <Bot className="h-5 w-5" />
                    General AI
                </button>
                <button
                    onClick={() => handleChatTypeChange('business')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-plus-jakarta font-semibold transition-all ${chatType === 'business'
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    <Briefcase className="h-5 w-5" />
                    Business AI
                </button>
                <button
                    onClick={() => handleChatTypeChange('persona')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-plus-jakarta font-semibold transition-all ${chatType === 'persona'
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                >
                    <Bot className="h-5 w-5" />
                    Persona AI
                </button>
            </div>

            {/* Main Chat Area */}
            <div className="grid grid-cols-12 gap-6 h-[calc(100%-12rem)]">
                {/* Conversations Sidebar */}
                <div className="col-span-3 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-plus-jakarta font-semibold text-black dark:text-white">
                            Conversations
                        </h3>
                        <button
                            onClick={startNewConversation}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="New conversation"
                        >
                            <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {conversationFilters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setConversationFilter(filter.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-plus-jakarta font-semibold transition-all ${conversationFilter === filter.id
                                    ? 'bg-black dark:bg-white text-white dark:text-black'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        {filteredConversations.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-500 font-inter text-center py-4">
                                No conversations yet
                            </p>
                        ) : (
                            filteredConversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setCurrentConversation(conv.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setCurrentConversation(conv.id);
                                        }
                                    }}
                                    className={`w-full p-3 rounded-lg transition-colors ${currentConversation === conv.id
                                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-inter text-sm text-black dark:text-white truncate">
                                                {conv.title || 'New conversation'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteConversation(conv.id);
                                            }}
                                            disabled={isDeleting}
                                            className="p-1 rounded-md hover:bg-white/40 dark:hover:bg-white/10 text-gray-500"
                                            aria-label="Delete conversation"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-500 font-inter">
                                            {new Date(conv.updated_at).toLocaleDateString()}
                                        </p>
                                        <span className="text-xs uppercase font-semibold text-gray-600 dark:text-gray-400">
                                            {conv.chat_type === 'business'
                                                ? 'Business AI'
                                                : conv.chat_type === 'persona'
                                                    ? 'Persona AI'
                                                    : 'General AI'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="col-span-9 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] flex flex-col">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                {chatType === 'general' ? (
                                    <Bot className="h-16 w-16 text-gray-400 mb-4" />
                                ) : chatType === 'business' ? (
                                    <Briefcase className="h-16 w-16 text-gray-400 mb-4" />
                                ) : (
                                    <Bot className="h-16 w-16 text-gray-400 mb-4" />
                                )}
                                <h3 className="text-xl font-sora font-bold text-black dark:text-white mb-2">
                                    {chatType === 'general'
                                        ? 'General AI Assistant'
                                        : chatType === 'business'
                                            ? 'Business AI Assistant'
                                            : 'Persona AI Assistant'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 font-inter max-w-md">
                                    {chatType === 'general'
                                        ? 'Ask me anything! I can help with general questions, explanations, and tasks.'
                                        : chatType === 'business'
                                            ? 'Ask me about your company processes, SOPs, and documentation. I\'m trained on your knowledge base.'
                                            : 'Ask questions and get responses in your writing voice.'}
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                                            {chatType === 'business' ? (
                                                <Briefcase className="h-4 w-4 text-white" />
                                            ) : (
                                                <Bot className="h-4 w-4 text-white" />
                                            )}
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-white dark:bg-white text-black'
                                            : 'bg-gray-100 dark:bg-white text-black'
                                            }`}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <div
                                                className="font-inter text-sm leading-relaxed space-y-3 ai-response text-black"
                                                dangerouslySetInnerHTML={{ __html: msg.content }}
                                            />
                                        ) : (
                                            <p className="font-inter text-sm whitespace-pre-wrap text-black">{msg.content}</p>
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-sm font-bold">U</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                                    {chatType === 'business' ? (
                                        <Briefcase className="h-4 w-4 text-white" />
                                    ) : (
                                        <Bot className="h-4 w-4 text-white" />
                                    )}
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                                    <Loader2 className="h-5 w-5 text-gray-600 dark:text-gray-400 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-[#E6E6E6] dark:border-[#333333] p-4">
                        <form onSubmit={handleSendMessage} className="flex gap-3">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder={`Ask ${chatType === 'general' ? 'anything' : chatType === 'business' ? 'about your company' : 'in your voice'}...`}
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isLoading}
                                className="px-6 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
