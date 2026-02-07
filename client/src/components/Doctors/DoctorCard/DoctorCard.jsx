import React from 'react';
import './DoctorCard.css';

const DoctorCard = ({ doctor, onEdit, onView }) => {
    const formatPhone = (phone) => {
        if (!phone) return null;
        return phone;
    };

    const formatAddress = (practice) => {
        if (!practice?.address) return null;
        const { street, city, state, zipCode } = practice.address;
        const parts = [street, city, state, zipCode].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : null;
    };

    const DoctorIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" />
            <circle cx="12" cy="7" r="4" />
            <path d="M12 11V14" />
            <path d="M10.5 12.5H13.5" />
        </svg>
    );

    const PhoneIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    );

    const LocationIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );

    return (
        <div className="doctor-card">
            <div className="doctor-card-header">
                <div className="doctor-card-icon">
                    <DoctorIcon />
                </div>
                <div className="doctor-card-title-group">
                    <h3 className="doctor-card-name">{doctor.name}</h3>
                    {doctor.specialty && (
                        <p className="doctor-card-specialty">{doctor.specialty}</p>
                    )}
                </div>
                {doctor.isPrimaryCare && (
                    <div className="doctor-card-badges">
                        <span className="doctor-badge primary">Primary Care</span>
                    </div>
                )}
                <div className="doctor-card-actions">
                    <button
                        className="doctor-card-view"
                        onClick={() => onView(doctor)}
                        type="button"
                    >
                        View
                    </button>
                    <button
                        className="doctor-card-edit"
                        onClick={() => onEdit(doctor)}
                        type="button"
                    >
                        Edit
                    </button>
                </div>
            </div>

            <div className="doctor-card-details">
                {doctor.practice?.name && (
                    <div className="doctor-detail-row">
                        <span className="doctor-detail-label">Practice:</span>
                        <span className="doctor-detail-value">{doctor.practice.name}</span>
                    </div>
                )}

                {formatPhone(doctor.phone) && (
                    <div className="doctor-detail-row doctor-detail-clickable">
                        <span className="doctor-detail-icon"><PhoneIcon /></span>
                        <a href={`tel:${doctor.phone}`} className="doctor-detail-link">
                            {formatPhone(doctor.phone)}
                        </a>
                    </div>
                )}

                {formatAddress(doctor.practice) && (
                    <div className="doctor-detail-row doctor-detail-address">
                        <span className="doctor-detail-icon"><LocationIcon /></span>
                        <span className="doctor-detail-value">{formatAddress(doctor.practice)}</span>
                    </div>
                )}

                {doctor.email && (
                    <div className="doctor-detail-row">
                        <span className="doctor-detail-label">Email:</span>
                        <a href={`mailto:${doctor.email}`} className="doctor-detail-link">
                            {doctor.email}
                        </a>
                    </div>
                )}

                {doctor.fax && (
                    <div className="doctor-detail-row">
                        <span className="doctor-detail-label">Fax:</span>
                        <span className="doctor-detail-value">{doctor.fax}</span>
                    </div>
                )}
            </div>

            {doctor.notes && (
                <div className="doctor-card-notes">
                    <p>{doctor.notes}</p>
                </div>
            )}
        </div>
    );
};

export default DoctorCard;
