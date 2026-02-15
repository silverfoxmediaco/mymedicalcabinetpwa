import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { adminAuthService } from '../../services/adminAuthService';
import './AdminLayout.css';

const AdminLayout = ({ admin, children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        adminAuthService.logout();
        navigate('/admin/login');
    };

    const hasPermission = (permission) => {
        if (!admin) return false;
        if (admin.role === 'super_admin') return true;
        return admin.permissions && admin.permissions[permission];
    };

    return (
        <div className="admin-layout-wrapper">
            {/* Sidebar */}
            <aside className="admin-layout-sidebar">
                <div className="admin-layout-sidebar-header">
                    <img
                        src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/mymedicalcabinetmobilev1.png"
                        alt="MyMedicalCabinet"
                        className="admin-layout-sidebar-logo"
                    />
                    <span className="admin-layout-sidebar-title">Admin</span>
                </div>

                <nav className="admin-layout-nav">
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) =>
                            `admin-layout-nav-item ${isActive ? 'admin-layout-nav-active' : ''}`
                        }
                    >
                        <svg className="admin-layout-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                        </svg>
                        Dashboard
                    </NavLink>

                    {hasPermission('canManageUsers') && (
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) =>
                                `admin-layout-nav-item ${isActive ? 'admin-layout-nav-active' : ''}`
                            }
                        >
                            <svg className="admin-layout-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                            </svg>
                            User Management
                        </NavLink>
                    )}

                    {hasPermission('canViewAnalytics') && (
                        <NavLink
                            to="/admin/stats"
                            className={({ isActive }) =>
                                `admin-layout-nav-item ${isActive ? 'admin-layout-nav-active' : ''}`
                            }
                        >
                            <svg className="admin-layout-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                            </svg>
                            Platform Stats
                        </NavLink>
                    )}

                    {hasPermission('canManageAdmins') && (
                        <NavLink
                            to="/admin/management"
                            className={({ isActive }) =>
                                `admin-layout-nav-item ${isActive ? 'admin-layout-nav-active' : ''}`
                            }
                        >
                            <svg className="admin-layout-nav-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                            </svg>
                            Admin Management
                        </NavLink>
                    )}
                </nav>
            </aside>

            {/* Main content area */}
            <div className="admin-layout-main">
                {/* Top bar */}
                <header className="admin-layout-topbar">
                    <div className="admin-layout-topbar-left">
                        <span className="admin-layout-breadcrumb">Administration</span>
                    </div>
                    <div className="admin-layout-topbar-right">
                        <div className="admin-layout-user-info">
                            <span className="admin-layout-user-name">
                                {admin ? `${admin.firstName} ${admin.lastName}` : ''}
                            </span>
                            <span className={`admin-layout-role-badge admin-layout-role-${admin?.role || 'admin'}`}>
                                {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </span>
                        </div>
                        <button className="admin-layout-logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="admin-layout-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
