const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const medicalBillService = {
    async getAll(familyMemberId = null) {
        const params = new URLSearchParams();
        if (familyMemberId) params.append('familyMemberId', familyMemberId);
        const queryString = params.toString();
        const url = `${API_BASE}/medical-bills${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch medical bills');
        }

        const result = await response.json();
        return result.data || [];
    },

    async getById(id) {
        const response = await fetch(`${API_BASE}/medical-bills/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch medical bill');
        }

        const result = await response.json();
        return result.data || null;
    },

    async create(billData, familyMemberId = null) {
        const body = { ...billData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-bills`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to create medical bill');
        }

        return response.json();
    },

    async update(id, billData) {
        const response = await fetch(`${API_BASE}/medical-bills/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billData)
        });

        if (!response.ok) {
            throw new Error('Failed to update medical bill');
        }

        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_BASE}/medical-bills/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete medical bill');
        }

        return response.json();
    },

    async uploadDocument(billId, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/medical-bills/${billId}/documents`, {
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

    async deleteDocument(billId, documentId) {
        const response = await fetch(`${API_BASE}/medical-bills/${billId}/documents/${documentId}`, {
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

    async addPayment(billId, paymentData) {
        const response = await fetch(`${API_BASE}/medical-bills/${billId}/payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            throw new Error('Failed to add payment');
        }

        return response.json();
    },

    async deletePayment(billId, paymentId) {
        const response = await fetch(`${API_BASE}/medical-bills/${billId}/payments/${paymentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete payment');
        }

        return response.json();
    },

    async stageBillFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/medical-bills/stage`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload bill page');
        }

        return response.json();
    },

    async extractFromDocuments(documents) {
        const response = await fetch(`${API_BASE}/medical-bills/extract`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ documents })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to extract bill data');
        }

        return response.json();
    },

    async scanBill(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/medical-bills/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to scan bill');
        }

        return response.json();
    },

    async createPaymentIntent(billId, amount = null) {
        const body = {};
        if (amount) body.amount = amount;

        const response = await fetch(`${API_BASE}/medical-bills/${billId}/payment-intent`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create payment intent');
        }

        return response.json();
    },

    async getSummary(familyMemberId = null) {
        const params = new URLSearchParams();
        if (familyMemberId) params.append('familyMemberId', familyMemberId);
        const queryString = params.toString();
        const url = `${API_BASE}/medical-bills/summary${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bills summary');
        }

        const result = await response.json();
        return result.data || {};
    }
};

export default medicalBillService;
