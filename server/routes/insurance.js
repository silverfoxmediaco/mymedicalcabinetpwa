const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const Insurance = require('../models/Insurance');
const { protect } = require('../middleware/auth');
const documentService = require('../services/documentService');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// @route   GET /api/insurance
// @desc    Get all insurance plans for user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const insurance = await Insurance.find({ userId: req.user._id })
            .sort({ isPrimary: -1, createdAt: -1 });

        res.json({
            success: true,
            count: insurance.length,
            data: insurance
        });
    } catch (error) {
        console.error('Get insurance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching insurance'
        });
    }
});

// @route   GET /api/insurance/:id
// @desc    Get single insurance plan
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const insurance = await Insurance.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Insurance not found'
            });
        }

        res.json({
            success: true,
            data: insurance
        });
    } catch (error) {
        console.error('Get insurance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching insurance'
        });
    }
});

// @route   POST /api/insurance
// @desc    Add insurance plan
// @access  Private
router.post('/', protect, [
    body('provider.name').notEmpty().withMessage('Insurance provider name is required'),
    body('memberId').notEmpty().withMessage('Member ID is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        // If setting as primary, unset any existing primary
        if (req.body.isPrimary) {
            await Insurance.updateMany(
                { userId: req.user._id, isPrimary: true },
                { isPrimary: false }
            );
        }

        const insurance = await Insurance.create({
            ...req.body,
            userId: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Insurance added',
            data: insurance
        });
    } catch (error) {
        console.error('Add insurance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding insurance'
        });
    }
});

// @route   PUT /api/insurance/:id
// @desc    Update insurance plan
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let insurance = await Insurance.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Insurance not found'
            });
        }

        // If setting as primary, unset any existing primary
        if (req.body.isPrimary && !insurance.isPrimary) {
            await Insurance.updateMany(
                { userId: req.user._id, isPrimary: true },
                { isPrimary: false }
            );
        }

        insurance = await Insurance.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Insurance updated',
            data: insurance
        });
    } catch (error) {
        console.error('Update insurance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating insurance'
        });
    }
});

// @route   PUT /api/insurance/:id/coverage
// @desc    Update coverage details
// @access  Private
router.put('/:id/coverage', protect, async (req, res) => {
    try {
        const insurance = await Insurance.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { coverage: req.body },
            { new: true }
        );

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Insurance not found'
            });
        }

        res.json({
            success: true,
            message: 'Coverage updated',
            data: insurance
        });
    } catch (error) {
        console.error('Update coverage error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating coverage'
        });
    }
});

// @route   POST /api/insurance/:id/upload-card
// @desc    Upload insurance card images
// @access  Private
router.post('/:id/upload-card', protect, async (req, res) => {
    const { front, back } = req.body;

    try {
        const insurance = await Insurance.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { cardImages: { front, back } },
            { new: true }
        );

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Insurance not found'
            });
        }

        res.json({
            success: true,
            message: 'Card images uploaded',
            data: insurance
        });
    } catch (error) {
        console.error('Upload card error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading card images'
        });
    }
});

// @route   POST /api/insurance/connect-fhir
// @desc    Initiate FHIR connection with insurance provider
// @access  Private
router.post('/connect-fhir', protect, async (req, res) => {
    const { providerId } = req.body;

    try {
        // TODO: Implement FHIR OAuth flow
        // This would redirect to the insurance provider's authorization page
        // and handle the OAuth callback to store tokens

        res.json({
            success: true,
            message: 'FHIR connection initiated',
            data: {
                note: 'FHIR API integration pending setup',
                supportedProviders: [
                    'Aetna',
                    'Cigna',
                    'United Healthcare',
                    'Blue Cross Blue Shield',
                    'Humana',
                    'Kaiser Permanente'
                ]
            }
        });
    } catch (error) {
        console.error('FHIR connect error:', error);
        res.status(500).json({
            success: false,
            message: 'Error initiating FHIR connection'
        });
    }
});

// @route   POST /api/insurance/:id/sync
// @desc    Sync data from connected insurance provider
// @access  Private
router.post('/:id/sync', protect, async (req, res) => {
    try {
        const insurance = await Insurance.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Insurance not found'
            });
        }

        if (!insurance.fhirConnection.connected) {
            return res.status(400).json({
                success: false,
                message: 'Insurance provider not connected. Please connect first.'
            });
        }

        // TODO: Implement FHIR data sync
        // This would fetch patient data, claims, coverage info from the insurer

        res.json({
            success: true,
            message: 'Sync initiated',
            data: {
                lastSynced: insurance.fhirConnection.lastSynced,
                note: 'FHIR sync implementation pending'
            }
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing insurance data'
        });
    }
});

// @route   POST /api/insurance/:id/documents
// @desc    Upload document to insurance record
// @access  Private
router.post('/:id/documents', protect, upload.single('file'), async (req, res) => {
    try {
        const insurance = await Insurance.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Insurance not found'
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

        await Insurance.findByIdAndUpdate(req.params.id, {
            $push: { documents: doc }
        });

        const updated = await Insurance.findById(req.params.id);
        const newDoc = updated.documents[updated.documents.length - 1];

        res.status(201).json({
            success: true,
            message: 'Document uploaded',
            document: newDoc
        });
    } catch (error) {
        console.error('Upload insurance document error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading document'
        });
    }
});

// @route   DELETE /api/insurance/:id/documents/:docId
// @desc    Remove document from insurance record
// @access  Private
router.delete('/:id/documents/:docId', protect, async (req, res) => {
    try {
        const insurance = await Insurance.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Insurance not found'
            });
        }

        const doc = insurance.documents.id(req.params.docId);
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
        await Insurance.findByIdAndUpdate(req.params.id, {
            $pull: { documents: { _id: req.params.docId } }
        });

        res.json({
            success: true,
            message: 'Document removed'
        });
    } catch (error) {
        console.error('Delete insurance document error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing document'
        });
    }
});

// @route   DELETE /api/insurance/:id
// @desc    Delete insurance plan
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const insurance = await Insurance.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!insurance) {
            return res.status(404).json({
                success: false,
                message: 'Insurance not found'
            });
        }

        res.json({
            success: true,
            message: 'Insurance deleted'
        });
    } catch (error) {
        console.error('Delete insurance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting insurance'
        });
    }
});

module.exports = router;
