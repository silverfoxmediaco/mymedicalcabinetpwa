const API_BASE = process.env.REACT_APP_API_URL || '/api';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

const getSessionHeaders = (sessionToken) => ({
    'Content-Type': 'application/json',
    'x-session-token': sessionToken
});

// =============================================
// Patient methods (authenticated)
// =============================================

export const settlementService = {
    async createOffer(data, familyMemberId = null) {
        const body = { ...data };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/settlement-offers`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to create offer');
        }

        return response.json();
    },

    async getOffersForBill(billId) {
        const response = await fetch(`${API_BASE}/settlement-offers/bill/${billId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch offers');
        }

        const result = await response.json();
        return result.data || [];
    },

    async getOffer(offerId) {
        const response = await fetch(`${API_BASE}/settlement-offers/${offerId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch offer');
        }

        const result = await response.json();
        return result.data || null;
    },

    async withdrawOffer(offerId) {
        const response = await fetch(`${API_BASE}/settlement-offers/${offerId}/withdraw`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to withdraw offer');
        }

        return response.json();
    },

    async acceptCounter(offerId) {
        const response = await fetch(`${API_BASE}/settlement-offers/${offerId}/accept-counter`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to accept counter');
        }

        return response.json();
    },

    async rejectCounter(offerId) {
        const response = await fetch(`${API_BASE}/settlement-offers/${offerId}/reject-counter`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to reject counter');
        }

        return response.json();
    },

    async createPaymentIntent(offerId) {
        const response = await fetch(`${API_BASE}/settlement-offers/${offerId}/payment-intent`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to create payment');
        }

        return response.json();
    },

    async resendOtp(offerId) {
        const response = await fetch(`${API_BASE}/settlement-offers/${offerId}/resend-otp`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to resend OTP');
        }

        return response.json();
    },

    // =============================================
    // Biller methods (public, session-based)
    // =============================================

    async checkOfferStatus(accessCode) {
        const response = await fetch(`${API_BASE}/settlement-offers/biller/status/${accessCode}`);

        if (!response.ok) {
            throw new Error('Failed to check offer status');
        }

        return response.json();
    },

    async verifyBillerOtp(accessCode, otp) {
        const response = await fetch(`${API_BASE}/settlement-offers/biller/verify-otp/${accessCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'OTP verification failed');
        }

        return response.json();
    },

    async getBillerOffer(accessCode, sessionToken) {
        const response = await fetch(`${API_BASE}/settlement-offers/biller/offer/${accessCode}`, {
            headers: getSessionHeaders(sessionToken)
        });

        if (!response.ok) {
            throw new Error('Failed to fetch offer');
        }

        return response.json();
    },

    async acceptOffer(accessCode, sessionToken) {
        const response = await fetch(`${API_BASE}/settlement-offers/biller/accept/${accessCode}`, {
            method: 'PUT',
            headers: getSessionHeaders(sessionToken)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to accept offer');
        }

        return response.json();
    },

    async rejectOffer(accessCode, sessionToken, message = '') {
        const response = await fetch(`${API_BASE}/settlement-offers/biller/reject/${accessCode}`, {
            method: 'PUT',
            headers: getSessionHeaders(sessionToken),
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to reject offer');
        }

        return response.json();
    },

    async counterOffer(accessCode, sessionToken, counterAmount, message = '') {
        const response = await fetch(`${API_BASE}/settlement-offers/biller/counter/${accessCode}`, {
            method: 'PUT',
            headers: getSessionHeaders(sessionToken),
            body: JSON.stringify({ counterAmount, message })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to submit counter-offer');
        }

        return response.json();
    },

    async getBillerOnboardingLink(accessCode, sessionToken) {
        const response = await fetch(`${API_BASE}/settlement-offers/biller/onboarding/${accessCode}`, {
            headers: getSessionHeaders(sessionToken)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to get onboarding link');
        }

        return response.json();
    }
};

export default settlementService;
