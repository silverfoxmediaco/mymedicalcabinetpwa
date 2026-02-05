const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const insuranceService = {
    async getAll() {
        const response = await fetch(`${API_BASE}/insurance`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch insurance');
        }

        const result = await response.json();
        return result.data || [];
    },

    async getById(id) {
        const response = await fetch(`${API_BASE}/insurance/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch insurance');
        }

        const result = await response.json();
        return result.data || null;
    },

    async create(insuranceData) {
        const response = await fetch(`${API_BASE}/insurance`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(insuranceData)
        });

        if (!response.ok) {
            throw new Error('Failed to create insurance');
        }

        return response.json();
    },

    async update(id, insuranceData) {
        const response = await fetch(`${API_BASE}/insurance/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(insuranceData)
        });

        if (!response.ok) {
            throw new Error('Failed to update insurance');
        }

        return response.json();
    },

    async updateCoverage(id, coverageData) {
        const response = await fetch(`${API_BASE}/insurance/${id}/coverage`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(coverageData)
        });

        if (!response.ok) {
            throw new Error('Failed to update coverage');
        }

        return response.json();
    },

    async uploadDocument(insuranceId, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/insurance/${insuranceId}/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload document');
        }

        return response.json();
    },

    async deleteDocument(insuranceId, documentId) {
        const response = await fetch(`${API_BASE}/insurance/${insuranceId}/documents/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }

        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_BASE}/insurance/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete insurance');
        }

        return response.json();
    },

    async getFhirAuthUrl(provider) {
        const response = await fetch(`${API_BASE}/insurance/fhir/authorize/${provider}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get FHIR authorization URL');
        }

        const result = await response.json();
        return result.data;
    },

    async syncFhirData(insuranceId) {
        const response = await fetch(`${API_BASE}/insurance/${insuranceId}/sync`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to sync FHIR data');
        }

        return response.json();
    },

    async disconnectFhir(insuranceId) {
        const response = await fetch(`${API_BASE}/insurance/${insuranceId}/disconnect`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to disconnect FHIR');
        }

        return response.json();
    }
};

export default insuranceService;
