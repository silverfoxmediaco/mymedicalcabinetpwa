import React from 'react';
import './SharedRecords.css';

const SharedDoctorCard = ({ doctor }) => {
  if (!doctor) return null;

  return (
    <div className="shared-card shared-doctor-card">
      <div className="shared-card-header">
        <div className="shared-card-icon doctor">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h3 className="shared-card-title">{doctor.name}</h3>
      </div>
      <div className="shared-card-content">
        {doctor.specialty && (
          <div className="shared-card-row">
            <span className="shared-card-label">Specialty:</span>
            <span className="shared-card-value">{doctor.specialty}</span>
          </div>
        )}
        {doctor.practice && (
          <div className="shared-card-row">
            <span className="shared-card-label">Practice:</span>
            <span className="shared-card-value">{doctor.practice}</span>
          </div>
        )}
        {doctor.phone && (
          <div className="shared-card-row">
            <span className="shared-card-label">Phone:</span>
            <span className="shared-card-value">{doctor.phone}</span>
          </div>
        )}
        {doctor.address && (
          <div className="shared-card-row">
            <span className="shared-card-label">Address:</span>
            <span className="shared-card-value">{doctor.address}</span>
          </div>
        )}
        {doctor.npi && (
          <div className="shared-card-row">
            <span className="shared-card-label">NPI:</span>
            <span className="shared-card-value">{doctor.npi}</span>
          </div>
        )}
        {doctor.isPrimary && (
          <div className="shared-card-badge primary">Primary Care Physician</div>
        )}
      </div>
    </div>
  );
};

export default SharedDoctorCard;
