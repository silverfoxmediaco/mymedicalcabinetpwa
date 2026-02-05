import React from 'react';
import './InsuranceCard.css';

const InsuranceCard = ({ insurance, onEdit }) => {
    const formatCurrency = (value) => {
        if (!value && value !== 0) return '—';
        return `$${value.toLocaleString()}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDeductibleProgress = () => {
        const deductible = insurance.coverage?.deductible;
        if (!deductible?.individual || !deductible?.met) return 0;
        return Math.min((deductible.met / deductible.individual) * 100, 100);
    };

    const getOopProgress = () => {
        const oop = insurance.coverage?.outOfPocketMax;
        if (!oop?.individual || !oop?.met) return 0;
        return Math.min((oop.met / oop.individual) * 100, 100);
    };

    const ShieldIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
        </svg>
    );

    return (
        <div className={`insurance-card ${!insurance.isActive ? 'inactive' : ''}`}>
            <div className="insurance-card-header">
                <div className="insurance-card-icon">
                    <ShieldIcon />
                </div>
                <div className="insurance-card-title-group">
                    <h3 className="insurance-card-provider">{insurance.provider?.name}</h3>
                    {insurance.plan?.name && (
                        <p className="insurance-card-plan">{insurance.plan.name}</p>
                    )}
                </div>
                <div className="insurance-card-badges">
                    {insurance.isPrimary && (
                        <span className="insurance-badge primary">Primary</span>
                    )}
                    {insurance.plan?.type && (
                        <span className="insurance-badge type">{insurance.plan.type}</span>
                    )}
                    {insurance.fhirConnection?.connected && (
                        <span className="insurance-badge fhir-synced" title={`Last synced: ${insurance.fhirConnection.lastSynced ? formatDate(insurance.fhirConnection.lastSynced) : 'Never'}`}>
                            Synced
                        </span>
                    )}
                </div>
                <button
                    className="insurance-card-edit"
                    onClick={() => onEdit(insurance)}
                    type="button"
                >
                    Edit
                </button>
            </div>

            {!insurance.isActive && (
                <div className="insurance-inactive-banner">
                    This plan is no longer active
                </div>
            )}

            <div className="insurance-card-details">
                <div className="insurance-detail-row">
                    <span className="insurance-detail-label">Member ID</span>
                    <span className="insurance-detail-value">{insurance.memberId}</span>
                </div>

                {insurance.groupNumber && (
                    <div className="insurance-detail-row">
                        <span className="insurance-detail-label">Group Number</span>
                        <span className="insurance-detail-value">{insurance.groupNumber}</span>
                    </div>
                )}

                {insurance.effectiveDate && (
                    <div className="insurance-detail-row">
                        <span className="insurance-detail-label">Effective Date</span>
                        <span className="insurance-detail-value">{formatDate(insurance.effectiveDate)}</span>
                    </div>
                )}
            </div>

            {insurance.coverage && (insurance.coverage.deductible?.individual || insurance.coverage.outOfPocketMax?.individual) && (
                <div className="insurance-card-coverage">
                    {insurance.coverage.deductible?.individual > 0 && (
                        <div className="coverage-item">
                            <div className="coverage-header">
                                <span className="coverage-label">Deductible</span>
                                <span className="coverage-values">
                                    {formatCurrency(insurance.coverage.deductible.met || 0)} / {formatCurrency(insurance.coverage.deductible.individual)}
                                </span>
                            </div>
                            <div className="coverage-progress-bar">
                                <div
                                    className="coverage-progress-fill"
                                    style={{ width: `${getDeductibleProgress()}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {insurance.coverage.outOfPocketMax?.individual > 0 && (
                        <div className="coverage-item">
                            <div className="coverage-header">
                                <span className="coverage-label">Out-of-Pocket Max</span>
                                <span className="coverage-values">
                                    {formatCurrency(insurance.coverage.outOfPocketMax.met || 0)} / {formatCurrency(insurance.coverage.outOfPocketMax.individual)}
                                </span>
                            </div>
                            <div className="coverage-progress-bar">
                                <div
                                    className="coverage-progress-fill"
                                    style={{ width: `${getOopProgress()}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {insurance.coverage?.copay && (
                <div className="insurance-card-copays">
                    <span className="copays-label">Copays:</span>
                    <div className="copays-grid">
                        {insurance.coverage.copay.primaryCare !== undefined && (
                            <span className="copay-item">
                                PCP {formatCurrency(insurance.coverage.copay.primaryCare)}
                            </span>
                        )}
                        {insurance.coverage.copay.specialist !== undefined && (
                            <span className="copay-item">
                                Specialist {formatCurrency(insurance.coverage.copay.specialist)}
                            </span>
                        )}
                        {insurance.coverage.copay.urgentCare !== undefined && (
                            <span className="copay-item">
                                Urgent {formatCurrency(insurance.coverage.copay.urgentCare)}
                            </span>
                        )}
                        {insurance.coverage.copay.emergency !== undefined && (
                            <span className="copay-item">
                                ER {formatCurrency(insurance.coverage.copay.emergency)}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {insurance.provider?.phone && (
                <div className="insurance-card-contact">
                    <a href={`tel:${insurance.provider.phone}`} className="insurance-contact-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        {insurance.provider.phone}
                    </a>
                </div>
            )}
        </div>
    );
};

export default InsuranceCard;
