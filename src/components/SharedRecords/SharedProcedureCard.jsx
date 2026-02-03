import React from 'react';
import './SharedRecords.css';

const SharedProcedureCard = ({ procedure }) => {
  if (!procedure) return null;

  return (
    <div className="shared-card shared-procedure-card">
      <div className="shared-card-header">
        <div className="shared-card-icon procedure">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
            <line x1="9" y1="9" x2="10" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </div>
        <h3 className="shared-card-title">{procedure.name}</h3>
      </div>
      <div className="shared-card-content">
        {procedure.cptCode && (
          <div className="shared-card-row">
            <span className="shared-card-label">CPT Code:</span>
            <span className="shared-card-value">{procedure.cptCode}</span>
          </div>
        )}
        {procedure.date && (
          <div className="shared-card-row">
            <span className="shared-card-label">Date:</span>
            <span className="shared-card-value">{new Date(procedure.date).toLocaleDateString()}</span>
          </div>
        )}
        {procedure.performedBy && (
          <div className="shared-card-row">
            <span className="shared-card-label">Performed By:</span>
            <span className="shared-card-value">{procedure.performedBy}</span>
          </div>
        )}
        {procedure.facility && (
          <div className="shared-card-row">
            <span className="shared-card-label">Facility:</span>
            <span className="shared-card-value">{procedure.facility}</span>
          </div>
        )}
        {procedure.indication && (
          <div className="shared-card-row">
            <span className="shared-card-label">Indication:</span>
            <span className="shared-card-value">{procedure.indication}</span>
          </div>
        )}
        {procedure.outcome && (
          <div className="shared-card-row">
            <span className="shared-card-label">Outcome:</span>
            <span className="shared-card-value">{procedure.outcome}</span>
          </div>
        )}
        {procedure.notes && (
          <div className="shared-card-row notes">
            <span className="shared-card-label">Notes:</span>
            <span className="shared-card-value">{procedure.notes}</span>
          </div>
        )}
        {procedure.status && (
          <div className={`shared-card-badge ${procedure.status === 'completed' ? 'completed' : 'scheduled'}`}>
            {procedure.status}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedProcedureCard;
