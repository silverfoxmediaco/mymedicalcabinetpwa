import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminManagementService } from '../../services/adminManagementService';
import './AdminManagement.css';

const AdminManagement = ({ admin }) => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [actionLoading, setActionLoading] = useState('');

    // Create form
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createForm, setCreateForm] = useState({
        email: '', password: '', firstName: '', lastName: '',
        role: 'admin',
        permissions: {
            canManageUsers: true,
            canViewMedicalData: false,
            canManageAdmins: false,
            canViewAnalytics: true,
            canResetPasswords: false,
        },
    });

    // Edit modal
    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm] = useState(null);

    const clearSuccess = () => setTimeout(() => setSuccessMsg(''), 4000);

    const fetchAdmins = async () => {
        try {
            const data = await adminManagementService.getAllAdmins();
            setAdmins(data.admins || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleCreateChange = (e) => {
        const { name, value } = e.target;
        setCreateForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreatePermissionChange = (perm) => {
        setCreateForm((prev) => ({
            ...prev,
            permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] },
        }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setActionLoading('create');
        setError('');
        try {
            await adminManagementService.createAdmin(createForm);
            setSuccessMsg(`Admin account created for ${createForm.email}`);
            clearSuccess();
            setShowCreateForm(false);
            setCreateForm({
                email: '', password: '', firstName: '', lastName: '',
                role: 'admin',
                permissions: {
                    canManageUsers: true, canViewMedicalData: false,
                    canManageAdmins: false, canViewAnalytics: true, canResetPasswords: false,
                },
            });
            fetchAdmins();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading('');
        }
    };

    const openEdit = (adm) => {
        setEditTarget(adm);
        setEditForm({
            firstName: adm.firstName,
            lastName: adm.lastName,
            role: adm.role,
            isActive: adm.isActive,
            permissions: { ...adm.permissions },
        });
    };

    const handleEditPermissionChange = (perm) => {
        setEditForm((prev) => ({
            ...prev,
            permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] },
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(`edit-${editTarget._id}`);
        setError('');
        try {
            await adminManagementService.updateAdmin(editTarget._id, editForm);
            setSuccessMsg(`Admin ${editTarget.email} updated`);
            clearSuccess();
            setEditTarget(null);
            setEditForm(null);
            fetchAdmins();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading('');
        }
    };

    const handleDeactivate = async (adm) => {
        setActionLoading(`deactivate-${adm._id}`);
        try {
            await adminManagementService.deactivateAdmin(adm._id);
            setSuccessMsg(`Admin ${adm.email} deactivated`);
            clearSuccess();
            fetchAdmins();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading('');
        }
    };

    const handleReactivate = async (adm) => {
        setActionLoading(`reactivate-${adm._id}`);
        try {
            await adminManagementService.updateAdmin(adm._id, { isActive: true });
            setSuccessMsg(`Admin ${adm.email} reactivated`);
            clearSuccess();
            fetchAdmins();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading('');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    const permissionLabels = {
        canManageUsers: 'Manage Users',
        canViewMedicalData: 'View Medical Data',
        canManageAdmins: 'Manage Admins',
        canViewAnalytics: 'View Analytics',
        canResetPasswords: 'Reset Passwords',
    };

    if (loading) {
        return (
            <AdminLayout admin={admin}>
                <div className="admin-mgmt-loading">Loading admin accounts...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout admin={admin}>
            <div className="admin-mgmt-page">
                <div className="admin-mgmt-header">
                    <h1 className="admin-mgmt-title">Admin Management</h1>
                    <button
                        className="admin-mgmt-create-btn"
                        onClick={() => setShowCreateForm(!showCreateForm)}
                    >
                        {showCreateForm ? 'Cancel' : 'Create New Admin'}
                    </button>
                </div>

                {successMsg && <div className="admin-mgmt-success">{successMsg}</div>}
                {error && <div className="admin-mgmt-error">{error} <button className="admin-mgmt-dismiss" onClick={() => setError('')}>x</button></div>}

                {/* Create Admin Form */}
                {showCreateForm && (
                    <div className="admin-mgmt-section">
                        <h2 className="admin-mgmt-section-title">Create New Admin</h2>
                        <form className="admin-mgmt-form" onSubmit={handleCreateSubmit}>
                            <div className="admin-mgmt-form-row">
                                <div className="admin-mgmt-form-group">
                                    <label className="admin-mgmt-label">Email</label>
                                    <input type="email" name="email" className="admin-mgmt-input" value={createForm.email} onChange={handleCreateChange} required />
                                </div>
                                <div className="admin-mgmt-form-group">
                                    <label className="admin-mgmt-label">Password</label>
                                    <input type="password" name="password" className="admin-mgmt-input" value={createForm.password} onChange={handleCreateChange} required minLength={8} />
                                </div>
                            </div>
                            <div className="admin-mgmt-form-row">
                                <div className="admin-mgmt-form-group">
                                    <label className="admin-mgmt-label">First Name</label>
                                    <input type="text" name="firstName" className="admin-mgmt-input" value={createForm.firstName} onChange={handleCreateChange} required />
                                </div>
                                <div className="admin-mgmt-form-group">
                                    <label className="admin-mgmt-label">Last Name</label>
                                    <input type="text" name="lastName" className="admin-mgmt-input" value={createForm.lastName} onChange={handleCreateChange} required />
                                </div>
                            </div>
                            <div className="admin-mgmt-form-group">
                                <label className="admin-mgmt-label">Role</label>
                                <select name="role" className="admin-mgmt-select" value={createForm.role} onChange={handleCreateChange}>
                                    <option value="admin">Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            {createForm.role === 'admin' && (
                                <div className="admin-mgmt-form-group">
                                    <label className="admin-mgmt-label">Permissions</label>
                                    <div className="admin-mgmt-permissions">
                                        {Object.entries(permissionLabels).map(([key, label]) => (
                                            <label className="admin-mgmt-checkbox-label" key={key}>
                                                <input
                                                    type="checkbox"
                                                    checked={createForm.permissions[key]}
                                                    onChange={() => handleCreatePermissionChange(key)}
                                                />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button
                                type="submit"
                                className="admin-mgmt-submit-btn"
                                disabled={actionLoading === 'create'}
                            >
                                {actionLoading === 'create' ? 'Creating...' : 'Create Admin'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Admin List */}
                <div className="admin-mgmt-section">
                    <h2 className="admin-mgmt-section-title">All Admin Accounts ({admins.length})</h2>
                    <div className="admin-mgmt-table-container">
                        <table className="admin-mgmt-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Active</th>
                                    <th>Last Login</th>
                                    <th>Permissions</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((adm) => (
                                    <tr key={adm._id}>
                                        <td className="admin-mgmt-cell-name">{adm.firstName} {adm.lastName}</td>
                                        <td className="admin-mgmt-cell-email">{adm.email}</td>
                                        <td>
                                            <span className={`admin-mgmt-role-badge admin-mgmt-role-${adm.role}`}>
                                                {adm.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`admin-mgmt-status-dot ${adm.isActive ? 'admin-mgmt-dot-green' : 'admin-mgmt-dot-gray'}`}></span>
                                            {adm.isActive ? 'Yes' : 'No'}
                                        </td>
                                        <td className="admin-mgmt-cell-date">{formatDate(adm.lastLogin)}</td>
                                        <td className="admin-mgmt-cell-perms">
                                            {adm.role === 'super_admin' ? (
                                                <span className="admin-mgmt-perm-all">All</span>
                                            ) : (
                                                Object.entries(adm.permissions || {})
                                                    .filter(([, v]) => v)
                                                    .map(([k]) => (
                                                        <span className="admin-mgmt-perm-chip" key={k}>
                                                            {permissionLabels[k] || k}
                                                        </span>
                                                    ))
                                            )}
                                        </td>
                                        <td className="admin-mgmt-cell-actions">
                                            {adm._id !== admin?.id && (
                                                <>
                                                    <button
                                                        className="admin-mgmt-action-btn admin-mgmt-btn-edit"
                                                        onClick={() => openEdit(adm)}
                                                    >
                                                        Edit
                                                    </button>
                                                    {adm.isActive ? (
                                                        <button
                                                            className="admin-mgmt-action-btn admin-mgmt-btn-deactivate"
                                                            disabled={actionLoading === `deactivate-${adm._id}`}
                                                            onClick={() => handleDeactivate(adm)}
                                                        >
                                                            {actionLoading === `deactivate-${adm._id}` ? '...' : 'Deactivate'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="admin-mgmt-action-btn admin-mgmt-btn-reactivate"
                                                            disabled={actionLoading === `reactivate-${adm._id}`}
                                                            onClick={() => handleReactivate(adm)}
                                                        >
                                                            {actionLoading === `reactivate-${adm._id}` ? '...' : 'Reactivate'}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {adm._id === admin?.id && (
                                                <span className="admin-mgmt-you-badge">You</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {editTarget && editForm && (
                    <div className="admin-mgmt-modal-overlay" onClick={() => { setEditTarget(null); setEditForm(null); }}>
                        <div className="admin-mgmt-modal" onClick={(e) => e.stopPropagation()}>
                            <h2 className="admin-mgmt-modal-title">Edit Admin: {editTarget.email}</h2>
                            <form onSubmit={handleEditSubmit}>
                                <div className="admin-mgmt-form-row">
                                    <div className="admin-mgmt-form-group">
                                        <label className="admin-mgmt-label">First Name</label>
                                        <input type="text" className="admin-mgmt-input" value={editForm.firstName}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))} />
                                    </div>
                                    <div className="admin-mgmt-form-group">
                                        <label className="admin-mgmt-label">Last Name</label>
                                        <input type="text" className="admin-mgmt-input" value={editForm.lastName}
                                            onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="admin-mgmt-form-group">
                                    <label className="admin-mgmt-label">Role</label>
                                    <select className="admin-mgmt-select" value={editForm.role}
                                        onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                                {editForm.role === 'admin' && (
                                    <div className="admin-mgmt-form-group">
                                        <label className="admin-mgmt-label">Permissions</label>
                                        <div className="admin-mgmt-permissions">
                                            {Object.entries(permissionLabels).map(([key, label]) => (
                                                <label className="admin-mgmt-checkbox-label" key={key}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.permissions[key] || false}
                                                        onChange={() => handleEditPermissionChange(key)}
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="admin-mgmt-modal-actions">
                                    <button type="button" className="admin-mgmt-modal-cancel" onClick={() => { setEditTarget(null); setEditForm(null); }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="admin-mgmt-modal-save" disabled={actionLoading === `edit-${editTarget._id}`}>
                                        {actionLoading === `edit-${editTarget._id}` ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminManagement;
