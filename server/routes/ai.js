import express from 'express';
import { protect } from '../middleware/auth.js';
import { analyzeDocument } from '../services/claudeService.js';
import { getDocument, validateDocumentOwnership } from '../services/documentService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   POST /api/ai/explain-document
 * @desc    Get AI explanation of a medical document
 * @access  Private
 */
router.post('/explain-document', protect, async (req, res) => {
  try {
    const { s3Key, eventId, base64Data, mimeType, filename } = req.body;
    const userId = req.user._id;

    let documentData;
    let documentMimeType;
    let documentFilename;

    if (base64Data) {
      documentData = base64Data;
      documentMimeType = mimeType || 'image/jpeg';
      documentFilename = filename || 'document';
    } else if (s3Key) {
      if (!validateDocumentOwnership(s3Key, userId)) {
        logger.warn('Unauthorized document access attempt', {
          userId: userId.toString(),
          s3Key,
        });
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this document',
        });
      }

      const document = await getDocument(s3Key);
      documentData = document.buffer.toString('base64');
      documentMimeType = document.mimeType;
      documentFilename = document.filename;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either s3Key or base64Data is required',
      });
    }

    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    if (!supportedTypes.includes(documentMimeType)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type: ${documentMimeType}. Supported types: JPEG, PNG, GIF, WebP, PDF`,
      });
    }

    logger.info('Processing document explanation request', {
      userId: userId.toString(),
      eventId,
      filename: documentFilename,
      mimeType: documentMimeType,
    });

    const explanation = await analyzeDocument(
      documentData,
      documentMimeType,
      documentFilename
    );

    res.json({
      success: true,
      data: {
        explanation,
        documentName: documentFilename,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Document explanation error', {
      error: error.message,
      userId: req.user?._id?.toString(),
    });

    const statusCode = error.message.includes('API key') ? 500 :
                       error.message.includes('rate limit') ? 429 :
                       error.message.includes('permission') ? 403 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to analyze document',
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
      model: 'claude-sonnet-4-20250514',
    },
  });
});

export default router;
