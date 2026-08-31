import { NextResponse } from 'next/server';
import { query } from '@/utils/db';
import { requireAuth } from '@/utils/auth';
import { ensureFoodPainTrackerTables } from '@/utils/ensure-food-pain-tracker';
import { generateChatResponse } from '@/utils/openai';

const STOPWORDS = new Set([
    'the', 'and', 'with', 'a', 'an', 'of', 'for', 'to', 'some', 'my', 'was', 'had',
    'ate', 'drank', 'plus', 'also', 'today', 'this', 'morning', 'lunch', 'dinner',
    'breakfast', 'snack', 'cup', 'glass', 'bowl', 'plate', 'small', 'large',
]);

function extractTagsForLog(foodLog) {
    const tags = new Set();

    const analysis = foodLog.ai_analysis;
    if (analysis) {
        (analysis.items || []).forEach((item) => {
            if (item) tags.add(String(item).toLowerCase().trim());
        });
        (analysis.possible_triggers || []).forEach((trigger) => {
            if (trigger && trigger !== 'none') tags.add(String(trigger).toLowerCase().trim());
        });
    }

    if (tags.size === 0 && foodLog.description) {
        foodLog.description
            .toLowerCase()
            .split(/[^a-z]+/)
            .filter((word) => word.length > 2 && !STOPWORDS.has(word))
            .forEach((word) => tags.add(word));
    }

    return tags;
}

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await ensureFoodPainTrackerTables();

        const { searchParams } = new URL(request.url);
        const days = Math.min(Math.max(parseInt(searchParams.get('days'), 10) || 60, 7), 365);

        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        const from = fromDate.toISOString().slice(0, 10);

        const [painResult, foodResult] = await Promise.all([
            query(
                `SELECT log_date, pain_level FROM pain_logs
                 WHERE org_id = $1 AND user_id = $2 AND log_date >= $3
                 ORDER BY log_date ASC`,
                [user.org_id, user.id, from]
            ),
            query(
                `SELECT log_date, description, ai_analysis FROM food_logs
                 WHERE org_id = $1 AND user_id = $2 AND log_date >= $3
                 ORDER BY log_date ASC`,
                [user.org_id, user.id, from]
            ),
        ]);

        const painByDate = new Map();
        painResult.rows.forEach((row) => {
            const dateKey = row.log_date.toISOString ? row.log_date.toISOString().slice(0, 10) : String(row.log_date);
            painByDate.set(dateKey, row.pain_level);
        });

        // Build set of tags present per date (deduped within a day)
        const tagsByDate = new Map();
        foodResult.rows.forEach((row) => {
            const dateKey = row.log_date.toISOString ? row.log_date.toISOString().slice(0, 10) : String(row.log_date);
            const tags = extractTagsForLog(row);
            if (!tagsByDate.has(dateKey)) tagsByDate.set(dateKey, new Set());
            const existing = tagsByDate.get(dateKey);
            tags.forEach((tag) => existing.add(tag));
        });

        // Only look at days that have both a pain level and at least one food log
        const relevantDates = [...painByDate.keys()].filter((date) => tagsByDate.has(date));

        const tagStats = new Map(); // tag -> { withLevels: [], withoutLevels: [] }
        const allTags = new Set();
        relevantDates.forEach((date) => {
            tagsByDate.get(date).forEach((tag) => allTags.add(tag));
        });

        allTags.forEach((tag) => {
            const withLevels = [];
            const withoutLevels = [];
            relevantDates.forEach((date) => {
                const level = painByDate.get(date);
                if (tagsByDate.get(date).has(tag)) {
                    withLevels.push(level);
                } else {
                    withoutLevels.push(level);
                }
            });
            tagStats.set(tag, { withLevels, withoutLevels });
        });

        const avg = (arr) => (arr.length ? arr.reduce((sum, n) => sum + n, 0) / arr.length : null);

        const correlations = [...tagStats.entries()]
            .map(([tag, { withLevels, withoutLevels }]) => {
                const avgWith = avg(withLevels);
                const avgWithout = avg(withoutLevels);
                return {
                    tag,
                    daysWith: withLevels.length,
                    avgPainWith: avgWith !== null ? Math.round(avgWith * 10) / 10 : null,
                    avgPainWithout: avgWithout !== null ? Math.round(avgWithout * 10) / 10 : null,
                    difference: avgWith !== null && avgWithout !== null
                        ? Math.round((avgWith - avgWithout) * 10) / 10
                        : null,
                };
            })
            .filter((entry) => entry.daysWith >= 2 && entry.avgPainWithout !== null)
            .sort((a, b) => Math.abs(b.difference || 0) - Math.abs(a.difference || 0))
            .slice(0, 10);

        const dailyPainLevels = [...painByDate.entries()]
            .map(([date, level]) => ({ date, painLevel: level }))
            .sort((a, b) => (a.date < b.date ? -1 : 1));

        const overallAvgPain = avg([...painByDate.values()]);

        let aiInsights = null;
        if (correlations.length > 0) {
            try {
                const response = await generateChatResponse({
                    orgId: user.org_id,
                    systemPrompt: `You are a careful health-tracking assistant. You are given statistical correlations between logged foods/drinks and a user's self-reported daily pain levels (0-10 scale). Write a short (3-5 sentence) plain-language summary of the most notable patterns. Be explicit that this is correlation, not proof of causation, that the sample size is small, and that they should discuss meaningful patterns with a doctor before changing their diet. Do not give medical diagnoses.`,
                    messages: [
                        {
                            role: 'user',
                            content: `Days analyzed: ${relevantDates.length}\nOverall average pain level: ${overallAvgPain !== null ? overallAvgPain.toFixed(1) : 'n/a'}\n\nCorrelations (tag, days it appeared, avg pain on those days vs avg pain on other days):\n${correlations
                                .map((c) => `- ${c.tag}: appeared on ${c.daysWith} day(s), avg pain ${c.avgPainWith} vs ${c.avgPainWithout} on other days (diff ${c.difference > 0 ? '+' : ''}${c.difference})`)
                                .join('\n')}`,
                        },
                    ],
                    temperature: 0.4,
                    maxTokens: 350,
                });
                aiInsights = response.content || null;
            } catch (error) {
                console.error('Failed to generate AI insights for pain analysis:', error.message);
            }
        }

        return NextResponse.json({
            daysAnalyzed: relevantDates.length,
            totalPainLogs: painByDate.size,
            totalFoodLogs: foodResult.rows.length,
            overallAvgPain: overallAvgPain !== null ? Math.round(overallAvgPain * 10) / 10 : null,
            dailyPainLevels,
            correlations,
            aiInsights,
        });
    } catch (error) {
        console.error('Pain analysis error:', error);
        return NextResponse.json({ error: 'Failed to analyze pain and food data' }, { status: 500 });
    }
}
