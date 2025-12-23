import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { prompt, actionType } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Simple heuristic parser for Phase 2 (Tier 2 will use OpenAI)
        // This simulates AI understanding
        let config = {};
        const lowerPrompt = prompt.toLowerCase();

        // Email logic
        if (actionType.startsWith('email_')) {
            const emailMatch = prompt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
            if (emailMatch) config.to = emailMatch[0];

            if (lowerPrompt.includes('subject')) {
                const subjectParts = prompt.split('subject');
                if (subjectParts[1]) config.subject = subjectParts[1].split(/[\n,]/)[0].replace(/[:|-]/, '').trim();
            }
        }

        // Slack logic
        if (actionType.startsWith('slack_')) {
            if (lowerPrompt.includes('channel')) {
                // Mock extracting channel
                config.channel = 'C123456';
            }
            config.text = prompt;
        }

        // Google Sheets logic
        if (actionType.includes('sheet')) {
            if (lowerPrompt.includes('row')) {
                config.values = ['{{webhook.name}}', '{{webhook.email}}'];
            }
        }

        // Default: If completely empty, provide template based on recognized keywords
        if (Object.keys(config).length === 0) {
            config = {
                note: "AI could not extract specific fields. Here is a template.",
                ...generateTemplate(actionType)
            };
        }

        return NextResponse.json({ config });

    } catch (error) {
        console.error('AI Assist error:', error);
        return NextResponse.json(
            { error: 'Failed to generate configuration' },
            { status: 500 }
        );
    }
}

function generateTemplate(actionType) {
    // Return explicit templates for known actions
    if (actionType === 'email_send_email') return { to: 'example@test.com', subject: 'Hello', text: 'Message body' };
    if (actionType === 'slack_send_message') return { channel: 'C12345', text: 'Hello from automation' };
    return {};
}
