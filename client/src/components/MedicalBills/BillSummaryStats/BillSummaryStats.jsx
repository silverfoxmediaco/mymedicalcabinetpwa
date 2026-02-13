import React from 'react';
import './BillSummaryStats.css';

const BillSummaryStats = ({ summary }) => {
    const formatCurrency = (value) => {
        if (!value && value !== 0) return '$0';
        return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="bill-summary-stats-bar">
            <div className="bill-summary-stat-card bill-summary-stat-owed">
                <div className="bill-summary-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <div className="bill-summary-stat-content">
                    <span className="bill-summary-stat-value">{formatCurrency(summary.totalOwed)}</span>
                    <span className="bill-summary-stat-label">Total Owed</span>
                </div>
            </div>

            <div className="bill-summary-stat-card bill-summary-stat-paid">
                <div className="bill-summary-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <div className="bill-summary-stat-content">
                    <span className="bill-summary-stat-value">{formatCurrency(summary.totalPaid)}</span>
                    <span className="bill-summary-stat-label">Total Paid</span>
                </div>
            </div>

            <div className="bill-summary-stat-card bill-summary-stat-savings">
                <div className="bill-summary-stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4z" />
                        <line x1="10" y1="14" x2="14" y2="14" />
                        <line x1="10" y1="17" x2="14" y2="17" />
                        <line x1="11" y1="20" x2="13" y2="20" />
                    </svg>
                </div>
                <div className="bill-summary-stat-content">
                    <span className="bill-summary-stat-value">{formatCurrency(summary.totalAiSavings)}</span>
                    <span className="bill-summary-stat-label">AI Savings</span>
                </div>
            </div>
        </div>
    );
};

export default BillSummaryStats;
