'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, ArrowRight, Plus, Trash2 } from 'lucide-react';

export default function VoiceTrainingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [samples, setSamples] = useState(['', '', '']);
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [responses, setResponses] = useState({});
    const [analyzing, setAnalyzing] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (step === 3) {
            fetchQuestions();
        }
    }, [step]);

    const fetchQuestions = async () => {
        try {
            const res = await fetch('/api/voice-profile/questions');
            const data = await res.json();
            setQuestions(data.questions);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        }
    };

    const handleAddSample = () => {
        setSamples([...samples, '']);
    };

    const handleRemoveSample = (index) => {
        if (samples.length > 3) {
            setSamples(samples.filter((_, i) => i !== index));
        }
    };

    const handleNextStep = () => {
        if (step === 2 && samples.filter(s => s.trim()).length < 3) {
            alert('Please provide at least 3 sample emails');
            return;
        }
        setStep(step + 1);
    };

    const handleNextQuestion = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            handleCompleteTraining();
        }
    };

    const handleCompleteTraining = async () => {
        setAnalyzing(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/voice-profile/setup', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    samples: samples.filter(s => s.trim()),
                    responses,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data.profile);
                setStep(5);
            }
        } catch (error) {
            console.error('Training failed:', error);
        }
        setAnalyzing(false);
    };

    const renderQuestion = (q) => {
        if (q.type === 'text') {
            return (
                <input
                    type="text"
                    value={responses[q.id] || ''}
                    onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                    placeholder={q.placeholder}
                    className="w-full px-6 py-4 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
            );
        }

        if (q.type === 'single_choice') {
            return (
                <div className="grid grid-cols-2 gap-3">
                    {q.options.map((option) => (
                        <button
                            key={option}
                            onClick={() => setResponses({ ...responses, [q.id]: option })}
                            className={`px-6 py-4 rounded-2xl border font-plus-jakarta font-medium transition-all ${responses[q.id] === option
                                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                    : 'bg-white dark:bg-[#1E1E1E] text-black dark:text-white border-[#E6E6E6] dark:border-[#333333] hover:border-black dark:hover:border-white'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            );
        }

        if (q.type === 'multiple_choice') {
            const selected = responses[q.id] || [];
            return (
                <div className="grid grid-cols-2 gap-3">
                    {q.options.map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                const newSelected = selected.includes(option)
                                    ? selected.filter(o => o !== option)
                                    : [...selected, option];
                                setResponses({ ...responses, [q.id]: newSelected });
                            }}
                            className={`px-6 py-4 rounded-2xl border font-plus-jakarta font-medium transition-all ${selected.includes(option)
                                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                                    : 'bg-white dark:bg-[#1E1E1E] text-black dark:text-white border-[#E6E6E6] dark:border-[#333333] hover:border-black dark:hover:border-white'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            );
        }

        if (q.type === 'scale') {
            return (
                <div className="space-y-4">
                    <input
                        type="range"
                        min={q.min}
                        max={q.max}
                        value={responses[q.id] || Math.floor((q.min + q.max) / 2)}
                        onChange={(e) => setResponses({ ...responses, [q.id]: parseInt(e.target.value) })}
                        className="w-full h-2 bg-[#E6E6E6] dark:bg-[#333333] rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 font-inter">
                        <span>{q.minLabel}</span>
                        <span className="font-bold text-black dark:text-white">{responses[q.id] || Math.floor((q.min + q.max) / 2)}</span>
                        <span>{q.maxLabel}</span>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Step 1: Introduction */}
            {step === 1 && (
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-accent mb-6">
                        <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-sora font-bold text-black dark:text-white mb-4">
                        Train Your AI Writing Assistant
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 font-inter mb-12">
                        Help us understand your unique writing style
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                                <span className="text-2xl">📧</span>
                            </div>
                            <h3 className="font-sora font-bold text-lg text-black dark:text-white mb-2">
                                Sample Emails
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 font-inter text-sm">
                                Provide examples of your writing
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                                <span className="text-2xl">❓</span>
                            </div>
                            <h3 className="font-sora font-bold text-lg text-black dark:text-white mb-2">
                                Questions
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 font-inter text-sm">
                                Answer 12 quick questions
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                                <span className="text-2xl">✨</span>
                            </div>
                            <h3 className="font-sora font-bold text-lg text-black dark:text-white mb-2">
                                AI Analysis
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 font-inter text-sm">
                                We create your voice profile
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleNextStep}
                        className="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold text-lg hover:scale-[0.98] transition-transform flex items-center gap-2 mx-auto"
                    >
                        Get Started
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Step 2: Sample Emails */}
            {step === 2 && (
                <div>
                    <h2 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                        Sample Emails
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 font-inter mb-8">
                        Paste at least 3 emails you've written (minimum 3 required)
                    </p>

                    <div className="space-y-4 mb-8">
                        {samples.map((sample, index) => (
                            <div key={index} className="relative">
                                <textarea
                                    value={sample}
                                    onChange={(e) => {
                                        const newSamples = [...samples];
                                        newSamples[index] = e.target.value;
                                        setSamples(newSamples);
                                    }}
                                    placeholder={`Sample email ${index + 1}...`}
                                    rows={6}
                                    className="w-full px-6 py-4 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                />
                                {samples.length > 3 && (
                                    <button
                                        onClick={() => handleRemoveSample(index)}
                                        className="absolute top-4 right-4 p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleAddSample}
                            className="px-6 py-3 rounded-full bg-[#F3F3F3] dark:bg-[#1E1E1E] text-black dark:text-white font-plus-jakarta font-medium hover:bg-[#E6E6E6] dark:hover:bg-[#333333] transition-all flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Add Another Sample
                        </button>

                        <button
                            onClick={handleNextStep}
                            className="px-8 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center gap-2 ml-auto"
                        >
                            Continue
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Questionnaire */}
            {step === 3 && questions.length > 0 && (
                <div>
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-3xl font-sora font-bold text-black dark:text-white">
                                Question {currentQuestion + 1} of {questions.length}
                            </h2>
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                                {Math.round(((currentQuestion + 1) / questions.length) * 100)}% complete
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[#E6E6E6] dark:bg-[#333333] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-accent transition-all duration-300"
                                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-8 mb-8">
                        <h3 className="text-2xl font-sora font-bold text-black dark:text-white mb-6">
                            {questions[currentQuestion].question}
                        </h3>
                        {renderQuestion(questions[currentQuestion])}
                    </div>

                    <button
                        onClick={handleNextQuestion}
                        disabled={analyzing}
                        className="px-8 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform flex items-center gap-2 ml-auto disabled:opacity-50"
                    >
                        {currentQuestion === questions.length - 1 ? (analyzing ? 'Analyzing...' : 'Complete Training') : 'Next Question'}
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Step 4: Analyzing (handled in step 3) */}

            {/* Step 5: Completion */}
            {step === 5 && profile && (
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-4xl font-sora font-bold text-black dark:text-white mb-4">
                        Your Voice Profile is Ready!
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 font-inter mb-12">
                        We've analyzed your writing style
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
                        <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-2">Tone</p>
                            <p className="text-2xl font-sora font-bold text-black dark:text-white capitalize">
                                {profile.tone}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-2">Formality</p>
                            <p className="text-2xl font-sora font-bold text-black dark:text-white">
                                {profile.formality_level}/5
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-2">Quality Score</p>
                            <p className="text-2xl font-sora font-bold text-black dark:text-white">
                                {(profile.quality_score * 100).toFixed(0)}%
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-2">Status</p>
                            <p className="text-2xl font-sora font-bold text-green-600 dark:text-green-400">
                                Trained ✓
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard/email-stream')}
                        className="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold text-lg hover:scale-[0.98] transition-transform flex items-center gap-2 mx-auto"
                    >
                        Start Drafting Emails
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
