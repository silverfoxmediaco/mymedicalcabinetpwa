const mongoose = require('mongoose');
const crypto = require('crypto');

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

const HealthSystemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    fhirBaseUrl: {
        type: String,
        required: true
    },
    authorizeUrl: {
        type: String,
        required: true
    },
    tokenUrl: {
        type: String,
        required: true
    },
    city: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    clientSecret: {
        type: String,
        default: ''
    },
    clientSecretNonProd: {
        type: String,
        default: ''
    },
    epicOrgId: {
        type: String,
        default: ''
    },
    activatedAt: {
        type: Date,
        default: null
    }
});

HealthSystemSchema.index({ name: 'text' });

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns "iv:authTag:ciphertext" (all hex-encoded).
 */
function encryptSecret(plaintext) {
    const key = process.env.EPIC_SECRET_ENCRYPTION_KEY;
    if (!key) throw new Error('EPIC_SECRET_ENCRYPTION_KEY is not set');
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, keyBuffer, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a stored "iv:authTag:ciphertext" string back to plaintext.
 */
function decryptSecret(stored) {
    const key = process.env.EPIC_SECRET_ENCRYPTION_KEY;
    if (!key) throw new Error('EPIC_SECRET_ENCRYPTION_KEY is not set');
    const keyBuffer = Buffer.from(key, 'hex');
    const [ivHex, authTagHex, ciphertext] = stored.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Encrypt and store a production client secret on this health system.
 */
HealthSystemSchema.methods.setClientSecret = function(plaintext) {
    this.clientSecret = encryptSecret(plaintext);
};

/**
 * Decrypt and return the production client secret (or null if not set).
 */
HealthSystemSchema.methods.getClientSecret = function() {
    if (!this.clientSecret) return null;
    return decryptSecret(this.clientSecret);
};

/**
 * Encrypt and store a non-production client secret.
 */
HealthSystemSchema.methods.setClientSecretNonProd = function(plaintext) {
    this.clientSecretNonProd = encryptSecret(plaintext);
};

/**
 * Decrypt and return the non-production client secret (or null if not set).
 */
HealthSystemSchema.methods.getClientSecretNonProd = function() {
    if (!this.clientSecretNonProd) return null;
    return decryptSecret(this.clientSecretNonProd);
};

module.exports = mongoose.model('HealthSystem', HealthSystemSchema);
