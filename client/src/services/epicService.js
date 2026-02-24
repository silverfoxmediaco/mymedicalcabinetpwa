const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const epicService = {
    /**
     * Get the Epic SMART on FHIR authorization URL
     * Redirects user to Epic's MyChart login
     */
    async getAuthorizationUrl(familyMemberId, healthSystemId) {
        const searchParams = new URLSearchParams();
        if (familyMemberId) searchParams.set('familyMemberId', familyMemberId);
        if (healthSystemId) searchParams.set('healthSystemId', healthSystemId);
        const params = searchParams.toString() ? `?${searchParams}` : '';
        const response = await fetch(`${API_BASE}/epic/authorize${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to get Epic authorization URL');
        }

        const result = await response.json();
        return result.data.authorizationUrl;
    },

    /**
     * Check the current user's Epic connection status
     */
    async getStatus(familyMemberId) {
        const params = familyMemberId ? `?familyMemberId=${familyMemberId}` : '';
        const response = await fetch(`${API_BASE}/epic/status${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to check Epic connection status');
        }

        const result = await response.json();
        return result.data;
    },

    /**
     * Disconnect the Epic account
     */
    async disconnect(familyMemberId) {
        const params = familyMemberId ? `?familyMemberId=${familyMemberId}` : '';
        const response = await fetch(`${API_BASE}/epic/disconnect${params}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to disconnect Epic');
        }

        return response.json();
    },

    /**
     * Import clinical data from Epic via FHIR sync
     */
    async sync(familyMemberId) {
        const body = familyMemberId ? JSON.stringify({ familyMemberId }) : undefined;
        const response = await fetch(`${API_BASE}/epic/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to sync Epic data');
        }

        const result = await response.json();
        return result.data;
    },

    /**
     * Test the Epic connection by reading Patient resource
     */
    async testConnection(familyMemberId) {
        const body = familyMemberId ? JSON.stringify({ familyMemberId }) : undefined;
        const response = await fetch(`${API_BASE}/epic/test-connection`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Epic connection test failed');
        }

        return response.json();
    }
};

export default epicService;
