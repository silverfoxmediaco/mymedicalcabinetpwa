import React, { useState, useEffect, useCallback } from 'react';
import { settlementService } from '../../../services/settlementService';
import StripeProvider from '../../StripeProvider/StripeProvider';
import SettlementPaymentForm from '../SettlementPaymentForm/SettlementPaymentForm';
import './BillNegotiationTab.css';

const BillNegotiationTab = ({ bill, onRefresh, onPaymentFormChange, aiAnalysis }) => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Calculate AI-suggested offer amount using recommendedPatientOffer (accounts for insurance)
    const suggestedAmount = React.useMemo(() => {
        if (!aiAnalysis || !bill?.totals) return '';
        // Prefer the AI's recommendedPatientOffer (already accounts for insurance paid)
        if (aiAnalysis.totals?.recommendedPatientOffer > 0) {
            return aiAnalysis.totals.recommendedPatientOffer.toFixed(2);
        }
        // Fallback for older analyses without full totals
        if (aiAnalysis.estimatedSavings > 0) {
            const responsibility = bill.totals.patientResponsibility || bill.totals.amountBilled || 0;
            const fairPrice = responsibility - (aiAnalysis.estimatedSavings || 0);
            return fairPrice > 0 ? fairPrice.toFixed(2) : '';
        }
        return '';
    }, [aiAnalysis, bill?.totals]);

    // Calculate patient savings (how much less than current balance the offer is)
    const patientSavings = React.useMemo(() => {
        if (!suggestedAmount || !bill?.totals) return 0;
        const responsibility = bill.totals.patientResponsibility || bill.totals.amountBilled || 0;
        return Math.max(0, responsibility - Number(suggestedAmount));
    }, [suggestedAmount, bill?.totals]);

    // New offer form
    const [billerEmail, setBillerEmail] = useState('');
    const [billerName, setBillerName] = useState(bill?.biller?.name || '');
    const [offerAmount, setOfferAmount] = useState(suggestedAmount);
    const [patientMessage, setPatientMessage] = useState('');

    // Payment state
    const [clientSecret, setClientSecret] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const activeOffer = offers.find(o =>
        ['pending_biller', 'countered', 'accepted', 'payment_pending', 'payment_processing', 'paid'].includes(o.status)
    );

    useEffect(() => {
        if (onPaymentFormChange) onPaymentFormChange(!!clientSecret);
    }, [clientSecret, onPaymentFormChange]);

    const loadOffers = useCallback(async () => {
        if (!bill?._id) return;
        try {
            setLoading(true);
            const data = await settlementService.getOffersForBill(bill._id);
            setOffers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [bill?._id]);

    useEffect(() => {
        loadOffers();
    }, [loadOffers]);

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        if (!billerEmail || !billerName || !offerAmount) {
            setError('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await settlementService.createOffer({
                billId: bill._id,
                billerEmail,
                billerName,
                offerAmount: Number(offerAmount),
                patientMessage
            }, bill.familyMemberId || null);
            await loadOffers();
            setBillerEmail('');
            setOfferAmount('');
            setPatientMessage('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        if (!activeOffer) return;
        setSubmitting(true);
        try {
            await settlementService.withdrawOffer(activeOffer._id);
            await loadOffers();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (!activeOffer) return;
        setSubmitting(true);
        try {
            await settlementService.resendOtp(activeOffer._id);
            setError(null);
            alert('Verification code resent to biller.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAcceptCounter = async () => {
        if (!activeOffer) return;
        setSubmitting(true);
        try {
            await settlementService.acceptCounter(activeOffer._id);
            await loadOffers();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectCounter = async () => {
        if (!activeOffer) return;
        setSubmitting(true);
        try {
            await settlementService.rejectCounter(activeOffer._id);
            await loadOffers();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInitiatePayment = async () => {
        if (!activeOffer) return;
        setSubmitting(true);
        setError(null);
        try {
            const result = await settlementService.createPaymentIntent(activeOffer._id);
            setClientSecret(result.data.clientSecret);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentSuccess = () => {
        setPaymentSuccess(true);
        setClientSecret(null);
        loadOffers();
        if (onRefresh) onRefresh();
    };

    const getExpirationText = (expiresAt) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;
        if (diff <= 0) return 'Expired';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h remaining`;
        return `${hours}h remaining`;
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending_biller: { label: 'Awaiting Biller', color: '#f59e0b' },
            countered: { label: 'Counter-Offer', color: '#8b5cf6' },
            accepted: { label: 'Accepted', color: '#16a34a' },
            payment_pending: { label: 'Payment Pending', color: '#017CFF' },
            payment_processing: { label: 'Processing', color: '#017CFF' },
            paid: { label: 'Paid', color: '#16a34a' },
            payment_failed: { label: 'Payment Failed', color: '#dc2626' },
            rejected: { label: 'Rejected', color: '#dc2626' },
            expired: { label: 'Expired', color: '#94a3b8' },
            withdrawn: { label: 'Withdrawn', color: '#94a3b8' }
        };
        const s = statusMap[status] || { label: status, color: '#94a3b8' };
        return (
            <span className="bill-negotiate-tab-status-badge" style={{ background: s.color }}>
                {s.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bill-negotiate-tab-loading">
                <div className="bill-negotiate-tab-spinner"></div>
                Loading...
            </div>
        );
    }

    // PAID STATE
    if (activeOffer?.status === 'paid' || paymentSuccess) {
        return (
            <div className="bill-negotiate-tab-container">
                <div className="bill-negotiate-tab-success-card">
                    <div className="bill-negotiate-tab-success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h3 className="bill-negotiate-tab-success-title">Payment Complete</h3>
                    <p className="bill-negotiate-tab-success-amount">
                        ${Number(activeOffer?.finalAmount || 0).toFixed(2)}
                    </p>
                    <p className="bill-negotiate-tab-success-detail">
                        Paid to {activeOffer?.billerName}
                    </p>
                    {activeOffer?.stripePaymentIntentId && (
                        <p className="bill-negotiate-tab-success-txn">
                            Transaction: {activeOffer.stripePaymentIntentId}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // PAYMENT FORM (accepted, ready to pay)
    if (clientSecret && activeOffer) {
        return (
            <div className="bill-negotiate-tab-container">
                <h3 className="bill-negotiate-tab-section-title">Complete Payment</h3>
                <StripeProvider clientSecret={clientSecret}>
                    <SettlementPaymentForm
                        amount={activeOffer.finalAmount}
                        billerName={activeOffer.billerName}
                        onSuccess={handlePaymentSuccess}
                        onError={(msg) => setError(msg)}
                    />
                </StripeProvider>
            </div>
        );
    }

    // ACCEPTED STATE — show pay button
    if (activeOffer?.status === 'accepted') {
        return (
            <div className="bill-negotiate-tab-container">
                <div className="bill-negotiate-tab-accepted-card">
                    <div className="bill-negotiate-tab-accepted-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="32" height="32">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h3 className="bill-negotiate-tab-accepted-title">Offer Accepted!</h3>
                    <p className="bill-negotiate-tab-accepted-text">
                        {activeOffer.billerName} has agreed to settle for:
                    </p>
                    <p className="bill-negotiate-tab-accepted-amount">
                        ${Number(activeOffer.finalAmount).toFixed(2)}
                    </p>
                    <p className="bill-negotiate-tab-accepted-original">
                        Original: ${Number(activeOffer.originalBillAmount).toFixed(2)}
                    </p>
                    {error && <div className="bill-negotiate-tab-error">{error}</div>}
                    <button
                        className="bill-negotiate-tab-pay-btn"
                        onClick={handleInitiatePayment}
                        disabled={submitting}
                    >
                        {submitting ? 'Setting up...' : 'Pay Now with Stripe'}
                    </button>
                </div>
                {renderHistory(activeOffer)}
            </div>
        );
    }

    // COUNTER STATE
    if (activeOffer?.status === 'countered') {
        return (
            <div className="bill-negotiate-tab-container">
                <div className="bill-negotiate-tab-counter-card">
                    <h3 className="bill-negotiate-tab-counter-title">Counter-Offer Received</h3>
                    <div className="bill-negotiate-tab-counter-comparison">
                        <div className="bill-negotiate-tab-counter-col">
                            <span className="bill-negotiate-tab-counter-label">Your Offer</span>
                            <span className="bill-negotiate-tab-counter-value bill-negotiate-tab-counter-yours">
                                ${Number(activeOffer.offerAmount).toFixed(2)}
                            </span>
                        </div>
                        <div className="bill-negotiate-tab-counter-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>
                        <div className="bill-negotiate-tab-counter-col">
                            <span className="bill-negotiate-tab-counter-label">Their Counter</span>
                            <span className="bill-negotiate-tab-counter-value bill-negotiate-tab-counter-theirs">
                                ${Number(activeOffer.counterAmount).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    {activeOffer.billerMessage && (
                        <div className="bill-negotiate-tab-counter-message">
                            <strong>Biller's message:</strong> {activeOffer.billerMessage}
                        </div>
                    )}
                    {error && <div className="bill-negotiate-tab-error">{error}</div>}
                    <div className="bill-negotiate-tab-counter-actions">
                        <button
                            className="bill-negotiate-tab-accept-btn"
                            onClick={handleAcceptCounter}
                            disabled={submitting}
                        >
                            Accept Counter
                        </button>
                        <button
                            className="bill-negotiate-tab-reject-btn"
                            onClick={handleRejectCounter}
                            disabled={submitting}
                        >
                            Reject
                        </button>
                    </div>
                </div>
                {renderHistory(activeOffer)}
            </div>
        );
    }

    // PENDING STATE
    if (activeOffer?.status === 'pending_biller') {
        return (
            <div className="bill-negotiate-tab-container">
                <div className="bill-negotiate-tab-pending-card">
                    {getStatusBadge(activeOffer.status)}
                    <h3 className="bill-negotiate-tab-pending-title">Offer Sent to {activeOffer.billerName}</h3>
                    <p className="bill-negotiate-tab-pending-amount">
                        Offer: ${Number(activeOffer.offerAmount).toFixed(2)}
                    </p>
                    <p className="bill-negotiate-tab-pending-email">
                        Sent to: {activeOffer.billerEmail}
                    </p>
                    <p className="bill-negotiate-tab-pending-expiry">
                        {getExpirationText(activeOffer.expiresAt)}
                    </p>
                    {error && <div className="bill-negotiate-tab-error">{error}</div>}
                    <div className="bill-negotiate-tab-pending-actions">
                        <button
                            className="bill-negotiate-tab-resend-btn"
                            onClick={handleResendOtp}
                            disabled={submitting}
                        >
                            Resend Code
                        </button>
                        <button
                            className="bill-negotiate-tab-withdraw-btn"
                            onClick={handleWithdraw}
                            disabled={submitting}
                        >
                            Withdraw Offer
                        </button>
                    </div>
                </div>
                {renderHistory(activeOffer)}
            </div>
        );
    }

    // PAYMENT_PENDING or PAYMENT_PROCESSING state
    if (activeOffer && ['payment_pending', 'payment_processing'].includes(activeOffer.status)) {
        return (
            <div className="bill-negotiate-tab-container">
                <div className="bill-negotiate-tab-pending-card">
                    {getStatusBadge(activeOffer.status)}
                    <h3 className="bill-negotiate-tab-pending-title">Payment In Progress</h3>
                    <p className="bill-negotiate-tab-pending-amount">
                        Amount: ${Number(activeOffer.finalAmount).toFixed(2)}
                    </p>
                    <p className="bill-negotiate-tab-pending-email">
                        Your payment is being processed. This page will update once confirmed.
                    </p>
                    <button
                        className="bill-negotiate-tab-resend-btn"
                        onClick={loadOffers}
                    >
                        Refresh Status
                    </button>
                </div>
                {renderHistory(activeOffer)}
            </div>
        );
    }

    // NO ACTIVE OFFER — show create form
    return (
        <div className="bill-negotiate-tab-container">
            {/* Past offers */}
            {offers.length > 0 && (
                <div className="bill-negotiate-tab-past-offers">
                    <h4 className="bill-negotiate-tab-past-title">Previous Offers</h4>
                    {offers.map(o => (
                        <div key={o._id} className="bill-negotiate-tab-past-item">
                            {getStatusBadge(o.status)}
                            <span className="bill-negotiate-tab-past-amount">
                                ${Number(o.offerAmount).toFixed(2)}
                            </span>
                            <span className="bill-negotiate-tab-past-date">
                                {new Date(o.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {aiAnalysis?.summary && (
                <div className="bill-negotiate-tab-ai-card">
                    <div className="bill-negotiate-tab-ai-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4z" />
                            <line x1="10" y1="14" x2="14" y2="14" />
                            <line x1="10" y1="17" x2="14" y2="17" />
                            <line x1="11" y1="20" x2="13" y2="20" />
                        </svg>
                        <span className="bill-negotiate-tab-ai-title">AI Analysis Findings</span>
                    </div>
                    <p className="bill-negotiate-tab-ai-summary">{aiAnalysis.summary}</p>
                    {aiAnalysis.errorsFound?.length > 0 && (
                        <div className="bill-negotiate-tab-ai-errors">
                            <span className="bill-negotiate-tab-ai-error-badge">
                                {aiAnalysis.errorsFound.length} billing error{aiAnalysis.errorsFound.length !== 1 ? 's' : ''} detected
                            </span>
                        </div>
                    )}
                    {suggestedAmount && (
                        <p className="bill-negotiate-tab-ai-savings">
                            Recommended offer: <strong>${suggestedAmount}</strong>
                            {patientSavings > 0 && (
                                <span className="bill-negotiate-tab-ai-savings-note">
                                    (saves ${patientSavings.toFixed(2)} off your ${Number(bill?.totals?.patientResponsibility || 0).toFixed(2)} balance)
                                </span>
                            )}
                        </p>
                    )}
                </div>
            )}

            <div className="bill-negotiate-tab-form-card">
                <h3 className="bill-negotiate-tab-form-title">Send Settlement Offer</h3>
                <p className="bill-negotiate-tab-form-description">
                    Send a negotiation offer to the biller. They will receive a secure email to review and respond.
                </p>

                {error && <div className="bill-negotiate-tab-error">{error}</div>}

                <form onSubmit={handleCreateOffer} className="bill-negotiate-tab-form">
                    <div className="bill-negotiate-tab-form-group">
                        <label className="bill-negotiate-tab-label">Biller Name *</label>
                        <input
                            type="text"
                            className="bill-negotiate-tab-input"
                            value={billerName}
                            onChange={(e) => setBillerName(e.target.value)}
                            placeholder="Hospital or clinic billing dept."
                            required
                        />
                    </div>
                    <div className="bill-negotiate-tab-form-group">
                        <label className="bill-negotiate-tab-label">Biller Email *</label>
                        <input
                            type="email"
                            className="bill-negotiate-tab-input"
                            value={billerEmail}
                            onChange={(e) => setBillerEmail(e.target.value)}
                            placeholder="billing@hospital.com"
                            required
                        />
                    </div>
                    <div className="bill-negotiate-tab-form-group">
                        <label className="bill-negotiate-tab-label">
                            Offer Amount *
                            <span className="bill-negotiate-tab-label-hint">
                                (Bill: ${Number(bill?.totals?.patientResponsibility || bill?.totals?.amountBilled || 0).toFixed(2)})
                            </span>
                            {suggestedAmount && offerAmount === suggestedAmount && (
                                <span className="bill-negotiate-tab-label-ai">AI suggested</span>
                            )}
                        </label>
                        <div className="bill-negotiate-tab-input-prefix">
                            <span>$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="bill-negotiate-tab-input"
                                value={offerAmount}
                                onChange={(e) => setOfferAmount(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                    <div className="bill-negotiate-tab-form-group">
                        <label className="bill-negotiate-tab-label">Message to Biller (optional)</label>
                        <textarea
                            className="bill-negotiate-tab-textarea"
                            value={patientMessage}
                            onChange={(e) => setPatientMessage(e.target.value)}
                            placeholder="Explain why you're requesting a settlement..."
                            rows={3}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bill-negotiate-tab-submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? 'Sending...' : 'Send Offer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Render history timeline
const renderHistory = (offer) => {
    if (!offer?.history?.length) return null;

    return (
        <div className="bill-negotiate-tab-history">
            <h4 className="bill-negotiate-tab-history-title">Activity</h4>
            <div className="bill-negotiate-tab-timeline">
                {[...offer.history].reverse().map((entry, i) => (
                    <div key={i} className="bill-negotiate-tab-timeline-item">
                        <div className="bill-negotiate-tab-timeline-dot"></div>
                        <div className="bill-negotiate-tab-timeline-content">
                            <span className="bill-negotiate-tab-timeline-action">
                                {entry.action.replace(/_/g, ' ')}
                            </span>
                            {entry.amount && (
                                <span className="bill-negotiate-tab-timeline-amount">
                                    ${Number(entry.amount).toFixed(2)}
                                </span>
                            )}
                            {entry.note && (
                                <p className="bill-negotiate-tab-timeline-note">{entry.note}</p>
                            )}
                            <span className="bill-negotiate-tab-timeline-time">
                                {new Date(entry.timestamp).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BillNegotiationTab;
