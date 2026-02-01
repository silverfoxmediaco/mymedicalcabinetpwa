const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const doctorService = {
    async getAll() {
        const response = await fetch(`${API_BASE}/doctors`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch doctors');
        }

        const result = await response.json();
        return result.data || [];
    },

    async getById(id) {
        const response = await fetch(`${API_BASE}/doctors/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch doctor');
        }

        const result = await response.json();
        return result.data || null;
    },

    async create(doctorData) {
        const response = await fetch(`${API_BASE}/doctors`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(doctorData)
        });

        if (!response.ok) {
            throw new Error('Failed to create doctor');
        }

        return response.json();
    },

    async update(id, doctorData) {
        const response = await fetch(`${API_BASE}/doctors/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(doctorData)
        });

        if (!response.ok) {
            throw new Error('Failed to update doctor');
        }

        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_BASE}/doctors/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete doctor');
        }

        return response.json();
    }
};

export default doctorService;
