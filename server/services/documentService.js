const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = 'mymedicalcabinet';
const DOCUMENTS_FOLDER = 'mymedicalcabinet-user-documents';

// Allowed file types
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/dicom', // DICOM medical imaging
    'application/octet-stream' // For DICOM files that may not have correct mime type
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const documentService = {
    /**
     * Generate a presigned URL for uploading a file
     */
    async getUploadUrl(userId, filename, mimeType) {
        if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
            throw new Error('File type not allowed');
        }

        const fileExtension = filename.split('.').pop();
        const uniqueFilename = `${uuidv4()}.${fileExtension}`;
        const s3Key = `${DOCUMENTS_FOLDER}/${userId}/${uniqueFilename}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: mimeType
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

        return {
            uploadUrl,
            s3Key,
            filename: uniqueFilename
        };
    },

    /**
     * Generate a presigned URL for downloading/viewing a file
     */
    async getDownloadUrl(s3Key) {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key
        });

        const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

        return downloadUrl;
    },

    /**
     * Delete a file from S3
     */
    async deleteFile(s3Key) {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key
        });

        await s3Client.send(command);
        return true;
    },

    /**
     * Upload a file directly (for server-side uploads)
     */
    async uploadFile(userId, file) {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new Error('File type not allowed');
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error('File too large. Maximum size is 50MB.');
        }

        const fileExtension = file.originalname.split('.').pop();
        const uniqueFilename = `${uuidv4()}.${fileExtension}`;
        const s3Key = `${DOCUMENTS_FOLDER}/${userId}/${uniqueFilename}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype
        });

        await s3Client.send(command);

        return {
            s3Key,
            filename: uniqueFilename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size
        };
    }
};

module.exports = documentService;
