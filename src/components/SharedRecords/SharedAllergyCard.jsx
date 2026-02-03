import React from 'react';
import './SharedRecords.css';

const SharedAllergyCard = ({ allergy }) => {
  if (!allergy) return null;

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
      case 'life-threatening':
        return 'severity-high';
      case 'moderate':
        return 'severity-medium';
      case 'mild':
        return 'severity-low';
      default:
        return '';
    }
  };

  return (
    <div className="shared-card shared-allergy-card">
      <div className="shared-card-header">
        <div className="shared-card-icon allergy">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 className="shared-card-title">{allergy.allergen}</h3>
      </div>
      <div className="shared-card-content">
        {allergy.type && (
          <div className="shared-card-row">
            <span className="shared-card-label">Type:</span>
            <span className="shared-card-value">{allergy.type}</span>
          </div>
        )}
        {allergy.reaction && (
          <div className="shared-card-row">
            <span className="shared-card-label">Reaction:</span>
            <span className="shared-card-value">{allergy.reaction}</span>
          </div>
        )}
        {allergy.severity && (
          <div className="shared-card-row">
            <span className="shared-card-label">Severity:</span>
            <span className={`shared-card-value ${getSeverityClass(allergy.severity)}`}>
              {allergy.severity}
            </span>
          </div>
        )}
        {allergy.onsetDate && (
          <div className="shared-card-row">
            <span className="shared-card-label">Onset:</span>
            <span className="shared-card-value">{new Date(allergy.onsetDate).toLocaleDateString()}</span>
          </div>
        )}
        {allergy.verifiedBy && (
          <div className="shared-card-row">
            <span className="shared-card-label">Verified By:</span>
            <span className="shared-card-value">{allergy.verifiedBy}</span>
          </div>
        )}
        {allergy.notes && (
          <div className="shared-card-row notes">
            <span className="shared-card-label">Notes:</span>
            <span className="shared-card-value">{allergy.notes}</span>
          </div>
        )}
        {allergy.severity?.toLowerCase() === 'severe' || allergy.severity?.toLowerCase() === 'life-threatening' ? (
          <div className="shared-card-badge warning">Critical Allergy</div>
        ) : null}
      </div>
    </div>
  );
};

export default SharedAllergyCard;
