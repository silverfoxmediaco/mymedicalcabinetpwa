import React, { useState, useEffect } from 'react';
import './AppointmentModal.css';

const AppointmentModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    appointment = null,
    doctors = [],
    isMobile = false
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        type: 'checkup',
        dateTime: '',
        duration: 30,
        doctor: { name: '', specialty: '' },
        location: '',
        notes: '',
        status: 'pending',
        reminder: true
    });

    const isEditMode = !!appointment;

    useEffect(() => {
        if (appointment) {
            setFormData({
                title: appointment.title || '',
                type: appointment.type || 'checkup',
                dateTime: appointment.dateTime
                    ? new Date(appointment.dateTime).toISOString().slice(0, 16)
                    : '',
                duration: appointment.duration || 30,
                doctor: appointment.doctor || { name: '', specialty: '' },
                location: appointment.location || '',
                notes: appointment.notes || '',
                status: appointment.status || 'pending',
                reminder: appointment.reminder !== false
            });
        } else {
            resetForm();
        }
    }, [appointment, isOpen]);

    const resetForm = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        now.setMinutes(0);

        setFormData({
            title: '',
            type: 'checkup',
            dateTime: now.toISOString().slice(0, 16),
            duration: 30,
            doctor: { name: '', specialty: '' },
            location: '',
            notes: '',
            status: 'pending',
            reminder: true
        });
        setShowDeleteConfirm(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (name.startsWith('doctor.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                doctor: {
                    ...prev.doctor,
                    [field]: val
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: val
            }));
        }
    };

    const handleDoctorSelect = (e) => {
        const selectedId = e.target.value;
        if (selectedId === 'custom') {
            setFormData(prev => ({
                ...prev,
                doctor: { name: '', specialty: '' }
            }));
        } else if (selectedId) {
            const selectedDoctor = doctors.find(d => d._id === selectedId);
            if (selectedDoctor) {
                setFormData(prev => ({
                    ...prev,
                    doctor: {
                        name: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
                        specialty: selectedDoctor.specialty || ''
                    },
                    location: selectedDoctor.practice?.address || prev.location
                }));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            duration: Number(formData.duration)
        });
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete(appointment._id);
            setShowDeleteConfirm(false);
        } else {
            setShowDeleteConfirm(true);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const appointmentTypes = [
        { value: 'checkup', label: 'Check-up' },
        { value: 'follow-up', label: 'Follow-up' },
        { value: 'consultation', label: 'Consultation' },
        { value: 'procedure', label: 'Procedure' },
        { value: 'lab-work', label: 'Lab Work' },
        { value: 'imaging', label: 'Imaging/X-Ray' },
        { value: 'vaccination', label: 'Vaccination' },
        { value: 'physical', label: 'Physical Exam' },
        { value: 'specialist', label: 'Specialist Visit' },
        { value: 'therapy', label: 'Therapy Session' },
        { value: 'dental', label: 'Dental' },
        { value: 'vision', label: 'Vision/Eye' },
        { value: 'other', label: 'Other' }
    ];

    const durations = [
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
        { value: 45, label: '45 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' }
    ];

    const statuses = [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'completed', label: 'Completed' }
    ];

    return (
        <div className="appointment-modal-overlay" onClick={handleClose}>
            <div
                className={`appointment-modal ${isMobile ? 'mobile' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="appointment-modal-header">
                    <h2 className="appointment-modal-title">
                        {isEditMode ? 'Edit Appointment' : 'New Appointment'}
                    </h2>
                    <button
                        type="button"
                        className="appointment-modal-close"
                        onClick={handleClose}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="appointment-modal-content">
                    <form onSubmit={handleSubmit} className="appointment-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="appt-title">
                                Appointment Title *
                            </label>
                            <input
                                id="appt-title"
                                type="text"
                                name="title"
                                className="form-input"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Annual Physical"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="appt-type">
                                    Type
                                </label>
                                <select
                                    id="appt-type"
                                    name="type"
                                    className="form-select"
                                    value={formData.type}
                                    onChange={handleChange}
                                >
                                    {appointmentTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="appt-status">
                                    Status
                                </label>
                                <select
                                    id="appt-status"
                                    name="status"
                                    className="form-select"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    {statuses.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="appt-datetime">
                                    Date & Time *
                                </label>
                                <input
                                    id="appt-datetime"
                                    type="datetime-local"
                                    name="dateTime"
                                    className="form-input"
                                    value={formData.dateTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group form-group-small">
                                <label className="form-label" htmlFor="appt-duration">
                                    Duration
                                </label>
                                <select
                                    id="appt-duration"
                                    name="duration"
                                    className="form-select"
                                    value={formData.duration}
                                    onChange={handleChange}
                                >
                                    {durations.map(d => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-divider">
                            <span>Provider</span>
                        </div>

                        {doctors.length > 0 && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="appt-doctor-select">
                                    Select from My Doctors
                                </label>
                                <select
                                    id="appt-doctor-select"
                                    className="form-select"
                                    onChange={handleDoctorSelect}
                                    defaultValue=""
                                >
                                    <option value="">Choose a doctor...</option>
                                    {doctors.map(doc => (
                                        <option key={doc._id} value={doc._id}>
                                            Dr. {doc.firstName} {doc.lastName}
                                            {doc.specialty && ` — ${doc.specialty}`}
                                        </option>
                                    ))}
                                    <option value="custom">Enter manually...</option>
                                </select>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="appt-doctor-name">
                                    Doctor Name
                                </label>
                                <input
                                    id="appt-doctor-name"
                                    type="text"
                                    name="doctor.name"
                                    className="form-input"
                                    value={formData.doctor.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Dr. Smith"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="appt-doctor-specialty">
                                    Specialty
                                </label>
                                <input
                                    id="appt-doctor-specialty"
                                    type="text"
                                    name="doctor.specialty"
                                    className="form-input"
                                    value={formData.doctor.specialty}
                                    onChange={handleChange}
                                    placeholder="e.g., Cardiology"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="appt-location">
                                Location
                            </label>
                            <input
                                id="appt-location"
                                type="text"
                                name="location"
                                className="form-input"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., 123 Medical Center Dr, Suite 100"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="appt-notes">
                                Notes
                            </label>
                            <textarea
                                id="appt-notes"
                                name="notes"
                                className="form-textarea"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any preparation needed, questions to ask, etc."
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-toggle-label">
                                <input
                                    type="checkbox"
                                    name="reminder"
                                    checked={formData.reminder}
                                    onChange={handleChange}
                                />
                                <span className="form-toggle"></span>
                                <span className="form-toggle-text">Send me a reminder</span>
                            </label>
                        </div>
                    </form>
                </div>

                <div className="appointment-modal-footer">
                    {isEditMode && (
                        <button
                            type="button"
                            className={`appointment-modal-delete ${showDeleteConfirm ? 'confirm' : ''}`}
                            onClick={handleDelete}
                        >
                            {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
                        </button>
                    )}
                    <div className="appointment-modal-actions">
                        <button
                            type="button"
                            className="appointment-modal-cancel"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="appointment-modal-save"
                            onClick={handleSubmit}
                        >
                            {isEditMode ? 'Save Changes' : 'Add Appointment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentModal;
