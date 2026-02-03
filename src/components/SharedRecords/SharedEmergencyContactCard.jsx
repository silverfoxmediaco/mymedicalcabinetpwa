import React from 'react';
import './SharedRecords.css';

const SharedEmergencyContactCard = ({ contact }) => {
  if (!contact) return null;

  return (
    <div className="shared-card shared-emergency-contact-card">
      <div className="shared-card-header">
        <div className="shared-card-icon emergency">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <h3 className="shared-card-title">{contact.name}</h3>
      </div>
      <div className="shared-card-content">
        {contact.relationship && (
          <div className="shared-card-row">
            <span className="shared-card-label">Relationship:</span>
            <span className="shared-card-value">{contact.relationship}</span>
          </div>
        )}
        {contact.phone && (
          <div className="shared-card-row">
            <span className="shared-card-label">Phone:</span>
            <span className="shared-card-value">{contact.phone}</span>
          </div>
        )}
        {contact.email && (
          <div className="shared-card-row">
            <span className="shared-card-label">Email:</span>
            <span className="shared-card-value">{contact.email}</span>
          </div>
        )}
        {contact.isPrimary && (
          <div className="shared-card-badge primary">Primary Contact</div>
        )}
      </div>
    </div>
  );
};

export default SharedEmergencyContactCard;
