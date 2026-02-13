import React, { useState } from 'react';
import './BillPaymentLedger.css';

const BillPaymentLedger = ({ payments = [], patientResponsibility = 0, onAddPayment }) => {
    const [showForm, setShowForm] = useState(false);
    const [paymentData, setPaymentData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        method: 'other',
        referenceNumber: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            other: 'Other'
        };
        return labels[method] || method;
    };

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = Math.max(patientResponsibility - totalPaid, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!paymentData.amount || Number(paymentData.amount) <= 0) return;

        setIsSubmitting(true);
        try {
            await onAddPayment({
                ...paymentData,
                amount: Number(paymentData.amount)
            });
            setPaymentData({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                method: 'other',
                referenceNumber: '',
                notes: ''
            });
            setShowForm(false);
        } catch (err) {
            console.error('Payment error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bill-payment-ledger">
            <div className="bill-payment-ledger-header">
                <h4 className="bill-payment-ledger-title">Payment History</h4>
                <button
                    type="button"
                    className="bill-payment-add-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancel' : '+ Add Payment'}
                </button>
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

            {showForm && (
                <form className="bill-payment-form" onSubmit={handleSubmit}>
                    <div className="bill-payment-form-row">
                        <div className="bill-payment-form-group">
                            <label className="bill-payment-form-label">Date</label>
                            <input
                                type="date"
                                className="bill-payment-form-input"
                                value={paymentData.date}
                                onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="bill-payment-form-group">
                            <label className="bill-payment-form-label">Amount ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="bill-payment-form-input"
                                value={paymentData.amount}
                                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                    <div className="bill-payment-form-row">
                        <div className="bill-payment-form-group">
                            <label className="bill-payment-form-label">Method</label>
                            <select
                                className="bill-payment-form-input"
                                value={paymentData.method}
                                onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                            >
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="online_portal">Online Portal</option>
                                <option value="check">Check</option>
                                <option value="cash">Cash</option>
                                <option value="money_order">Money Order</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="bill-payment-form-group">
                            <label className="bill-payment-form-label">Reference #</label>
                            <input
                                type="text"
                                className="bill-payment-form-input"
                                value={paymentData.referenceNumber}
                                onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                    <div className="bill-payment-form-group">
                        <label className="bill-payment-form-label">Notes</label>
                        <input
                            type="text"
                            className="bill-payment-form-input"
                            value={paymentData.notes}
                            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                            placeholder="Optional notes"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bill-payment-submit-btn"
                        disabled={isSubmitting || !paymentData.amount}
                    >
                        {isSubmitting ? 'Saving...' : 'Record Payment'}
                    </button>
                </form>
            )}

            {payments.length > 0 ? (
                <div className="bill-payment-table-wrapper">
                    <table className="bill-payment-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={payment._id || index}>
                                    <td>{formatDate(payment.date)}</td>
                                    <td className="bill-payment-amount">{formatCurrency(payment.amount)}</td>
                                    <td>{getMethodLabel(payment.method)}</td>
                                    <td>{payment.referenceNumber || '—'}</td>
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
