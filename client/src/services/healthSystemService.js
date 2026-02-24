const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const healthSystemService = {
    /**
     * Search health systems by name
     * @param {string} query - Search term
     * @returns {Promise<Array>} Matching health systems
     */
    async search(query) {
        const params = new URLSearchParams({ q: query });
        const response = await fetch(`${API_BASE}/health-systems/search?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to search health systems');
        }

        const result = await response.json();
        return result.data;
    }
};

export default healthSystemService;
