const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const medicationService = {
    async getAll(status = null) {
        const url = status
            ? `${API_BASE}/medications?status=${status}`
            : `${API_BASE}/medications`;

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

    async create(medicationData) {
        const response = await fetch(`${API_BASE}/medications`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(medicationData)
        });

        if (!response.ok) {
            throw new Error('Failed to create medication');
        }

        return response.json();
    },

    async createFromScan(scanData) {
        const response = await fetch(`${API_BASE}/medications/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scanData)
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
