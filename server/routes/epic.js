const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getFamilyMemberFilter } = require('../middleware/familyMemberScope');
const EpicConnection = require('../models/EpicConnection');
const HealthSystem = require('../models/HealthSystem');
const epicFhir = require('../services/epicFhir');
const fhirMappingService = require('../services/fhirMappingService');

// In-memory state store for CSRF protection during OAuth flow
// In production, use Redis or a DB-backed store
const pendingStates = new Map();

// Clean up expired states every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [state, data] of pendingStates.entries()) {
        if (now - data.createdAt > 10 * 60 * 1000) {
            pendingStates.delete(state);
        }
    }
}, 10 * 60 * 1000);

// @route   GET /api/epic/authorize
// @desc    Get the Epic SMART on FHIR authorization URL
// @access  Private
router.get('/authorize', protect, async (req, res) => {
    try {
        if (!process.env.EPIC_CLIENT_ID) {
            return res.status(503).json({
                success: false,
                message: 'Epic integration is not configured. EPIC_CLIENT_ID is missing.'
            });
        }

        const familyMemberId = req.query.familyMemberId || null;
        const healthSystemId = req.query.healthSystemId || null;

        // Validate family member ownership if provided
        if (familyMemberId) {
            await getFamilyMemberFilter(req.user._id, familyMemberId);
        }

        // Look up health system endpoints if provided
        let healthSystem = null;
        if (healthSystemId) {
            healthSystem = await HealthSystem.findById(healthSystemId);
            if (!healthSystem || !healthSystem.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Health system not found or inactive'
                });
            }
        }

        const { url, state } = epicFhir.buildAuthorizationUrl(req.user._id.toString(), healthSystem);

        // Store state with userId, familyMemberId, and health system info for callback
        pendingStates.set(state, {
            userId: req.user._id.toString(),
            familyMemberId,
            healthSystemId: healthSystem ? healthSystem._id.toString() : null,
            healthSystemName: healthSystem ? healthSystem.name : '',
            tokenUrl: healthSystem ? healthSystem.tokenUrl : null,
            fhirBaseUrl: healthSystem ? healthSystem.fhirBaseUrl : null,
            createdAt: Date.now()
        });

        res.json({
            success: true,
            data: { authorizationUrl: url }
        });
    } catch (error) {
        console.error('Epic authorize error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error generating Epic authorization URL'
        });
    }
});

// @route   GET /api/epic/callback
// @desc    Handle OAuth callback from Epic (browser redirect)
// @access  Public (redirected from Epic)
router.get('/callback', async (req, res) => {
    const { code, state, error: oauthError, error_description } = req.query;
    const clientUrl = process.env.CLIENT_URL || 'https://mymedicalcabinet.com';

    // Handle OAuth error (user denied, etc.)
    if (oauthError) {
        console.error('Epic OAuth error:', oauthError, error_description);
        return res.redirect(`${clientUrl}/settings?epic=error&reason=${encodeURIComponent(error_description || oauthError)}`);
    }

    if (!code || !state) {
        return res.redirect(`${clientUrl}/settings?epic=error&reason=missing_params`);
    }

    // Verify state for CSRF protection
    const stateData = pendingStates.get(state);
    if (!stateData) {
        return res.redirect(`${clientUrl}/settings?epic=error&reason=invalid_state`);
    }

    const userId = stateData.userId;
    const familyMemberId = stateData.familyMemberId || null;
    const stateTokenUrl = stateData.tokenUrl || null;
    const stateFhirBaseUrl = stateData.fhirBaseUrl || null;
    const stateHealthSystemId = stateData.healthSystemId || null;
    const stateHealthSystemName = stateData.healthSystemName || '';
    pendingStates.delete(state);

    try {
        // Exchange code for tokens (use health system token URL if available)
        const tokenData = await epicFhir.exchangeCodeForToken(code, stateTokenUrl);

        if (!tokenData.access_token || !tokenData.patient) {
            console.error('Epic token response missing required fields:', Object.keys(tokenData));
            return res.redirect(`${clientUrl}/settings?epic=error&reason=invalid_token_response`);
        }

        const fhirBaseUrl = stateFhirBaseUrl || epicFhir.getEndpoints().fhirBaseUrl;

        // Read Patient resource to verify identity and get name
        let patientName = '';
        try {
            const patient = await epicFhir.readPatient(
                tokenData.access_token,
                fhirBaseUrl,
                tokenData.patient
            );
            patientName = epicFhir.getPatientDisplayName(patient);
        } catch (patientError) {
            console.error('Could not read Patient resource:', patientError.message);
            // Non-fatal — continue with connection
        }

        // Upsert EpicConnection (one per user + family member combination)
        await EpicConnection.findOneAndUpdate(
            { userId, familyMemberId },
            {
                userId,
                familyMemberId,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || null,
                tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
                patientFhirId: tokenData.patient,
                epicEndpoint: fhirBaseUrl,
                healthSystemId: stateHealthSystemId,
                healthSystemName: stateHealthSystemName,
                epicTokenUrl: stateTokenUrl || '',
                scopes: tokenData.scope || '',
                patientName,
                status: 'active',
                connectedAt: new Date()
            },
            { upsert: true, new: true }
        );

        const redirectParams = familyMemberId
            ? `?epic=connected&familyMemberId=${familyMemberId}`
            : '?epic=connected';
        res.redirect(`${clientUrl}/settings${redirectParams}`);
    } catch (error) {
        console.error('Epic callback error:', error);
        res.redirect(`${clientUrl}/settings?epic=error&reason=token_exchange_failed`);
    }
});

// @route   GET /api/epic/status
// @desc    Check Epic connection status for current user
// @access  Private
router.get('/status', protect, async (req, res) => {
    try {
        const familyMemberId = req.query.familyMemberId || null;
        const connection = await EpicConnection.findOne({ userId: req.user._id, familyMemberId });

        if (!connection) {
            return res.json({
                success: true,
                data: {
                    connected: false
                }
            });
        }

        res.json({
            success: true,
            data: {
                connected: connection.status === 'active',
                status: connection.status,
                patientName: connection.patientName || '',
                patientFhirId: connection.patientFhirId,
                healthSystemName: connection.healthSystemName || '',
                connectedAt: connection.connectedAt,
                lastSyncAt: connection.lastSyncAt,
                syncHistory: connection.syncHistory || [],
                tokenExpired: connection.isTokenExpired()
            }
        });
    } catch (error) {
        console.error('Epic status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking Epic connection status'
        });
    }
});

// @route   DELETE /api/epic/disconnect
// @desc    Disconnect Epic account
// @access  Private
router.delete('/disconnect', protect, async (req, res) => {
    try {
        const familyMemberId = req.query.familyMemberId || null;

        // Validate family member ownership if provided
        if (familyMemberId) {
            await getFamilyMemberFilter(req.user._id, familyMemberId);
        }

        const connection = await EpicConnection.findOneAndUpdate(
            { userId: req.user._id, familyMemberId },
            { status: 'disconnected', accessToken: '', refreshToken: '' },
            { new: true }
        );

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'No Epic connection found'
            });
        }

        res.json({
            success: true,
            message: 'Epic account disconnected'
        });
    } catch (error) {
        console.error('Epic disconnect error:', error);
        res.status(500).json({
            success: false,
            message: 'Error disconnecting Epic account'
        });
    }
});

// @route   POST /api/epic/test-connection
// @desc    Test the Epic connection by reading Patient resource
// @access  Private
router.post('/test-connection', protect, async (req, res) => {
    try {
        const familyMemberId = req.body.familyMemberId || null;
        const { accessToken, fhirBaseUrl, patientFhirId } = await epicFhir.getValidToken(req.user._id, familyMemberId);

        const patient = await epicFhir.readPatient(accessToken, fhirBaseUrl, patientFhirId);

        res.json({
            success: true,
            message: 'Epic connection is working',
            data: {
                patientName: epicFhir.getPatientDisplayName(patient),
                patientId: patientFhirId
            }
        });
    } catch (error) {
        console.error('Epic test connection error:', error);
        res.status(error.message.includes('No active') ? 404 : 500).json({
            success: false,
            message: error.message || 'Epic connection test failed'
        });
    }
});

// @route   POST /api/epic/sync
// @desc    Import clinical data from Epic via FHIR
// @access  Private
router.post('/sync', protect, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const familyMemberId = req.body.familyMemberId || null;

        // Validate family member ownership if provided
        if (familyMemberId) {
            await getFamilyMemberFilter(userId, familyMemberId);
        }

        const { accessToken, fhirBaseUrl, patientFhirId } = await epicFhir.getValidToken(userId, familyMemberId);

        // Fetch all FHIR resource bundles in parallel
        const resourceQueries = [
            { key: 'medicationRequest', path: `MedicationRequest?patient=${patientFhirId}` },
            { key: 'condition', path: `Condition?patient=${patientFhirId}` },
            { key: 'allergyIntolerance', path: `AllergyIntolerance?patient=${patientFhirId}` },
            { key: 'immunization', path: `Immunization?patient=${patientFhirId}` },
            { key: 'procedure', path: `Procedure?patient=${patientFhirId}` },
            { key: 'encounter', path: `Encounter?patient=${patientFhirId}` }
        ];

        const errors = [];
        const bundles = {};

        const results = await Promise.allSettled(
            resourceQueries.map(q =>
                epicFhir.fhirRequest(accessToken, fhirBaseUrl, q.path)
                    .then(bundle => ({ key: q.key, bundle }))
            )
        );

        for (const result of results) {
            if (result.status === 'fulfilled') {
                bundles[result.value.key] = result.value.bundle;
            } else {
                const failedKey = resourceQueries[results.indexOf(result)]?.key || 'unknown';
                console.error(`FHIR fetch failed for ${failedKey}:`, result.reason?.message);
                errors.push(failedKey);
            }
        }

        // Extract resources from bundles
        const fhirData = {
            medicationRequest: [],
            condition: [],
            allergyIntolerance: [],
            immunization: [],
            procedure: [],
            encounter: [],
            practitioners: []
        };

        for (const [key, bundle] of Object.entries(bundles)) {
            if (bundle?.entry?.length) {
                fhirData[key] = bundle.entry
                    .map(e => e.resource)
                    .filter(r => r && r.id);
            }
        }

        // Extract unique Practitioner references from resources
        const practitionerRefs = new Set();

        const extractRef = (ref) => {
            if (!ref?.reference) return;
            const match = ref.reference.match(/Practitioner\/(.+)/);
            if (match) practitionerRefs.add(match[1]);
        };

        // MedicationRequest.requester
        for (const r of fhirData.medicationRequest) {
            extractRef(r.requester);
        }
        // Procedure.performer[].actor
        for (const r of fhirData.procedure) {
            if (r.performer) {
                for (const p of r.performer) {
                    extractRef(p.actor);
                }
            }
        }
        // Encounter.participant[].individual
        for (const r of fhirData.encounter) {
            if (r.participant) {
                for (const p of r.participant) {
                    extractRef(p.individual);
                }
            }
        }
        // Immunization.performer[].actor
        for (const r of fhirData.immunization) {
            if (r.performer) {
                for (const p of r.performer) {
                    extractRef(p.actor);
                }
            }
        }

        // Fetch each unique Practitioner
        const practitionerResults = await Promise.allSettled(
            Array.from(practitionerRefs).map(id =>
                epicFhir.fhirRequest(accessToken, fhirBaseUrl, `Practitioner/${id}`)
            )
        );

        for (const result of practitionerResults) {
            if (result.status === 'fulfilled' && result.value?.id) {
                fhirData.practitioners.push(result.value);
            }
        }

        // Sync to MMC models
        const summary = await fhirMappingService.syncFhirDataToModels(userId, 'epic', fhirData, familyMemberId);

        // Update EpicConnection sync tracking
        const totalImported = Object.values(summary).reduce(
            (sum, s) => sum + s.created + s.updated, 0
        );

        const syncEntry = {
            resourceType: 'all',
            recordsImported: totalImported,
            syncedAt: new Date()
        };

        await EpicConnection.findOneAndUpdate(
            { userId, familyMemberId },
            {
                lastSyncAt: new Date(),
                $push: { syncHistory: syncEntry }
            }
        );

        res.json({
            success: true,
            data: {
                summary,
                errors: errors.length > 0 ? errors : undefined,
                syncedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Epic sync error:', error);
        res.status(error.message.includes('No active') ? 404 : 500).json({
            success: false,
            message: error.message || 'Failed to sync Epic data'
        });
    }
});

module.exports = router;
