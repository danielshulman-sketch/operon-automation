import { NextResponse } from 'next/server';

export async function GET() {
    const questions = [
        {
            id: 1,
            question: 'What is your typical email greeting?',
            type: 'text',
            placeholder: 'e.g., Hi there, Hello, Hey',
        },
        {
            id: 2,
            question: 'What is your typical email closing?',
            type: 'text',
            placeholder: 'e.g., Best regards, Cheers, Thanks',
        },
        {
            id: 3,
            question: 'What is your preferred tone?',
            type: 'single_choice',
            options: ['Professional', 'Casual', 'Friendly', 'Formal'],
        },
        {
            id: 4,
            question: 'How formal are your emails?',
            type: 'scale',
            min: 1,
            max: 5,
            minLabel: 'Very Casual',
            maxLabel: 'Very Formal',
        },
        {
            id: 5,
            question: 'What sentence length do you prefer?',
            type: 'single_choice',
            options: ['Short/concise', 'Medium', 'Long/detailed'],
        },
        {
            id: 6,
            question: 'How often do you use emojis?',
            type: 'single_choice',
            options: ['Never', 'Rarely', 'Sometimes', 'Often'],
        },
        {
            id: 7,
            question: 'How often do you use exclamation marks?',
            type: 'single_choice',
            options: ['Rarely', 'Sometimes', 'Often'],
        },
        {
            id: 8,
            question: 'What are your preferred pronouns?',
            type: 'text',
            placeholder: 'e.g., he/him, she/her, they/them',
        },
        {
            id: 9,
            question: 'What are some common phrases you use?',
            type: 'text',
            placeholder: 'Comma-separated, e.g., "Let me know", "Happy to help"',
        },
        {
            id: 10,
            question: 'What industry or context do you work in?',
            type: 'text',
            placeholder: 'e.g., tech startup, healthcare, education',
        },
        {
            id: 11,
            question: 'Who do you typically email?',
            type: 'multiple_choice',
            options: ['Colleagues', 'Clients', 'Partners', 'Friends'],
        },
        {
            id: 12,
            question: 'What are your writing priorities?',
            type: 'multiple_choice',
            options: ['Clarity', 'Brevity', 'Warmth', 'Professionalism', 'Humor'],
        },
    ];

    return NextResponse.json({ questions });
}
