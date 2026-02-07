import React from 'react';
import InteractionAlert from '../InteractionAlert';
import './MedicationCard.css';

const MedicationCard = ({ medication, onEdit, onView, interactions = [] }) => {
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isRefillSoon = () => {
        if (!medication.nextRefillDate) return false;
        const refillDate = new Date(medication.nextRefillDate);
        const today = new Date();
        const daysUntilRefill = Math.ceil((refillDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilRefill <= 7 && daysUntilRefill >= 0;
    };

    const getDosageDisplay = () => {
        if (!medication.dosage) return '—';
        const { amount, unit } = medication.dosage;
        if (!amount) return '—';
        return `${amount} ${unit || 'mg'}`;
    };

    const PillIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 20.5L3.5 13.5C1.5 11.5 1.5 8.5 3.5 6.5C5.5 4.5 8.5 4.5 10.5 6.5L17.5 13.5C19.5 15.5 19.5 18.5 17.5 20.5C15.5 22.5 12.5 22.5 10.5 20.5Z" />
            <path d="M7 13.5L13.5 7" />
        </svg>
    );

    return (
        <div className="medication-card">
            <div className="medication-card-header">
                <div className="medication-card-icon">
                    <PillIcon />
                </div>
                <div className="medication-card-title-group">
                    <h3 className="medication-card-name">
                        {medication.name}
                        {medication.dosage?.amount && (
                            <span className="medication-card-strength">
                                {' '}{getDosageDisplay()}
                            </span>
                        )}
                    </h3>
                    {medication.genericName && (
                        <p className="medication-card-generic">
                            ({medication.genericName})
                        </p>
                    )}
                </div>
                <div className="medication-card-actions">
                    <button
                        className="medication-card-view"
                        onClick={() => onView(medication)}
                        type="button"
                    >
                        View
                    </button>
                    <button
                        className="medication-card-edit"
                        onClick={() => onEdit(medication)}
                        type="button"
                    >
                        Edit
                    </button>
                </div>
            </div>

            {interactions.length > 0 && (
                <InteractionAlert interactions={interactions} compact />
            )}

            <div className="medication-card-details">
                <div className="medication-detail-row">
                    <span className="medication-detail-label">Dosage:</span>
                    <span className="medication-detail-value">{getDosageDisplay()}</span>
                </div>

                <div className="medication-detail-row">
                    <span className="medication-detail-label">Frequency:</span>
                    <span className="medication-detail-value">
                        {medication.frequency ? medication.frequency.charAt(0).toUpperCase() + medication.frequency.slice(1) : '—'}
                    </span>
                </div>

                {medication.prescribedBy && (
                    <div className="medication-detail-row">
                        <span className="medication-detail-label">Prescriber:</span>
                        <span className="medication-detail-value">{medication.prescribedBy}</span>
                    </div>
                )}

                {medication.pharmacy?.name && (
                    <div className="medication-detail-row">
                        <span className="medication-detail-label">Pharmacy:</span>
                        <span className="medication-detail-value">{medication.pharmacy.name}</span>
                    </div>
                )}

                <div className="medication-detail-row">
                    <span className="medication-detail-label">Refill by:</span>
                    <span className="medication-detail-value">
                        {formatDate(medication.nextRefillDate)}
                        {isRefillSoon() && (
                            <span className="refill-soon-badge">Soon</span>
                        )}
                    </span>
                </div>

                <div className="medication-detail-row">
                    <span className="medication-detail-label">Refills:</span>
                    <span className="medication-detail-value">
                        {medication.refillsRemaining !== undefined
                            ? `${medication.refillsRemaining} remaining`
                            : '—'}
                    </span>
                </div>
            </div>

            {medication.reminderEnabled && (
                <div className="medication-card-reminder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span>Reminder set</span>
                </div>
            )}
        </div>
    );
};

export default MedicationCard;
