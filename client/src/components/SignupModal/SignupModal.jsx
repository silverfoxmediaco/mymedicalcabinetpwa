import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import './SignupModal.css';

const SignupModal = ({ isOpen, onClose, onSignupSuccess }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const result = await authService.register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password
            });

            setSuccess(true);

            // Call success callback if provided
            if (onSignupSuccess) {
                onSignupSuccess(result.user);
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form state when closing
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
        setError('');
        setSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="signup-modal-overlay"
                onClick={handleClose}
            ></div>

            <div className="signup-modal">
                <div className="signup-modal-header">
                    <h2 className="signup-modal-title">
                        {success ? 'Check Your Email' : 'Create Account'}
                    </h2>
                    <button
                        className="signup-modal-close"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <span className="signup-modal-close-icon"></span>
                    </button>
                </div>

                <div className="signup-modal-body">
                    {success ? (
                        <div className="signup-success">
                            <div className="signup-success-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                                </svg>
                            </div>
                            <h3 className="signup-success-title">Almost there!</h3>
                            <p className="signup-success-text">
                                We've sent a verification email to <strong>{formData.email}</strong>.
                                Please check your inbox and click the link to verify your account.
                            </p>
                            <p className="signup-success-note">
                                Didn't receive the email? Check your spam folder or try again in a few minutes.
                            </p>
                            <button
                                className="signup-submit-btn"
                                onClick={handleClose}
                            >
                                Got it
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="signup-modal-subtitle">
                                Start managing your health records today.
                            </p>

                            {error && (
                                <div className="signup-error">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="signup-form">
                                <div className="signup-form-row">
                                    <div className="signup-form-group">
                                        <label htmlFor="firstName" className="signup-label">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            className="signup-input"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="signup-form-group">
                                        <label htmlFor="lastName" className="signup-label">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            className="signup-input"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="signup-form-group">
                                    <label htmlFor="email" className="signup-label">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="signup-input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="signup-form-group">
                                    <label htmlFor="password" className="signup-label">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="signup-input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                </div>

                                <div className="signup-form-group">
                                    <label htmlFor="confirmPassword" className="signup-label">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="signup-input"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="signup-submit-btn"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </form>

                            <p className="signup-login-prompt">
                                Already have an account? <button className="signup-login-link" onClick={handleClose}>Log in</button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default SignupModal;
