import crypto from 'crypto';

const IV_LENGTH = 16; // AES block size

// Derive a proper 32-byte key from whatever is provided (or use fallback)
function getEncryptionKey(): Buffer {
    const rawKey = process.env.ENCRYPTION_KEY || 'BudgalongDefaultDevKey2026';
    // Use SHA-256 to always get exactly 32 bytes
    return crypto.createHash('sha256').update(rawKey).digest();
}

export function encrypt(text: string): string {
    if (!text) return text;
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption failed:', error);
        return text; // Fallback: return plain text (not ideal but prevents crashes)
    }
}

export function decrypt(text: string): string {
    if (!text) return text;
    try {
        const key = getEncryptionKey();
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed:', error);
        return '***'; // Fail safe - masked value
    }
}
