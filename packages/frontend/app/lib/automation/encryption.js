import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-secret-key-change-me!!';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data (OAuth tokens, API keys)
 */
export function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf-8').slice(0, 32), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf-8').slice(0, 32), iv);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export function normalizeEncryptedValue(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        if (typeof value.encrypted === 'string') {
            return value.encrypted;
        }
        return JSON.stringify(value);
    }
    return String(value);
}

export function decryptValue(value) {
    const encrypted = normalizeEncryptedValue(value);
    if (!encrypted) {
        throw new Error('Missing encrypted credentials');
    }
    return decrypt(encrypted);
}

/**
 * Generate a secure random string
 */
export function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}
