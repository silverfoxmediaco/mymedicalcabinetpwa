import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminStatsService } from '../../services/adminStatsService';
import './AdminDashboard.css';

const AdminDashboard = ({ admin }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, recentRes] = await Promise.all([
                adminStatsService.getSystemStats(),
                adminStatsService.getRecentRegistrations(),
            ]);

            setStats(statsRes.stats);
            setRecentUsers(recentRes.users || []);
        } catch (err) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'patient': return 'admin-dashboard-role-patient';
            case 'caregiver': return 'admin-dashboard-role-caregiver';
            case 'doctor': return 'admin-dashboard-role-doctor';
            default: return '';
        }
    };

    if (loading) {
        return (
            <AdminLayout admin={admin}>
                <div className="admin-dashboard-loading">Loading dashboard...</div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout admin={admin}>
                <div className="admin-dashboard-error">{error}</div>
            </AdminLayout>
        );
    }

    const totalRecords =
        (stats?.dataVolume?.conditions || 0) +
        (stats?.dataVolume?.medications || 0) +
        (stats?.dataVolume?.appointments || 0) +
        (stats?.dataVolume?.insurancePlans || 0);

    const formatDollar = (val) => {
        if (!val) return '$0';
        return '$' + Math.round(val).toLocaleString();
    };

    return (
        <AdminLayout admin={admin}>
            <div className="admin-dashboard-page">
                <h1 className="admin-dashboard-title">Dashboard</h1>

                {/* Stats Cards Row */}
                <div className="admin-dashboard-stats-grid">
                    <div className="admin-dashboard-stat-card admin-dashboard-stat-users"
                         onClick={() => navigate('/admin/users')}
                         style={{ cursor: 'pointer' }}>
                        <div className="admin-dashboard-stat-border"></div>
                        <div className="admin-dashboard-stat-content">
                            <h3 className="admin-dashboard-stat-label">Total Users</h3>
                            <p className="admin-dashboard-stat-value">{stats?.users?.total || 0}</p>
                            <span className="admin-dashboard-stat-detail">
                                {stats?.users?.byRole?.patient || 0} patients,{' '}
                                {stats?.users?.byRole?.caregiver || 0} caregivers,{' '}
                                {stats?.users?.byRole?.doctor || 0} doctors
                            </span>
                        </div>
                    </div>

                    <div className="admin-dashboard-stat-card admin-dashboard-stat-active">
                        <div className="admin-dashboard-stat-border"></div>
                        <div className="admin-dashboard-stat-content">
                            <h3 className="admin-dashboard-stat-label">Active Users (30d)</h3>
                            <p className="admin-dashboard-stat-value">{stats?.activity?.last30d || 0}</p>
                            <span className="admin-dashboard-stat-detail">
                                {stats?.activity?.last7d || 0} in last 7 days
                            </span>
                        </div>
                    </div>

                    <div className="admin-dashboard-stat-card admin-dashboard-stat-unverified">
                        <div className="admin-dashboard-stat-border"></div>
                        <div className="admin-dashboard-stat-content">
                            <h3 className="admin-dashboard-stat-label">Unverified Emails</h3>
                            <p className="admin-dashboard-stat-value">{stats?.users?.unverified || 0}</p>
                            <span className="admin-dashboard-stat-detail">
                                {stats?.users?.verified || 0} verified
                            </span>
                        </div>
                    </div>

                    <div className="admin-dashboard-stat-card admin-dashboard-stat-records">
                        <div className="admin-dashboard-stat-border"></div>
                        <div className="admin-dashboard-stat-content">
                            <h3 className="admin-dashboard-stat-label">Medical Records</h3>
                            <p className="admin-dashboard-stat-value">{totalRecords}</p>
                            <span className="admin-dashboard-stat-detail">
                                {stats?.dataVolume?.medications || 0} meds, {stats?.dataVolume?.appointments || 0} appts
                            </span>
                        </div>
                    </div>
                </div>

                {/* New Feature Stats Cards Row */}
                <div className="admin-dashboard-stats-grid">
                    <div className="admin-dashboard-stat-card admin-dashboard-stat-bills">
                        <div className="admin-dashboard-stat-border"></div>
                        <div className="admin-dashboard-stat-content">
                            <h3 className="admin-dashboard-stat-label">Medical Bills</h3>
                            <p className="admin-dashboard-stat-value">{stats?.medicalBills?.total || 0}</p>
                            <span className="admin-dashboard-stat-detail">
                                {stats?.medicalBills?.byStatus?.unpaid || 0} unpaid, {stats?.medicalBills?.byStatus?.paid || 0} paid
                            </span>
                        </div>
                    </div>

                    <div className="admin-dashboard-stat-card admin-dashboard-stat-settlements">
                        <div className="admin-dashboard-stat-border"></div>
                        <div className="admin-dashboard-stat-content">
                            <h3 className="admin-dashboard-stat-label">Settlement Offers</h3>
                            <p className="admin-dashboard-stat-value">{stats?.settlements?.total || 0}</p>
                            <span className="admin-dashboard-stat-detail">
                                {stats?.settlements?.byStatus?.paid || 0} paid, {formatDollar(stats?.settlements?.paid?.platformFees)} fees
                            </span>
                        </div>
                    </div>

                    <div className="admin-dashboard-stat-card admin-dashboard-stat-family">
                        <div className="admin-dashboard-stat-border"></div>
                        <div className="admin-dashboard-stat-content">
                            <h3 className="admin-dashboard-stat-label">Family Members</h3>
                            <p className="admin-dashboard-stat-value">{stats?.familyMembers?.total || 0}</p>
                            <span className="admin-dashboard-stat-detail">
                                {stats?.familyMembers?.byRelationship?.spouse || 0} spouses, {stats?.familyMembers?.byRelationship?.child || 0} children
                            </span>
                        </div>
                    </div>

                    <div className="admin-dashboard-stat-card admin-dashboard-stat-ai">
                        <div className="admin-dashboard-stat-border"></div>
                        <div className="admin-dashboard-stat-content">
                            <h3 className="admin-dashboard-stat-label">AI Analyses</h3>
                            <p className="admin-dashboard-stat-value">{stats?.medicalBills?.aiAnalyzed || 0}</p>
                            <span className="admin-dashboard-stat-detail">
                                {formatDollar(stats?.medicalBills?.aiEstimatedSavings)} estimated savings
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recent Registrations */}
                <div className="admin-dashboard-section">
                    <div className="admin-dashboard-section-header">
                        <h2 className="admin-dashboard-section-title">Recent Registrations</h2>
                        <button
                            className="admin-dashboard-view-all-btn"
                            onClick={() => navigate('/admin/users')}
                        >
                            View All Users
                        </button>
                    </div>

                    <div className="admin-dashboard-table-container">
                        <table className="admin-dashboard-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Verified</th>
                                    <th>Registered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.slice(0, 10).map((user) => (
                                    <tr key={user._id}>
                                        <td className="admin-dashboard-cell-name">
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td className="admin-dashboard-cell-email">{user.email}</td>
                                        <td>
                                            <span className={`admin-dashboard-role-badge ${getRoleBadgeClass(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`admin-dashboard-status-dot ${user.isEmailVerified ? 'admin-dashboard-dot-green' : 'admin-dashboard-dot-amber'}`}></span>
                                            {user.isEmailVerified ? 'Yes' : 'No'}
                                        </td>
                                        <td className="admin-dashboard-cell-date">{formatDate(user.createdAt)}</td>
                                    </tr>
                                ))}
                                {recentUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="admin-dashboard-empty">No users found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="admin-dashboard-section">
                    <h2 className="admin-dashboard-section-title">Quick Actions</h2>
                    <div className="admin-dashboard-actions">
                        <button
                            className="admin-dashboard-action-btn admin-dashboard-action-primary"
                            onClick={() => navigate('/admin/users')}
                        >
                            View All Users
                        </button>
                        <button
                            className="admin-dashboard-action-btn admin-dashboard-action-secondary"
                            onClick={() => navigate('/admin/stats')}
                        >
                            Platform Stats
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
