/**
 * NPI Registry Service
 * Lookup doctors using the free National Provider Identifier (NPI) Registry API
 * https://npiregistry.cms.hhs.gov/api-page
 *
 * This provides:
 * - Doctor verification (is this a real licensed provider?)
 * - Provider details (name, credentials, specialty, address)
 * - Practice location information
 *
 * Note: Malpractice data is in the NPDB (National Practitioner Data Bank)
 * which requires special authorization and is not publicly available.
 */

const NPI_API_BASE = 'https://npiregistry.cms.hhs.gov/api';

/**
 * Search for providers by name
 * @param {Object} params - Search parameters
 * @param {string} params.firstName - Provider first name
 * @param {string} params.lastName - Provider last name
 * @param {string} params.state - Two-letter state code (optional)
 * @param {string} params.city - City name (optional)
 * @param {string} params.specialty - Taxonomy description (optional)
 * @param {number} params.limit - Max results (default 10, max 200)
 */
const searchProviders = async ({ firstName, lastName, state, city, specialty, limit = 10 }) => {
    const params = new URLSearchParams({
        version: '2.1',
        enumeration_type: 'NPI-1', // Individual providers only
        limit: Math.min(limit, 200)
    });

    if (firstName) params.append('first_name', firstName);
    if (lastName) params.append('last_name', lastName);
    if (state) params.append('state', state);
    if (city) params.append('city', city);
    if (specialty) params.append('taxonomy_description', specialty);

    try {
        const response = await fetch(`${NPI_API_BASE}/?${params.toString()}`);
        const data = await response.json();

        if (data.result_count === 0) {
            return { success: true, count: 0, providers: [] };
        }

        const providers = data.results.map(formatProviderResult);

        return {
            success: true,
            count: data.result_count,
            providers
        };
    } catch (error) {
        console.error('NPI API error:', error);
        throw new Error('Failed to search NPI registry');
    }
};

/**
 * Lookup a specific provider by NPI number
 * @param {string} npiNumber - 10-digit NPI number
 */
const lookupByNPI = async (npiNumber) => {
    if (!npiNumber || !/^\d{10}$/.test(npiNumber)) {
        throw new Error('Invalid NPI number. Must be 10 digits.');
    }

    const params = new URLSearchParams({
        version: '2.1',
        number: npiNumber
    });

    try {
        const response = await fetch(`${NPI_API_BASE}/?${params.toString()}`);
        const data = await response.json();

        if (data.result_count === 0) {
            return { success: true, found: false, provider: null };
        }

        const provider = formatProviderResult(data.results[0]);

        return {
            success: true,
            found: true,
            provider
        };
    } catch (error) {
        console.error('NPI API error:', error);
        throw new Error('Failed to lookup NPI');
    }
};

/**
 * Verify a doctor exists and get their credentials
 * @param {string} npiNumber - NPI number to verify
 * @param {string} lastName - Last name to match (optional additional verification)
 */
const verifyProvider = async (npiNumber, lastName = null) => {
    const result = await lookupByNPI(npiNumber);

    if (!result.found) {
        return {
            verified: false,
            reason: 'NPI number not found in registry'
        };
    }

    // If lastName provided, verify it matches
    if (lastName && result.provider.lastName.toLowerCase() !== lastName.toLowerCase()) {
        return {
            verified: false,
            reason: 'Name does not match NPI registry',
            provider: result.provider
        };
    }

    return {
        verified: true,
        provider: result.provider,
        verifiedAt: new Date().toISOString()
    };
};

/**
 * Format raw NPI result into cleaner structure
 */
const formatProviderResult = (result) => {
    const basic = result.basic || {};
    const addresses = result.addresses || [];
    const taxonomies = result.taxonomies || [];

    // Find primary practice location
    const practiceAddress = addresses.find(a => a.address_purpose === 'LOCATION') || addresses[0] || {};

    // Find primary taxonomy (specialty)
    const primaryTaxonomy = taxonomies.find(t => t.primary) || taxonomies[0] || {};

    return {
        npiNumber: result.number,
        enumType: result.enumeration_type,
        status: basic.status || 'A',

        // Name info
        firstName: basic.first_name || '',
        lastName: basic.last_name || '',
        middleName: basic.middle_name || '',
        credential: basic.credential || '',
        namePrefix: basic.name_prefix || '',
        nameSuffix: basic.name_suffix || '',
        fullName: formatFullName(basic),

        // Demographics
        gender: basic.gender || '',
        lastUpdated: basic.last_updated || '',
        enumerationDate: basic.enumeration_date || '',

        // Specialty/Taxonomy
        specialty: primaryTaxonomy.desc || '',
        taxonomyCode: primaryTaxonomy.code || '',
        taxonomyGroup: primaryTaxonomy.taxonomy_group || '',
        licenseNumber: primaryTaxonomy.license || '',
        licenseState: primaryTaxonomy.state || '',
        isPrimaryTaxonomy: primaryTaxonomy.primary || false,

        // All specialties
        allSpecialties: taxonomies.map(t => ({
            description: t.desc,
            code: t.code,
            isPrimary: t.primary,
            state: t.state,
            license: t.license
        })),

        // Practice address
        practiceAddress: {
            street: practiceAddress.address_1 || '',
            street2: practiceAddress.address_2 || '',
            city: practiceAddress.city || '',
            state: practiceAddress.state || '',
            zipCode: practiceAddress.postal_code || '',
            phone: practiceAddress.telephone_number || '',
            fax: practiceAddress.fax_number || ''
        },

        // All addresses
        addresses: addresses.map(a => ({
            purpose: a.address_purpose,
            street: a.address_1,
            street2: a.address_2,
            city: a.city,
            state: a.state,
            zipCode: a.postal_code,
            phone: a.telephone_number,
            fax: a.fax_number
        }))
    };
};

/**
 * Format full name from basic info
 */
const formatFullName = (basic) => {
    const parts = [];
    if (basic.name_prefix) parts.push(basic.name_prefix);
    if (basic.first_name) parts.push(basic.first_name);
    if (basic.middle_name) parts.push(basic.middle_name);
    if (basic.last_name) parts.push(basic.last_name);
    if (basic.name_suffix) parts.push(basic.name_suffix);
    if (basic.credential) parts.push(`, ${basic.credential}`);
    return parts.join(' ').replace(' ,', ',');
};

module.exports = {
    searchProviders,
    lookupByNPI,
    verifyProvider
};
