const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const epicService = {
    /**
     * Get the Epic SMART on FHIR authorization URL
     * Redirects user to Epic's MyChart login
     */
    async getAuthorizationUrl() {
        const response = await fetch(`${API_BASE}/epic/authorize`, {
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
    async getStatus() {
        const response = await fetch(`${API_BASE}/epic/status`, {
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
    async disconnect() {
        const response = await fetch(`${API_BASE}/epic/disconnect`, {
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
    async sync() {
        const response = await fetch(`${API_BASE}/epic/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
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
    async testConnection() {
        const response = await fetch(`${API_BASE}/epic/test-connection`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Epic connection test failed');
        }

        return response.json();
    }
};

export default epicService;
