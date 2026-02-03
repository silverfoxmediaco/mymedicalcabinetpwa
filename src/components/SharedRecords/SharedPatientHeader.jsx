import React from 'react';
import './SharedRecords.css';

const SharedPatientHeader = ({ patient }) => {
  if (!patient) return null;

  return (
    <div className="shared-patient-header">
      <div className="shared-patient-avatar">
        {patient.name?.charAt(0) || 'P'}
      </div>
      <div className="shared-patient-info">
        <h1 className="shared-patient-name">{patient.name || 'Patient'}</h1>
        {patient.dob && (
          <p className="shared-patient-detail">
            <span className="shared-patient-label">Date of Birth:</span>
            {new Date(patient.dob).toLocaleDateString()}
          </p>
        )}
        {patient.phone && (
          <p className="shared-patient-detail">
            <span className="shared-patient-label">Phone:</span>
            {patient.phone}
          </p>
        )}
      </div>
      <div className="shared-patient-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Protected Health Information
      </div>
    </div>
  );
};

export default SharedPatientHeader;
