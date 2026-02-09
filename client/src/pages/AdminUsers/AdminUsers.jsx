import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminUsersService } from '../../services/adminUsersService';
import './AdminUsers.css';

const AdminUsers = ({ admin }) => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Search and filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');
    const [verifiedFilter, setVerifiedFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [page, setPage] = useState(1);

    // Expanded user detail
    const [expandedUserId, setExpandedUserId] = useState(null);
    const [userDetail, setUserDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Medical data modal
    const [medicalData, setMedicalData] = useState(null);
    const [medicalModalOpen, setMedicalModalOpen] = useState(false);
    const [medicalLoading, setMedicalLoading] = useState(false);

    // Delete confirmation modal
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const hasPermission = (perm) => {
        if (!admin) return false;
        if (admin.role === 'super_admin') return true;
        return admin.permissions && admin.permissions[perm];
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminUsersService.getAllUsers({
                page,
                limit: 25,
                search: search || undefined,
                role: roleFilter !== 'all' ? roleFilter : undefined,
                isActive: activeFilter !== 'all' ? activeFilter : undefined,
                isEmailVerified: verifiedFilter !== 'all' ? verifiedFilter : undefined,
                sortBy,
                sortOrder,
            });
            setUsers(data.users || []);
            setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter, activeFilter, verifiedFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Debounced search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const clearSuccess = () => {
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    // Expand user row
    const handleRowClick = async (userId) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
            setUserDetail(null);
            return;
        }

        setExpandedUserId(userId);
        setDetailLoading(true);
        try {
            const data = await adminUsersService.getUserById(userId);
            setUserDetail(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setDetailLoading(false);
        }
    };

    // View medical data
    const handleViewMedical = async (userId) => {
        setMedicalLoading(true);
        setMedicalModalOpen(true);
        try {
            const data = await adminUsersService.getUserMedicalSummary(userId);
            setMedicalData(data);
        } catch (err) {
            setError(err.message);
            setMedicalModalOpen(false);
        } finally {
            setMedicalLoading(false);
        }
    };

    // Force password reset
    const handlePasswordReset = async (userId, email) => {
        setActionLoading(`reset-${userId}`);
        try {
            await adminUsersService.forcePasswordReset(userId);
            setSuccessMsg(`Password reset email sent to ${email}`);
            clearSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading('');
        }
    };

    // Force email verification
    const handleVerifyEmail = async (userId, email) => {
        setActionLoading(`verify-${userId}`);
        try {
            await adminUsersService.forceEmailVerification(userId);
            setSuccessMsg(`Email verified for ${email}`);
            clearSuccess();
            fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading('');
        }
    };

    // Deactivate / Reactivate
    const handleToggleActive = async (userId, isActive) => {
        setActionLoading(`toggle-${userId}`);
        try {
            if (isActive) {
                await adminUsersService.deactivateUser(userId);
                setSuccessMsg('User deactivated');
            } else {
                await adminUsersService.reactivateUser(userId);
                setSuccessMsg('User reactivated');
            }
            clearSuccess();
            fetchUsers();
            if (expandedUserId === userId) {
                const data = await adminUsersService.getUserById(userId);
                setUserDetail(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading('');
        }
    };

    // Delete user
    const handleDeleteConfirm = async () => {
        if (deleteConfirmText !== 'DELETE' || !deleteTarget) return;

        setActionLoading(`delete-${deleteTarget._id}`);
        try {
            const result = await adminUsersService.deleteUser(deleteTarget._id);
            setSuccessMsg(result.message || 'User deleted');
            clearSuccess();
            setDeleteTarget(null);
            setDeleteConfirmText('');
            setExpandedUserId(null);
            setUserDetail(null);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading('');
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    const getSortIcon = (field) => {
        if (sortBy !== field) return ' \u2195';
        return sortOrder === 'asc' ? ' \u2191' : ' \u2193';
    };

    return (
        <AdminLayout admin={admin}>
            <div className="admin-users-page">
                <h1 className="admin-users-title">User Management</h1>

                {/* Success / Error messages */}
                {successMsg && <div className="admin-users-success">{successMsg}</div>}
                {error && <div className="admin-users-error">{error} <button className="admin-users-dismiss" onClick={() => setError('')}>x</button></div>}

                {/* Search and Filters */}
                <div className="admin-users-controls">
                    <input
                        type="text"
                        className="admin-users-search"
                        placeholder="Search by email, name, or phone..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <div className="admin-users-filters">
                        <select className="admin-users-filter-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                            <option value="all">All Roles</option>
                            <option value="patient">Patient</option>
                            <option value="caregiver">Caregiver</option>
                            <option value="doctor">Doctor</option>
                        </select>
                        <select className="admin-users-filter-select" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
                            <option value="all">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                        <select className="admin-users-filter-select" value={verifiedFilter} onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}>
                            <option value="all">All Verification</option>
                            <option value="true">Verified</option>
                            <option value="false">Unverified</option>
                        </select>
                    </div>
                </div>

                {/* Results count */}
                <div className="admin-users-results-count">
                    Showing {users.length} of {pagination.total} users
                </div>

                {/* Users Table */}
                <div className="admin-users-table-container">
                    {loading ? (
                        <div className="admin-users-loading">Loading users...</div>
                    ) : (
                        <table className="admin-users-table">
                            <thead>
                                <tr>
                                    <th className="admin-users-th-sortable" onClick={() => handleSort('firstName')}>Name{getSortIcon('firstName')}</th>
                                    <th className="admin-users-th-sortable" onClick={() => handleSort('email')}>Email{getSortIcon('email')}</th>
                                    <th>Role</th>
                                    <th>Active</th>
                                    <th>Verified</th>
                                    <th className="admin-users-th-sortable" onClick={() => handleSort('createdAt')}>Registered{getSortIcon('createdAt')}</th>
                                    <th className="admin-users-th-sortable" onClick={() => handleSort('lastLogin')}>Last Login{getSortIcon('lastLogin')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <React.Fragment key={user._id}>
                                        <tr
                                            className={`admin-users-row ${expandedUserId === user._id ? 'admin-users-row-expanded' : ''}`}
                                            onClick={() => handleRowClick(user._id)}
                                        >
                                            <td className="admin-users-cell-name">{user.firstName} {user.lastName}</td>
                                            <td className="admin-users-cell-email">{user.email}</td>
                                            <td>
                                                <span className={`admin-users-role-badge admin-users-role-${user.role}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`admin-users-status-dot ${user.isActive ? 'admin-users-dot-green' : 'admin-users-dot-gray'}`}></span>
                                                {user.isActive ? 'Yes' : 'No'}
                                            </td>
                                            <td>
                                                <span className={`admin-users-status-dot ${user.isEmailVerified ? 'admin-users-dot-green' : 'admin-users-dot-amber'}`}></span>
                                                {user.isEmailVerified ? 'Yes' : 'No'}
                                            </td>
                                            <td className="admin-users-cell-date">{formatDate(user.createdAt)}</td>
                                            <td className="admin-users-cell-date">{formatDate(user.lastLogin)}</td>
                                        </tr>

                                        {/* Expanded Detail Panel */}
                                        {expandedUserId === user._id && (
                                            <tr className="admin-users-detail-row">
                                                <td colSpan="7">
                                                    {detailLoading ? (
                                                        <div className="admin-users-detail-loading">Loading details...</div>
                                                    ) : userDetail ? (
                                                        <div className="admin-users-detail-panel">
                                                            {/* Profile Info */}
                                                            <div className="admin-users-detail-section">
                                                                <h3 className="admin-users-detail-heading">Profile</h3>
                                                                <div className="admin-users-detail-grid">
                                                                    <div><strong>Email:</strong> {userDetail.user.email}</div>
                                                                    <div><strong>Phone:</strong> {userDetail.user.phone || 'N/A'}</div>
                                                                    <div><strong>DOB:</strong> {userDetail.user.dateOfBirth ? formatDate(userDetail.user.dateOfBirth) : 'N/A'}</div>
                                                                    <div><strong>Role:</strong> {userDetail.user.role}</div>
                                                                    <div><strong>Address:</strong> {userDetail.user.address?.city ? `${userDetail.user.address.city}, ${userDetail.user.address.state}` : 'N/A'}</div>
                                                                    <div><strong>Registered:</strong> {formatDate(userDetail.user.createdAt)}</div>
                                                                </div>
                                                            </div>

                                                            {/* Data Summary */}
                                                            <div className="admin-users-detail-section">
                                                                <h3 className="admin-users-detail-heading">Data Summary</h3>
                                                                <div className="admin-users-data-counts">
                                                                    <span className="admin-users-count-chip">{userDetail.dataSummary.conditions} conditions</span>
                                                                    <span className="admin-users-count-chip">{userDetail.dataSummary.allergies} allergies</span>
                                                                    <span className="admin-users-count-chip">{userDetail.dataSummary.medications} medications</span>
                                                                    <span className="admin-users-count-chip">{userDetail.dataSummary.appointments} appointments</span>
                                                                    <span className="admin-users-count-chip">{userDetail.dataSummary.doctors} doctors</span>
                                                                    <span className="admin-users-count-chip">{userDetail.dataSummary.insurancePlans} insurance</span>
                                                                    <span className="admin-users-count-chip">{userDetail.dataSummary.events} events</span>
                                                                    <span className="admin-users-count-chip">{userDetail.dataSummary.shareAccesses} shares</span>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="admin-users-detail-actions">
                                                                {hasPermission('canViewMedicalData') && (
                                                                    <button
                                                                        className="admin-users-action-btn admin-users-btn-medical"
                                                                        onClick={(e) => { e.stopPropagation(); handleViewMedical(user._id); }}
                                                                    >
                                                                        View Medical Data
                                                                    </button>
                                                                )}
                                                                {hasPermission('canResetPasswords') && (
                                                                    <>
                                                                        <button
                                                                            className="admin-users-action-btn admin-users-btn-reset"
                                                                            disabled={actionLoading === `reset-${user._id}`}
                                                                            onClick={(e) => { e.stopPropagation(); handlePasswordReset(user._id, user.email); }}
                                                                        >
                                                                            {actionLoading === `reset-${user._id}` ? 'Sending...' : 'Force Password Reset'}
                                                                        </button>
                                                                        {!user.isEmailVerified && (
                                                                            <button
                                                                                className="admin-users-action-btn admin-users-btn-verify"
                                                                                disabled={actionLoading === `verify-${user._id}`}
                                                                                onClick={(e) => { e.stopPropagation(); handleVerifyEmail(user._id, user.email); }}
                                                                            >
                                                                                {actionLoading === `verify-${user._id}` ? 'Verifying...' : 'Force Verify Email'}
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                                <button
                                                                    className={`admin-users-action-btn ${user.isActive ? 'admin-users-btn-deactivate' : 'admin-users-btn-reactivate'}`}
                                                                    disabled={actionLoading === `toggle-${user._id}`}
                                                                    onClick={(e) => { e.stopPropagation(); handleToggleActive(user._id, user.isActive); }}
                                                                >
                                                                    {actionLoading === `toggle-${user._id}` ? '...' : user.isActive ? 'Deactivate' : 'Reactivate'}
                                                                </button>
                                                                <button
                                                                    className="admin-users-action-btn admin-users-btn-delete"
                                                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ ...user, dataSummary: userDetail.dataSummary }); }}
                                                                >
                                                                    Delete Account
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                                {users.length === 0 && !loading && (
                                    <tr><td colSpan="7" className="admin-users-empty">No users found</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="admin-users-pagination">
                        <button
                            className="admin-users-page-btn"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </button>
                        <span className="admin-users-page-info">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            className="admin-users-page-btn"
                            disabled={page >= pagination.pages}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteTarget && (
                    <div className="admin-users-modal-overlay" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}>
                        <div className="admin-users-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="admin-users-modal-title">Delete User Account</h2>
                            <p className="admin-users-modal-warning">
                                This will permanently delete <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> ({deleteTarget.email}) and all their data:
                            </p>
                            <ul className="admin-users-modal-list">
                                {deleteTarget.dataSummary?.conditions > 0 && <li>{deleteTarget.dataSummary.conditions} condition(s)</li>}
                                {deleteTarget.dataSummary?.allergies > 0 && <li>{deleteTarget.dataSummary.allergies} allergy(ies)</li>}
                                {deleteTarget.dataSummary?.medications > 0 && <li>{deleteTarget.dataSummary.medications} medication(s)</li>}
                                {deleteTarget.dataSummary?.appointments > 0 && <li>{deleteTarget.dataSummary.appointments} appointment(s)</li>}
                                {deleteTarget.dataSummary?.doctors > 0 && <li>{deleteTarget.dataSummary.doctors} doctor(s)</li>}
                                {deleteTarget.dataSummary?.insurancePlans > 0 && <li>{deleteTarget.dataSummary.insurancePlans} insurance plan(s)</li>}
                                {deleteTarget.dataSummary?.events > 0 && <li>{deleteTarget.dataSummary.events} event(s)</li>}
                                {deleteTarget.dataSummary?.shareAccesses > 0 && <li>{deleteTarget.dataSummary.shareAccesses} share access(es)</li>}
                            </ul>
                            <p className="admin-users-modal-confirm-text">This cannot be undone. Type <strong>DELETE</strong> to confirm:</p>
                            <input
                                type="text"
                                className="admin-users-modal-input"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                            />
                            <div className="admin-users-modal-actions">
                                <button
                                    className="admin-users-modal-cancel"
                                    onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="admin-users-modal-delete"
                                    disabled={deleteConfirmText !== 'DELETE' || actionLoading.startsWith('delete-')}
                                    onClick={handleDeleteConfirm}
                                >
                                    {actionLoading.startsWith('delete-') ? 'Deleting...' : 'Permanently Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Medical Data Modal */}
                {medicalModalOpen && (
                    <div className="admin-users-modal-overlay" onClick={() => { setMedicalModalOpen(false); setMedicalData(null); }}>
                        <div className="admin-users-medical-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-users-medical-header">
                                <h2 className="admin-users-modal-title">
                                    Medical Data - {medicalData?.user?.firstName} {medicalData?.user?.lastName}
                                </h2>
                                <button className="admin-users-modal-close" onClick={() => { setMedicalModalOpen(false); setMedicalData(null); }}>x</button>
                            </div>

                            {medicalLoading ? (
                                <div className="admin-users-detail-loading">Loading medical data...</div>
                            ) : medicalData ? (
                                <div className="admin-users-medical-content">
                                    {/* Conditions */}
                                    <div className="admin-users-medical-section">
                                        <h3>Conditions ({medicalData.medicalData.conditions.length})</h3>
                                        {medicalData.medicalData.conditions.length > 0 ? (
                                            <ul>{medicalData.medicalData.conditions.map((c, i) => (
                                                <li key={i}>{c.name} - <em>{c.status}</em>{c.diagnosedDate ? ` (${formatDate(c.diagnosedDate)})` : ''}</li>
                                            ))}</ul>
                                        ) : <p className="admin-users-medical-none">None</p>}
                                    </div>

                                    {/* Allergies */}
                                    <div className="admin-users-medical-section">
                                        <h3>Allergies ({medicalData.medicalData.allergies.length})</h3>
                                        {medicalData.medicalData.allergies.length > 0 ? (
                                            <ul>{medicalData.medicalData.allergies.map((a, i) => (
                                                <li key={i}>{a.allergen} - {a.severity}{a.reaction ? `: ${a.reaction}` : ''}</li>
                                            ))}</ul>
                                        ) : <p className="admin-users-medical-none">None</p>}
                                    </div>

                                    {/* Medications */}
                                    <div className="admin-users-medical-section">
                                        <h3>Medications ({medicalData.medicalData.medications.length})</h3>
                                        {medicalData.medicalData.medications.length > 0 ? (
                                            <ul>{medicalData.medicalData.medications.map((m) => (
                                                <li key={m._id}>{m.name} {m.dosage?.amount ? `${m.dosage.amount}${m.dosage.unit}` : ''} - {m.frequency} ({m.status})</li>
                                            ))}</ul>
                                        ) : <p className="admin-users-medical-none">None</p>}
                                    </div>

                                    {/* Doctors */}
                                    <div className="admin-users-medical-section">
                                        <h3>Doctors ({medicalData.medicalData.doctors.length})</h3>
                                        {medicalData.medicalData.doctors.length > 0 ? (
                                            <ul>{medicalData.medicalData.doctors.map((d) => (
                                                <li key={d._id}>{d.name}{d.specialty ? ` - ${d.specialty}` : ''}{d.isPrimaryCare ? ' (PCP)' : ''}</li>
                                            ))}</ul>
                                        ) : <p className="admin-users-medical-none">None</p>}
                                    </div>

                                    {/* Appointments */}
                                    <div className="admin-users-medical-section">
                                        <h3>Appointments ({medicalData.medicalData.appointments.length})</h3>
                                        {medicalData.medicalData.appointments.length > 0 ? (
                                            <ul>{medicalData.medicalData.appointments.slice(0, 20).map((a) => (
                                                <li key={a._id}>{a.title} - {a.doctorName} ({formatDate(a.dateTime)}) [{a.status}]</li>
                                            ))}</ul>
                                        ) : <p className="admin-users-medical-none">None</p>}
                                    </div>

                                    {/* Insurance */}
                                    <div className="admin-users-medical-section">
                                        <h3>Insurance ({medicalData.medicalData.insurance.length})</h3>
                                        {medicalData.medicalData.insurance.length > 0 ? (
                                            <ul>{medicalData.medicalData.insurance.map((ins) => (
                                                <li key={ins._id}>{ins.provider?.name} - {ins.plan?.type} (Member: {ins.memberId})</li>
                                            ))}</ul>
                                        ) : <p className="admin-users-medical-none">None</p>}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
