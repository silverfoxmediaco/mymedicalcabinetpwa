const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { analyzeDocument, analyzeInsuranceDocument } = require('../services/claudeService');
const documentService = require('../services/documentService');

/**
 * @route   POST /api/ai/explain-document
 * @desc    Get AI explanation of a medical document
 * @access  Private
 */
router.post('/explain-document', protect, async (req, res) => {
    try {
        const { s3Key, filename } = req.body;
        const userId = req.user._id.toString();

        if (!s3Key) {
            return res.status(400).json({
                success: false,
                message: 's3Key is required'
            });
        }

        // Validate user owns the document (s3Key should contain their userId)
        if (!s3Key.includes(userId)) {
            console.warn('Unauthorized document access attempt', { userId, s3Key });
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this document'
            });
        }

        // Fetch document from S3
        console.log('Fetching document for AI analysis:', s3Key);
        const { buffer, mimeType } = await documentService.getFileContent(s3Key);

        // Validate file type for AI analysis
        const supportedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf'
        ];

        if (!supportedTypes.includes(mimeType)) {
            return res.status(400).json({
                success: false,
                message: `Unsupported file type for AI analysis: ${mimeType}. Supported types: JPEG, PNG, GIF, WebP, PDF`
            });
        }

        // Convert to base64
        const base64Data = buffer.toString('base64');

        // Call Claude API
        console.log('Sending document to Claude for analysis...');
        const explanation = await analyzeDocument(base64Data, mimeType, filename || 'document');

        res.json({
            success: true,
            data: {
                explanation,
                documentName: filename,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Document explanation error:', error.message);

        const statusCode = error.message.includes('API key') ? 500 :
                           error.message.includes('rate limit') ? 429 :
                           error.message.includes('permission') ? 403 : 500;

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to analyze document'
        });
    }
});

/**
 * @route   POST /api/ai/explain-insurance-document
 * @desc    Get AI explanation of an insurance document
 * @access  Private
 */
router.post('/explain-insurance-document', protect, async (req, res) => {
    try {
        const { s3Key, filename } = req.body;
        const userId = req.user._id.toString();

        if (!s3Key) {
            return res.status(400).json({
                success: false,
                message: 's3Key is required'
            });
        }

        if (!s3Key.includes(userId)) {
            console.warn('Unauthorized insurance document access attempt', { userId, s3Key });
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this document'
            });
        }

        console.log('Fetching insurance document for AI analysis:', s3Key);
        const { buffer, mimeType } = await documentService.getFileContent(s3Key);

        const supportedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf'
        ];

        if (!supportedTypes.includes(mimeType)) {
            return res.status(400).json({
                success: false,
                message: `Unsupported file type for AI analysis: ${mimeType}. Supported types: JPEG, PNG, GIF, WebP, PDF`
            });
        }

        const base64Data = buffer.toString('base64');

        console.log('Sending insurance document to Claude for analysis...');
        const explanation = await analyzeInsuranceDocument(base64Data, mimeType, filename || 'document');

        res.json({
            success: true,
            data: {
                explanation,
                documentName: filename,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Insurance document explanation error:', error.message);

        const statusCode = error.message.includes('API key') ? 500 :
                           error.message.includes('rate limit') ? 429 :
                           error.message.includes('permission') ? 403 : 500;

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to analyze insurance document'
        });
    }
});

/**
 * @route   GET /api/ai/health
 * @desc    Check AI service health
 * @access  Public
 */
router.get('/health', (req, res) => {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    res.json({
        success: true,
        data: {
            status: hasApiKey ? 'configured' : 'not_configured',
            model: 'claude-sonnet-4-20250514'
        }
    });
});

module.exports = router;
