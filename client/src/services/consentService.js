const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const consentService = {
    async getConsentStatus() {
        const response = await fetch(`${API_BASE}/users/consent`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch consent status');
        }

        return response.json();
    },

    async acceptConsent(acceptTerms, acceptPrivacy, acceptHipaa) {
        const response = await fetch(`${API_BASE}/users/consent`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                acceptTerms,
                acceptPrivacy,
                acceptHipaa
            })
        });

        if (!response.ok) {
            throw new Error('Failed to record consent');
        }

        return response.json();
    },

    // Check if user has given all required consent
    hasFullConsent(consent) {
        if (!consent) return false;
        return (
            consent.hasAcceptedTerms === true &&
            consent.hasAcceptedPrivacy === true &&
            consent.hasAcceptedHipaa === true
        );
    }
};

export default consentService;
