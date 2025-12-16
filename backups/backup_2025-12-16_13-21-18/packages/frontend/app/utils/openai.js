import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

export async function classifyEmail(emailContent) {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: `You are an email classification assistant. Classify emails into one of these categories:
- "task" - Action required
- "fyi" - Information only
- "question" - Requires response
- "approval" - Needs approval
- "meeting" - Meeting related

Also extract any tasks mentioned in the email.

Respond in JSON format:
{
  "classification": "task|fyi|question|approval|meeting",
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description",
      "priority": "high|medium|low",
      "due_date": "ISO date or null"
    }
  ]
}`
            },
            {
                role: 'user',
                content: emailContent
            }
        ],
        response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
}

export async function analyzeVoiceProfile(samples, responses) {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: `You are a writing style analyzer. Analyze the provided email samples and questionnaire responses to create a voice profile.

Respond in JSON format:
{
  "tone": "professional|casual|friendly|formal",
  "formality_level": 1-5,
  "writing_style": {
    "greeting": "typical greeting",
    "closing": "typical closing",
    "sentence_length": "short|medium|long",
    "emoji_usage": "never|rarely|sometimes|often",
    "exclamation_usage": "rarely|sometimes|often",
    "common_phrases": ["phrase1", "phrase2"]
  },
  "quality_score": 0.0-1.0
}`
            },
            {
                role: 'user',
                content: `Sample Emails:\n${samples.join('\n\n---\n\n')}\n\nQuestionnaire Responses:\n${JSON.stringify(responses, null, 2)}`
            }
        ],
        response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
}

export async function generateDraft(emailContent, voiceProfile) {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: `You are an email draft generator. Generate a professional email response based on the user's voice profile.

Voice Profile:
- Tone: ${voiceProfile.tone}
- Formality: ${voiceProfile.formality_level}/5
- Greeting: ${voiceProfile.writing_style?.greeting || 'Hi'}
- Closing: ${voiceProfile.writing_style?.closing || 'Best regards'}
- Sentence length: ${voiceProfile.writing_style?.sentence_length || 'medium'}

Respond in JSON format:
{
  "subject": "Re: Original subject",
  "body": "Full email body"
}`
            },
            {
                role: 'user',
                content: `Generate a reply to this email:\n\n${emailContent}`
            }
        ],
        response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
}

export async function generateEmbedding(text) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });

    return response.data[0].embedding;
}
