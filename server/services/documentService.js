import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

const s3Client = process.env.AWS_ACCESS_KEY_ID
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

const S3_BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Get document from S3 or local storage
 * @param {string} s3Key - S3 key or local file path
 * @returns {Promise<{buffer: Buffer, mimeType: string, filename: string}>}
 */
export const getDocument = async (s3Key) => {
  if (!s3Key) {
    throw new Error('Document key is required');
  }

  if (s3Client && S3_BUCKET && s3Key.startsWith('documents/')) {
    return getDocumentFromS3(s3Key);
  }

  return getDocumentFromLocal(s3Key);
};

/**
 * Get document from S3
 */
const getDocumentFromS3 = async (s3Key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const filename = path.basename(s3Key);
    const mimeType = response.ContentType || getMimeType(filename);

    logger.info('Document fetched from S3', { s3Key, size: buffer.length });

    return { buffer, mimeType, filename };
  } catch (error) {
    logger.error('S3 fetch error', { error: error.message, s3Key });
    throw new Error('Failed to fetch document from storage');
  }
};

/**
 * Get document from local storage
 */
const getDocumentFromLocal = async (filePath) => {
  try {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads/';
    const fullPath = filePath.startsWith('/')
      ? filePath
      : path.join(process.cwd(), uploadPath, filePath);

    const buffer = await fs.readFile(fullPath);
    const filename = path.basename(fullPath);
    const mimeType = getMimeType(filename);

    logger.info('Document fetched from local storage', { filePath, size: buffer.length });

    return { buffer, mimeType, filename };
  } catch (error) {
    logger.error('Local file fetch error', { error: error.message, filePath });
    throw new Error('Failed to fetch document from storage');
  }
};

/**
 * Get MIME type from filename
 */
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

/**
 * Validate that user owns the document
 * @param {string} s3Key - S3 key containing user ID
 * @param {string} userId - User ID to validate against
 * @returns {boolean}
 */
export const validateDocumentOwnership = (s3Key, userId) => {
  if (!s3Key || !userId) return false;

  const userIdStr = userId.toString();
  return s3Key.includes(userIdStr) || s3Key.includes(`user-${userIdStr}`);
};

export default { getDocument, validateDocumentOwnership };
