'use client';

import { useState, useEffect, useCallback } from 'react';
import { Camera, Trash2, Sparkles, Utensils, Activity, X, Pencil, AlertCircle } from 'lucide-react';

const MAX_IMAGE_DIMENSION = 1024;
const IMAGE_QUALITY = 0.8;

function todayDate() {
    return new Date().toISOString().slice(0, 10);
}

function compressImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read image file'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Could not load image'));
            img.onload = () => {
                let { width, height } = img;
                if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
                    const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

function PainScale({ value, onChange }) {
    const getColor = (level) => {
        if (level === 0) return 'bg-green-500';
        if (level <= 3) return 'bg-lime-500';
        if (level <= 6) return 'bg-orange-500';
        return 'bg-red-600';
    };

    return (
        <div>
            <div className="flex items-end justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-inter">No pain</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-inter">Worst pain</span>
            </div>
            <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-black dark:accent-white cursor-pointer"
            />
            <div className="flex items-center justify-center mt-3">
                <span className={`inline-flex items-center justify-center w-14 h-14 rounded-full text-white text-xl font-bold font-sora ${getColor(value)}`}>
                    {value}
                </span>
            </div>
        </div>
    );
}

export default function FoodPainTrackerPage() {
    const [painLevel, setPainLevel] = useState(0);
    const [painNotes, setPainNotes] = useState('');
    const [savingPain, setSavingPain] = useState(false);
    const [painSavedAt, setPainSavedAt] = useState(null);

    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageProcessing, setImageProcessing] = useState(false);
    const [savingFood, setSavingFood] = useState(false);
    const [foodLogs, setFoodLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    const [analysis, setAnalysis] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);

    const [editingLogId, setEditingLogId] = useState(null);
    const [editDescription, setEditDescription] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const authHeaders = useCallback(() => {
        const token = localStorage.getItem('auth_token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    const fetchTodaysPainLog = useCallback(async () => {
        try {
            const res = await fetch(`/api/pain-logs?from=${todayDate()}&to=${todayDate()}`, {
                headers: authHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                const todaysLog = data.painLogs?.[0];
                if (todaysLog) {
                    setPainLevel(todaysLog.pain_level);
                    setPainNotes(todaysLog.notes || '');
                }
            }
        } catch (error) {
            console.error('Failed to fetch today\'s pain log:', error);
        }
    }, [authHeaders]);

    const fetchFoodLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            const res = await fetch('/api/food-logs', { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setFoodLogs(data.foodLogs || []);
            }
        } catch (error) {
            console.error('Failed to fetch food logs:', error);
        }
        setLoadingLogs(false);
    }, [authHeaders]);

    useEffect(() => {
        fetchTodaysPainLog();
        fetchFoodLogs();
    }, [fetchTodaysPainLog, fetchFoodLogs]);

    const handleSavePain = async () => {
        setSavingPain(true);
        setPainSavedAt(null);
        try {
            const res = await fetch('/api/pain-logs', {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ painLevel, notes: painNotes, logDate: todayDate() }),
            });
            if (res.ok) {
                setPainSavedAt(new Date());
            }
        } catch (error) {
            console.error('Failed to save pain level:', error);
        }
        setSavingPain(false);
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageProcessing(true);
        try {
            const dataUrl = await compressImageFile(file);
            setImagePreview(dataUrl);
        } catch (error) {
            console.error('Failed to process image:', error);
        }
        setImageProcessing(false);
    };

    const handleSaveFood = async (e) => {
        e.preventDefault();
        if (!imagePreview && !description.trim()) return;

        setSavingFood(true);
        try {
            const res = await fetch('/api/food-logs', {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imagePreview,
                    description: description.trim(),
                    logDate: todayDate(),
                }),
            });
            if (res.ok) {
                setDescription('');
                setImagePreview(null);
                fetchFoodLogs();
            }
        } catch (error) {
            console.error('Failed to save food log:', error);
        }
        setSavingFood(false);
    };

    const handleStartEdit = (log) => {
        setEditingLogId(log.id);
        setEditDescription(log.description || '');
    };

    const handleCancelEdit = () => {
        setEditingLogId(null);
        setEditDescription('');
    };

    const handleSaveEdit = async (id) => {
        if (!editDescription.trim()) return;
        setSavingEdit(true);
        try {
            const res = await fetch(`/api/food-logs/${id}`, {
                method: 'PATCH',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: editDescription.trim() }),
            });
            if (res.ok) {
                const data = await res.json();
                setFoodLogs((prev) => prev.map((log) => (log.id === id ? data.foodLog : log)));
                setEditingLogId(null);
                setEditDescription('');
            }
        } catch (error) {
            console.error('Failed to update food log description:', error);
        }
        setSavingEdit(false);
    };

    const handleDeleteFoodLog = async (id) => {
        setFoodLogs((prev) => prev.filter((log) => log.id !== id));
        try {
            await fetch(`/api/food-logs/${id}`, { method: 'DELETE', headers: authHeaders() });
        } catch (error) {
            console.error('Failed to delete food log:', error);
            fetchFoodLogs();
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setAnalysisError(null);
        try {
            const res = await fetch('/api/pain-logs/analysis?days=60', { headers: authHeaders() });
            if (res.ok) {
                setAnalysis(await res.json());
            } else {
                setAnalysisError('Could not analyze your data right now.');
            }
        } catch (error) {
            console.error('Failed to analyze:', error);
            setAnalysisError('Could not analyze your data right now.');
        }
        setAnalyzing(false);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Food, Drink &amp; Pain Tracker
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Log what you eat and drink, track your daily pain level, and look for patterns between them.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Pain level */}
                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="h-5 w-5 text-black dark:text-white" />
                        <h2 className="text-lg font-sora font-bold text-black dark:text-white">Today&apos;s Pain Level</h2>
                    </div>
                    <PainScale value={painLevel} onChange={setPainLevel} />
                    <textarea
                        value={painNotes}
                        onChange={(e) => setPainNotes(e.target.value)}
                        rows={2}
                        placeholder="Optional notes (location, type of pain, etc.)"
                        className="w-full mt-4 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none text-sm"
                    />
                    <button
                        onClick={handleSavePain}
                        disabled={savingPain}
                        className="w-full mt-4 py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {savingPain ? 'Saving...' : 'Save Pain Level'}
                    </button>
                    {painSavedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center font-inter">
                            Saved for today
                        </p>
                    )}
                </div>

                {/* Log food/drink */}
                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Utensils className="h-5 w-5 text-black dark:text-white" />
                        <h2 className="text-lg font-sora font-bold text-black dark:text-white">Log Food or Drink</h2>
                    </div>
                    <form onSubmit={handleSaveFood} className="space-y-4">
                        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-6 cursor-pointer hover:border-black dark:hover:border-white transition-colors">
                            {imagePreview ? (
                                <div className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setImagePreview(null); }}
                                        className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Camera className="h-8 w-8 text-gray-400" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                                        {imageProcessing ? 'Processing photo...' : 'Take or upload a photo'}
                                    </span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </label>
                        <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2 font-inter">
                            Tip: for packaged food or drink, also photograph the ingredients label — it gives the best chance of spotting a specific trigger.
                        </p>

                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe what you ate or drank..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none text-sm"
                        />

                        <button
                            type="submit"
                            disabled={savingFood || imageProcessing || (!imagePreview && !description.trim())}
                            className="w-full py-3 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {savingFood ? 'Saving...' : 'Add Entry'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Pattern analysis */}
            <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-black dark:text-white" />
                        <h2 className="text-lg font-sora font-bold text-black dark:text-white">Pattern Analysis</h2>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-black dark:border-white text-black dark:text-white font-plus-jakarta font-semibold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50"
                    >
                        {analyzing ? 'Analyzing...' : 'Analyze Last 60 Days'}
                    </button>
                </div>

                {analysisError && (
                    <p className="text-sm text-red-500 font-inter">{analysisError}</p>
                )}

                {analysis && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-xl bg-[#F3F3F3] dark:bg-[#151515] p-4">
                                <p className="text-2xl font-sora font-bold text-black dark:text-white">{analysis.daysAnalyzed}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-inter">days with both pain &amp; food logs</p>
                            </div>
                            <div className="rounded-xl bg-[#F3F3F3] dark:bg-[#151515] p-4">
                                <p className="text-2xl font-sora font-bold text-black dark:text-white">
                                    {analysis.overallAvgPain ?? '—'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-inter">average pain level</p>
                            </div>
                            <div className="rounded-xl bg-[#F3F3F3] dark:bg-[#151515] p-4">
                                <p className="text-2xl font-sora font-bold text-black dark:text-white">{analysis.totalFoodLogs}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-inter">food/drink entries</p>
                            </div>
                        </div>

                        {analysis.aiInsights && (
                            <div className="rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4">
                                <p className="text-sm font-semibold text-black dark:text-white mb-1 font-inter">AI Insights</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-inter whitespace-pre-line">
                                    {analysis.aiInsights}
                                </p>
                            </div>
                        )}

                        {analysis.correlations && analysis.correlations.length > 0 ? (
                            <div>
                                <p className="text-sm font-semibold text-black dark:text-white mb-3 font-inter">
                                    Foods/drinks most associated with a change in pain level
                                </p>
                                <div className="space-y-3">
                                    {analysis.correlations.map((c) => (
                                        <div key={c.tag}>
                                            <div className="flex items-center justify-between text-sm font-inter mb-1">
                                                <span className="capitalize text-black dark:text-white font-medium">{c.tag}</span>
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {c.avgPainWith} vs {c.avgPainWithout} avg ({c.daysWith} day{c.daysWith === 1 ? '' : 's'})
                                                </span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-[#F3F3F3] dark:bg-[#151515] overflow-hidden">
                                                <div
                                                    className={`h-full ${c.difference > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min(100, Math.abs(c.difference) * 10)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 font-inter">
                                    These are correlations from your own logs, not medical conclusions. Talk to a doctor before changing your diet based on this.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                                Not enough overlapping food and pain data yet. Keep logging daily to build up patterns.
                            </p>
                        )}
                    </div>
                )}

                {!analysis && !analyzing && !analysisError && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">
                        Log your food, drinks, and pain level for a few days, then run an analysis to see potential links.
                    </p>
                )}
            </div>

            {/* Recent entries */}
            <div>
                <h2 className="text-lg font-sora font-bold text-black dark:text-white mb-4">Recent Entries</h2>
                {loadingLogs ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-inter">Loading...</p>
                ) : foodLogs.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E]">
                        <Utensils className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400 font-inter">No entries yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {foodLogs.map((log) => {
                            const isEditing = editingLogId === log.id;
                            const wasUnrecognized = !log.description && (!log.ai_analysis || !(log.ai_analysis.items?.length));

                            return (
                                <div
                                    key={log.id}
                                    className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] overflow-hidden"
                                >
                                    {log.image_data && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={log.image_data} alt="Food log" className="w-full h-40 object-cover" />
                                    )}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-inter">
                                                {new Date(log.log_date).toLocaleDateString()}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {!isEditing && (
                                                    <button
                                                        onClick={() => handleStartEdit(log)}
                                                        className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                                        aria-label="Edit description"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteFoodLog(log.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    aria-label="Delete entry"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {isEditing ? (
                                            <div className="mb-2">
                                                <textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    rows={2}
                                                    autoFocus
                                                    placeholder="Describe what this is..."
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none text-sm"
                                                />
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleSaveEdit(log.id)}
                                                        disabled={savingEdit || !editDescription.trim()}
                                                        className="px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                                                    >
                                                        {savingEdit ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        disabled={savingEdit}
                                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-black dark:text-white text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : log.description ? (
                                            <p className="text-sm text-black dark:text-white font-inter mb-2">{log.description}</p>
                                        ) : wasUnrecognized ? (
                                            <button
                                                onClick={() => handleStartEdit(log)}
                                                className="w-full text-left flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 px-3 py-2 mb-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                            >
                                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                                <span className="text-xs text-amber-800 dark:text-amber-300 font-inter">
                                                    We couldn&apos;t recognize this from the photo. Tap to add a description.
                                                </span>
                                            </button>
                                        ) : null}

                                        {log.ai_analysis?.ingredients?.length > 0 && (
                                            <div className="mb-2">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-inter">
                                                        Ingredients
                                                    </p>
                                                    {log.ai_analysis.ingredients_from_label && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-inter">
                                                            read from label
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {log.ai_analysis.ingredients.slice(0, 8).map((ingredient, idx) => (
                                                        <span
                                                            key={`${ingredient}-${idx}`}
                                                            className="px-2 py-0.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-inter"
                                                        >
                                                            {ingredient}
                                                        </span>
                                                    ))}
                                                    {log.ai_analysis.ingredients.length > 8 && (
                                                        <span className="px-2 py-0.5 text-xs text-gray-400 font-inter">
                                                            +{log.ai_analysis.ingredients.length - 8} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {log.ai_analysis?.possible_triggers?.filter((t) => t !== 'none').length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {log.ai_analysis.possible_triggers
                                                    .filter((t) => t !== 'none')
                                                    .map((trigger) => (
                                                        <span
                                                            key={trigger}
                                                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F3F3F3] dark:bg-[#151515] text-gray-600 dark:text-gray-400 font-inter"
                                                        >
                                                            {trigger}
                                                        </span>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
