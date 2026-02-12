import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './ResetPassword.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Password strength validation
    const passwordRequirements = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!isPasswordValid) {
            setError('Password does not meet all requirements');
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="reset-password-page">
                <div className="reset-password-container">
                    <div className="reset-password-content">
                        <div className="reset-password-icon reset-password-icon-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <h1 className="reset-password-title">Invalid Link</h1>
                        <p className="reset-password-text">This password reset link is invalid. No token was provided.</p>
                        <button className="reset-password-btn" onClick={() => navigate('/login')}>
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="reset-password-page">
                <div className="reset-password-container">
                    <div className="reset-password-content">
                        <div className="reset-password-icon reset-password-icon-success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h1 className="reset-password-title">Password Updated!</h1>
                        <p className="reset-password-text">Your password has been reset successfully. Redirecting to login...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <div className="reset-password-header">
                    <a href="/" className="reset-password-logo">
                        <img
                            src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/medifax-logo-mobile.svg"
                            alt="MyMedicalCabinet"
                            className="reset-password-logo-img"
                        />
                    </a>
                </div>

                <h1 className="reset-password-title">Set New Password</h1>
                <p className="reset-password-subtitle">Enter your new password below.</p>

                {error && <div className="reset-password-error">{error}</div>}

                <form onSubmit={handleSubmit} className="reset-password-form">
                    <div className="reset-password-form-group">
                        <label htmlFor="resetNewPassword" className="reset-password-label">New Password</label>
                        <input
                            type="password"
                            id="resetNewPassword"
                            className="reset-password-input"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                            required
                            disabled={isLoading}
                            minLength={8}
                            autoComplete="new-password"
                        />
                        {password && (
                            <div className="reset-password-requirements">
                                <div className={`reset-password-req ${passwordRequirements.minLength ? 'reset-password-req-met' : ''}`}>
                                    <span className="reset-password-req-icon">{passwordRequirements.minLength ? '✓' : '○'}</span>
                                    At least 8 characters
                                </div>
                                <div className={`reset-password-req ${passwordRequirements.hasUppercase ? 'reset-password-req-met' : ''}`}>
                                    <span className="reset-password-req-icon">{passwordRequirements.hasUppercase ? '✓' : '○'}</span>
                                    One uppercase letter
                                </div>
                                <div className={`reset-password-req ${passwordRequirements.hasLowercase ? 'reset-password-req-met' : ''}`}>
                                    <span className="reset-password-req-icon">{passwordRequirements.hasLowercase ? '✓' : '○'}</span>
                                    One lowercase letter
                                </div>
                                <div className={`reset-password-req ${passwordRequirements.hasNumber ? 'reset-password-req-met' : ''}`}>
                                    <span className="reset-password-req-icon">{passwordRequirements.hasNumber ? '✓' : '○'}</span>
                                    One number
                                </div>
                                <div className={`reset-password-req ${passwordRequirements.hasSpecial ? 'reset-password-req-met' : ''}`}>
                                    <span className="reset-password-req-icon">{passwordRequirements.hasSpecial ? '✓' : '○'}</span>
                                    One special character (!@#$%^&* etc.)
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="reset-password-form-group">
                        <label htmlFor="resetConfirmPassword" className="reset-password-label">Confirm Password</label>
                        <input
                            type="password"
                            id="resetConfirmPassword"
                            className="reset-password-input"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
                            required
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="reset-password-submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="reset-password-back-link">
                    <button className="reset-password-link-btn" onClick={() => navigate('/login')}>
                        Back to Sign In
                    </button>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
