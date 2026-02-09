import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { adminAuthService } from '../services/adminAuthService';

const ProtectedAdminRoute = ({ children, requiredPermission }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [admin, setAdmin] = useState(null);

    useEffect(() => {
        const verifyAdmin = async () => {
            // Quick local check first
            if (!adminAuthService.isAuthenticated()) {
                setIsChecking(false);
                setIsValid(false);
                return;
            }

            try {
                // Verify token is still valid with the server
                const data = await adminAuthService.getProfile();
                setAdmin(data.admin);
                setIsValid(true);
            } catch {
                // Token is invalid or expired
                adminAuthService.logout();
                setIsValid(false);
            } finally {
                setIsChecking(false);
            }
        };

        verifyAdmin();
    }, []);

    if (isChecking) {
        return (
            <div className="admin-login-loading">
                <p>Verifying admin access...</p>
            </div>
        );
    }

    if (!isValid) {
        return <Navigate to="/admin/login" replace />;
    }

    // Check specific permission if required
    if (requiredPermission && admin) {
        if (admin.role !== 'super_admin' && !admin.permissions[requiredPermission]) {
            return (
                <div className="admin-login-loading">
                    <p>You do not have permission to access this page.</p>
                </div>
            );
        }
    }

    // Pass admin data to children
    return React.cloneElement(children, { admin });
};

export default ProtectedAdminRoute;
