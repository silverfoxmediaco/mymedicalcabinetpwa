const crypto = require('crypto');

// Provider configurations - add new insurers here
const PROVIDERS = {
    wellmark: {
        name: 'Wellmark BCBS',
        // FHIR base URL (used as 'aud' parameter)
        fhirBaseUrl: process.env.WELLMARK_FHIR_BASE_URL || 'https://apigw.wellmark.com/patient-access-api',
        // OAuth endpoints from /metadata capability statement
        authorizeUrl: process.env.WELLMARK_AUTH_URL || 'https://apigw.wellmark.com/interop-access-presentation-api/v1/auth/authorize-app',
        tokenUrl: process.env.WELLMARK_TOKEN_URL || 'https://apigw.wellmark.com/interop-access-presentation-api/v1/auth/token',
        // Wellmark uses API Key as client_id (NOT the App ID)
        clientId: process.env.WELLMARK_PRODUCTION_KEY || process.env.WELLMARK_SANDBOX_KEY,
        // API Key is also needed in Auth header for data requests
        apiKey: process.env.WELLMARK_PRODUCTION_KEY || process.env.WELLMARK_SANDBOX_KEY,
        // Wellmark supported scopes
        scopes: 'launch patient/*.read',
        // Wellmark uses standard OAuth, not PKCE
        usePKCE: false,
        // Wellmark does not support refresh tokens
        supportsRefresh: false
    }
};

/**
 * Generate a cryptographically secure random string for PKCE code_verifier
 * Must be 43-128 characters, using unreserved URI characters
 */
const generateCodeVerifier = () => {
    return crypto.randomBytes(32).toString('base64url');
};

/**
 * Generate code_challenge from code_verifier using S256 method
 */
const generateCodeChallenge = (codeVerifier) => {
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
};

/**
 * Generate a cryptographically secure state token
 */
const generateStateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Get provider config by ID
 */
const getProvider = (providerId) => {
    const provider = PROVIDERS[providerId];
    if (!provider) {
        throw new Error(`Unknown FHIR provider: ${providerId}`);
    }
    return provider;
};

/**
 * Build OAuth authorization URL for a given provider
 * @param {string} providerId - The provider ID
 * @param {string} state - The state parameter for OAuth
 * @param {string} redirectUri - The redirect URI for OAuth callback
 * @param {string} codeVerifier - Optional: pre-generated code_verifier for PKCE
 * Returns both the URL and the code_verifier (needed for token exchange)
 */
const getAuthorizationUrl = (providerId, state, redirectUri, codeVerifier = null) => {
    const provider = getProvider(providerId);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: provider.clientId,
        redirect_uri: redirectUri,
        scope: provider.scopes,
        state: state,
        aud: provider.fhirBaseUrl
    });

    // Add PKCE parameters for public clients (if required by provider)
    if (provider.usePKCE) {
        // Use provided codeVerifier or generate a new one
        if (!codeVerifier) {
            codeVerifier = generateCodeVerifier();
        }
        const codeChallenge = generateCodeChallenge(codeVerifier);
        params.append('code_challenge', codeChallenge);
        params.append('code_challenge_method', 'S256');
    }

    return {
        url: `${provider.authorizeUrl}?${params.toString()}`,
        codeVerifier
    };
};

/**
 * Exchange authorization code for access + refresh tokens
 */
const exchangeCodeForTokens = async (providerId, code, redirectUri, codeVerifier = null) => {
    const provider = getProvider(providerId);

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: provider.clientId
    });

    // For PKCE flow, include code_verifier instead of client_secret
    if (provider.usePKCE && codeVerifier) {
        body.append('code_verifier', codeVerifier);
    }

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
    };

    // Include API key if required
    if (provider.apiKey) {
        headers['x-api-key'] = provider.apiKey;
    }

    const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers,
        body: body.toString()
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Token exchange failed:', errorData);
        throw new Error(`Token exchange failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        patientId: data.patient,
        scope: data.scope
    };
};

/**
 * Refresh an expired access token
 */
const refreshAccessToken = async (providerId, refreshToken) => {
    const provider = getProvider(providerId);

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: provider.clientId
    });

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
    };

    if (provider.apiKey) {
        headers['x-api-key'] = provider.apiKey;
    }

    const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers,
        body: body.toString()
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Token refresh failed:', errorData);
        throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in
    };
};

/**
 * Fetch a FHIR resource from the provider
 */
const fetchResource = async (providerId, accessToken, resourceType, params = {}) => {
    const provider = getProvider(providerId);

    const url = new URL(`${provider.fhirBaseUrl}/${resourceType}`);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json'
    };

    if (provider.apiKey) {
        headers['x-api-key'] = provider.apiKey;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
        const errorData = await response.text();
        console.error(`FHIR fetch ${resourceType} failed:`, errorData);
        throw new Error(`FHIR fetch ${resourceType} failed: ${response.status}`);
    }

    return response.json();
};

/**
 * Fetch all patient data from a FHIR provider
 */
const fetchPatientData = async (providerId, accessToken, patientId) => {
    const resourceTypes = [
        { type: 'Coverage', params: { patient: patientId } },
        { type: 'Claim', params: { patient: patientId } },
        { type: 'Condition', params: { patient: patientId } },
        { type: 'AllergyIntolerance', params: { patient: patientId } },
        { type: 'MedicationRequest', params: { patient: patientId } },
        { type: 'Immunization', params: { patient: patientId } },
        { type: 'Encounter', params: { patient: patientId } },
        { type: 'Procedure', params: { patient: patientId } }
    ];

    const results = {};
    const errors = [];

    const fetches = resourceTypes.map(async ({ type, params }) => {
        try {
            const bundle = await fetchResource(providerId, accessToken, type, params);
            const entries = bundle.entry ? bundle.entry.map(e => e.resource) : [];
            return { type, data: entries };
        } catch (err) {
            console.error(`Error fetching ${type}:`, err.message);
            errors.push({ type, error: err.message });
            return { type, data: [] };
        }
    });

    const settled = await Promise.all(fetches);

    settled.forEach(({ type, data }) => {
        const key = type.charAt(0).toLowerCase() + type.slice(1);
        results[key] = data;
    });

    // Collect unique practitioner references from encounters
    const practitionerRefs = new Set();
    (results.encounter || []).forEach(enc => {
        (enc.participant || []).forEach(p => {
            if (p.individual?.reference?.startsWith('Practitioner/')) {
                practitionerRefs.add(p.individual.reference.split('/')[1]);
            }
        });
    });

    const practitioners = [];
    for (const practId of practitionerRefs) {
        try {
            const practitioner = await fetchResource(providerId, accessToken, `Practitioner/${practId}`);
            practitioners.push(practitioner);
        } catch (err) {
            console.error(`Error fetching Practitioner/${practId}:`, err.message);
        }
    }
    results.practitioners = practitioners;

    if (errors.length > 0) {
        results._errors = errors;
    }

    return results;
};

/**
 * Map FHIR Coverage resource to insurance coverage fields
 */
const mapCoverageToInsurance = (coverageResources) => {
    if (!coverageResources || coverageResources.length === 0) return null;

    const coverage = coverageResources[0];
    const mapped = {};

    if (coverage.costToBeneficiary) {
        coverage.costToBeneficiary.forEach(ctb => {
            const typeCode = ctb.type?.coding?.[0]?.code;
            if (typeCode === 'copay' && ctb.valueMoney) {
                if (!mapped.copay) mapped.copay = {};
                const category = ctb.type?.coding?.[0]?.display?.toLowerCase() || '';
                if (category.includes('primary') || category.includes('pcp')) {
                    mapped.copay.primaryCare = ctb.valueMoney.value;
                } else if (category.includes('specialist')) {
                    mapped.copay.specialist = ctb.valueMoney.value;
                } else if (category.includes('urgent')) {
                    mapped.copay.urgentCare = ctb.valueMoney.value;
                } else if (category.includes('emergency') || category.includes('er')) {
                    mapped.copay.emergency = ctb.valueMoney.value;
                }
            } else if (typeCode === 'coinsurance' && ctb.valueQuantity) {
                mapped.coinsurance = ctb.valueQuantity.value;
            }
        });
    }

    return mapped;
};

module.exports = {
    PROVIDERS,
    getProvider,
    getAuthorizationUrl,
    exchangeCodeForTokens,
    refreshAccessToken,
    fetchResource,
    fetchPatientData,
    mapCoverageToInsurance,
    generateStateToken,
    generateCodeVerifier,
    generateCodeChallenge
};
