const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const medicalRecordsService = {
    async getAll(familyMemberId = null) {
        const params = new URLSearchParams();
        if (familyMemberId) params.append('familyMemberId', familyMemberId);
        const queryString = params.toString();
        const url = `${API_BASE}/medical-history${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch medical history');
        }

        return response.json();
    },

    // Events
    async addEvent(eventData, familyMemberId = null) {
        const body = { ...eventData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-history/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to add event');
        }

        return response.json();
    },

    async deleteEvent(eventId) {
        const response = await fetch(`${API_BASE}/medical-history/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete event');
        }

        return response.json();
    },

    // Vitals
    async updateVitals(vitalsData, familyMemberId = null) {
        const body = { ...vitalsData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-history/vitals`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to update vitals');
        }

        return response.json();
    },

    // Conditions
    async addCondition(conditionData, familyMemberId = null) {
        const body = { ...conditionData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-history/conditions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to add condition');
        }

        return response.json();
    },

    async deleteCondition(conditionId) {
        const response = await fetch(`${API_BASE}/medical-history/conditions/${conditionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete condition');
        }

        return response.json();
    },

    // Allergies
    async addAllergy(allergyData, familyMemberId = null) {
        const body = { ...allergyData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-history/allergies`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to add allergy');
        }

        return response.json();
    },

    async deleteAllergy(allergyId) {
        const response = await fetch(`${API_BASE}/medical-history/allergies/${allergyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete allergy');
        }

        return response.json();
    },

    // Surgeries
    async addSurgery(surgeryData, familyMemberId = null) {
        const body = { ...surgeryData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-history/surgeries`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to add surgery');
        }

        return response.json();
    },

    async deleteSurgery(surgeryId) {
        const response = await fetch(`${API_BASE}/medical-history/surgeries/${surgeryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete surgery');
        }

        return response.json();
    },

    // Family History
    async addFamilyHistory(historyData, familyMemberId = null) {
        const body = { ...historyData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-history/family-history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to add family history');
        }

        return response.json();
    },

    async deleteFamilyHistory(historyId) {
        const response = await fetch(`${API_BASE}/medical-history/family-history/${historyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete family history');
        }

        return response.json();
    }
};

export default medicalRecordsService;
