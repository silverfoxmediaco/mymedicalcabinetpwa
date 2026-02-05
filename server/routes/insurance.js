const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const Insurance = require('../models/Insurance');
const { protect } = require('../middleware/auth');
const documentService = require('../services/documentService');
const fhirService = require('../services/fhirService');
const fhirMappingService = require('../services/fhirMappingService');

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
    body('provider.name').notEmpty().withMessage('Insurance provider name is required').trim(),
    body('memberId').notEmpty().withMessage('Member ID is required').trim()
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

// @route   GET /api/insurance/fhir/authorize/:provider
// @desc    Initiate FHIR OAuth flow for a given provider
// @access  Private
router.get('/fhir/authorize/:provider', protect, async (req, res) => {
    try {
        const providerId = req.params.provider;

        fhirService.getProvider(providerId);

        // Build the redirect URI - this should point to the SERVER callback endpoint
        const serverUrl = process.env.SERVER_URL || process.env.CLIENT_URL || 'http://localhost:3000';
        const redirectUri = `${serverUrl}/api/insurance/fhir/callback`;

        // Generate code_verifier for PKCE (must be the same one used in auth URL and token exchange)
        const codeVerifier = fhirService.generateCodeVerifier();

        // Build state with all data needed for callback
        const stateData = {
            userId: req.user._id.toString(),
            provider: providerId,
            nonce: fhirService.generateStateToken(),
            codeVerifier: codeVerifier,
            redirectUri: redirectUri
        };
        const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

        // Generate authorization URL with PKCE using the same codeVerifier
        const { url: authorizeUrl } = fhirService.getAuthorizationUrl(
            providerId,
            state,
            redirectUri,
            codeVerifier
        );

        // Log the full authorization URL for debugging
        console.log('[FHIR Auth] Generated authorization URL:', authorizeUrl);
        console.log('[FHIR Auth] Client ID:', process.env.WELLMARK_CLIENT_ID);
        console.log('[FHIR Auth] Redirect URI:', redirectUri);

        res.json({
            success: true,
            data: { authorizeUrl }
        });
    } catch (error) {
        console.error('FHIR authorize error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error initiating FHIR authorization'
        });
    }
});

// @route   GET /api/insurance/fhir/callback
// @desc    Handle OAuth callback from FHIR provider
// @access  Public (redirect from provider)
router.get('/fhir/callback', async (req, res) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    try {
        const { code, state, error: oauthError } = req.query;

        if (oauthError) {
            console.error('OAuth error from provider:', oauthError);
            return res.redirect(`${clientUrl}/my-insurance?fhir=error&reason=${encodeURIComponent(oauthError)}`);
        }

        if (!code || !state) {
            return res.redirect(`${clientUrl}/my-insurance?fhir=error&reason=missing_params`);
        }

        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        } catch (e) {
            return res.redirect(`${clientUrl}/my-insurance?fhir=error&reason=invalid_state`);
        }

        const { userId, provider: providerId, codeVerifier, redirectUri } = stateData;

        const tokens = await fhirService.exchangeCodeForTokens(providerId, code, redirectUri, codeVerifier);

        let insurance = await Insurance.findOne({
            userId: userId,
            'fhirConnection.provider': providerId
        });

        if (!insurance) {
            insurance = await Insurance.findOne({ userId: userId });

            if (!insurance) {
                const providerConfig = fhirService.getProvider(providerId);
                insurance = await Insurance.create({
                    userId: userId,
                    provider: { name: providerConfig.name },
                    memberId: tokens.patientId || 'FHIR-Connected',
                    fhirConnection: {
                        connected: true,
                        provider: providerId,
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        tokenExpiry: new Date(Date.now() + (tokens.expiresIn || 3600) * 1000),
                        patientId: tokens.patientId,
                        lastSynced: null
                    }
                });

                return res.redirect(`${clientUrl}/my-insurance?fhir=success&insuranceId=${insurance._id}`);
            }
        }

        insurance.fhirConnection = {
            connected: true,
            provider: providerId,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: new Date(Date.now() + (tokens.expiresIn || 3600) * 1000),
            patientId: tokens.patientId,
            lastSynced: null
        };

        await insurance.save();

        res.redirect(`${clientUrl}/my-insurance?fhir=success&insuranceId=${insurance._id}`);
    } catch (error) {
        console.error('FHIR callback error:', error);
        res.redirect(`${clientUrl}/my-insurance?fhir=error&reason=token_exchange_failed`);
    }
});

// @route   POST /api/insurance/:id/sync
// @desc    Sync FHIR data from connected insurance provider
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

        if (!insurance.fhirConnection?.connected) {
            return res.status(400).json({
                success: false,
                message: 'Insurance provider not connected. Please connect first.'
            });
        }

        const providerId = insurance.fhirConnection.provider;
        let accessToken = insurance.fhirConnection.accessToken;

        // Check if token is expired, refresh if needed
        if (insurance.fhirConnection.tokenExpiry && new Date() >= insurance.fhirConnection.tokenExpiry) {
            try {
                const refreshed = await fhirService.refreshAccessToken(
                    providerId,
                    insurance.fhirConnection.refreshToken
                );
                accessToken = refreshed.accessToken;
                insurance.fhirConnection.accessToken = refreshed.accessToken;
                insurance.fhirConnection.refreshToken = refreshed.refreshToken;
                insurance.fhirConnection.tokenExpiry = new Date(Date.now() + (refreshed.expiresIn || 3600) * 1000);
            } catch (refreshErr) {
                console.error('Token refresh failed:', refreshErr);
                insurance.fhirConnection.connected = false;
                await insurance.save();
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please reconnect to your insurance provider.'
                });
            }
        }

        const patientData = await fhirService.fetchPatientData(
            providerId,
            accessToken,
            insurance.fhirConnection.patientId
        );

        // Map FHIR coverage to insurance coverage fields
        const mappedCoverage = fhirService.mapCoverageToInsurance(patientData.coverage);
        if (mappedCoverage) {
            if (mappedCoverage.copay) {
                insurance.coverage = insurance.coverage || {};
                insurance.coverage.copay = {
                    ...insurance.coverage.copay,
                    ...mappedCoverage.copay
                };
            }
            if (mappedCoverage.coinsurance !== undefined) {
                insurance.coverage = insurance.coverage || {};
                insurance.coverage.coinsurance = mappedCoverage.coinsurance;
            }
        }

        // Store raw FHIR data
        insurance.fhirData = {
            coverage: patientData.coverage || [],
            claims: patientData.claim || [],
            conditions: patientData.condition || [],
            allergies: patientData.allergyIntolerance || [],
            medications: patientData.medicationRequest || [],
            immunizations: patientData.immunization || [],
            encounters: patientData.encounter || [],
            practitioners: patientData.practitioners || [],
            procedures: patientData.procedure || [],
            lastFetched: new Date()
        };

        insurance.fhirConnection.lastSynced = new Date();
        await insurance.save();

        // Sync FHIR data to app models (Medications, MedicalHistory, Doctors)
        const syncSummary = await fhirMappingService.syncFhirDataToModels(
            req.user._id.toString(),
            providerId,
            patientData
        );

        res.json({
            success: true,
            message: 'FHIR data synced successfully',
            data: {
                lastSynced: insurance.fhirConnection.lastSynced,
                fhirResources: {
                    coverage: (patientData.coverage || []).length,
                    claims: (patientData.claim || []).length,
                    conditions: (patientData.condition || []).length,
                    allergies: (patientData.allergyIntolerance || []).length,
                    medications: (patientData.medicationRequest || []).length,
                    immunizations: (patientData.immunization || []).length,
                    encounters: (patientData.encounter || []).length,
                    practitioners: (patientData.practitioners || []).length,
                    procedures: (patientData.procedure || []).length
                },
                syncedToApp: syncSummary,
                errors: patientData._errors || []
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

// @route   POST /api/insurance/:id/disconnect
// @desc    Disconnect FHIR connection and clear synced data
// @access  Private
router.post('/:id/disconnect', protect, async (req, res) => {
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

        insurance.fhirConnection = {
            connected: false,
            provider: null,
            accessToken: null,
            refreshToken: null,
            tokenExpiry: null,
            patientId: null,
            lastSynced: null
        };

        insurance.fhirData = {
            coverage: null,
            claims: [],
            conditions: [],
            allergies: [],
            medications: [],
            immunizations: [],
            encounters: [],
            practitioners: [],
            procedures: [],
            lastFetched: null
        };

        await insurance.save();

        res.json({
            success: true,
            message: 'FHIR connection disconnected',
            data: insurance
        });
    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({
            success: false,
            message: 'Error disconnecting FHIR'
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
