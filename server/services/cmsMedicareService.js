/**
 * CMS Medicare Provider Utilization & Payment Data Service
 *
 * Queries the free, public CMS dataset API for real Medicare payment rates
 * by HCPCS/CPT code and state. No API key required.
 *
 * Dataset: Medicare Physician & Other Practitioners — by Provider and Service
 * UUID: 92396110-2aed-4d63-a6a2-5d6207d46a29
 */

const CMS_DATASET_UUID = '92396110-2aed-4d63-a6a2-5d6207d46a29';
const CMS_BASE_URL = `https://data.cms.gov/data-api/v1/dataset/${CMS_DATASET_UUID}/data`;

// In-memory cache: key = "hcpcsCode-state" or "hcpcsCode-national", value = { data, timestamp }
const cache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Calculate median of a numeric array
 */
const median = (values) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Fetch CMS data for a single HCPCS code, optionally filtered by state
 */
const fetchCmsData = async (hcpcsCode, state) => {
    const cacheKey = `${hcpcsCode}-${state || 'national'}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }

    try {
        const params = new URLSearchParams({
            'filter[HCPCS_Cd]': hcpcsCode,
            size: '500'
        });

        if (state) {
            params.set('filter[Rndrng_Prvdr_State_Abrvtn]', state.toUpperCase());
        }

        const url = `${CMS_BASE_URL}?${params.toString()}`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000) // 10s timeout
        });

        if (!response.ok) {
            console.warn(`CMS API returned ${response.status} for HCPCS ${hcpcsCode}`);
            return [];
        }

        const data = await response.json();

        // Cache the result
        cache.set(cacheKey, { data, timestamp: Date.now() });

        return data;
    } catch (error) {
        console.warn(`CMS API error for HCPCS ${hcpcsCode}:`, error.message);
        return [];
    }
};

/**
 * Aggregate CMS rows into a summary for one HCPCS code
 */
const aggregateRates = (rows, hcpcsCode, state) => {
    if (!rows || rows.length === 0) return null;

    const allowedAmts = rows
        .map(r => parseFloat(r.Avg_Mdcr_Alowd_Amt))
        .filter(v => !isNaN(v) && v > 0);

    const submittedCharges = rows
        .map(r => parseFloat(r.Avg_Sbmtd_Chrg))
        .filter(v => !isNaN(v) && v > 0);

    const paymentAmts = rows
        .map(r => parseFloat(r.Avg_Mdcr_Pymt_Amt))
        .filter(v => !isNaN(v) && v > 0);

    if (allowedAmts.length === 0) return null;

    // Use description from first row
    const description = rows[0].HCPCS_Desc || '';

    return {
        hcpcsCode,
        description,
        medicareAllowedAmt: Math.round(median(allowedAmts) * 100) / 100,
        avgSubmittedCharge: Math.round(median(submittedCharges) * 100) / 100,
        medicarePaymentAmt: Math.round(median(paymentAmts) * 100) / 100,
        sampleSize: allowedAmts.length,
        state: state || 'National',
        source: 'CMS Medicare Physician & Other Practitioners'
    };
};

/**
 * Look up Medicare rates for an array of HCPCS/CPT codes
 *
 * @param {string[]} hcpcsCodes - Array of HCPCS/CPT codes
 * @param {string|null} state - Optional 2-letter state abbreviation for regional rates
 * @returns {Promise<Object>} Object keyed by HCPCS code with rate data
 */
const lookupMedicareRates = async (hcpcsCodes, state = null) => {
    if (!hcpcsCodes || hcpcsCodes.length === 0) return {};

    const results = {};
    const uniqueCodes = [...new Set(hcpcsCodes.map(c => c.trim()).filter(Boolean))];

    for (const code of uniqueCodes) {
        // Small delay between requests to be respectful to CMS servers
        if (uniqueCodes.indexOf(code) > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        let rows = [];

        // Try state-specific first if state provided
        if (state) {
            rows = await fetchCmsData(code, state);
        }

        // If no state results (or no state provided), try national
        if (rows.length === 0) {
            rows = await fetchCmsData(code, null);
        }

        const aggregated = aggregateRates(rows, code, rows.length > 0 && state ? state : null);
        if (aggregated) {
            results[code] = aggregated;
        }
    }

    return results;
};

/**
 * Format Medicare data into a text block for injection into Claude prompts
 */
const formatMedicareDataForPrompt = (medicareData) => {
    if (!medicareData || Object.keys(medicareData).length === 0) {
        return null;
    }

    const lines = Object.values(medicareData).map(d => {
        const region = d.state ? ` (${d.state}, n=${d.sampleSize})` : ` (National, n=${d.sampleSize})`;
        return `- CPT ${d.hcpcsCode} (${d.description}): Medicare allowed $${d.medicareAllowedAmt}, avg submitted $${d.avgSubmittedCharge}${region}`;
    });

    return `MEDICARE REFERENCE DATA (from CMS Medicare Physician Fee Schedule):\n${lines.join('\n')}\n\nUse these actual Medicare rates as your primary benchmark for fairPriceEstimate. The Medicare allowed amount represents what CMS has determined is a fair reimbursement. Fair price should be at or near the Medicare allowed amount. Flag any billed amount exceeding 2x the average submitted charge as a potential overcharge.`;
};

module.exports = { lookupMedicareRates, formatMedicareDataForPrompt };
