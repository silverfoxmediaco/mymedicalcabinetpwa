import React from 'react';
import './SharedRecords.css';

const SharedConditionCard = ({ condition }) => {
  if (!condition) return null;

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
      case 'high':
        return 'severity-high';
      case 'moderate':
      case 'medium':
        return 'severity-medium';
      case 'mild':
      case 'low':
        return 'severity-low';
      default:
        return '';
    }
  };

  return (
    <div className="shared-card shared-condition-card">
      <div className="shared-card-header">
        <div className="shared-card-icon condition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <h3 className="shared-card-title">{condition.name}</h3>
      </div>
      <div className="shared-card-content">
        {condition.icdCode && (
          <div className="shared-card-row">
            <span className="shared-card-label">ICD Code:</span>
            <span className="shared-card-value">{condition.icdCode}</span>
          </div>
        )}
        {condition.diagnosedDate && (
          <div className="shared-card-row">
            <span className="shared-card-label">Diagnosed:</span>
            <span className="shared-card-value">{new Date(condition.diagnosedDate).toLocaleDateString()}</span>
          </div>
        )}
        {condition.diagnosedBy && (
          <div className="shared-card-row">
            <span className="shared-card-label">Diagnosed By:</span>
            <span className="shared-card-value">{condition.diagnosedBy}</span>
          </div>
        )}
        {condition.severity && (
          <div className="shared-card-row">
            <span className="shared-card-label">Severity:</span>
            <span className={`shared-card-value ${getSeverityClass(condition.severity)}`}>
              {condition.severity}
            </span>
          </div>
        )}
        {condition.notes && (
          <div className="shared-card-row">
            <span className="shared-card-label">Notes:</span>
            <span className="shared-card-value">{condition.notes}</span>
          </div>
        )}
        {condition.status && (
          <div className={`shared-card-badge ${condition.status === 'active' ? 'active' : 'resolved'}`}>
            {condition.status}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedConditionCard;
