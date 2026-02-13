import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './BillAnalysisModal.css';

const BillAnalysisModal = ({
    isOpen,
    onClose,
    analysis,
    documentName,
    isLoading,
    error
}) => {
    const modalRef = useRef(null);
    const [copiedLetter, setCopiedLetter] = useState(false);

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

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === modalRef.current) {
            onClose();
        }
    };

    const formatCurrency = (value) => {
        if (!value && value !== 0) return '$0.00';
        return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleCopyLetter = () => {
        if (analysis?.disputeLetterText) {
            navigator.clipboard.writeText(analysis.disputeLetterText);
            setCopiedLetter(true);
            setTimeout(() => setCopiedLetter(false), 2000);
        }
    };

    const getErrorTypeLabel = (type) => {
        const labels = {
            duplicate_charge: 'Duplicate Charge',
            upcoding: 'Upcoding',
            unbundling: 'Unbundling',
            incorrect_quantity: 'Incorrect Quantity',
            wrong_code: 'Wrong Code',
            balance_billing: 'Balance Billing',
            phantom_charge: 'Phantom Charge',
            other: 'Other'
        };
        return labels[type] || type;
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="bill-analysis-overlay"
            ref={modalRef}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-analysis-title"
        >
            <div className="bill-analysis-container">
                <div className="bill-analysis-header">
                    <div className="bill-analysis-title-wrapper">
                        <svg
                            className="bill-analysis-header-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4z" />
                            <line x1="10" y1="14" x2="14" y2="14" />
                            <line x1="10" y1="17" x2="14" y2="17" />
                            <line x1="11" y1="20" x2="13" y2="20" />
                        </svg>
                        <div>
                            <h2 id="bill-analysis-title" className="bill-analysis-title">
                                Bill Analysis
                            </h2>
                            {documentName && (
                                <p className="bill-analysis-subtitle">{documentName}</p>
                            )}
                        </div>
                    </div>
                    <button
                        className="bill-analysis-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="bill-analysis-content">
                    {isLoading && (
                        <div className="bill-analysis-loading">
                            <div className="bill-analysis-spinner"></div>
                            <p>Analyzing your medical bill for errors...</p>
                            <p className="bill-analysis-loading-hint">
                                Checking for duplicate charges, upcoding, and overcharges
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bill-analysis-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4m0 4h.01" />
                            </svg>
                            <p>{error}</p>
                            <button className="bill-analysis-retry" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && analysis && (
                        <>
                            <section className="bill-analysis-section bill-analysis-section-summary">
                                <h3 className="bill-analysis-section-title">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    Summary
                                </h3>
                                <p className="bill-analysis-section-text">{analysis.summary}</p>
                            </section>

                            {analysis.totals && (
                                <section className="bill-analysis-section bill-analysis-section-totals">
                                    <div className="bill-analysis-totals-grid">
                                        <div className="bill-analysis-total-card">
                                            <span className="bill-analysis-total-label">Amount Billed</span>
                                            <span className="bill-analysis-total-value">{formatCurrency(analysis.totals.amountBilled)}</span>
                                        </div>
                                        <div className="bill-analysis-total-card">
                                            <span className="bill-analysis-total-label">Fair Price Est.</span>
                                            <span className="bill-analysis-total-value bill-analysis-value-green">{formatCurrency(analysis.totals.fairPriceTotal)}</span>
                                        </div>
                                        <div className="bill-analysis-total-card bill-analysis-total-savings">
                                            <span className="bill-analysis-total-label">Potential Savings</span>
                                            <span className="bill-analysis-total-value">{formatCurrency(analysis.totals.estimatedSavings)}</span>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {analysis.errorsFound?.length > 0 && (
                                <section className="bill-analysis-section bill-analysis-section-errors">
                                    <h3 className="bill-analysis-section-title bill-analysis-title-error">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                        Errors Found ({analysis.errorsFound.length})
                                    </h3>
                                    <div className="bill-analysis-errors-list">
                                        {analysis.errorsFound.map((err, index) => (
                                            <div key={index} className="bill-analysis-error-card">
                                                <div className="bill-analysis-error-badge">
                                                    {getErrorTypeLabel(err.type)}
                                                </div>
                                                <p className="bill-analysis-error-desc">{err.description}</p>
                                                {err.estimatedOvercharge > 0 && (
                                                    <span className="bill-analysis-error-amount">
                                                        Overcharge: {formatCurrency(err.estimatedOvercharge)}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {analysis.lineItems?.length > 0 && (
                                <section className="bill-analysis-section bill-analysis-section-items">
                                    <h3 className="bill-analysis-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Line Items
                                    </h3>
                                    <div className="bill-analysis-items-table-wrapper">
                                        <table className="bill-analysis-items-table">
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th>CPT</th>
                                                    <th>Billed</th>
                                                    <th>Fair Price</th>
                                                    <th>Flag</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analysis.lineItems.map((item, index) => (
                                                    <tr key={index} className={item.flaggedAsError ? 'bill-analysis-item-flagged' : ''}>
                                                        <td>{item.description}</td>
                                                        <td>{item.cptCode || '—'}</td>
                                                        <td>{formatCurrency(item.amountBilled)}</td>
                                                        <td>{item.fairPriceEstimate ? formatCurrency(item.fairPriceEstimate) : '—'}</td>
                                                        <td>
                                                            {item.flaggedAsError && (
                                                                <span className="bill-analysis-flag" title={item.errorReason}>!</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {analysis.disputeLetterText && (
                                <section className="bill-analysis-section bill-analysis-section-letter">
                                    <h3 className="bill-analysis-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        Dispute Letter
                                    </h3>
                                    <div className="bill-analysis-letter-box">
                                        <pre className="bill-analysis-letter-text">{analysis.disputeLetterText}</pre>
                                    </div>
                                    <button
                                        className="bill-analysis-copy-btn"
                                        onClick={handleCopyLetter}
                                    >
                                        {copiedLetter ? 'Copied!' : 'Copy Letter to Clipboard'}
                                    </button>
                                </section>
                            )}

                            {analysis.recommendations?.length > 0 && (
                                <section className="bill-analysis-section bill-analysis-section-recs">
                                    <h3 className="bill-analysis-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Recommendations
                                    </h3>
                                    <ul className="bill-analysis-recs-list">
                                        {analysis.recommendations.map((rec, index) => (
                                            <li key={index} className="bill-analysis-rec-item">{rec}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <div className="bill-analysis-disclaimer">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>
                                    <strong>Disclaimer:</strong> This AI analysis is for informational purposes.
                                    Always verify billing details directly with your healthcare provider or billing department.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <div className="bill-analysis-footer">
                    <button className="bill-analysis-close-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BillAnalysisModal;
