const crypto = require('crypto');
const EpicConnection = require('../models/EpicConnection');

// Epic sandbox endpoints (replace with production when ready)
const EPIC_SANDBOX = {
    authorizeUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize',
    tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
    fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4'
};

// Scopes for patient-level read access to clinical data (SMART v2 format)
const EPIC_SCOPES = [
    'openid',
    'fhirUser',
    'launch/patient',
    'patient/Patient.rs',
    'patient/MedicationRequest.rs',
    'patient/AllergyIntolerance.rs',
    'patient/Condition.rs',
    'patient/Immunization.rs',
    'patient/Encounter.rs',
    'patient/Procedure.rs',
    'patient/DiagnosticReport.rs',
    'patient/Observation.rs',
    'patient/Coverage.rs',
    'patient/ExplanationOfBenefit.rs',
    'patient/Practitioner.rs',
    'patient/Organization.rs'
].join(' ');

/**
 * Get the configured Epic endpoints (sandbox or production)
 */
function getEndpoints() {
    return {
        authorizeUrl: process.env.EPIC_AUTHORIZE_URL || EPIC_SANDBOX.authorizeUrl,
        tokenUrl: process.env.EPIC_TOKEN_URL || EPIC_SANDBOX.tokenUrl,
        fhirBaseUrl: process.env.EPIC_FHIR_BASE_URL || EPIC_SANDBOX.fhirBaseUrl
    };
}

/**
 * Build the SMART on FHIR authorization URL
 * @param {string} userId - MMC user ID (stored in state for CSRF protection)
 * @returns {{ url: string, state: string }}
 */
function buildAuthorizationUrl(userId) {
    const endpoints = getEndpoints();
    const state = crypto.randomBytes(32).toString('hex');
    const redirectUri = process.env.EPIC_REDIRECT_URI || `${process.env.SERVER_URL}/api/epic/callback`;

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.EPIC_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: EPIC_SCOPES,
        state: state,
        aud: endpoints.fhirBaseUrl
    });

    return {
        url: `${endpoints.authorizeUrl}?${params.toString()}`,
        state
    };
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from Epic callback
 * @returns {Promise<Object>} Token response
 */
async function exchangeCodeForToken(code) {
    const endpoints = getEndpoints();
    const redirectUri = process.env.EPIC_REDIRECT_URI || `${process.env.SERVER_URL}/api/epic/callback`;

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
    });

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Confidential client: send credentials via Basic auth header
    if (process.env.EPIC_CLIENT_SECRET) {
        const credentials = Buffer.from(
            `${process.env.EPIC_CLIENT_ID}:${process.env.EPIC_CLIENT_SECRET}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
    } else {
        // Fallback for sandbox/public client flow
        body.set('client_id', process.env.EPIC_CLIENT_ID);
    }

    const response = await fetch(endpoints.tokenUrl, {
        method: 'POST',
        headers,
        body: body.toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Epic token exchange failed:', response.status, errorText);
        throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Refresh an expired access token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} New token response
 */
async function refreshAccessToken(refreshToken) {
    const endpoints = getEndpoints();

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Confidential client: send credentials via Basic auth header
    if (process.env.EPIC_CLIENT_SECRET) {
        const credentials = Buffer.from(
            `${process.env.EPIC_CLIENT_ID}:${process.env.EPIC_CLIENT_SECRET}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
    } else {
        body.set('client_id', process.env.EPIC_CLIENT_ID);
    }

    const response = await fetch(endpoints.tokenUrl, {
        method: 'POST',
        headers,
        body: body.toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Epic token refresh failed:', response.status, errorText);
        throw new Error(`Token refresh failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Get a valid access token for a user, refreshing if needed
 * @param {string} userId - MMC user ID
 * @returns {Promise<{ accessToken: string, fhirBaseUrl: string, patientFhirId: string }>}
 */
async function getValidToken(userId, familyMemberId = null) {
    const connection = await EpicConnection.findOne({ userId, familyMemberId: familyMemberId || null, status: 'active' });
    if (!connection) {
        throw new Error('No active Epic connection found');
    }

    // Check if token is expired or about to expire (5 min buffer)
    const bufferMs = 5 * 60 * 1000;
    if (new Date(Date.now() + bufferMs) >= connection.tokenExpiresAt) {
        if (!connection.refreshToken) {
            connection.status = 'expired';
            await connection.save();
            throw new Error('Epic token expired and no refresh token available');
        }

        try {
            const tokenData = await refreshAccessToken(connection.refreshToken);
            connection.accessToken = tokenData.access_token;
            connection.tokenExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
            if (tokenData.refresh_token) {
                connection.refreshToken = tokenData.refresh_token;
            }
            await connection.save();
        } catch (error) {
            connection.status = 'error';
            await connection.save();
            throw new Error('Failed to refresh Epic token');
        }
    }

    return {
        accessToken: connection.accessToken,
        fhirBaseUrl: connection.epicEndpoint,
        patientFhirId: connection.patientFhirId
    };
}

/**
 * Make an authenticated FHIR API call
 * @param {string} accessToken - Bearer token
 * @param {string} fhirBaseUrl - FHIR server base URL
 * @param {string} resourcePath - e.g., 'Patient/abc123' or 'MedicationRequest?patient=abc123'
 * @returns {Promise<Object>} FHIR response JSON
 */
async function fhirRequest(accessToken, fhirBaseUrl, resourcePath) {
    const url = `${fhirBaseUrl}/${resourcePath}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/fhir+json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`FHIR request failed: ${url}`, response.status, errorText);
        throw new Error(`FHIR request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Read the Patient resource after initial auth to verify identity
 * @param {string} accessToken
 * @param {string} fhirBaseUrl
 * @param {string} patientId
 * @returns {Promise<Object>} Patient FHIR resource
 */
async function readPatient(accessToken, fhirBaseUrl, patientId) {
    return fhirRequest(accessToken, fhirBaseUrl, `Patient/${patientId}`);
}

/**
 * Extract a display name from a FHIR Patient resource
 * @param {Object} patient - FHIR Patient resource
 * @returns {string}
 */
function getPatientDisplayName(patient) {
    if (!patient || !patient.name || patient.name.length === 0) {
        return 'Unknown';
    }
    const name = patient.name[0];
    const given = name.given ? name.given.join(' ') : '';
    const family = name.family || '';
    return `${given} ${family}`.trim() || 'Unknown';
}

module.exports = {
    buildAuthorizationUrl,
    exchangeCodeForToken,
    refreshAccessToken,
    getValidToken,
    fhirRequest,
    readPatient,
    getPatientDisplayName,
    getEndpoints,
    EPIC_SCOPES
};
