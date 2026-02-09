const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USER_KEY = 'adminUser';

// Helper to get admin auth headers
const getAdminHeaders = () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const adminAuthService = {
    // Admin login
    async login(email, password) {
        const response = await fetch(`${API_URL}/admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store admin token separately from user token
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin));

        return data;
    },

    // Admin logout
    logout() {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
    },

    // Get admin profile
    async getProfile() {
        const response = await fetch(`${API_URL}/admin/auth/me`, {
            method: 'GET',
            headers: getAdminHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch profile');
        }

        return data;
    },

    // Change admin password
    async changePassword(currentPassword, newPassword) {
        const response = await fetch(`${API_URL}/admin/auth/password`, {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to change password');
        }

        // Update stored token
        if (data.token) {
            localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        }

        return data;
    },

    // Check if admin is authenticated
    isAuthenticated() {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) return false;

        // Check if token is expired by decoding the payload
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },

    // Get stored admin data
    getAdmin() {
        try {
            const admin = localStorage.getItem(ADMIN_USER_KEY);
            return admin ? JSON.parse(admin) : null;
        } catch {
            return null;
        }
    },

    // Get admin token
    getToken() {
        return localStorage.getItem(ADMIN_TOKEN_KEY);
    },

    // Get admin auth headers (for use by other admin services)
    getHeaders() {
        return getAdminHeaders();
    },
};
