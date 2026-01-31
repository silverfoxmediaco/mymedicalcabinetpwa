const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const documentService = require('../services/documentService');
const MedicalHistory = require('../models/MedicalHistory');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// @route   POST /api/documents/upload-url
// @desc    Get a presigned URL for client-side upload
// @access  Private
router.post('/upload-url', protect, async (req, res) => {
    try {
        const { filename, mimeType } = req.body;

        if (!filename || !mimeType) {
            return res.status(400).json({
                success: false,
                message: 'Filename and mimeType are required'
            });
        }

        const result = await documentService.getUploadUrl(
            req.user._id.toString(),
            filename,
            mimeType
        );

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Get upload URL error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error generating upload URL'
        });
    }
});

// @route   POST /api/documents/upload
// @desc    Upload a file directly to server then S3
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const result = await documentService.uploadFile(
            req.user._id.toString(),
            req.file
        );

        res.json({
            success: true,
            document: result
        });
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error uploading file'
        });
    }
});

// @route   GET /api/documents/download/:s3Key
// @desc    Get a presigned URL for downloading a file
// @access  Private
router.get('/download/*', protect, async (req, res) => {
    try {
        // Get the full path after /download/
        const s3Key = req.params[0];

        if (!s3Key) {
            return res.status(400).json({
                success: false,
                message: 's3Key is required'
            });
        }

        // Verify user owns this document (s3Key should contain user ID)
        if (!s3Key.includes(req.user._id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const downloadUrl = await documentService.getDownloadUrl(s3Key);

        res.json({
            success: true,
            downloadUrl
        });
    } catch (error) {
        console.error('Get download URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating download URL'
        });
    }
});

// @route   DELETE /api/documents/:s3Key
// @desc    Delete a file from S3
// @access  Private
router.delete('/*', protect, async (req, res) => {
    try {
        // Get the full path after /
        const s3Key = req.params[0];

        if (!s3Key) {
            return res.status(400).json({
                success: false,
                message: 's3Key is required'
            });
        }

        // Verify user owns this document
        if (!s3Key.includes(req.user._id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await documentService.deleteFile(s3Key);

        res.json({
            success: true,
            message: 'Document deleted'
        });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file'
        });
    }
});

// @route   POST /api/documents/event/:eventId
// @desc    Add a document to an event
// @access  Private
router.post('/event/:eventId', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        // Upload file to S3
        const uploadResult = await documentService.uploadFile(
            req.user._id.toString(),
            req.file
        );

        // Add document to event
        const history = await MedicalHistory.findOneAndUpdate(
            {
                userId: req.user._id,
                'events._id': req.params.eventId
            },
            {
                $push: {
                    'events.$.documents': {
                        filename: uploadResult.filename,
                        originalName: uploadResult.originalName,
                        mimeType: uploadResult.mimeType,
                        size: uploadResult.size,
                        s3Key: uploadResult.s3Key
                    }
                }
            },
            { new: true }
        );

        if (!history) {
            // Clean up uploaded file if event not found
            await documentService.deleteFile(uploadResult.s3Key);
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const event = history.events.id(req.params.eventId);

        res.json({
            success: true,
            message: 'Document added to event',
            document: event.documents[event.documents.length - 1]
        });
    } catch (error) {
        console.error('Add document to event error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error adding document to event'
        });
    }
});

// @route   DELETE /api/documents/event/:eventId/:documentId
// @desc    Remove a document from an event
// @access  Private
router.delete('/event/:eventId/:documentId', protect, async (req, res) => {
    try {
        // First get the document to find s3Key
        const history = await MedicalHistory.findOne({
            userId: req.user._id,
            'events._id': req.params.eventId
        });

        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        const event = history.events.id(req.params.eventId);
        const document = event.documents.id(req.params.documentId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Delete from S3
        await documentService.deleteFile(document.s3Key);

        // Remove from database
        await MedicalHistory.findOneAndUpdate(
            {
                userId: req.user._id,
                'events._id': req.params.eventId
            },
            {
                $pull: {
                    'events.$.documents': { _id: req.params.documentId }
                }
            }
        );

        res.json({
            success: true,
            message: 'Document removed from event'
        });
    } catch (error) {
        console.error('Remove document from event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing document from event'
        });
    }
});

module.exports = router;
