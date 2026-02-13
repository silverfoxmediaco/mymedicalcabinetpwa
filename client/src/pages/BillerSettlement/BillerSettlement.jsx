import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { settlementService } from '../../services/settlementService';
import './BillerSettlement.css';

const BillerSettlement = () => {
    const { accessCode } = useParams();
    const [searchParams] = useSearchParams();
    const [stage, setStage] = useState('loading'); // loading, otp, offer, responded, error, expired
    const [offerStatus, setOfferStatus] = useState(null);
    const [sessionToken, setSessionToken] = useState(null);
    const [offer, setOffer] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // OTP input
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const inputRefs = useRef([]);

    // Counter form
    const [showCounterForm, setShowCounterForm] = useState(false);
    const [counterAmount, setCounterAmount] = useState('');
    const [counterMessage, setCounterMessage] = useState('');

    // Reject form
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectMessage, setRejectMessage] = useState('');

    // Check onboarding return
    useEffect(() => {
        if (searchParams.get('onboarding') === 'complete') {
            const stored = sessionStorage.getItem(`settlement_session_${accessCode}`);
            if (stored) {
                setSessionToken(stored);
                setStage('offer');
            }
        }
    }, [searchParams, accessCode]);

    // Initial status check
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const result = await settlementService.checkOfferStatus(accessCode);
                setOfferStatus(result.data);

                if (result.data.isExpired) {
                    setStage('expired');
                } else if (['paid', 'withdrawn', 'rejected'].includes(result.data.status)) {
                    setStage('responded');
                } else {
                    // Check for existing session
                    const stored = sessionStorage.getItem(`settlement_session_${accessCode}`);
                    if (stored) {
                        setSessionToken(stored);
                        setStage('offer');
                    } else {
                        setStage('otp');
                    }
                }
            } catch (err) {
                setError('Settlement offer not found or has been removed.');
                setStage('error');
            }
        };
        checkStatus();
    }, [accessCode]);

    // Load offer after session established
    const loadOffer = useCallback(async (token) => {
        try {
            const result = await settlementService.getBillerOffer(accessCode, token);
            setOffer(result.data);
        } catch (err) {
            if (err.message.includes('Session expired') || err.message.includes('session')) {
                setSessionToken(null);
                sessionStorage.removeItem(`settlement_session_${accessCode}`);
                setStage('otp');
                setOtpError('Session expired. Please verify again.');
            } else {
                setError(err.message);
            }
        }
    }, [accessCode]);

    useEffect(() => {
        if (sessionToken && stage === 'offer') {
            loadOffer(sessionToken);
        }
    }, [sessionToken, stage, loadOffer]);

    // OTP handlers
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (paste.length > 0) {
            e.preventDefault();
            const newOtp = [...otp];
            for (let i = 0; i < paste.length && i < 6; i++) {
                newOtp[i] = paste[i];
            }
            setOtp(newOtp);
            const focusIndex = Math.min(paste.length, 5);
            inputRefs.current[focusIndex]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setOtpError('Please enter the full 6-digit code');
            return;
        }

        setSubmitting(true);
        setOtpError('');

        try {
            const result = await settlementService.verifyBillerOtp(accessCode, otpString);
            const token = result.data.sessionToken;
            setSessionToken(token);
            sessionStorage.setItem(`settlement_session_${accessCode}`, token);
            setStage('offer');
        } catch (err) {
            setOtpError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Offer action handlers
    const handleAccept = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await settlementService.acceptOffer(accessCode, sessionToken);
            await loadOffer(sessionToken);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await settlementService.rejectOffer(accessCode, sessionToken, rejectMessage);
            setStage('responded');
            setOfferStatus(prev => ({ ...prev, status: 'rejected' }));
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCounter = async () => {
        if (!counterAmount || Number(counterAmount) <= 0) {
            setError('Please enter a valid counter amount');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await settlementService.counterOffer(accessCode, sessionToken, Number(counterAmount), counterMessage);
            setStage('responded');
            setOfferStatus(prev => ({ ...prev, status: 'countered' }));
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOnboarding = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const result = await settlementService.getBillerOnboardingLink(accessCode, sessionToken);
            if (result.data.accountReady) {
                alert('Your Stripe account is already set up. The patient can now proceed with payment.');
            } else {
                window.location.href = result.data.onboardingUrl;
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ===== RENDER =====

    // LOADING
    if (stage === 'loading') {
        return (
            <div className="biller-settlement-page">
                <div className="biller-settlement-card">
                    <div className="biller-settlement-loading">
                        <div className="biller-settlement-spinner"></div>
                        <p>Loading settlement offer...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ERROR
    if (stage === 'error') {
        return (
            <div className="biller-settlement-page">
                <div className="biller-settlement-card">
                    <div className="biller-settlement-error-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" width="48" height="48">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                        <h2>Offer Not Found</h2>
                        <p>{error || 'This settlement offer could not be found.'}</p>
                    </div>
                </div>
            </div>
        );
    }

    // EXPIRED
    if (stage === 'expired') {
        return (
            <div className="biller-settlement-page">
                <div className="biller-settlement-card">
                    <div className="biller-settlement-error-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" width="48" height="48">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <h2>Offer Expired</h2>
                        <p>This settlement offer has expired. The patient may send a new offer.</p>
                    </div>
                </div>
            </div>
        );
    }

    // RESPONDED (after accept/reject/counter)
    if (stage === 'responded') {
        const statusText = {
            rejected: 'You have rejected this offer.',
            countered: 'Your counter-offer has been sent to the patient.',
            paid: 'This settlement has been paid.',
            withdrawn: 'This offer was withdrawn by the patient.'
        };
        return (
            <div className="biller-settlement-page">
                <div className="biller-settlement-card">
                    <div className="biller-settlement-responded">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="48" height="48">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <h2>Response Recorded</h2>
                        <p>{statusText[offerStatus?.status] || 'Your response has been recorded.'}</p>
                    </div>
                </div>
            </div>
        );
    }

    // OTP VERIFICATION
    if (stage === 'otp') {
        return (
            <div className="biller-settlement-page">
                <div className="biller-settlement-card">
                    <div className="biller-settlement-header">
                        <img
                            src="/mymedicalcabinet600.png"
                            alt="MyMedicalCabinet"
                            className="biller-settlement-logo"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <h2 className="biller-settlement-title">Settlement Offer</h2>
                        <p className="biller-settlement-subtitle">
                            Enter the 6-digit verification code sent to your email
                        </p>
                    </div>

                    <div className="biller-settlement-otp-section">
                        <div className="biller-settlement-otp-inputs">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    onPaste={index === 0 ? handleOtpPaste : undefined}
                                    className="biller-settlement-otp-input"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        {otpError && (
                            <p className="biller-settlement-otp-error">{otpError}</p>
                        )}

                        <button
                            className="biller-settlement-verify-btn"
                            onClick={handleVerifyOtp}
                            disabled={submitting || otp.join('').length !== 6}
                        >
                            {submitting ? 'Verifying...' : 'Verify & View Offer'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // OFFER VIEW
    if (stage === 'offer' && offer) {
        const isAccepted = offer.status === 'accepted';

        return (
            <div className="biller-settlement-page">
                <div className="biller-settlement-card biller-settlement-card-wide">
                    <div className="biller-settlement-header">
                        <img
                            src="/mymedicalcabinet600.png"
                            alt="MyMedicalCabinet"
                            className="biller-settlement-logo"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <h2 className="biller-settlement-title">Settlement Offer</h2>
                    </div>

                    {/* Offer details */}
                    <div className="biller-settlement-offer-details">
                        <div className="biller-settlement-offer-amounts">
                            <div className="biller-settlement-offer-row">
                                <span className="biller-settlement-offer-label">Original Bill Amount</span>
                                <span className="biller-settlement-offer-value">
                                    ${Number(offer.originalBillAmount).toFixed(2)}
                                </span>
                            </div>
                            <div className="biller-settlement-offer-row biller-settlement-offer-row-highlight">
                                <span className="biller-settlement-offer-label">Settlement Offer</span>
                                <span className="biller-settlement-offer-value biller-settlement-offer-amount">
                                    ${Number(offer.offerAmount).toFixed(2)}
                                </span>
                            </div>
                            {offer.counterAmount && (
                                <div className="biller-settlement-offer-row">
                                    <span className="biller-settlement-offer-label">Your Counter</span>
                                    <span className="biller-settlement-offer-value">
                                        ${Number(offer.counterAmount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            {offer.finalAmount && (
                                <div className="biller-settlement-offer-row biller-settlement-offer-row-final">
                                    <span className="biller-settlement-offer-label">Agreed Amount</span>
                                    <span className="biller-settlement-offer-value">
                                        ${Number(offer.finalAmount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {offer.patientMessage && (
                            <div className="biller-settlement-message-box">
                                <strong>Patient's message:</strong>
                                <p>{offer.patientMessage}</p>
                            </div>
                        )}
                    </div>

                    {error && <div className="biller-settlement-error">{error}</div>}

                    {/* ACCEPTED — show onboarding prompt */}
                    {isAccepted && (
                        <div className="biller-settlement-onboarding">
                            <h3>Set Up Payment Receiving</h3>
                            <p>To receive this payment, you need to connect a Stripe account. This is a one-time setup.</p>
                            <button
                                className="biller-settlement-onboard-btn"
                                onClick={handleOnboarding}
                                disabled={submitting}
                            >
                                {submitting ? 'Loading...' : 'Set Up Stripe Account'}
                            </button>
                        </div>
                    )}

                    {/* PENDING — show accept/reject/counter */}
                    {offer.status === 'pending_biller' && !showCounterForm && !showRejectForm && (
                        <div className="biller-settlement-actions">
                            <button
                                className="biller-settlement-accept-btn"
                                onClick={handleAccept}
                                disabled={submitting}
                            >
                                {submitting ? 'Processing...' : 'Accept Offer'}
                            </button>
                            <button
                                className="biller-settlement-counter-btn"
                                onClick={() => setShowCounterForm(true)}
                                disabled={submitting}
                            >
                                Make Counter-Offer
                            </button>
                            <button
                                className="biller-settlement-reject-btn"
                                onClick={() => setShowRejectForm(true)}
                                disabled={submitting}
                            >
                                Reject Offer
                            </button>
                        </div>
                    )}

                    {/* Counter form */}
                    {showCounterForm && (
                        <div className="biller-settlement-counter-form">
                            <h3>Make a Counter-Offer</h3>
                            <div className="biller-settlement-form-group">
                                <label>Counter Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={counterAmount}
                                    onChange={(e) => setCounterAmount(e.target.value)}
                                    className="biller-settlement-form-input"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="biller-settlement-form-group">
                                <label>Message (optional)</label>
                                <textarea
                                    value={counterMessage}
                                    onChange={(e) => setCounterMessage(e.target.value)}
                                    className="biller-settlement-form-textarea"
                                    placeholder="Explain your counter-offer..."
                                    rows={3}
                                />
                            </div>
                            <div className="biller-settlement-form-actions">
                                <button
                                    className="biller-settlement-counter-submit-btn"
                                    onClick={handleCounter}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Sending...' : 'Send Counter-Offer'}
                                </button>
                                <button
                                    className="biller-settlement-cancel-btn"
                                    onClick={() => { setShowCounterForm(false); setCounterAmount(''); setCounterMessage(''); }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Reject form */}
                    {showRejectForm && (
                        <div className="biller-settlement-reject-form">
                            <h3>Reject Offer</h3>
                            <div className="biller-settlement-form-group">
                                <label>Reason (optional)</label>
                                <textarea
                                    value={rejectMessage}
                                    onChange={(e) => setRejectMessage(e.target.value)}
                                    className="biller-settlement-form-textarea"
                                    placeholder="Provide a reason for rejection..."
                                    rows={3}
                                />
                            </div>
                            <div className="biller-settlement-form-actions">
                                <button
                                    className="biller-settlement-reject-submit-btn"
                                    onClick={handleReject}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                                <button
                                    className="biller-settlement-cancel-btn"
                                    onClick={() => { setShowRejectForm(false); setRejectMessage(''); }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Activity history */}
                    {offer.history && offer.history.length > 0 && (
                        <div className="biller-settlement-history">
                            <h4>Activity</h4>
                            {[...offer.history].reverse().map((entry, i) => (
                                <div key={i} className="biller-settlement-history-item">
                                    <div className="biller-settlement-history-dot"></div>
                                    <div className="biller-settlement-history-content">
                                        <span className="biller-settlement-history-action">
                                            {entry.action.replace(/_/g, ' ')}
                                        </span>
                                        {entry.amount && (
                                            <span className="biller-settlement-history-amount">
                                                ${Number(entry.amount).toFixed(2)}
                                            </span>
                                        )}
                                        <span className="biller-settlement-history-time">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="biller-settlement-footer">
                        <p>Powered by MyMedicalCabinet &middot; Secure payments via Stripe</p>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback loading
    return (
        <div className="biller-settlement-page">
            <div className="biller-settlement-card">
                <div className="biller-settlement-loading">
                    <div className="biller-settlement-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        </div>
    );
};

export default BillerSettlement;
