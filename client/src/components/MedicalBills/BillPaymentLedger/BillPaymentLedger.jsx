import React, { useState } from 'react';
import './BillPaymentLedger.css';

const BillPaymentLedger = ({ payments = [], patientResponsibility = 0, onMakePayment, onDeletePayment, isProcessing, billStatus }) => {
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const formatCurrency = (value) => {
        if (!value && value !== 0) return '$0.00';
        return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getMethodLabel = (method) => {
        const labels = {
            cash: 'Cash',
            check: 'Check',
            credit_card: 'Credit Card',
            debit_card: 'Debit Card',
            bank_transfer: 'Bank Transfer',
            online_portal: 'Online Portal',
            money_order: 'Money Order',
            stripe: 'Stripe',
            other: 'Other'
        };
        return labels[method] || method;
    };

    const handleDeletePayment = async (paymentId) => {
        if (!onDeletePayment) return;
        setDeletingId(paymentId);
        try {
            await onDeletePayment(paymentId);
            setConfirmDeleteId(null);
        } catch (err) {
            console.error('Delete payment error:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = Math.max(patientResponsibility - totalPaid, 0);
    const isPaidOff = billStatus === 'paid' || billStatus === 'resolved' || remaining <= 0;

    return (
        <div className="bill-payment-ledger">
            <div className="bill-payment-ledger-header">
                <h4 className="bill-payment-ledger-title">Payment History</h4>
                {!isPaidOff && onMakePayment && (
                    <button
                        type="button"
                        className="bill-payment-pay-now-btn"
                        onClick={onMakePayment}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <div className="bill-payment-btn-spinner"></div>
                                Loading...
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                                Pay Now
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="bill-payment-balance-bar">
                <div className="bill-payment-balance-item">
                    <span className="bill-payment-balance-label">Total Responsibility</span>
                    <span className="bill-payment-balance-value">{formatCurrency(patientResponsibility)}</span>
                </div>
                <div className="bill-payment-balance-item">
                    <span className="bill-payment-balance-label">Paid</span>
                    <span className="bill-payment-balance-value bill-payment-value-green">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="bill-payment-balance-item">
                    <span className="bill-payment-balance-label">Remaining</span>
                    <span className={`bill-payment-balance-value ${remaining > 0 ? 'bill-payment-value-red' : 'bill-payment-value-green'}`}>
                        {formatCurrency(remaining)}
                    </span>
                </div>
            </div>

            {payments.length > 0 ? (
                <div className="bill-payment-table-wrapper">
                    <table className="bill-payment-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Reference</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={payment._id || index}>
                                    <td>{formatDate(payment.date)}</td>
                                    <td className="bill-payment-amount">{formatCurrency(payment.amount)}</td>
                                    <td>{getMethodLabel(payment.method)}</td>
                                    <td>{payment.referenceNumber || '—'}</td>
                                    <td className="bill-payment-actions-cell">
                                        {payment._id && onDeletePayment && (
                                            confirmDeleteId === payment._id ? (
                                                <div className="bill-payment-confirm-delete">
                                                    <button
                                                        type="button"
                                                        className="bill-payment-confirm-yes"
                                                        onClick={() => handleDeletePayment(payment._id)}
                                                        disabled={deletingId === payment._id}
                                                    >
                                                        {deletingId === payment._id ? '...' : 'Delete'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="bill-payment-confirm-no"
                                                        onClick={() => setConfirmDeleteId(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="bill-payment-delete-btn"
                                                    onClick={() => setConfirmDeleteId(payment._id)}
                                                    title="Remove payment"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="bill-payment-empty">No payments recorded yet.</p>
            )}
        </div>
    );
};

export default BillPaymentLedger;
