import React from 'react';
import './SharedRecords.css';

const SharedEventCard = ({ event }) => {
  if (!event) return null;

  const getEventTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'hospitalization':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-4" />
            <path d="M9 9h1" />
            <path d="M9 13h1" />
            <path d="M9 17h1" />
          </svg>
        );
      case 'emergency':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'surgery':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M8 10h8" />
            <path d="M8 14h6" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
    }
  };

  const getEventTypeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'hospitalization':
        return 'event-hospitalization';
      case 'emergency':
        return 'event-emergency';
      case 'surgery':
        return 'event-surgery';
      default:
        return 'event-default';
    }
  };

  return (
    <div className="shared-card shared-event-card">
      <div className="shared-card-header">
        <div className={`shared-card-icon event ${getEventTypeClass(event.type)}`}>
          {getEventTypeIcon(event.type)}
        </div>
        <h3 className="shared-card-title">{event.title || event.type}</h3>
      </div>
      <div className="shared-card-content">
        {event.type && (
          <div className="shared-card-row">
            <span className="shared-card-label">Type:</span>
            <span className="shared-card-value capitalize">{event.type}</span>
          </div>
        )}
        {event.date && (
          <div className="shared-card-row">
            <span className="shared-card-label">Date:</span>
            <span className="shared-card-value">{new Date(event.date).toLocaleDateString()}</span>
          </div>
        )}
        {event.endDate && (
          <div className="shared-card-row">
            <span className="shared-card-label">End Date:</span>
            <span className="shared-card-value">{new Date(event.endDate).toLocaleDateString()}</span>
          </div>
        )}
        {event.facility && (
          <div className="shared-card-row">
            <span className="shared-card-label">Facility:</span>
            <span className="shared-card-value">{event.facility}</span>
          </div>
        )}
        {event.provider && (
          <div className="shared-card-row">
            <span className="shared-card-label">Provider:</span>
            <span className="shared-card-value">{event.provider}</span>
          </div>
        )}
        {event.reason && (
          <div className="shared-card-row">
            <span className="shared-card-label">Reason:</span>
            <span className="shared-card-value">{event.reason}</span>
          </div>
        )}
        {event.diagnosis && (
          <div className="shared-card-row">
            <span className="shared-card-label">Diagnosis:</span>
            <span className="shared-card-value">{event.diagnosis}</span>
          </div>
        )}
        {event.outcome && (
          <div className="shared-card-row">
            <span className="shared-card-label">Outcome:</span>
            <span className="shared-card-value">{event.outcome}</span>
          </div>
        )}
        {event.notes && (
          <div className="shared-card-row notes">
            <span className="shared-card-label">Notes:</span>
            <span className="shared-card-value">{event.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedEventCard;
