const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const EpicConnection = require('../models/EpicConnection');
const epicFhir = require('../services/epicFhir');

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

        const { url, state } = epicFhir.buildAuthorizationUrl(req.user._id.toString());

        // Store state with userId for verification on callback
        pendingStates.set(state, {
            userId: req.user._id.toString(),
            createdAt: Date.now()
        });

        res.json({
            success: true,
            data: { authorizationUrl: url }
        });
    } catch (error) {
        console.error('Epic authorize error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating Epic authorization URL'
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
    pendingStates.delete(state);

    try {
        // Exchange code for tokens
        const tokenData = await epicFhir.exchangeCodeForToken(code);

        if (!tokenData.access_token || !tokenData.patient) {
            console.error('Epic token response missing required fields:', Object.keys(tokenData));
            return res.redirect(`${clientUrl}/settings?epic=error&reason=invalid_token_response`);
        }

        const endpoints = epicFhir.getEndpoints();

        // Read Patient resource to verify identity and get name
        let patientName = '';
        try {
            const patient = await epicFhir.readPatient(
                tokenData.access_token,
                endpoints.fhirBaseUrl,
                tokenData.patient
            );
            patientName = epicFhir.getPatientDisplayName(patient);
        } catch (patientError) {
            console.error('Could not read Patient resource:', patientError.message);
            // Non-fatal — continue with connection
        }

        // Upsert EpicConnection (one per user)
        await EpicConnection.findOneAndUpdate(
            { userId },
            {
                userId,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || null,
                tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
                patientFhirId: tokenData.patient,
                epicEndpoint: endpoints.fhirBaseUrl,
                scopes: tokenData.scope || '',
                patientName,
                status: 'active',
                connectedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.redirect(`${clientUrl}/settings?epic=connected`);
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
        const connection = await EpicConnection.findOne({ userId: req.user._id });

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
        const connection = await EpicConnection.findOneAndUpdate(
            { userId: req.user._id },
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
        const { accessToken, fhirBaseUrl, patientFhirId } = await epicFhir.getValidToken(req.user._id);

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

module.exports = router;
