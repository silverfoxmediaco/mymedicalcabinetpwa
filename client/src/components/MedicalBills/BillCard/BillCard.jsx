import React from 'react';
import './BillCard.css';

const BillCard = ({ bill, onEdit, onView, onPay }) => {
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

    const getStatusBadgeClass = (status) => {
        const classes = {
            unpaid: 'bill-card-badge-unpaid',
            partially_paid: 'bill-card-badge-partial',
            paid: 'bill-card-badge-paid',
            disputed: 'bill-card-badge-disputed',
            in_review: 'bill-card-badge-review',
            resolved: 'bill-card-badge-resolved'
        };
        return classes[status] || 'bill-card-badge-unpaid';
    };

    const getStatusLabel = (status) => {
        const labels = {
            unpaid: 'Unpaid',
            partially_paid: 'Partially Paid',
            paid: 'Paid',
            disputed: 'Disputed',
            in_review: 'In Review',
            resolved: 'Resolved'
        };
        return labels[status] || 'Unknown';
    };

    const hasAiErrors = bill.aiAnalysis?.errorsFound?.length > 0;
    const patientOwes = (bill.totals?.patientResponsibility || 0) - (bill.totals?.amountPaid || 0);
    const isDue = bill.dueDate && new Date(bill.dueDate) < new Date() && bill.status === 'unpaid';

    return (
        <div className={`bill-card-container ${isDue ? 'bill-card-overdue' : ''}`}>
            <div className="bill-card-header">
                <div className="bill-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <div className="bill-card-title-group">
                    <h3 className="bill-card-biller">{bill.biller?.name}</h3>
                    {bill.dateOfService && (
                        <p className="bill-card-date">Service: {formatDate(bill.dateOfService)}</p>
                    )}
                </div>
                <div className="bill-card-badges">
                    <span className={`bill-card-badge ${getStatusBadgeClass(bill.status)}`}>
                        {getStatusLabel(bill.status)}
                    </span>
                    {hasAiErrors && (
                        <span className="bill-card-badge bill-card-badge-error" title="AI found potential billing errors">
                            Errors Found
                        </span>
                    )}
                </div>
                <div className="bill-card-actions">
                    <button
                        className="bill-card-view-btn"
                        onClick={() => onView(bill)}
                        type="button"
                    >
                        View
                    </button>
                    <button
                        className="bill-card-edit-btn"
                        onClick={() => onEdit(bill)}
                        type="button"
                    >
                        Edit
                    </button>
                    {patientOwes > 0 && onPay && (
                        <button
                            className="bill-card-pay-btn"
                            onClick={() => onPay(bill)}
                            type="button"
                        >
                            Pay
                        </button>
                    )}
                </div>
            </div>

            <div className="bill-card-details">
                <div className="bill-card-detail-row">
                    <span className="bill-card-detail-label">Amount Billed</span>
                    <span className="bill-card-detail-value">{formatCurrency(bill.totals?.amountBilled)}</span>
                </div>
                {bill.totals?.insurancePaid > 0 && (
                    <div className="bill-card-detail-row">
                        <span className="bill-card-detail-label">Insurance Paid</span>
                        <span className="bill-card-detail-value bill-card-value-green">-{formatCurrency(bill.totals.insurancePaid)}</span>
                    </div>
                )}
                <div className="bill-card-detail-row bill-card-detail-highlight">
                    <span className="bill-card-detail-label">You Owe</span>
                    <span className={`bill-card-detail-value ${patientOwes > 0 ? 'bill-card-value-red' : 'bill-card-value-green'}`}>
                        {formatCurrency(Math.max(patientOwes, 0))}
                    </span>
                </div>
            </div>

            {bill.dueDate && (
                <div className={`bill-card-due ${isDue ? 'bill-card-due-overdue' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <path d="M16 2V6" />
                        <path d="M8 2V6" />
                        <path d="M3 10H21" />
                    </svg>
                    <span>{isDue ? 'Overdue' : 'Due'}: {formatDate(bill.dueDate)}</span>
                </div>
            )}

            {hasAiErrors && (
                <div className="bill-card-ai-flag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>
                        AI found {bill.aiAnalysis.errorsFound.length} potential error{bill.aiAnalysis.errorsFound.length !== 1 ? 's' : ''}
                        {bill.aiAnalysis.estimatedSavings > 0 && ` — Save up to ${formatCurrency(bill.aiAnalysis.estimatedSavings)}`}
                    </span>
                </div>
            )}
        </div>
    );
};

export default BillCard;
