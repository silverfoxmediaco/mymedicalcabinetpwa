import { adminAuthService } from './adminAuthService';

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

export const adminManagementService = {
    // Get all admin accounts
    async getAllAdmins() {
        const response = await fetch(`${API_URL}/admin/management`, {
            method: 'GET',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch admins');
        return data;
    },

    // Create a new admin account
    async createAdmin(adminData) {
        const response = await fetch(`${API_URL}/admin/management`, {
            method: 'POST',
            headers: adminAuthService.getHeaders(),
            body: JSON.stringify(adminData),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to create admin');
        return data;
    },

    // Update admin permissions/role/status
    async updateAdmin(id, updates) {
        const response = await fetch(`${API_URL}/admin/management/${id}`, {
            method: 'PUT',
            headers: adminAuthService.getHeaders(),
            body: JSON.stringify(updates),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update admin');
        return data;
    },

    // Deactivate admin account
    async deactivateAdmin(id) {
        const response = await fetch(`${API_URL}/admin/management/${id}/deactivate`, {
            method: 'PUT',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to deactivate admin');
        return data;
    },
};
