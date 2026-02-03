import React from 'react';
import './SharedRecords.css';

const SharedMedicationCard = ({ medication }) => {
  if (!medication) return null;

  return (
    <div className="shared-card shared-medication-card">
      <div className="shared-card-header">
        <div className="shared-card-icon medication">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.5 20.5L3.5 13.5c-1.953-1.953-1.953-5.119 0-7.071 1.953-1.953 5.119-1.953 7.071 0l7.071 7.071c1.953 1.953 1.953 5.119 0 7.071-1.953 1.953-5.119 1.953-7.071 0z" />
            <path d="M8.5 8.5l7 7" />
          </svg>
        </div>
        <h3 className="shared-card-title">{medication.name}</h3>
      </div>
      <div className="shared-card-content">
        {medication.dosage && (
          <div className="shared-card-row">
            <span className="shared-card-label">Dosage:</span>
            <span className="shared-card-value">{medication.dosage}</span>
          </div>
        )}
        {medication.frequency && (
          <div className="shared-card-row">
            <span className="shared-card-label">Frequency:</span>
            <span className="shared-card-value">{medication.frequency}</span>
          </div>
        )}
        {medication.prescribedBy && (
          <div className="shared-card-row">
            <span className="shared-card-label">Prescribed By:</span>
            <span className="shared-card-value">{medication.prescribedBy}</span>
          </div>
        )}
        {medication.startDate && (
          <div className="shared-card-row">
            <span className="shared-card-label">Start Date:</span>
            <span className="shared-card-value">{new Date(medication.startDate).toLocaleDateString()}</span>
          </div>
        )}
        {medication.purpose && (
          <div className="shared-card-row">
            <span className="shared-card-label">Purpose:</span>
            <span className="shared-card-value">{medication.purpose}</span>
          </div>
        )}
        {medication.refillsRemaining !== undefined && (
          <div className="shared-card-row">
            <span className="shared-card-label">Refills:</span>
            <span className="shared-card-value">{medication.refillsRemaining} remaining</span>
          </div>
        )}
        {medication.isActive !== undefined && (
          <div className={`shared-card-badge ${medication.isActive ? 'active' : 'inactive'}`}>
            {medication.isActive ? 'Active' : 'Discontinued'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedMedicationCard;
