import React, { useState, useEffect } from 'react';
import { createEmailShare } from '../../services/shareService';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, onSuccess, familyMemberId, familyMemberName }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const [recipientEmail, setRecipientEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [permissions, setPermissions] = useState({
        medicalHistory: true,
        medications: true,
        allergies: true,
        doctors: false,
        insurance: false,
        appointments: false,
        intakeForm: false
    });
    const [reasonForVisit, setReasonForVisit] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [shareResult, setShareResult] = useState(null);

    const handlePermissionChange = (key) => {
        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!recipientEmail.trim()) {
            setError('Please enter a recipient email address');
            return;
        }

        if (!validateEmail(recipientEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        const hasPermission = Object.values(permissions).some(v => v);
        if (!hasPermission) {
            setError('Please select at least one type of record to share');
            return;
        }

        setIsLoading(true);

        try {
            const result = await createEmailShare(recipientEmail, recipientName, permissions, familyMemberId, reasonForVisit);
            setShareResult(result.data);
            setSuccess(true);
            if (onSuccess) {
                onSuccess(result.data);
            }
        } catch (err) {
            setError(err.message || 'Failed to send share invitation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setRecipientEmail('');
        setRecipientName('');
        setPermissions({
            medicalHistory: true,
            medications: true,
            allergies: true,
            doctors: false,
            insurance: false,
            appointments: false,
            intakeForm: false
        });
        setReasonForVisit('');
        setError('');
        setSuccess(false);
        setShareResult(null);
        onClose();
    };

    if (!isOpen) return null;

    const permissionLabels = {
        medicalHistory: 'Medical History',
        medications: 'Medications',
        allergies: 'Allergies',
        doctors: 'My Doctors',
        insurance: 'Insurance',
        appointments: 'Appointments',
        intakeForm: 'Patient Intake Form'
    };

    return (
        <>
            <div className="share-modal-overlay" onClick={handleClose}></div>

            <div className="share-modal">
                <div className="share-modal-header">
                    <h2 className="share-modal-title">
                        {success ? 'Invitation Sent!' : familyMemberName ? `Share ${familyMemberName}'s Records` : 'Share My Records'}
                    </h2>
                    <button
                        className="share-modal-close"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <span className="share-modal-close-icon"></span>
                    </button>
                </div>

                <div className="share-modal-body">
                    {success ? (
                        <div className="share-success">
                            <div className="share-success-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <p className="share-success-text">
                                A secure link and verification code have been sent to:
                            </p>
                            <p className="share-success-email">{shareResult?.recipientEmail}</p>
                            <p className="share-success-note">
                                The link will expire in 24 hours. You can revoke access at any time from your dashboard.
                            </p>
                            <button className="share-submit-btn" onClick={handleClose}>
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="share-modal-subtitle">
                                Send a secure link to your healthcare provider. They will need a verification code to access your records.
                            </p>

                            {error && (
                                <div className="share-error">{error}</div>
                            )}

                            <form onSubmit={handleSubmit} className="share-form">
                                <div className="share-form-group">
                                    <label htmlFor="recipientEmail" className="share-label">
                                        Recipient Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="recipientEmail"
                                        className="share-input"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        placeholder="doctor@hospital.com"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="share-form-group">
                                    <label htmlFor="recipientName" className="share-label">
                                        Recipient Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="recipientName"
                                        className="share-input"
                                        value={recipientName}
                                        onChange={(e) => setRecipientName(e.target.value)}
                                        placeholder="Dr. Smith"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="share-permissions">
                                    <label className="share-permissions-label">Select records to share:</label>
                                    <div className="share-permissions-grid">
                                        {Object.entries(permissionLabels).map(([key, label]) => (
                                            <label key={key} className="share-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={permissions[key]}
                                                    onChange={() => handlePermissionChange(key)}
                                                    disabled={isLoading}
                                                />
                                                <span className="share-checkbox-custom"></span>
                                                <span className="share-checkbox-label">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {permissions.intakeForm && (
                                    <div className="share-form-group">
                                        <label htmlFor="reasonForVisit" className="share-label">
                                            Reason for Visit (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            id="reasonForVisit"
                                            className="share-input"
                                            value={reasonForVisit}
                                            onChange={(e) => setReasonForVisit(e.target.value)}
                                            placeholder="e.g. Annual checkup, follow-up, new patient visit"
                                            disabled={isLoading}
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="share-submit-btn"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Sending...' : 'Send Secure Link'}
                                </button>
                            </form>

                            <p className="share-security-note">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Your records are encrypted and protected. Access expires after 24 hours.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ShareModal;
