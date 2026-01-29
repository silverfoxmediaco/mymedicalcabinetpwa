import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await authService.login(formData.email, formData.password);

            // Store token
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <a href="/" className="login-logo">
                        <img
                            src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/logo-b2-stacked.svg"
                            alt="MyMedicalCabinet"
                            className="login-logo-img"
                        />
                    </a>
                </div>

                <h1 className="login-title">Welcome Back</h1>
                <p className="login-subtitle">Sign in to access your medical cabinet</p>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-form-group">
                        <label htmlFor="email" className="login-label">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="login-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="login-form-group">
                        <label htmlFor="password" className="login-label">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="login-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="login-signup-prompt">
                    Don't have an account? <a href="/" className="login-signup-link">Sign up</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
