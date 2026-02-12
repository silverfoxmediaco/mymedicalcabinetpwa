import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthService } from '../../services/adminAuthService';
import './AdminLogin.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already authenticated
    useEffect(() => {
        if (adminAuthService.isAuthenticated()) {
            navigate('/admin/dashboard');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await adminAuthService.login(formData.email, formData.password);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-login-header">
                    <img
                        src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/logo-b2-stacked.svg"
                        alt="MyMedicalCabinet"
                        className="admin-login-logo-img"
                    />
                </div>

                <h1 className="admin-login-title">Administration Portal</h1>
                <p className="admin-login-subtitle">Sign in to access the admin dashboard</p>

                {error && (
                    <div className="admin-login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="admin-login-form-group">
                        <label htmlFor="admin-email" className="admin-login-label">
                            Email
                        </label>
                        <input
                            type="email"
                            id="admin-email"
                            name="email"
                            className="admin-login-input"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@mymedicalcabinet.com"
                            required
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="admin-login-form-group">
                        <label htmlFor="admin-password" className="admin-login-label">
                            Password
                        </label>
                        <input
                            type="password"
                            id="admin-password"
                            name="password"
                            className="admin-login-input"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="admin-login-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <span className="admin-login-footer-text">MyMedicalCabinet Admin</span>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
