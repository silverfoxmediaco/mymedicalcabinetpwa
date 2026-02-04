/**
 * NPI Registry Service - Frontend
 * Calls our backend which queries the NPPES NPI Registry
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Search for doctors by name
 * @param {string} searchTerm - Doctor name to search
 * @param {Object} options - Additional filters
 */
export const searchDoctors = async (searchTerm, options = {}) => {
    if (!searchTerm || searchTerm.length < 2) {
        return [];
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No auth token for NPI search');
        return [];
    }

    // Parse search term into first/last name
    const nameParts = searchTerm.trim().split(/\s+/);
    let firstName = '';
    let lastName = '';

    if (nameParts.length === 1) {
        // Single word - search as last name (more common)
        lastName = nameParts[0];
    } else {
        // Multiple words - first word is first name, rest is last name
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
    }

    const params = new URLSearchParams();
    if (firstName) params.append('firstName', firstName);
    if (lastName) params.append('lastName', lastName);
    if (options.state) params.append('state', options.state);
    if (options.city) params.append('city', options.city);
    if (options.specialty) params.append('specialty', options.specialty);
    params.append('limit', options.limit || 10);

    try {
        const response = await fetch(`${API_BASE}/npi/search?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('NPI search failed');
        }

        const data = await response.json();
        return data.providers || [];
    } catch (error) {
        console.error('NPI search error:', error);
        return [];
    }
};

/**
 * Lookup a specific doctor by NPI number
 * @param {string} npiNumber - 10-digit NPI
 */
export const lookupByNPI = async (npiNumber) => {
    if (!npiNumber || !/^\d{10}$/.test(npiNumber)) {
        return null;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No auth token for NPI lookup');
        return null;
    }

    try {
        const response = await fetch(`${API_BASE}/npi/lookup/${npiNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('NPI lookup failed');
        }

        const data = await response.json();
        return data.found ? data.provider : null;
    } catch (error) {
        console.error('NPI lookup error:', error);
        return null;
    }
};

/**
 * Verify an NPI number is valid
 * @param {string} npiNumber - NPI to verify
 * @param {string} lastName - Optional last name to match
 */
export const verifyNPI = async (npiNumber, lastName = null) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return { verified: false, reason: 'Not authenticated' };
    }

    try {
        const response = await fetch(`${API_BASE}/npi/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ npiNumber, lastName })
        });

        if (!response.ok) {
            throw new Error('NPI verify failed');
        }

        return await response.json();
    } catch (error) {
        console.error('NPI verify error:', error);
        return { verified: false, reason: 'Verification failed' };
    }
};

export default {
    searchDoctors,
    lookupByNPI,
    verifyNPI
};
