import React, { useState, useEffect } from 'react';
import { createEmailShare } from '../../../services/shareService';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, onSuccess }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [permissions, setPermissions] = useState({
    emergencyContacts: true,
    medications: true,
    doctors: true,
    insurance: true,
    medicalHistory: true,
    allergies: true,
    vitals: false,
    procedures: false,
    events: false,
    documents: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shareResult, setShareResult] = useState(null);

  // Lock body scroll when modal is open
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecipientEmail('');
      setRecipientName('');
      setPermissions({
        emergencyContacts: true,
        medications: true,
        doctors: true,
        insurance: true,
        medicalHistory: true,
        allergies: true,
        vitals: false,
        procedures: false,
        events: false,
        documents: false
      });
      setError('');
      setSuccess(false);
      setShareResult(null);
    }
  }, [isOpen]);

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

    // Check if at least one permission is selected
    const hasPermission = Object.values(permissions).some(v => v);
    if (!hasPermission) {
      setError('Please select at least one type of record to share');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createEmailShare(recipientEmail, recipientName, permissions);
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
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const permissionLabels = {
    emergencyContacts: 'Emergency Contacts',
    medications: 'Medications',
    doctors: 'Doctors',
    insurance: 'Insurance Information',
    medicalHistory: 'Medical Conditions',
    allergies: 'Allergies',
    vitals: 'Vitals',
    procedures: 'Procedures',
    events: 'Medical Events',
    documents: 'Documents'
  };

  return (
    <div className="share-modal-overlay" onClick={handleOverlayClick}>
      <div className="share-modal-content">
        <button className="share-modal-close" onClick={handleClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="share-modal-success">
            <div className="share-modal-success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="share-modal-title">Invitation Sent!</h2>
            <p className="share-modal-success-message">
              A secure link and verification code have been sent to:
            </p>
            <p className="share-modal-success-email">{shareResult?.recipientEmail}</p>
            <p className="share-modal-success-note">
              The link will expire in 24 hours. You can revoke access at any time from your dashboard.
            </p>
            <button className="share-modal-done-btn" onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="share-modal-title">Share My Records</h2>
            <p className="share-modal-subtitle">
              Send a secure link to your healthcare provider. They will need a verification code to access your records.
            </p>

            <form onSubmit={handleSubmit} className="share-modal-form">
              <div className="share-modal-field">
                <label htmlFor="recipientEmail">Recipient Email *</label>
                <input
                  type="email"
                  id="recipientEmail"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="doctor@hospital.com"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="share-modal-field">
                <label htmlFor="recipientName">Recipient Name (Optional)</label>
                <input
                  type="text"
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Dr. Smith"
                  disabled={isLoading}
                />
              </div>

              <div className="share-modal-permissions">
                <label className="share-modal-permissions-label">Select records to share:</label>
                <div className="share-modal-permissions-grid">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <label key={key} className="share-modal-checkbox">
                      <input
                        type="checkbox"
                        checked={permissions[key]}
                        onChange={() => handlePermissionChange(key)}
                        disabled={isLoading}
                      />
                      <span className="share-modal-checkbox-custom"></span>
                      <span className="share-modal-checkbox-label">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="share-modal-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="share-modal-actions">
                <button
                  type="button"
                  className="share-modal-cancel-btn"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="share-modal-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="share-modal-spinner"></span>
                      Sending...
                    </>
                  ) : (
                    'Send Secure Link'
                  )}
                </button>
              </div>
            </form>

            <p className="share-modal-security-note">
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
  );
};

export default ShareModal;
