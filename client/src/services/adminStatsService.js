import { adminAuthService } from './adminAuthService';

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

export const adminStatsService = {
    // Get platform-wide system statistics
    async getSystemStats() {
        const response = await fetch(`${API_URL}/admin/stats`, {
            method: 'GET',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch stats');
        }

        return data;
    },

    // Get last 20 recent registrations
    async getRecentRegistrations() {
        const response = await fetch(`${API_URL}/admin/stats/recent-registrations`, {
            method: 'GET',
            headers: adminAuthService.getHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch recent registrations');
        }

        return data;
    },
};
