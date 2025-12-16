'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    const handleConnectEmail = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/email/oauth/google', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                window.location.href = data.authUrl;
            }
        } catch (error) {
            console.error('Failed to initiate OAuth:', error);
        }
    };

    const handleSkipVoiceTraining = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Step 1: Connect Email */}
                {step === 1 && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-accent mb-6">
                            <Mail className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-sora font-bold text-black dark:text-white mb-4">
                            Connect Your Email
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 font-inter mb-12">
                            Start by connecting your Gmail account to begin automating your email workflow
                        </p>

                        <div className="space-y-4 max-w-md mx-auto">
                            <button
                                onClick={handleConnectEmail}
                                className="w-full px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold text-lg hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                            >
                                <Mail className="h-5 w-5" />
                                Connect Gmail
                            </button>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full px-8 py-4 rounded-full bg-[#F3F3F3] dark:bg-[#1E1E1E] text-black dark:text-white font-plus-jakarta font-medium hover:bg-[#E6E6E6] dark:hover:bg-[#333333] transition-all"
                            >
                                Skip for Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Voice Training */}
                {step === 2 && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-accent mb-6">
                            <Sparkles className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-sora font-bold text-black dark:text-white mb-4">
                            Train Your AI Assistant
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 font-inter mb-12">
                            Help us understand your writing style to generate personalized email drafts
                        </p>

                        <div className="space-y-4 max-w-md mx-auto">
                            <Link
                                href="/dashboard/voice-training"
                                className="w-full px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold text-lg hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                            >
                                <Sparkles className="h-5 w-5" />
                                Start Training
                            </Link>

                            <button
                                onClick={handleSkipVoiceTraining}
                                className="w-full px-8 py-4 rounded-full bg-[#F3F3F3] dark:bg-[#1E1E1E] text-black dark:text-white font-plus-jakarta font-medium hover:bg-[#E6E6E6] dark:hover:bg-[#333333] transition-all"
                            >
                                Skip for Now
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
