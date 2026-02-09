import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminStatsService } from '../../services/adminStatsService';
import './AdminStats.css';

const AdminStats = ({ admin }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminStatsService.getSystemStats();
                setStats(data.stats);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <AdminLayout admin={admin}>
                <div className="admin-stats-loading">Loading platform stats...</div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout admin={admin}>
                <div className="admin-stats-error">{error}</div>
            </AdminLayout>
        );
    }

    const totalUsers = stats?.users?.total || 0;
    const roles = stats?.users?.byRole || {};

    const calcPct = (val) => {
        if (!totalUsers) return '0';
        return ((val / totalUsers) * 100).toFixed(1);
    };

    return (
        <AdminLayout admin={admin}>
            <div className="admin-stats-page">
                <h1 className="admin-stats-title">Platform Statistics</h1>

                {/* Users by Role */}
                <div className="admin-stats-section">
                    <h2 className="admin-stats-section-title">Users by Role</h2>
                    <div className="admin-stats-role-grid">
                        {['patient', 'caregiver', 'doctor'].map((role) => (
                            <div className="admin-stats-role-card" key={role}>
                                <div className={`admin-stats-role-icon admin-stats-role-${role}`}>
                                    {role.charAt(0).toUpperCase()}
                                </div>
                                <div className="admin-stats-role-info">
                                    <span className="admin-stats-role-label">{role.charAt(0).toUpperCase() + role.slice(1)}s</span>
                                    <span className="admin-stats-role-count">{roles[role] || 0}</span>
                                    <span className="admin-stats-role-pct">{calcPct(roles[role] || 0)}%</span>
                                </div>
                            </div>
                        ))}
                        <div className="admin-stats-role-card">
                            <div className="admin-stats-role-icon admin-stats-role-total">T</div>
                            <div className="admin-stats-role-info">
                                <span className="admin-stats-role-label">Total</span>
                                <span className="admin-stats-role-count">{totalUsers}</span>
                                <span className="admin-stats-role-pct">100%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active vs Inactive & Verification */}
                <div className="admin-stats-two-col">
                    <div className="admin-stats-section">
                        <h2 className="admin-stats-section-title">Active vs Inactive</h2>
                        <div className="admin-stats-bar-group">
                            <div className="admin-stats-bar-item">
                                <div className="admin-stats-bar-header">
                                    <span>Active</span>
                                    <span>{stats?.users?.active || 0} ({calcPct(stats?.users?.active || 0)}%)</span>
                                </div>
                                <div className="admin-stats-bar-track">
                                    <div className="admin-stats-bar-fill admin-stats-bar-green" style={{ width: `${calcPct(stats?.users?.active || 0)}%` }}></div>
                                </div>
                            </div>
                            <div className="admin-stats-bar-item">
                                <div className="admin-stats-bar-header">
                                    <span>Inactive</span>
                                    <span>{stats?.users?.inactive || 0} ({calcPct(stats?.users?.inactive || 0)}%)</span>
                                </div>
                                <div className="admin-stats-bar-track">
                                    <div className="admin-stats-bar-fill admin-stats-bar-gray" style={{ width: `${calcPct(stats?.users?.inactive || 0)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="admin-stats-section">
                        <h2 className="admin-stats-section-title">Email Verification</h2>
                        <div className="admin-stats-bar-group">
                            <div className="admin-stats-bar-item">
                                <div className="admin-stats-bar-header">
                                    <span>Verified</span>
                                    <span>{stats?.users?.verified || 0} ({calcPct(stats?.users?.verified || 0)}%)</span>
                                </div>
                                <div className="admin-stats-bar-track">
                                    <div className="admin-stats-bar-fill admin-stats-bar-teal" style={{ width: `${calcPct(stats?.users?.verified || 0)}%` }}></div>
                                </div>
                            </div>
                            <div className="admin-stats-bar-item">
                                <div className="admin-stats-bar-header">
                                    <span>Unverified</span>
                                    <span>{stats?.users?.unverified || 0} ({calcPct(stats?.users?.unverified || 0)}%)</span>
                                </div>
                                <div className="admin-stats-bar-track">
                                    <div className="admin-stats-bar-fill admin-stats-bar-amber" style={{ width: `${calcPct(stats?.users?.unverified || 0)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Breakdown */}
                <div className="admin-stats-section">
                    <h2 className="admin-stats-section-title">Users by Activity</h2>
                    <div className="admin-stats-activity-grid">
                        <div className="admin-stats-activity-card">
                            <span className="admin-stats-activity-value">{stats?.activity?.last24h || 0}</span>
                            <span className="admin-stats-activity-label">Last 24 hours</span>
                        </div>
                        <div className="admin-stats-activity-card">
                            <span className="admin-stats-activity-value">{stats?.activity?.last7d || 0}</span>
                            <span className="admin-stats-activity-label">Last 7 days</span>
                        </div>
                        <div className="admin-stats-activity-card">
                            <span className="admin-stats-activity-value">{stats?.activity?.last30d || 0}</span>
                            <span className="admin-stats-activity-label">Last 30 days</span>
                        </div>
                        <div className="admin-stats-activity-card">
                            <span className="admin-stats-activity-value">{stats?.activity?.last90d || 0}</span>
                            <span className="admin-stats-activity-label">Last 90 days</span>
                        </div>
                        <div className="admin-stats-activity-card admin-stats-activity-inactive">
                            <span className="admin-stats-activity-value">{stats?.activity?.inactive90dPlus || 0}</span>
                            <span className="admin-stats-activity-label">Inactive 90d+</span>
                        </div>
                    </div>
                </div>

                {/* Data Volume */}
                <div className="admin-stats-section">
                    <h2 className="admin-stats-section-title">Data Volume</h2>
                    <div className="admin-stats-data-grid">
                        <div className="admin-stats-data-card">
                            <span className="admin-stats-data-value">{stats?.dataVolume?.conditions || 0}</span>
                            <span className="admin-stats-data-label">Conditions</span>
                        </div>
                        <div className="admin-stats-data-card">
                            <span className="admin-stats-data-value">{stats?.dataVolume?.medications || 0}</span>
                            <span className="admin-stats-data-label">Medications</span>
                        </div>
                        <div className="admin-stats-data-card">
                            <span className="admin-stats-data-value">{stats?.dataVolume?.appointments || 0}</span>
                            <span className="admin-stats-data-label">Appointments</span>
                        </div>
                        <div className="admin-stats-data-card">
                            <span className="admin-stats-data-value">{stats?.dataVolume?.doctors || 0}</span>
                            <span className="admin-stats-data-label">Doctors</span>
                        </div>
                        <div className="admin-stats-data-card">
                            <span className="admin-stats-data-value">{stats?.dataVolume?.insurancePlans || 0}</span>
                            <span className="admin-stats-data-label">Insurance Plans</span>
                        </div>
                        <div className="admin-stats-data-card">
                            <span className="admin-stats-data-value">{stats?.dataVolume?.shareAccesses || 0}</span>
                            <span className="admin-stats-data-label">Share Accesses</span>
                        </div>
                    </div>
                </div>

                {/* Registration Trends */}
                <div className="admin-stats-section">
                    <h2 className="admin-stats-section-title">Registration Trends (Last 30 Days)</h2>
                    {stats?.registrationTrends && stats.registrationTrends.length > 0 ? (
                        <div className="admin-stats-trends-table-container">
                            <table className="admin-stats-trends-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Signups</th>
                                        <th>Visual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.registrationTrends.map((day) => {
                                        const maxCount = Math.max(...stats.registrationTrends.map(d => d.count));
                                        const barWidth = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                                        return (
                                            <tr key={day._id}>
                                                <td className="admin-stats-trends-date">{day._id}</td>
                                                <td className="admin-stats-trends-count">{day.count}</td>
                                                <td className="admin-stats-trends-bar-cell">
                                                    <div className="admin-stats-trends-bar" style={{ width: `${barWidth}%` }}></div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="admin-stats-empty">No registration data for the last 30 days</p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminStats;
