'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, Mail } from 'lucide-react';

const INITIAL_ASSISTANT_MESSAGE =
    'Hi! I am your Operon AI assistant. Ask me anything about the workspace and I will point you in the right direction.';

const getAuthToken = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        return window.localStorage.getItem('auth_token');
    } catch {
        return null;
    }
};

export default function HelpCenterButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSendingChat, setIsSendingChat] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [chatMessages, setChatMessages] = useState([
        { role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE },
    ]);
    const [chatInput, setChatInput] = useState('');
    const [activeTab, setActiveTab] = useState('chat');

    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [contactStatus, setContactStatus] = useState(null);
    const [isSendingContact, setIsSendingContact] = useState(false);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) return;

        const loadUserProfile = async () => {
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) return;
                const data = await res.json();

                setContactForm((prev) => ({
                    ...prev,
                    name: data?.user?.firstName
                        ? `${data.user.firstName} ${data.user.lastName || ''}`.trim()
                        : prev.name,
                    email: data?.user?.email || prev.email,
                }));
            } catch (error) {
                // Ignore profile hydration errors for help widget
            }
        };

        loadUserProfile();
    }, []);

    const handleSendMessage = useCallback(async () => {
        const trimmed = chatInput.trim();
        if (!trimmed || isSendingChat) {
            return;
        }

        const token = getAuthToken();
        if (!token) {
            setChatMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'You need to sign in to use the AI helper.' },
            ]);
            setChatInput('');
            return;
        }

        const outgoing = { role: 'user', content: trimmed };
        setChatMessages((prev) => [...prev, outgoing]);
        setChatInput('');
        setIsSendingChat(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: trimmed,
                    chatType: 'general',
                    conversationId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || 'Unable to reach AI assistant');
            }

            if (data?.conversationId) {
                setConversationId(data.conversationId);
            }

            if (data?.message) {
                setChatMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: data.message },
                ]);
            }
        } catch (error) {
            setChatMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        error.message ||
                        'Something went wrong reaching the AI assistant. Please try again.',
                },
            ]);
        } finally {
            setIsSendingChat(false);
        }
    }, [chatInput, isSendingChat, conversationId]);

    const handleContactSubmit = useCallback(
        async (event) => {
            event.preventDefault();
            if (isSendingContact) return;
            if (!contactForm.message.trim()) {
                setContactStatus({
                    type: 'error',
                    message: 'Please include a short message so Daniel knows how to help.',
                });
                return;
            }

            const token = getAuthToken();

            setIsSendingContact(true);
            setContactStatus(null);

            try {
                const res = await fetch('/api/support/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(contactForm),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data?.error || 'Failed to send your request.');
                }

                setContactStatus({
                    type: 'success',
                    message: 'Thanks! Daniel has been emailed and will get back to you shortly.',
                });
                setContactForm((prev) => ({
                    ...prev,
                    message: '',
                }));
            } catch (error) {
                setContactStatus({
                    type: 'error',
                    message: error.message || 'Unable to send your message right now.',
                });
            } finally {
                setIsSendingContact(false);
            }
        },
        [contactForm, isSendingContact]
    );

    const handleFormChange = (field, value) => {
        setContactForm((prev) => ({ ...prev, [field]: value }));
    };

    const resetChat = () => {
        setConversationId(null);
        setChatMessages([{ role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE }]);
    };

    return (
        <div className="help-button fixed bottom-6 right-6 z-50">
            {isOpen && (
                <div className="help-options mb-3 w-[360px] max-w-[85vw] sm:w-[400px] rounded-3xl bg-white/95 backdrop-blur-xl border border-gray-200 ring-1 ring-black/5 shadow-[0_35px_80px_rgba(15,23,42,0.35)] overflow-hidden text-black">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">
                                Need help?
                            </p>
                            <h3 className="text-lg font-semibold text-black">Help Center</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Close help center"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-5 pt-4 flex gap-2">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'chat'
                                ? 'bg-black text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Bot className="w-4 h-4" />
                            AI Assistant
                        </button>
                        <button
                            onClick={() => setActiveTab('contact')}
                            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'contact'
                                ? 'bg-black text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Mail className="w-4 h-4" />
                            Contact Daniel
                        </button>
                    </div>

                    {activeTab === 'chat' ? (
                        <div className="px-5 py-4">
                            <div className="h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {chatMessages.map((msg, idx) => (
                                    <div
                                        key={`${msg.role}-${idx}`}
                                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed border ${msg.role === 'assistant'
                                            ? 'bg-gray-100 text-gray-900 border-gray-200'
                                            : 'bg-blue-50 text-blue-900 border-blue-100 ml-auto'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                ))}
                                {isSendingChat && (
                                    <div className="px-4 py-2.5 rounded-2xl bg-gray-100 text-gray-700 text-sm inline-flex items-center gap-2 border border-gray-200">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Thinking...
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <button
                                    onClick={resetChat}
                                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Clear chat
                                </button>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(event) => setChatInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Ask the AI assistant..."
                                    className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:border-gray-400"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isSendingChat}
                                    className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center disabled:opacity-40"
                                    aria-label="Send question to AI assistant"
                                >
                                    {isSendingChat ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="px-5 py-4 space-y-3" onSubmit={handleContactSubmit}>
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-gray-500">
                                    Your name
                                </label>
                                <input
                                    type="text"
                                    value={contactForm.name}
                                    onChange={(event) => handleFormChange('name', event.target.value)}
                                    placeholder="Jane Cooper"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:border-gray-400"
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-gray-500">
                                    Reply email
                                </label>
                                <input
                                    type="email"
                                    value={contactForm.email}
                                    onChange={(event) => handleFormChange('email', event.target.value)}
                                    placeholder="you@company.com"
                                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:border-gray-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-gray-500">
                                    Message for Daniel
                                </label>
                                <textarea
                                    value={contactForm.message}
                                    onChange={(event) => handleFormChange('message', event.target.value)}
                                    placeholder="Let Daniel know how he can help..."
                                    className="mt-1 min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-black placeholder:text-gray-500 focus:outline-none focus:border-gray-400"
                                />
                            </div>

                            {contactStatus && (
                                <p
                                    className={`text-sm ${contactStatus.type === 'success'
                                        ? 'text-green-600'
                                        : 'text-red-500'
                                        }`}
                                >
                                    {contactStatus.message}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSendingContact}
                                className="w-full rounded-2xl bg-black text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                {isSendingContact ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" />
                                        Email Daniel
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            )}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full bg-white text-black font-semibold px-4 py-2 shadow-[0_15px_50px_rgba(0,0,0,0.35)] hover:scale-[1.02] transition-transform"
            >
                <MessageCircle className="w-4 h-4" />
                {isOpen ? 'Close help' : 'Need help?'}
            </button>
        </div>
    );
}
