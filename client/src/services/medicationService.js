const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const medicationService = {
    async getAll(status = null, familyMemberId = null) {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (familyMemberId) params.append('familyMemberId', familyMemberId);
        const queryString = params.toString();
        const url = `${API_BASE}/medications${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch medications');
        }

        return response.json();
    },

    async getById(id) {
        const response = await fetch(`${API_BASE}/medications/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch medication');
        }

        return response.json();
    },

    async create(medicationData, familyMemberId = null) {
        const body = { ...medicationData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medications`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to create medication');
        }

        return response.json();
    },

    async createFromScan(scanData, familyMemberId = null) {
        const body = { ...scanData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medications/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to create medication from scan');
        }

        return response.json();
    },

    async update(id, medicationData) {
        const response = await fetch(`${API_BASE}/medications/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(medicationData)
        });

        if (!response.ok) {
            throw new Error('Failed to update medication');
        }

        return response.json();
    },

    async updateStatus(id, status) {
        const response = await fetch(`${API_BASE}/medications/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error('Failed to update medication status');
        }

        return response.json();
    },

    async updateReminder(id, enabled, times = []) {
        const response = await fetch(`${API_BASE}/medications/${id}/reminder`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ enabled, times })
        });

        if (!response.ok) {
            throw new Error('Failed to update reminder');
        }

        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_BASE}/medications/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete medication');
        }

        return response.json();
    }
};

export default medicationService;
