import React, { useEffect, useRef } from 'react';
import './ExplanationModal.css';

const ExplanationModal = ({
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

    return (
        <div
            className="explanation-modal-overlay"
            ref={modalRef}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="explanation-modal-title"
        >
            <div className="explanation-modal-container">
                <div className="explanation-modal-header">
                    <div className="explanation-modal-title-wrapper">
                        <svg
                            className="explanation-modal-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                            <h2 id="explanation-modal-title" className="explanation-modal-title">
                                Document Explanation
                            </h2>
                            {documentName && (
                                <p className="explanation-modal-subtitle">{documentName}</p>
                            )}
                        </div>
                    </div>
                    <button
                        className="explanation-modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="explanation-modal-content">
                    {isLoading && (
                        <div className="explanation-modal-loading">
                            <div className="explanation-modal-spinner"></div>
                            <p>Analyzing your document...</p>
                            <p className="explanation-modal-loading-hint">
                                This may take a few moments
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="explanation-modal-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4m0 4h.01" />
                            </svg>
                            <p>{error}</p>
                            <button className="explanation-modal-retry" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && explanation && (
                        <>
                            <section className="explanation-section explanation-section-summary">
                                <h3 className="explanation-section-title">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    Summary
                                </h3>
                                <p className="explanation-section-content">{explanation.summary}</p>
                            </section>

                            {explanation.keyFindings?.length > 0 && (
                                <section className="explanation-section explanation-section-findings">
                                    <h3 className="explanation-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Key Findings
                                    </h3>
                                    <ul className="explanation-findings-list">
                                        {explanation.keyFindings.map((finding, index) => (
                                            <li key={index} className="explanation-finding-item">
                                                {finding}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {explanation.termsExplained?.length > 0 && (
                                <section className="explanation-section explanation-section-terms">
                                    <h3 className="explanation-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        Medical Terms Explained
                                    </h3>
                                    <div className="explanation-terms-grid">
                                        {explanation.termsExplained.map((item, index) => (
                                            <div key={index} className="explanation-term-card">
                                                <dt className="explanation-term">{item.term}</dt>
                                                <dd className="explanation-definition">{item.definition}</dd>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {explanation.questionsForDoctor?.length > 0 && (
                                <section className="explanation-section explanation-section-questions">
                                    <h3 className="explanation-section-title">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Questions for Your Doctor
                                    </h3>
                                    <ul className="explanation-questions-list">
                                        {explanation.questionsForDoctor.map((question, index) => (
                                            <li key={index} className="explanation-question-item">
                                                {question}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <div className="explanation-disclaimer">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>
                                    <strong>Medical Disclaimer:</strong> This explanation is generated by AI
                                    for educational purposes only. It is not medical advice and should not
                                    replace consultation with your healthcare provider. Always discuss your
                                    results with your doctor or qualified medical professional.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <div className="explanation-modal-footer">
                    <button className="explanation-modal-close-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExplanationModal;
