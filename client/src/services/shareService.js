const API_URL = process.env.REACT_APP_API_URL || '';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create email share with OTP
export const createEmailShare = async (recipientEmail, recipientName = '', permissions = {}, familyMemberId = null) => {
    const body = {
        recipientEmail,
        recipientName,
        permissions
    };
    if (familyMemberId) body.familyMemberId = familyMemberId;

    const response = await fetch(`${API_URL}/api/share/email-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to create share');
    }

    return data;
};

// Verify OTP and get session token
export const verifyOtp = async (accessCode, otp) => {
    const response = await fetch(`${API_URL}/api/share/verify-otp/${accessCode}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
    }

    return data;
};

// Get shared records using session token
export const getSharedRecords = async (accessCode, sessionToken) => {
    const response = await fetch(`${API_URL}/api/share/records/${accessCode}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to retrieve records');
    }

    return data;
};

// Get all shares for current user
export const getMyShares = async () => {
    const response = await fetch(`${API_URL}/api/share`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to retrieve shares');
    }

    return data;
};

// Revoke a share
export const revokeShare = async (shareId) => {
    const response = await fetch(`${API_URL}/api/share/${shareId}/revoke`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to revoke share');
    }

    return data;
};

// Check share status (public)
export const checkShareStatus = async (accessCode) => {
    const response = await fetch(`${API_URL}/api/share/status/${accessCode}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to check share status');
    }

    return data;
};

// Delete a share
export const deleteShare = async (shareId) => {
    const response = await fetch(`${API_URL}/api/share/${shareId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader()
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete share');
    }

    return data;
};

export default {
    createEmailShare,
    verifyOtp,
    getSharedRecords,
    getMyShares,
    revokeShare,
    checkShareStatus,
    deleteShare
};
