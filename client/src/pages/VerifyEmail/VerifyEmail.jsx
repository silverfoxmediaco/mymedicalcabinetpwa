import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './VerifyEmail.css';

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. No token provided.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/verify-email/${token}`);
                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setMessage(data.message || 'Your email has been verified successfully!');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Verification failed. The link may have expired.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Something went wrong. Please try again later.');
            }
        };

        verifyEmail();
    }, [searchParams]);

    const handleGoToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="verify-email-page">
            <div className="verify-email-container">
                {status === 'verifying' && (
                    <div className="verify-email-content">
                        <div className="verify-email-spinner"></div>
                        <h1 className="verify-email-title">Verifying your email...</h1>
                        <p className="verify-email-text">Please wait while we verify your email address.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="verify-email-content">
                        <div className="verify-email-icon verify-email-icon-success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h1 className="verify-email-title">Email Verified!</h1>
                        <p className="verify-email-text">{message}</p>
                        <button className="verify-email-btn" onClick={handleGoToLogin}>
                            Go to Login
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="verify-email-content">
                        <div className="verify-email-icon verify-email-icon-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        <h1 className="verify-email-title">Verification Failed</h1>
                        <p className="verify-email-text">{message}</p>
                        <button className="verify-email-btn" onClick={handleGoToLogin}>
                            Go to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
