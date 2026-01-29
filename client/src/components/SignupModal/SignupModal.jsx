import React, { useState } from 'react';
import './SignupModal.css';

const SignupModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle signup logic here
        console.log('Signup submitted:', formData);
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="signup-modal-overlay"
                onClick={onClose}
            ></div>

            <div className="signup-modal">
                <div className="signup-modal-header">
                    <h2 className="signup-modal-title">Create Account</h2>
                    <button
                        className="signup-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <span className="signup-modal-close-icon"></span>
                    </button>
                </div>

                <div className="signup-modal-body">
                    <p className="signup-modal-subtitle">
                        Start managing your health records today.
                    </p>

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
                            />
                        </div>

                        <button type="submit" className="signup-submit-btn">
                            Create Account
                        </button>
                    </form>

                    <p className="signup-login-prompt">
                        Already have an account? <button className="signup-login-link" onClick={onClose}>Log in</button>
                    </p>
                </div>
            </div>
        </>
    );
};

export default SignupModal;
