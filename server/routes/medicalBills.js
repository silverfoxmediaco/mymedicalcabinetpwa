const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const sharp = require('sharp');
const MedicalBill = require('../models/MedicalBill');
const { protect } = require('../middleware/auth');
const { getFamilyMemberFilter } = require('../middleware/familyMemberScope');
const documentService = require('../services/documentService');
const { extractBillData, extractBillDataMulti } = require('../services/claudeService');

const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024; // 3.5MB raw — base64 adds ~33%, keeps under Claude's 5MB limit

const compressImageForAI = async (buffer, mimeType) => {
    if (!mimeType || !mimeType.startsWith('image/') || mimeType === 'image/gif') {
        return buffer;
    }
    if (buffer.length <= MAX_IMAGE_BYTES) {
        return buffer;
    }
    // Progressive compression: reduce size + quality until under limit
    const steps = [
        { width: 2000, height: 2000, quality: 75 },
        { width: 1600, height: 1600, quality: 65 },
        { width: 1200, height: 1200, quality: 55 },
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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// @route   GET /api/medical-bills
// @desc    Get all medical bills for user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { familyMemberId } = req.query;
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);
        const bills = await MedicalBill.find({ userId: req.user._id, ...familyFilter })
            .sort({ dateOfService: -1, createdAt: -1 });

        res.json({
            success: true,
            count: bills.length,
            data: bills
        });
    } catch (error) {
        console.error('Get medical bills error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error fetching medical bills'
        });
    }
});

// @route   GET /api/medical-bills/summary
// @desc    Get aggregate totals for bills
// @access  Private
router.get('/summary', protect, async (req, res) => {
    try {
        const { familyMemberId } = req.query;
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);
        const bills = await MedicalBill.find({ userId: req.user._id, ...familyFilter });

        const summary = {
            totalBills: bills.length,
            totalBilled: 0,
            totalInsurancePaid: 0,
            totalPatientResponsibility: 0,
            totalPaid: 0,
            totalOwed: 0,
            totalAiSavings: 0,
            byStatus: {
                unpaid: 0,
                partially_paid: 0,
                paid: 0,
                disputed: 0,
                in_review: 0,
                resolved: 0
            }
        };

        bills.forEach(bill => {
            summary.totalBilled += bill.totals?.amountBilled || 0;
            summary.totalInsurancePaid += bill.totals?.insurancePaid || 0;
            summary.totalPatientResponsibility += bill.totals?.patientResponsibility || 0;
            summary.totalPaid += bill.totals?.amountPaid || 0;
            summary.totalAiSavings += bill.aiAnalysis?.estimatedSavings || 0;
            if (bill.dispute?.savedAmount) {
                summary.totalAiSavings += bill.dispute.savedAmount;
            }
            if (summary.byStatus[bill.status] !== undefined) {
                summary.byStatus[bill.status]++;
            }
        });

        summary.totalOwed = summary.totalPatientResponsibility - summary.totalPaid;
        if (summary.totalOwed < 0) summary.totalOwed = 0;

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Get bills summary error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error fetching bills summary'
        });
    }
});

// @route   POST /api/medical-bills/scan
// @desc    Scan a bill image/PDF and extract data via AI
// @access  Private
// @route   POST /api/medical-bills/stage
// @desc    Upload a bill page to S3 (no AI extraction)
// @access  Private
router.post('/stage', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const uploaded = await documentService.uploadFile(req.user._id.toString(), req.file);

        res.json({
            success: true,
            document: {
                s3Key: uploaded.s3Key,
                filename: uploaded.filename,
                originalName: uploaded.originalName,
                mimeType: uploaded.mimeType,
                size: uploaded.size
            }
        });
    } catch (error) {
        console.error('Stage bill error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading bill page'
        });
    }
});

// @route   POST /api/medical-bills/extract
// @desc    Extract bill data from multiple staged documents via AI
// @access  Private
router.post('/extract', protect, async (req, res) => {
    try {
        const { documents } = req.body;

        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No documents provided'
            });
        }

        if (documents.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 10 pages per extraction'
            });
        }

        // Fetch all documents from S3, compress if needed, and convert to base64
        const docData = [];
        for (const doc of documents) {
            const fileContent = await documentService.getFileContent(doc.s3Key);
            let buffer = fileContent.buffer;
            let mimeType = doc.mimeType;

            // Compress large images to fit Claude's 5MB limit
            if (mimeType && mimeType.startsWith('image/') && buffer.length > MAX_IMAGE_BYTES) {
                buffer = await compressImageForAI(buffer, mimeType);
                mimeType = 'image/jpeg';
            }

            docData.push({
                base64Data: buffer.toString('base64'),
                mimeType: mimeType,
                filename: doc.originalName || doc.filename
            });
        }

        const extracted = await extractBillDataMulti(docData);

        res.json({
            success: true,
            extracted
        });
    } catch (error) {
        console.error('Extract bill data error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error extracting bill data'
        });
    }
});

router.post('/scan', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        // Upload to S3
        const uploaded = await documentService.uploadFile(req.user._id.toString(), req.file);

        // Get file content for AI analysis, compress if needed
        const fileContent = await documentService.getFileContent(uploaded.s3Key);
        let buffer = fileContent.buffer;
        let mimeType = uploaded.mimeType;

        if (mimeType && mimeType.startsWith('image/') && buffer.length > MAX_IMAGE_BYTES) {
            buffer = await compressImageForAI(buffer, mimeType);
            mimeType = 'image/jpeg';
        }

        const base64Data = buffer.toString('base64');

        // Extract bill data via Claude
        const extracted = await extractBillData(base64Data, mimeType, uploaded.originalName);

        res.json({
            success: true,
            extracted,
            document: {
                s3Key: uploaded.s3Key,
                filename: uploaded.filename,
                originalName: uploaded.originalName,
                mimeType: uploaded.mimeType,
                size: uploaded.size
            }
        });
    } catch (error) {
        console.error('Scan bill error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error scanning bill'
        });
    }
});

// @route   GET /api/medical-bills/:id
// @desc    Get single medical bill
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const bill = await MedicalBill.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Medical bill not found'
            });
        }

        res.json({
            success: true,
            data: bill
        });
    } catch (error) {
        console.error('Get medical bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching medical bill'
        });
    }
});

// @route   POST /api/medical-bills
// @desc    Create medical bill
// @access  Private
router.post('/', protect, [
    body('biller.name').notEmpty().withMessage('Biller name is required').trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const familyFilter = await getFamilyMemberFilter(req.user._id, req.body.familyMemberId);

        const bill = await MedicalBill.create({
            ...req.body,
            userId: req.user._id,
            ...familyFilter
        });

        res.status(201).json({
            success: true,
            message: 'Medical bill added',
            data: bill
        });
    } catch (error) {
        console.error('Add medical bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding medical bill'
        });
    }
});

// @route   PUT /api/medical-bills/:id
// @desc    Update medical bill
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let bill = await MedicalBill.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Medical bill not found'
            });
        }

        bill = await MedicalBill.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Medical bill updated',
            data: bill
        });
    } catch (error) {
        console.error('Update medical bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating medical bill'
        });
    }
});

// @route   DELETE /api/medical-bills/:id
// @desc    Delete medical bill + S3 cleanup
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const bill = await MedicalBill.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Medical bill not found'
            });
        }

        // Clean up S3 documents
        if (bill.documents && bill.documents.length > 0) {
            for (const doc of bill.documents) {
                if (doc.s3Key) {
                    try {
                        await documentService.deleteFile(doc.s3Key);
                    } catch (s3Err) {
                        console.error('S3 cleanup error:', s3Err.message);
                    }
                }
            }
        }

        await MedicalBill.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Medical bill deleted'
        });
    } catch (error) {
        console.error('Delete medical bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting medical bill'
        });
    }
});

// @route   POST /api/medical-bills/:id/documents
// @desc    Upload document to medical bill
// @access  Private
router.post('/:id/documents', protect, upload.single('file'), async (req, res) => {
    try {
        const bill = await MedicalBill.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Medical bill not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const uploaded = await documentService.uploadFile(req.user._id.toString(), req.file);

        const doc = {
            filename: uploaded.filename,
            originalName: uploaded.originalName,
            mimeType: uploaded.mimeType,
            size: uploaded.size,
            s3Key: uploaded.s3Key,
            uploadedAt: new Date()
        };

        await MedicalBill.findByIdAndUpdate(req.params.id, {
            $push: { documents: doc }
        });

        const updated = await MedicalBill.findById(req.params.id);
        const newDoc = updated.documents[updated.documents.length - 1];

        res.status(201).json({
            success: true,
            message: 'Document uploaded',
            document: newDoc
        });
    } catch (error) {
        console.error('Upload bill document error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading document'
        });
    }
});

// @route   DELETE /api/medical-bills/:id/documents/:docId
// @desc    Remove document from medical bill
// @access  Private
router.delete('/:id/documents/:docId', protect, async (req, res) => {
    try {
        const bill = await MedicalBill.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Medical bill not found'
            });
        }

        const doc = bill.documents.id(req.params.docId);
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Delete from S3
        if (doc.s3Key) {
            await documentService.deleteFile(doc.s3Key);
        }

        // Remove from array
        await MedicalBill.findByIdAndUpdate(req.params.id, {
            $pull: { documents: { _id: req.params.docId } }
        });

        res.json({
            success: true,
            message: 'Document removed'
        });
    } catch (error) {
        console.error('Delete bill document error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing document'
        });
    }
});

// @route   POST /api/medical-bills/:id/payments
// @desc    Add payment to bill ledger
// @access  Private
router.post('/:id/payments', protect, [
    body('amount').isNumeric().withMessage('Payment amount is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const bill = await MedicalBill.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Medical bill not found'
            });
        }

        const payment = {
            date: req.body.date || new Date(),
            amount: req.body.amount,
            method: req.body.method || 'other',
            referenceNumber: req.body.referenceNumber,
            notes: req.body.notes
        };

        bill.payments.push(payment);

        // Recalculate amountPaid from all payments
        const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
        bill.totals.amountPaid = totalPaid;

        // Auto-transition status based on payments
        const responsibility = bill.totals.patientResponsibility || 0;
        if (responsibility > 0) {
            if (totalPaid >= responsibility) {
                bill.status = 'paid';
            } else if (totalPaid > 0 && bill.status === 'unpaid') {
                bill.status = 'partially_paid';
            }
        }

        await bill.save();

        res.status(201).json({
            success: true,
            message: 'Payment added',
            data: bill
        });
    } catch (error) {
        console.error('Add payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding payment'
        });
    }
});

module.exports = router;
