const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const appointmentService = {
    async getAll() {
        const response = await fetch(`${API_BASE}/appointments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch appointments');
        }

        return response.json();
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

        return response.json();
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

        return response.json();
    },

    async create(appointmentData) {
        const response = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
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
    }
};

export default appointmentService;
