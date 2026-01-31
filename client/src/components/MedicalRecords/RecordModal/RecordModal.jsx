import React, { useState, useEffect } from 'react';
import EventSearch from '../EventSearch';
import FacilitySearch from '../FacilitySearch';
import DocumentUpload from '../DocumentUpload';
import AllergenSearch from '../AllergenSearch';
import ConditionSearch from '../ConditionSearch';
import ProcedureSearch from '../ProcedureSearch';
import './RecordModal.css';

const RecordModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    type,
    record = null,
    isMobile = false
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({});

    const isEditMode = !!record;

    const typeConfig = {
        event: {
            title: 'Event',
            customRender: true,
            fields: [
                { name: 'eventType', label: 'Event Type', type: 'select', options: [
                    { value: 'physical', label: 'Annual Physical' },
                    { value: 'checkup', label: 'Check-up' },
                    { value: 'specialist', label: 'Specialist Visit' },
                    { value: 'urgent_care', label: 'Urgent Care' },
                    { value: 'er_visit', label: 'ER Visit' },
                    { value: 'hospital_stay', label: 'Hospital Stay' },
                    { value: 'procedure', label: 'Procedure' },
                    { value: 'lab_work', label: 'Lab Work' },
                    { value: 'imaging', label: 'Imaging (X-ray, MRI, CT)' },
                    { value: 'vaccination', label: 'Vaccination' },
                    { value: 'therapy', label: 'Therapy Session' },
                    { value: 'other', label: 'Other' }
                ]},
                { name: 'description', label: 'What Happened?', type: 'eventSearch', required: true },
                { name: 'date', label: 'Date', type: 'date', required: true },
                { name: 'provider', label: 'Provider/Facility', type: 'facilitySearch' },
                { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Diagnosis, treatment, follow-up...' }
            ]
        },
        condition: {
            title: 'Condition',
            fields: [
                { name: 'name', label: 'Condition Name', type: 'conditionSearch', required: true },
                { name: 'diagnosedDate', label: 'Date Diagnosed', type: 'date' },
                { name: 'status', label: 'Status', type: 'select', options: [
                    { value: 'active', label: 'Active' },
                    { value: 'managed', label: 'Managed' },
                    { value: 'resolved', label: 'Resolved' }
                ]},
                { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional details...' }
            ]
        },
        allergy: {
            title: 'Allergy',
            fields: [
                { name: 'allergen', label: 'Allergen', type: 'allergenSearch', required: true },
                { name: 'reaction', label: 'Reaction', type: 'text', placeholder: 'e.g., Hives, difficulty breathing' },
                { name: 'severity', label: 'Severity', type: 'select', options: [
                    { value: 'mild', label: 'Mild' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'severe', label: 'Severe' }
                ]}
            ]
        },
        surgery: {
            title: 'Surgery',
            fields: [
                { name: 'procedure', label: 'Procedure', type: 'procedureSearch', required: true },
                { name: 'date', label: 'Date', type: 'date' },
                { name: 'hospital', label: 'Hospital/Facility', type: 'facilitySearch' },
                { name: 'surgeon', label: 'Surgeon', type: 'text', placeholder: 'e.g., Dr. Smith' },
                { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional details...' }
            ]
        },
        familyHistory: {
            title: 'Family History',
            fields: [
                { name: 'condition', label: 'Condition', type: 'conditionSearch', required: true },
                { name: 'relationship', label: 'Relationship', type: 'select', options: [
                    { value: 'mother', label: 'Mother' },
                    { value: 'father', label: 'Father' },
                    { value: 'sibling', label: 'Sibling' },
                    { value: 'grandparent', label: 'Grandparent' },
                    { value: 'other', label: 'Other' }
                ]},
                { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional details...' }
            ]
        },
        vitals: {
            title: 'Vitals',
            fields: [
                { name: 'bloodType', label: 'Blood Type', type: 'select', options: [
                    { value: 'unknown', label: 'Unknown' },
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' }
                ]},
                { name: 'heightValue', label: 'Height', type: 'number', placeholder: 'e.g., 70' },
                { name: 'heightUnit', label: 'Unit', type: 'select', options: [
                    { value: 'in', label: 'inches' },
                    { value: 'cm', label: 'cm' }
                ]},
                { name: 'weightValue', label: 'Weight', type: 'number', placeholder: 'e.g., 165' },
                { name: 'weightUnit', label: 'Unit', type: 'select', options: [
                    { value: 'lb', label: 'lbs' },
                    { value: 'kg', label: 'kg' }
                ]}
            ]
        }
    };

    const config = typeConfig[type] || typeConfig.condition;

    useEffect(() => {
        if (record) {
            if (type === 'vitals') {
                setFormData({
                    bloodType: record.bloodType || 'unknown',
                    heightValue: record.height?.value || '',
                    heightUnit: record.height?.unit || 'in',
                    weightValue: record.weight?.value || '',
                    weightUnit: record.weight?.unit || 'lb'
                });
            } else {
                const data = { ...record };
                if (data.diagnosedDate) {
                    data.diagnosedDate = new Date(data.diagnosedDate).toISOString().split('T')[0];
                }
                if (data.date) {
                    data.date = new Date(data.date).toISOString().split('T')[0];
                }
                setFormData(data);
            }
        } else {
            resetForm();
        }
    }, [record, type, isOpen]);

    const resetForm = () => {
        const defaults = {};
        config.fields.forEach(field => {
            if (field.type === 'select' && field.options?.length > 0) {
                defaults[field.name] = field.options[0].value;
            } else {
                defaults[field.name] = '';
            }
        });
        setFormData(defaults);
        setShowDeleteConfirm(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let dataToSave = { ...formData };

        // Format vitals data
        if (type === 'vitals') {
            dataToSave = {
                bloodType: formData.bloodType,
                height: {
                    value: parseFloat(formData.heightValue) || null,
                    unit: formData.heightUnit
                },
                weight: {
                    value: parseFloat(formData.weightValue) || null,
                    unit: formData.weightUnit
                }
            };
        }

        onSave(dataToSave);
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete(record._id);
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

    const handleEventSearchChange = (value) => {
        setFormData(prev => ({
            ...prev,
            description: value
        }));
    };

    const handleFacilitySelect = (facilityData) => {
        setFormData(prev => ({
            ...prev,
            provider: facilityData.name || '',
            providerAddress: facilityData.formattedAddress || '',
            providerPhone: facilityData.phone || ''
        }));
    };

    const handleAllergenChange = (value) => {
        setFormData(prev => ({
            ...prev,
            allergen: value
        }));
    };

    const handleConditionChange = (fieldName) => (value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleProcedureChange = (value) => {
        setFormData(prev => ({
            ...prev,
            procedure: value
        }));
    };

    const handleHospitalSelect = (facilityData) => {
        setFormData(prev => ({
            ...prev,
            hospital: facilityData.name || '',
            hospitalAddress: facilityData.formattedAddress || '',
            hospitalPhone: facilityData.phone || ''
        }));
    };

    const renderField = (field) => {
        const value = formData[field.name] || '';

        switch (field.type) {
            case 'eventSearch':
                return (
                    <EventSearch
                        value={value}
                        onChange={handleEventSearchChange}
                        placeholder="e.g., Chest Pain, Broken Arm, Knee Surgery"
                    />
                );
            case 'facilitySearch':
                return (
                    <FacilitySearch
                        value={value}
                        onSelect={field.name === 'hospital' ? handleHospitalSelect : handleFacilitySelect}
                        placeholder="Search for hospital, clinic, or doctor's office"
                    />
                );
            case 'allergenSearch':
                return (
                    <AllergenSearch
                        value={value}
                        onChange={handleAllergenChange}
                        placeholder="e.g., Penicillin, Peanuts, Shellfish"
                    />
                );
            case 'conditionSearch':
                return (
                    <ConditionSearch
                        value={value}
                        onChange={handleConditionChange(field.name)}
                        placeholder="e.g., Type 2 Diabetes, Heart Disease"
                    />
                );
            case 'procedureSearch':
                return (
                    <ProcedureSearch
                        value={value}
                        onChange={handleProcedureChange}
                        placeholder="e.g., Appendectomy, Knee Replacement"
                    />
                );
            case 'select':
                return (
                    <select
                        id={`record-${field.name}`}
                        name={field.name}
                        className="form-select"
                        value={value}
                        onChange={handleChange}
                    >
                        {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            case 'textarea':
                return (
                    <textarea
                        id={`record-${field.name}`}
                        name={field.name}
                        className="form-textarea"
                        value={value}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        rows={3}
                    />
                );
            case 'date':
                return (
                    <input
                        id={`record-${field.name}`}
                        type="date"
                        name={field.name}
                        className="form-input"
                        value={value}
                        onChange={handleChange}
                    />
                );
            case 'number':
                return (
                    <input
                        id={`record-${field.name}`}
                        type="number"
                        name={field.name}
                        className="form-input"
                        value={value}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                    />
                );
            default:
                return (
                    <input
                        id={`record-${field.name}`}
                        type="text"
                        name={field.name}
                        className="form-input"
                        value={value}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                );
        }
    };

    return (
        <div className="record-modal-overlay" onClick={handleClose}>
            <div
                className={`record-modal ${isMobile ? 'mobile' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="record-modal-header">
                    <h2 className="record-modal-title">
                        {isEditMode ? `Edit ${config.title}` : `Add ${config.title}`}
                    </h2>
                    <button
                        type="button"
                        className="record-modal-close"
                        onClick={handleClose}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="record-modal-content">
                    <form onSubmit={handleSubmit} className="record-form">
                        {type === 'vitals' ? (
                            <>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="record-bloodType">
                                        Blood Type
                                    </label>
                                    {renderField({ name: 'bloodType', type: 'select', options: typeConfig.vitals.fields[0].options })}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="record-heightValue">
                                            Height
                                        </label>
                                        {renderField({ name: 'heightValue', type: 'number', placeholder: '70' })}
                                    </div>
                                    <div className="form-group form-group-small">
                                        <label className="form-label" htmlFor="record-heightUnit">
                                            Unit
                                        </label>
                                        {renderField({ name: 'heightUnit', type: 'select', options: typeConfig.vitals.fields[2].options })}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="record-weightValue">
                                            Weight
                                        </label>
                                        {renderField({ name: 'weightValue', type: 'number', placeholder: '165' })}
                                    </div>
                                    <div className="form-group form-group-small">
                                        <label className="form-label" htmlFor="record-weightUnit">
                                            Unit
                                        </label>
                                        {renderField({ name: 'weightUnit', type: 'select', options: typeConfig.vitals.fields[4].options })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {config.fields.map(field => (
                                    <div key={field.name} className="form-group">
                                        <label className="form-label" htmlFor={`record-${field.name}`}>
                                            {field.label}{field.required && ' *'}
                                        </label>
                                        {renderField(field)}
                                    </div>
                                ))}
                                {type === 'event' && (
                                    <DocumentUpload
                                        eventId={record?._id}
                                        documents={record?.documents || []}
                                        isNewEvent={!isEditMode}
                                        onDocumentAdded={(doc) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                documents: [...(prev.documents || []), doc]
                                            }));
                                        }}
                                        onDocumentRemoved={(docId) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                documents: (prev.documents || []).filter(d => d._id !== docId)
                                            }));
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </form>
                </div>

                <div className="record-modal-footer">
                    {isEditMode && type !== 'vitals' && (
                        <button
                            type="button"
                            className={`record-modal-delete ${showDeleteConfirm ? 'confirm' : ''}`}
                            onClick={handleDelete}
                        >
                            {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
                        </button>
                    )}
                    <div className="record-modal-actions">
                        <button
                            type="button"
                            className="record-modal-cancel"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="record-modal-save"
                            onClick={handleSubmit}
                        >
                            {type === 'vitals' ? 'Save Vitals' : (isEditMode ? 'Save Changes' : `Add ${config.title}`)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordModal;
