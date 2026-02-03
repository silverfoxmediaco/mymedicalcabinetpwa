import React from 'react';
import './SharedRecords.css';

const SharedInsuranceCard = ({ insurance }) => {
  if (!insurance) return null;

  return (
    <div className="shared-card shared-insurance-card full-width">
      <div className="shared-card-header">
        <div className="shared-card-icon insurance">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <h3 className="shared-card-title">{insurance.provider || 'Insurance Information'}</h3>
      </div>
      <div className="shared-card-content shared-insurance-grid">
        <div className="shared-insurance-section">
          <h4>Primary Insurance</h4>
          {insurance.provider && (
            <div className="shared-card-row">
              <span className="shared-card-label">Provider:</span>
              <span className="shared-card-value">{insurance.provider}</span>
            </div>
          )}
          {insurance.policyNumber && (
            <div className="shared-card-row">
              <span className="shared-card-label">Policy Number:</span>
              <span className="shared-card-value">{insurance.policyNumber}</span>
            </div>
          )}
          {insurance.groupNumber && (
            <div className="shared-card-row">
              <span className="shared-card-label">Group Number:</span>
              <span className="shared-card-value">{insurance.groupNumber}</span>
            </div>
          )}
          {insurance.subscriberName && (
            <div className="shared-card-row">
              <span className="shared-card-label">Subscriber:</span>
              <span className="shared-card-value">{insurance.subscriberName}</span>
            </div>
          )}
          {insurance.relationship && (
            <div className="shared-card-row">
              <span className="shared-card-label">Relationship:</span>
              <span className="shared-card-value">{insurance.relationship}</span>
            </div>
          )}
        </div>

        {insurance.contactPhone && (
          <div className="shared-insurance-section">
            <h4>Contact Information</h4>
            <div className="shared-card-row">
              <span className="shared-card-label">Phone:</span>
              <span className="shared-card-value">{insurance.contactPhone}</span>
            </div>
          </div>
        )}

        {insurance.copay && (
          <div className="shared-insurance-section">
            <h4>Coverage Details</h4>
            {insurance.copay && (
              <div className="shared-card-row">
                <span className="shared-card-label">Copay:</span>
                <span className="shared-card-value">${insurance.copay}</span>
              </div>
            )}
            {insurance.deductible && (
              <div className="shared-card-row">
                <span className="shared-card-label">Deductible:</span>
                <span className="shared-card-value">${insurance.deductible}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedInsuranceCard;
