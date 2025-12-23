/**
 * Email Parser Utilities
 * Helper functions for extracting structured data from email objects
 */

/**
 * Parse email address string into structured object
 * Handles formats like "John Doe <john@example.com>" or "john@example.com"
 */
export function parseEmailAddress(addressString) {
    if (!addressString) return null;

    // Handle array of addresses
    if (Array.isArray(addressString)) {
        return addressString.map(addr => parseEmailAddress(addr)).filter(Boolean);
    }

    // Match "Name <email@domain.com>" or "email@domain.com"
    const match = addressString.match(/^(.+?)\s*<(.+?)>$/) || addressString.match(/^(.+)$/);

    if (!match) return null;

    if (match[2]) {
        // "Name <email>" format
        return {
            name: match[1].trim(),
            email: match[2].trim()
        };
    } else {
        // Just email format
        return {
            name: '',
            email: match[1].trim()
        };
    }
}

/**
 * Parse multiple email addresses (for cc, bcc fields)
 */
export function parseEmailAddresses(addressString) {
    if (!addressString) return [];

    if (Array.isArray(addressString)) {
        return addressString.map(addr => parseEmailAddress(addr)).filter(Boolean);
    }

    // Split by comma and parse each
    return addressString
        .split(',')
        .map(addr => parseEmailAddress(addr.trim()))
        .filter(Boolean);
}

/**
 * Extract keywords from text (simple implementation)
 * Removes common words and returns significant terms
 */
export function extractKeywords(text, limit = 10) {
    if (!text) return [];

    // Common stop words to filter out
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
        'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    // Extract words, filter, and count
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word));

    // Count word frequency
    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Sort by frequency and return top keywords
    return Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([word]) => word);
}

/**
 * Analyze sentiment of text (basic implementation)
 * For more accurate results, could use OpenAI or sentiment library
 */
export function analyzeSentiment(text) {
    if (!text) return 'neutral';

    const lowerText = text.toLowerCase();

    // Simple positive/negative word lists
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'good',
        'happy', 'love', 'best', 'awesome', 'perfect', 'thank', 'thanks'];

    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate',
        'angry', 'disappointed', 'problem', 'issue', 'complaint', 'wrong'];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        positiveScore += (lowerText.match(regex) || []).length;
    });

    negativeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        negativeScore += (lowerText.match(regex) || []).length;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
}

/**
 * Extract email metadata from email object
 */
export function extractEmailMetadata(email) {
    return {
        // Basic fields with parsing
        subject: email.subject || '',
        from: parseEmailAddress(email.from),
        to: parseEmailAddress(email.to),
        cc: parseEmailAddresses(email.cc),
        bcc: parseEmailAddresses(email.bcc),

        // Body content
        body: email.text || '',
        html: email.html || '',

        // Metadata
        date: email.date || new Date().toISOString(),
        messageId: email.messageId || email.id || '',
        inReplyTo: email.inReplyTo || '',
        references: email.references || [],

        // Attachments
        hasAttachments: (email.attachments && email.attachments.length > 0) || false,
        attachments: (email.attachments || []).map(att => ({
            filename: att.filename || att.name || 'unknown',
            size: att.size || 0,
            contentType: att.contentType || att.mimeType || 'application/octet-stream'
        })),

        // Extracted insights
        subject_keywords: extractKeywords(email.subject || '', 5),
        body_keywords: extractKeywords(email.text || '', 10),
        sentiment: analyzeSentiment(email.text || '')
    };
}
