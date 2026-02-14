const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const familyMemberService = {
    async getAll() {
        const response = await fetch(`${API_BASE}/family-members`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch family members');
        }

        const result = await response.json();
        return result.data || [];
    },

    async getById(id) {
        const response = await fetch(`${API_BASE}/family-members/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch family member');
        }

        const result = await response.json();
        return result.data || null;
    },

    async create(memberData) {
        const response = await fetch(`${API_BASE}/family-members`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create family member');
        }

        return response.json();
    },

    async update(id, memberData) {
        const response = await fetch(`${API_BASE}/family-members/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(memberData)
        });

        if (!response.ok) {
            throw new Error('Failed to update family member');
        }

        return response.json();
    },

    async addPharmacy(memberId, data) {
        const response = await fetch(`${API_BASE}/family-members/${memberId}/pharmacies`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add pharmacy');
        }

        return response.json();
    },

    async updatePharmacy(memberId, pharmacyId, data) {
        const response = await fetch(`${API_BASE}/family-members/${memberId}/pharmacies/${pharmacyId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to update pharmacy');
        }

        return response.json();
    },

    async deletePharmacy(memberId, pharmacyId) {
        const response = await fetch(`${API_BASE}/family-members/${memberId}/pharmacies/${pharmacyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete pharmacy');
        }

        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_BASE}/family-members/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete family member');
        }

        return response.json();
    }
};

export default familyMemberService;
