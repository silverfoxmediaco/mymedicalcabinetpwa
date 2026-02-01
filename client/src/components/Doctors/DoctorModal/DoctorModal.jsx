import React, { useState, useEffect } from 'react';
import DoctorOfficeSearch from '../DoctorOfficeSearch';
import './DoctorModal.css';

const DoctorModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    doctor = null,
    isMobile = false
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        practice: {
            name: '',
            address: {
                street: '',
                city: '',
                state: '',
                zipCode: ''
            }
        },
        phone: '',
        fax: '',
        email: '',
        npiNumber: '',
        isPrimaryCare: false,
        notes: ''
    });

    const isEditMode = !!doctor;

    useEffect(() => {
        if (doctor) {
            setFormData({
                name: doctor.name || '',
                specialty: doctor.specialty || '',
                practice: {
                    name: doctor.practice?.name || '',
                    address: {
                        street: doctor.practice?.address?.street || '',
                        city: doctor.practice?.address?.city || '',
                        state: doctor.practice?.address?.state || '',
                        zipCode: doctor.practice?.address?.zipCode || ''
                    }
                },
                phone: doctor.phone || '',
                fax: doctor.fax || '',
                email: doctor.email || '',
                npiNumber: doctor.npiNumber || '',
                isPrimaryCare: doctor.isPrimaryCare || false,
                notes: doctor.notes || ''
            });
        } else {
            resetForm();
        }
    }, [doctor, isOpen]);

    const resetForm = () => {
        setFormData({
            name: '',
            specialty: '',
            practice: {
                name: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: ''
                }
            },
            phone: '',
            fax: '',
            email: '',
            npiNumber: '',
            isPrimaryCare: false,
            notes: ''
        });
        setShowDeleteConfirm(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('practice.address.')) {
            const field = name.replace('practice.address.', '');
            setFormData(prev => ({
                ...prev,
                practice: {
                    ...prev.practice,
                    address: {
                        ...prev.practice.address,
                        [field]: value
                    }
                }
            }));
        } else if (name.startsWith('practice.')) {
            const field = name.replace('practice.', '');
            setFormData(prev => ({
                ...prev,
                practice: {
                    ...prev.practice,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleOfficeSelect = (officeData) => {
        if (!officeData.name) return;

        setFormData(prev => ({
            ...prev,
            practice: {
                name: officeData.name,
                address: {
                    street: officeData.address?.street || '',
                    city: officeData.address?.city || '',
                    state: officeData.address?.state || '',
                    zipCode: officeData.address?.zipCode || ''
                }
            },
            phone: officeData.phone || prev.phone
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete(doctor._id);
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

    const specialtyOptions = [
        'Primary Care',
        'Family Medicine',
        'Internal Medicine',
        'Cardiology',
        'Dermatology',
        'Endocrinology',
        'Gastroenterology',
        'Neurology',
        'Obstetrics & Gynecology',
        'Oncology',
        'Ophthalmology',
        'Orthopedics',
        'Pediatrics',
        'Psychiatry',
        'Pulmonology',
        'Radiology',
        'Rheumatology',
        'Surgery',
        'Urology',
        'Other'
    ];

    return (
        <div className="doctor-modal-overlay" onClick={handleClose}>
            <div
                className={`doctor-modal ${isMobile ? 'mobile' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="doctor-modal-header">
                    <h2 className="doctor-modal-title">
                        {isEditMode ? 'Edit Doctor' : 'Add Doctor'}
                    </h2>
                    <button
                        type="button"
                        className="doctor-modal-close"
                        onClick={handleClose}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="doctor-modal-content">
                    <form onSubmit={handleSubmit} className="doctor-form">
                        <div className="form-group">
                            <label className="form-label" htmlFor="doctor-name">
                                Doctor Name *
                            </label>
                            <input
                                id="doctor-name"
                                type="text"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Dr. John Smith"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="doctor-specialty">
                                Specialty
                            </label>
                            <select
                                id="doctor-specialty"
                                name="specialty"
                                className="form-select"
                                value={formData.specialty}
                                onChange={handleChange}
                            >
                                <option value="">Select specialty</option>
                                {specialtyOptions.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-toggle-label">
                                <input
                                    type="checkbox"
                                    name="isPrimaryCare"
                                    checked={formData.isPrimaryCare}
                                    onChange={handleChange}
                                />
                                <span className="form-toggle"></span>
                                <span className="form-toggle-text">Primary Care Physician</span>
                            </label>
                        </div>

                        <div className="form-divider">
                            <span>Practice Information</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Search for Practice
                            </label>
                            <DoctorOfficeSearch
                                onSelect={handleOfficeSelect}
                                value={formData.practice.name}
                                placeholder="Search for doctor's office or clinic..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="practice-name">
                                Practice Name
                            </label>
                            <input
                                id="practice-name"
                                type="text"
                                name="practice.name"
                                className="form-input"
                                value={formData.practice.name}
                                onChange={handleChange}
                                placeholder="e.g., City Medical Center"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="practice-street">
                                Street Address
                            </label>
                            <input
                                id="practice-street"
                                type="text"
                                name="practice.address.street"
                                className="form-input"
                                value={formData.practice.address.street}
                                onChange={handleChange}
                                placeholder="123 Main Street"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="practice-city">
                                    City
                                </label>
                                <input
                                    id="practice-city"
                                    type="text"
                                    name="practice.address.city"
                                    className="form-input"
                                    value={formData.practice.address.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                />
                            </div>
                            <div className="form-group form-group-small">
                                <label className="form-label" htmlFor="practice-state">
                                    State
                                </label>
                                <input
                                    id="practice-state"
                                    type="text"
                                    name="practice.address.state"
                                    className="form-input"
                                    value={formData.practice.address.state}
                                    onChange={handleChange}
                                    placeholder="TX"
                                    maxLength={2}
                                />
                            </div>
                            <div className="form-group form-group-small">
                                <label className="form-label" htmlFor="practice-zip">
                                    ZIP
                                </label>
                                <input
                                    id="practice-zip"
                                    type="text"
                                    name="practice.address.zipCode"
                                    className="form-input"
                                    value={formData.practice.address.zipCode}
                                    onChange={handleChange}
                                    placeholder="12345"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <div className="form-divider">
                            <span>Contact Information</span>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="doctor-phone">
                                    Phone
                                </label>
                                <input
                                    id="doctor-phone"
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="doctor-fax">
                                    Fax
                                </label>
                                <input
                                    id="doctor-fax"
                                    type="tel"
                                    name="fax"
                                    className="form-input"
                                    value={formData.fax}
                                    onChange={handleChange}
                                    placeholder="(555) 123-4568"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="doctor-email">
                                Email
                            </label>
                            <input
                                id="doctor-email"
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="doctor@practice.com"
                            />
                        </div>

                        <div className="form-divider">
                            <span>Additional Information</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="doctor-npi">
                                NPI Number
                            </label>
                            <input
                                id="doctor-npi"
                                type="text"
                                name="npiNumber"
                                className="form-input"
                                value={formData.npiNumber}
                                onChange={handleChange}
                                placeholder="10-digit NPI"
                                maxLength={10}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="doctor-notes">
                                Notes
                            </label>
                            <textarea
                                id="doctor-notes"
                                name="notes"
                                className="form-textarea"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Any additional notes about this doctor..."
                                rows={3}
                            />
                        </div>
                    </form>
                </div>

                <div className="doctor-modal-footer">
                    {isEditMode && (
                        <button
                            type="button"
                            className={`doctor-modal-delete ${showDeleteConfirm ? 'confirm' : ''}`}
                            onClick={handleDelete}
                        >
                            {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
                        </button>
                    )}
                    <div className="doctor-modal-actions">
                        <button
                            type="button"
                            className="doctor-modal-cancel"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="doctor-modal-save"
                            onClick={handleSubmit}
                        >
                            {isEditMode ? 'Save Changes' : 'Add Doctor'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorModal;
