const API_BASE = process.env.REACT_APP_API_URL || '/api';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const intakeService = {
    async getIntakeData(familyMemberId = null) {
        const params = new URLSearchParams();
        if (familyMemberId) params.append('familyMemberId', familyMemberId);
        const qs = params.toString();
        const suffix = qs ? `?${qs}` : '';

        const [userRes, historyRes, medsRes, doctorsRes, insuranceRes] = await Promise.all([
            fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/medical-history${suffix}`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/medications${suffix}`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/doctors${suffix}`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE}/insurance${suffix}`, { headers: getAuthHeaders() })
        ]);

        const [userData, historyData, medsData, doctorsData, insuranceData] = await Promise.all([
            userRes.json(),
            historyRes.json(),
            medsRes.json(),
            doctorsRes.json(),
            insuranceRes.json()
        ]);

        return {
            user: userData.user || userData.data,
            medicalHistory: historyData.medicalHistory || historyData.data,
            medications: medsData.medications || medsData.data || [],
            doctors: doctorsData.doctors || doctorsData.data || [],
            insurance: insuranceData.insurance || insuranceData.data || []
        };
    },

    async updateSocialHistory(socialData, familyMemberId = null) {
        const body = { ...socialData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-history/social-history`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to update social history');
        }

        return response.json();
    },

    async updatePastMedicalChecklist(checklistData, familyMemberId = null) {
        const body = { ...checklistData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-history/past-medical-checklist`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to update past medical checklist');
        }

        return response.json();
    },

    async updateFamilyHistoryChecklist(checklistData, familyMemberId = null) {
        const body = { ...checklistData };
        if (familyMemberId) body.familyMemberId = familyMemberId;

        const response = await fetch(`${API_BASE}/medical-history/family-history-checklist`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Failed to update family history checklist');
        }

        return response.json();
    },

    async updateUserProfile(profileData) {
        const response = await fetch(`${API_BASE}/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        return response.json();
    }
};

export default intakeService;
