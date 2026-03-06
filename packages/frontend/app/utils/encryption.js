import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// In a real app, this should be a 32-byte hex string in the environment variables.
// Fallback to a hardcoded string for development ONLY if ENCRYPTION_KEY is unset (not recommended for prod)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Encrypts a plain text string.
 * @param {string} text The plain text string to encrypt.
 * @returns {string|null} The encrypted string in the format "iv:authTag:encryptedData", or null if input is empty.
 */
export function encrypt(text) {
    if (!text) return null;

    // Ensure the key is exactly 32 bytes (256 bits)
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Return the IV, Auth Tag, and Encrypted Text together
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string created by the `encrypt` function.
 * @param {string} encryptedText The encrypted string in the format "iv:authTag:encryptedData".
 * @returns {string|null} The decrypted plain text string, or null if input is empty or invalid.
 */
export function decrypt(encryptedText) {
    if (!encryptedText) return null;

    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            // If it doesn't match our format, it might be an old unencrypted key (legacy fallback)
            // In a strict environment, you would throw an error here instead.
            return encryptedText;
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        // Fallback to returning the original string if decryption fails 
        // (useful during migration where some keys might be plaintext and others encrypted)
        return encryptedText;
    }
}
