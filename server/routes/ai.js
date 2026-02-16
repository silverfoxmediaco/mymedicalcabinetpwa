const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const { protect } = require('../middleware/auth');
const { analyzeDocument, analyzeInsuranceDocument, analyzeDocumentText, analyzeInsuranceDocumentText, analyzeMedicalBill, analyzeMedicalBillText, extractCptCodesFromBill, extractCptCodesFromBillText } = require('../services/claudeService');
const { lookupMedicareRates } = require('../services/cmsMedicareService');
const documentService = require('../services/documentService');
const pdfParse = require('pdf-parse');
const MedicalHistory = require('../models/MedicalHistory');
const Insurance = require('../models/Insurance');
const MedicalBill = require('../models/MedicalBill');

// Maximum pages before switching to text extraction
const MAX_PDF_PAGES_FOR_VISION = 100;

// 3.5MB raw — base64 adds ~33%, keeps under Claude's 5MB limit
const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024;

const compressImageForAI = async (buffer) => {
    if (buffer.length <= MAX_IMAGE_BYTES) return buffer;
    const steps = [
        { width: 2400, height: 2400, quality: 80 },
        { width: 1800, height: 1800, quality: 70 },
        { width: 1400, height: 1400, quality: 60 },
        { width: 1000, height: 1000, quality: 50 }
    ];
    let compressed = buffer;
    for (const step of steps) {
        compressed = await sharp(buffer)
            .resize(step.width, step.height, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: step.quality })
            .toBuffer();
        if (compressed.length <= MAX_IMAGE_BYTES) break;
    }
    return compressed;
};

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

        // Validate user owns the document
        if (!s3Key.includes(userId)) {
            // s3Key doesn't contain userId — check if the document exists in user's records
            // (handles family member docs and migrated/merged account docs)
            const [medMatch, insMatch] = await Promise.all([
                MedicalHistory.findOne({
                    userId: req.user._id,
                    'events.documents.s3Key': s3Key
                }),
                Insurance.findOne({
                    userId: req.user._id,
                    $or: [
                        { 'cardImages.front': s3Key },
                        { 'cardImages.back': s3Key },
                        { 'documents.s3Key': s3Key }
                    ]
                })
            ]);

            if (!medMatch && !insMatch) {
                console.warn('Unauthorized document access attempt', { userId, s3Key });
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this document'
                });
            }
        }

        // Fetch document from S3
        console.log('Fetching document for AI analysis:', s3Key);
        let { buffer, mimeType } = await documentService.getFileContent(s3Key);

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

        // Compress large images to fit Claude's 5MB base64 limit
        if (mimeType && mimeType.startsWith('image/') && buffer.length > MAX_IMAGE_BYTES) {
            console.log(`Image is ${(buffer.length / 1024 / 1024).toFixed(1)}MB, compressing...`);
            buffer = await compressImageForAI(buffer);
            mimeType = 'image/jpeg';
            console.log(`Compressed to ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
        }

        let explanation;

        // For PDFs, check page count and use text extraction for large documents
        if (mimeType === 'application/pdf') {
            try {
                const pdfData = await pdfParse(buffer);
                const pageCount = pdfData.numpages || 0;
                console.log(`PDF has ${pageCount} pages`);

                if (pageCount > MAX_PDF_PAGES_FOR_VISION) {
                    // Use text extraction for large PDFs
                    console.log(`PDF exceeds ${MAX_PDF_PAGES_FOR_VISION} pages, using text extraction...`);
                    const extractedText = pdfData.text;

                    if (!extractedText || extractedText.trim().length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Unable to extract text from this PDF. The document may be image-based or encrypted.'
                        });
                    }

                    explanation = await analyzeDocumentText(extractedText, filename || 'document');
                } else {
                    // Use vision API for smaller PDFs
                    const base64Data = buffer.toString('base64');
                    console.log('Sending document to Claude for analysis...');
                    explanation = await analyzeDocument(base64Data, mimeType, filename || 'document');
                }
            } catch (pdfError) {
                console.error('PDF parsing error:', pdfError.message);
                // Fall back to vision API if parsing fails
                const base64Data = buffer.toString('base64');
                console.log('PDF parsing failed, attempting vision analysis...');
                explanation = await analyzeDocument(base64Data, mimeType, filename || 'document');
            }
        } else {
            // Non-PDF files use vision API
            const base64Data = buffer.toString('base64');
            console.log('Sending document to Claude for analysis...');
            explanation = await analyzeDocument(base64Data, mimeType, filename || 'document');
        }

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
            const [medMatch, insMatch] = await Promise.all([
                MedicalHistory.findOne({
                    userId: req.user._id,
                    'events.documents.s3Key': s3Key
                }),
                Insurance.findOne({
                    userId: req.user._id,
                    $or: [
                        { 'cardImages.front': s3Key },
                        { 'cardImages.back': s3Key },
                        { 'documents.s3Key': s3Key }
                    ]
                })
            ]);

            if (!medMatch && !insMatch) {
                console.warn('Unauthorized insurance document access attempt', { userId, s3Key });
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this document'
                });
            }
        }

        console.log('Fetching insurance document for AI analysis:', s3Key);
        let { buffer, mimeType } = await documentService.getFileContent(s3Key);

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

        // Compress large images to fit Claude's 5MB base64 limit
        if (mimeType && mimeType.startsWith('image/') && buffer.length > MAX_IMAGE_BYTES) {
            console.log(`Image is ${(buffer.length / 1024 / 1024).toFixed(1)}MB, compressing...`);
            buffer = await compressImageForAI(buffer);
            mimeType = 'image/jpeg';
            console.log(`Compressed to ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
        }

        let explanation;

        // For PDFs, check page count and use text extraction for large documents
        if (mimeType === 'application/pdf') {
            try {
                const pdfData = await pdfParse(buffer);
                const pageCount = pdfData.numpages || 0;
                console.log(`Insurance PDF has ${pageCount} pages`);

                if (pageCount > MAX_PDF_PAGES_FOR_VISION) {
                    // Use text extraction for large PDFs
                    console.log(`PDF exceeds ${MAX_PDF_PAGES_FOR_VISION} pages, using text extraction...`);
                    const extractedText = pdfData.text;

                    if (!extractedText || extractedText.trim().length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Unable to extract text from this PDF. The document may be image-based or encrypted.'
                        });
                    }

                    explanation = await analyzeInsuranceDocumentText(extractedText, filename || 'document');
                } else {
                    // Use vision API for smaller PDFs
                    const base64Data = buffer.toString('base64');
                    console.log('Sending insurance document to Claude for analysis...');
                    explanation = await analyzeInsuranceDocument(base64Data, mimeType, filename || 'document');
                }
            } catch (pdfError) {
                console.error('PDF parsing error:', pdfError.message);
                // Fall back to vision API if parsing fails
                const base64Data = buffer.toString('base64');
                console.log('PDF parsing failed, attempting vision analysis...');
                explanation = await analyzeInsuranceDocument(base64Data, mimeType, filename || 'document');
            }
        } else {
            // Non-PDF files use vision API
            const base64Data = buffer.toString('base64');
            console.log('Sending insurance document to Claude for analysis...');
            explanation = await analyzeInsuranceDocument(base64Data, mimeType, filename || 'document');
        }

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
 * @route   POST /api/ai/analyze-medical-bill
 * @desc    AI analysis of a medical bill for errors and overcharges
 * @access  Private
 */
router.post('/analyze-medical-bill', protect, async (req, res) => {
    try {
        const { s3Key, filename } = req.body;
        const userId = req.user._id.toString();

        if (!s3Key) {
            return res.status(400).json({
                success: false,
                message: 's3Key is required'
            });
        }

        // Validate user owns the document
        if (!s3Key.includes(userId)) {
            const billMatch = await MedicalBill.findOne({
                userId: req.user._id,
                'documents.s3Key': s3Key
            });

            if (!billMatch) {
                console.warn('Unauthorized bill document access attempt', { userId, s3Key });
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this document'
                });
            }
        }

        console.log('Fetching bill document for AI analysis:', s3Key);
        let { buffer, mimeType } = await documentService.getFileContent(s3Key);

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

        // Compress large images to fit Claude's 5MB base64 limit
        if (mimeType && mimeType.startsWith('image/') && buffer.length > MAX_IMAGE_BYTES) {
            console.log(`Image is ${(buffer.length / 1024 / 1024).toFixed(1)}MB, compressing...`);
            buffer = await compressImageForAI(buffer);
            mimeType = 'image/jpeg'; // sharp outputs JPEG
            console.log(`Compressed to ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
        }

        let analysis;

        if (mimeType === 'application/pdf') {
            try {
                const pdfData = await pdfParse(buffer);
                const pageCount = pdfData.numpages || 0;
                console.log(`Bill PDF has ${pageCount} pages`);

                if (pageCount > MAX_PDF_PAGES_FOR_VISION) {
                    console.log(`PDF exceeds ${MAX_PDF_PAGES_FOR_VISION} pages, using text extraction...`);
                    const extractedText = pdfData.text;

                    if (!extractedText || extractedText.trim().length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Unable to extract text from this PDF. The document may be image-based or encrypted.'
                        });
                    }

                    // Pre-extract CPT codes from text, then look up CMS rates
                    console.log('Pre-extracting CPT codes from bill text...');
                    const { codes, state } = await extractCptCodesFromBillText(extractedText);
                    let medicareData = null;
                    if (codes.length > 0) {
                        console.log(`Found CPT codes: ${codes.join(', ')}${state ? ` (state: ${state})` : ''}, looking up CMS Medicare rates...`);
                        medicareData = await lookupMedicareRates(codes, state);
                        console.log(`CMS data retrieved for ${Object.keys(medicareData).length} of ${codes.length} codes`);
                    }

                    analysis = await analyzeMedicalBillText(extractedText, filename || 'document', medicareData);
                } else {
                    const base64Data = buffer.toString('base64');

                    // Pre-extract CPT codes from PDF, then look up CMS rates
                    console.log('Pre-extracting CPT codes from bill...');
                    const { codes, state } = await extractCptCodesFromBill(base64Data, mimeType);
                    let medicareData = null;
                    if (codes.length > 0) {
                        console.log(`Found CPT codes: ${codes.join(', ')}${state ? ` (state: ${state})` : ''}, looking up CMS Medicare rates...`);
                        medicareData = await lookupMedicareRates(codes, state);
                        console.log(`CMS data retrieved for ${Object.keys(medicareData).length} of ${codes.length} codes`);
                    }

                    console.log('Sending bill document to Claude for analysis...');
                    analysis = await analyzeMedicalBill(base64Data, mimeType, filename || 'document', medicareData);
                }
            } catch (pdfError) {
                console.error('PDF parsing error:', pdfError.message);
                const base64Data = buffer.toString('base64');

                // Pre-extract CPT codes, then look up CMS rates
                console.log('PDF parsing failed, attempting vision analysis with CMS lookup...');
                const { codes, state } = await extractCptCodesFromBill(base64Data, mimeType);
                let medicareData = null;
                if (codes.length > 0) {
                    medicareData = await lookupMedicareRates(codes, state);
                }

                analysis = await analyzeMedicalBill(base64Data, mimeType, filename || 'document', medicareData);
            }
        } else {
            const base64Data = buffer.toString('base64');

            // Pre-extract CPT codes from image bill, then look up CMS rates
            console.log('Pre-extracting CPT codes from bill image...');
            const { codes, state } = await extractCptCodesFromBill(base64Data, mimeType);
            let medicareData = null;
            if (codes.length > 0) {
                console.log(`Found CPT codes: ${codes.join(', ')}${state ? ` (state: ${state})` : ''}, looking up CMS Medicare rates...`);
                medicareData = await lookupMedicareRates(codes, state);
                console.log(`CMS data retrieved for ${Object.keys(medicareData).length} of ${codes.length} codes`);
            }

            console.log('Sending bill document to Claude for analysis...');
            analysis = await analyzeMedicalBill(base64Data, mimeType, filename || 'document', medicareData);
        }

        res.json({
            success: true,
            data: {
                analysis,
                documentName: filename,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Bill analysis error:', error.message);

        const statusCode = error.message.includes('API key') ? 500 :
                           error.message.includes('rate limit') ? 429 :
                           error.message.includes('permission') ? 403 : 500;

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to analyze medical bill'
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
