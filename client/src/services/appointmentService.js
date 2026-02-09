const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const appointmentService = {
    async getAll(familyMemberId = null) {
        const params = new URLSearchParams();
        if (familyMemberId) params.append('familyMemberId', familyMemberId);
        const queryString = params.toString();
        const url = `${API_BASE}/appointments${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch appointments');
        }

        const result = await response.json();
        return result.data || [];
    },

    async getById(id) {
        const response = await fetch(`${API_BASE}/appointments/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch appointment');
        }

        const result = await response.json();
        return result.data || null;
    },

    async getUpcoming() {
        const response = await fetch(`${API_BASE}/appointments/upcoming`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch upcoming appointments');
        }

        const result = await response.json();
        return result.data || [];
    },

    async create(appointmentData, familyMemberId = null) {
        const body = { ...appointmentData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to create appointment');
        }

        return response.json();
    },

    async update(id, appointmentData) {
        const response = await fetch(`${API_BASE}/appointments/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });

        if (!response.ok) {
            throw new Error('Failed to update appointment');
        }

        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_BASE}/appointments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete appointment');
        }

        return response.json();
    },

    async complete(id, { visitSummary, notes, prescriptions }) {
        const response = await fetch(`${API_BASE}/appointments/${id}/complete`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ visitSummary, notes, prescriptions })
        });

        if (!response.ok) {
            throw new Error('Failed to complete appointment');
        }

        return response.json();
    }
};

export default appointmentService;
