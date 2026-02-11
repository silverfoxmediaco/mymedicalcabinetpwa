// Use relative URL in production (same domain), full URL in development
const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

export const authService = {
    // Register a new user
    async register(userData) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Store token if registration successful
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    },

    // Login user
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    },

    // Logout user
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },

    // Get current user from storage
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Get auth token
    getToken() {
        return localStorage.getItem('authToken');
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    },

    // Verify email
    async verifyEmail(token) {
        const response = await fetch(`${API_URL}/auth/verify-email/${token}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Email verification failed');
        }

        return data;
    },

    // Forgot password - send reset email
    async forgotPassword(email) {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send reset email');
        }

        return data;
    },

    // Reset password with token
    async resetPassword(token, password) {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to reset password');
        }

        return data;
    },

    // Forgot username - look up by last name + SSN last 4
    async forgotUsername(lastName, ssnLast4) {
        const response = await fetch(`${API_URL}/auth/forgot-username`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lastName, ssnLast4 })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to look up account');
        }

        return data;
    },

    // Resend verification email
    async resendVerification() {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to resend verification');
        }

        return data;
    }
};
