import React, { useState } from 'react';
import './InteractionAlert.css';

const InteractionAlert = ({ interactions, compact = false }) => {
    const [expanded, setExpanded] = useState(false);

    if (!interactions || interactions.length === 0) {
        return null;
    }

    const highSeverity = interactions.filter(i =>
        i.severity?.toLowerCase() === 'high'
    );
    const moderateSeverity = interactions.filter(i =>
        i.severity?.toLowerCase() === 'moderate'
    );

    const getSeverityIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );

    if (compact) {
        return (
            <div className={`interaction-alert-compact ${highSeverity.length > 0 ? 'high' : 'moderate'}`}>
                <span className="interaction-alert-compact-icon">
                    {getSeverityIcon()}
                </span>
                <span className="interaction-alert-compact-text">
                    {interactions.length} potential interaction{interactions.length > 1 ? 's' : ''}
                </span>
            </div>
        );
    }

    return (
        <div className={`interaction-alert ${highSeverity.length > 0 ? 'high' : 'moderate'}`}>
            <div className="interaction-alert-header" onClick={() => setExpanded(!expanded)}>
                <div className="interaction-alert-title">
                    <span className="interaction-alert-icon">
                        {getSeverityIcon()}
                    </span>
                    <span>
                        {highSeverity.length > 0 ? 'Serious ' : ''}Drug Interaction Warning
                    </span>
                </div>
                <button className="interaction-alert-toggle" type="button">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={expanded ? 'rotated' : ''}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
            </div>

            <p className="interaction-alert-summary">
                {interactions.length} potential interaction{interactions.length > 1 ? 's' : ''} detected
                {highSeverity.length > 0 && ` (${highSeverity.length} serious)`}
            </p>

            {expanded && (
                <div className="interaction-alert-details">
                    {interactions.map((interaction, index) => (
                        <div
                            key={index}
                            className={`interaction-item ${interaction.severity?.toLowerCase()}`}
                        >
                            <div className="interaction-item-header">
                                <span className={`severity-badge ${interaction.severity?.toLowerCase()}`}>
                                    {interaction.severity || 'Unknown'}
                                </span>
                                <span className="interaction-drugs">
                                    {interaction.drugs?.map(d => d.name).join(' + ')}
                                </span>
                            </div>
                            <p className="interaction-description">
                                {interaction.description}
                            </p>
                        </div>
                    ))}
                    <p className="interaction-disclaimer">
                        This information is for educational purposes only and is not a substitute
                        for professional medical advice. Always consult your doctor or pharmacist
                        before making changes to your medications.
                    </p>
                </div>
            )}
        </div>
    );
};

export default InteractionAlert;
