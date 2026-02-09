import { adminAuthService } from './adminAuthService';

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

export const adminUsersService = {
    // Get all users with search, filter, sort, pagination
    async getAllUsers(params = {}) {
        const query = new URLSearchParams();

        if (params.page) query.set('page', params.page);
        if (params.limit) query.set('limit', params.limit);
        if (params.search) query.set('search', params.search);
        if (params.role) query.set('role', params.role);
        if (params.isActive) query.set('isActive', params.isActive);
        if (params.isEmailVerified) query.set('isEmailVerified', params.isEmailVerified);
        if (params.sortBy) query.set('sortBy', params.sortBy);
        if (params.sortOrder) query.set('sortOrder', params.sortOrder);

        const response = await fetch(`${API_URL}/admin/users?${query.toString()}`, {
            method: 'GET',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
        return data;
    },

    // Get user by ID with data counts
    async getUserById(id) {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'GET',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch user');
        return data;
    },

    // Get user medical data summary
    async getUserMedicalSummary(id) {
        const response = await fetch(`${API_URL}/admin/users/${id}/medical`, {
            method: 'GET',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch medical data');
        return data;
    },

    // Force password reset
    async forcePasswordReset(id) {
        const response = await fetch(`${API_URL}/admin/users/${id}/reset-password`, {
            method: 'POST',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to send password reset');
        return data;
    },

    // Force email verification
    async forceEmailVerification(id) {
        const response = await fetch(`${API_URL}/admin/users/${id}/verify-email`, {
            method: 'POST',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to verify email');
        return data;
    },

    // Deactivate user
    async deactivateUser(id) {
        const response = await fetch(`${API_URL}/admin/users/${id}/deactivate`, {
            method: 'PUT',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to deactivate user');
        return data;
    },

    // Reactivate user
    async reactivateUser(id) {
        const response = await fetch(`${API_URL}/admin/users/${id}/reactivate`, {
            method: 'PUT',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to reactivate user');
        return data;
    },

    // Permanently delete user
    async deleteUser(id) {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete user');
        return data;
    },
};
