import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './InsuranceExplanationModal.css';

const InsuranceExplanationModal = ({
    isOpen,
    onClose,
    explanation,
    documentName,
    isLoading,
    error
}) => {
    const modalRef = useRef(null);

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

    if (!isOpen) return null;

    return createPortal(
        <div
            className="ins-explanation-overlay"
            ref={modalRef}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ins-explanation-title"
        >
            <div className="ins-explanation-container">
                <div className="ins-explanation-header">
                    <div className="ins-explanation-title-wrapper">
                        <svg
                            className="ins-explanation-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                            <h2 id="ins-explanation-title" className="ins-explanation-title">
                                Policy Explanation
                            </h2>
                            {documentName && (
                                <p className="ins-explanation-subtitle">{documentName}</p>
                            )}
                        </div>
                    </div>
                    <button
                        className="ins-explanation-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="ins-explanation-content">
                    {isLoading && (
                        <div className="ins-explanation-loading">
                            <div className="ins-explanation-spinner"></div>
                            <p>Analyzing your insurance document...</p>
                            <p className="ins-explanation-loading-hint">
                                This may take a few moments
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="ins-explanation-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4m0 4h.01" />
                            </svg>
                            <p>{error}</p>
                            <button className="ins-explanation-retry" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && explanation && (
                        <>
                            <section className="ins-explanation-section ins-explanation-section-summary">
                                <h3 className="ins-explanation-section-title">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    Summary
                                </h3>
                                <p className="ins-explanation-section-content">{explanation.summary}</p>
                            </section>

                            {explanation.coverageHighlights?.length > 0 && (
                                <section className="ins-explanation-section ins-explanation-section-coverage">
                                    <h3 className="ins-explanation-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Coverage Highlights
                                    </h3>
                                    <ul className="ins-explanation-highlights-list">
                                        {explanation.coverageHighlights.map((item, index) => (
                                            <li key={index} className="ins-explanation-highlight-item">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {explanation.costs && Object.keys(explanation.costs).length > 0 && (
                                <section className="ins-explanation-section ins-explanation-section-costs">
                                    <h3 className="ins-explanation-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="1" x2="12" y2="23" />
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                        Costs
                                    </h3>
                                    <div className="ins-explanation-costs-grid">
                                        {explanation.costs.deductible && (
                                            <div className="ins-explanation-cost-card">
                                                <dt className="ins-explanation-cost-label">Deductible</dt>
                                                <dd className="ins-explanation-cost-value">{explanation.costs.deductible}</dd>
                                            </div>
                                        )}
                                        {explanation.costs.copays && (
                                            <div className="ins-explanation-cost-card">
                                                <dt className="ins-explanation-cost-label">Copays</dt>
                                                <dd className="ins-explanation-cost-value">{explanation.costs.copays}</dd>
                                            </div>
                                        )}
                                        {explanation.costs.coinsurance && (
                                            <div className="ins-explanation-cost-card">
                                                <dt className="ins-explanation-cost-label">Coinsurance</dt>
                                                <dd className="ins-explanation-cost-value">{explanation.costs.coinsurance}</dd>
                                            </div>
                                        )}
                                        {explanation.costs.outOfPocketMax && (
                                            <div className="ins-explanation-cost-card">
                                                <dt className="ins-explanation-cost-label">Out-of-Pocket Max</dt>
                                                <dd className="ins-explanation-cost-value">{explanation.costs.outOfPocketMax}</dd>
                                            </div>
                                        )}
                                        {explanation.costs.premiums && (
                                            <div className="ins-explanation-cost-card">
                                                <dt className="ins-explanation-cost-label">Premiums</dt>
                                                <dd className="ins-explanation-cost-value">{explanation.costs.premiums}</dd>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {explanation.exclusions?.length > 0 && (
                                <section className="ins-explanation-section ins-explanation-section-exclusions">
                                    <h3 className="ins-explanation-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                        </svg>
                                        Exclusions
                                    </h3>
                                    <ul className="ins-explanation-exclusions-list">
                                        {explanation.exclusions.map((item, index) => (
                                            <li key={index} className="ins-explanation-exclusion-item">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {explanation.termsExplained?.length > 0 && (
                                <section className="ins-explanation-section ins-explanation-section-terms">
                                    <h3 className="ins-explanation-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        Insurance Terms Explained
                                    </h3>
                                    <div className="ins-explanation-terms-grid">
                                        {explanation.termsExplained.map((item, index) => (
                                            <div key={index} className="ins-explanation-term-card">
                                                <dt className="ins-explanation-term">{item.term}</dt>
                                                <dd className="ins-explanation-definition">{item.definition}</dd>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {explanation.questionsForInsurer?.length > 0 && (
                                <section className="ins-explanation-section ins-explanation-section-questions">
                                    <h3 className="ins-explanation-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Questions for Your Insurance Company
                                    </h3>
                                    <ul className="ins-explanation-questions-list">
                                        {explanation.questionsForInsurer.map((question, index) => (
                                            <li key={index} className="ins-explanation-question-item">
                                                {question}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <div className="ins-explanation-disclaimer">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>
                                    <strong>Disclaimer:</strong> This is AI-generated for informational
                                    purposes. Always verify coverage details directly with your insurance
                                    provider.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <div className="ins-explanation-footer">
                    <button className="ins-explanation-close-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default InsuranceExplanationModal;
