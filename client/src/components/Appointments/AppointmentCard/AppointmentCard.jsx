import React from 'react';
import './AppointmentCard.css';

const AppointmentCard = ({ appointment, onEdit, onView, onComplete, onAddToCalendar }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'confirmed': return 'confirmed';
            case 'pending': return 'pending';
            case 'cancelled': return 'cancelled';
            case 'completed': return 'completed';
            default: return 'pending';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'confirmed': return 'Confirmed';
            case 'pending': return 'Pending';
            case 'cancelled': return 'Cancelled';
            case 'completed': return 'Completed';
            default: return 'Pending';
        }
    };

    const isUpcoming = () => {
        return new Date(appointment.dateTime) > new Date();
    };

    const isDueToday = () => {
        const today = new Date();
        const apptDate = new Date(appointment.dateTime);
        return today.toDateString() === apptDate.toDateString();
    };

    const isDueSoon = () => {
        const now = new Date();
        const apptDate = new Date(appointment.dateTime);
        const diffDays = Math.ceil((apptDate - now) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 3;
    };

    const isPastAndUncompleted = () => {
        const now = new Date();
        const apptDate = new Date(appointment.dateTime);
        return apptDate < now &&
               appointment.status !== 'completed' &&
               appointment.status !== 'cancelled';
    };

    const CalendarIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );

    const ClockIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );

    const LocationIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );

    const UserIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );

    const CalendarPlusIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="12" y1="14" x2="12" y2="18" />
            <line x1="10" y1="16" x2="14" y2="16" />
        </svg>
    );

    const CheckIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );

    return (
        <div className={`appointment-card ${!isUpcoming() ? 'past' : ''}`}>
            <div className="appointment-card-header">
                <div className="appointment-card-icon">
                    <CalendarIcon />
                </div>
                <div className="appointment-card-title-group">
                    <h3 className="appointment-card-title">{appointment.title}</h3>
                    {appointment.type && (
                        <p className="appointment-card-type">{appointment.type}</p>
                    )}
                </div>
                <div className="appointment-card-badges">
                    <span className={`appointment-badge status ${getStatusClass(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                    </span>
                    {isDueToday() && isUpcoming() && (
                        <span className="appointment-badge today">Today</span>
                    )}
                    {isDueSoon() && !isDueToday() && (
                        <span className="appointment-badge soon">Soon</span>
                    )}
                </div>
                <button
                    className="appointment-card-view"
                    onClick={() => onView(appointment)}
                    type="button"
                >
                    View
                </button>
                <button
                    className="appointment-card-edit"
                    onClick={() => onEdit(appointment)}
                    type="button"
                >
                    Edit
                </button>
            </div>

            <div className="appointment-card-details">
                <div className="appointment-detail-row">
                    <span className="appointment-detail-icon">
                        <CalendarIcon />
                    </span>
                    <span className="appointment-detail-value">
                        {formatDate(appointment.dateTime)}
                    </span>
                </div>

                <div className="appointment-detail-row">
                    <span className="appointment-detail-icon">
                        <ClockIcon />
                    </span>
                    <span className="appointment-detail-value">
                        {formatTime(appointment.dateTime)}
                        {appointment.duration && ` (${appointment.duration} min)`}
                    </span>
                </div>

                {appointment.doctor && (
                    <div className="appointment-detail-row">
                        <span className="appointment-detail-icon">
                            <UserIcon />
                        </span>
                        <span className="appointment-detail-value">
                            {appointment.doctor.name}
                            {appointment.doctor.specialty && (
                                <span className="appointment-detail-secondary">
                                    {' '}— {appointment.doctor.specialty}
                                </span>
                            )}
                        </span>
                    </div>
                )}

                {appointment.location && (
                    <div className="appointment-detail-row">
                        <span className="appointment-detail-icon">
                            <LocationIcon />
                        </span>
                        <span className="appointment-detail-value">{appointment.location}</span>
                    </div>
                )}
            </div>

            {appointment.notes && (
                <div className="appointment-card-notes">
                    <p>{appointment.notes}</p>
                </div>
            )}

            {isUpcoming() && appointment.status !== 'cancelled' && (
                <div className="appointment-card-actions">
                    <button
                        className="appointment-calendar-btn"
                        onClick={() => onAddToCalendar(appointment)}
                        type="button"
                    >
                        <CalendarPlusIcon />
                        Add to Calendar
                    </button>
                </div>
            )}

            {isPastAndUncompleted() && onComplete && (
                <div className="appointment-card-actions">
                    <button
                        className="appointment-complete-btn"
                        onClick={() => onComplete(appointment)}
                        type="button"
                    >
                        <CheckIcon />
                        Complete Visit
                    </button>
                </div>
            )}
        </div>
    );
};

export default AppointmentCard;
