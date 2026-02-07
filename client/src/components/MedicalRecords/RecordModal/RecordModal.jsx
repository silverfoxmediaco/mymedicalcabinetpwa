import React, { useState, useEffect } from 'react';
import EventSearch from '../EventSearch';
import FacilitySearch from '../FacilitySearch';
import DocumentUpload from '../DocumentUpload';
import AllergenSearch from '../AllergenSearch';
import ConditionSearch from '../ConditionSearch';
import ProcedureSearch from '../ProcedureSearch';
import DoctorInputField from '../../Doctors/DoctorInputField';
import DrugSearch from '../../Medications/DrugSearch/DrugSearch';
import BarcodeScanner from '../../Medications/BarcodeScanner';
import { openFdaService } from '../../../services/openFdaService';
import './RecordModal.css';

const RecordModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    type,
    record = null,
    isMobile = false,
    doctors = [],
    onDoctorCreated
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({});
    const [prescriptions, setPrescriptions] = useState([]);
    const [scanningIndex, setScanningIndex] = useState(null);

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
                { name: 'doctor', label: 'Doctor', type: 'doctorInput' },
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
            // Populate prescriptions from prescribedMedications in edit mode
            if (type === 'event' && record.prescribedMedications?.length > 0) {
                setPrescriptions(record.prescribedMedications.map(med => ({
                    _id: med._id,
                    medicationName: med.name || '',
                    genericName: med.genericName || '',
                    dosage: {
                        amount: med.dosage?.amount || '',
                        unit: med.dosage?.unit || 'mg'
                    },
                    frequency: med.frequency || 'once daily',
                    purpose: med.purpose || '',
                    instructions: med.instructions || ''
                })));
            } else {
                setPrescriptions([]);
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
        setPrescriptions([]);
        setScanningIndex(null);
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

        // Attach prescriptions for events
        if (type === 'event') {
            dataToSave.prescriptions = prescriptions.filter(p => p.medicationName.trim());
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

    const handleDoctorChange = (doctorData) => {
        setFormData(prev => ({
            ...prev,
            doctor: doctorData,
            doctorId: doctorData.doctorId,
            doctorName: doctorData.doctorName
        }));
    };

    const rxFrequencyOptions = [
        { value: 'once daily', label: 'Once daily' },
        { value: 'twice daily', label: 'Twice daily' },
        { value: 'three times daily', label: 'Three times daily' },
        { value: 'four times daily', label: 'Four times daily' },
        { value: 'as needed', label: 'As needed' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'other', label: 'Other' }
    ];

    const rxUnitOptions = [
        { value: 'mg', label: 'mg' },
        { value: 'mcg', label: 'mcg' },
        { value: 'g', label: 'g' },
        { value: 'ml', label: 'ml' },
        { value: 'units', label: 'units' },
        { value: 'other', label: 'other' }
    ];

    const handleAddPrescription = () => {
        setPrescriptions(prev => [
            ...prev,
            {
                medicationName: '',
                dosage: { amount: '', unit: 'mg' },
                frequency: 'once daily',
                purpose: '',
                instructions: ''
            }
        ]);
    };

    const handleRemovePrescription = (index) => {
        setPrescriptions(prev => prev.filter((_, i) => i !== index));
    };

    const handlePrescriptionChange = (index, field, value) => {
        setPrescriptions(prev => {
            const updated = [...prev];
            if (field.startsWith('dosage.')) {
                const dosageField = field.replace('dosage.', '');
                updated[index] = {
                    ...updated[index],
                    dosage: { ...updated[index].dosage, [dosageField]: value }
                };
            } else {
                updated[index] = { ...updated[index], [field]: value };
            }
            return updated;
        });
    };

    const handleDrugSelect = async (index, drugData) => {
        setPrescriptions(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                medicationName: drugData.name,
                rxcui: drugData.rxcui,
                genericName: drugData.genericName || '',
                dosage: {
                    amount: drugData.strength || updated[index].dosage.amount,
                    unit: drugData.unit || updated[index].dosage.unit
                }
            };
            return updated;
        });
        // Auto-fill purpose from FDA indications
        const indications = await openFdaService.getIndications(drugData.name);
        if (indications) {
            setPrescriptions(prev => {
                const updated = [...prev];
                if (updated[index] && !updated[index].purpose) {
                    updated[index] = { ...updated[index], purpose: indications };
                }
                return updated;
            });
        }
    };

    const handleScanSuccess = async (drugInfo) => {
        const scannedIndex = scanningIndex;
        if (scannedIndex !== null) {
            setPrescriptions(prev => {
                const updated = [...prev];
                updated[scannedIndex] = {
                    ...updated[scannedIndex],
                    medicationName: drugInfo.name || '',
                    genericName: drugInfo.genericName || '',
                    dosage: {
                        amount: drugInfo.strength?.replace(/[^\d.]/g, '') || updated[scannedIndex].dosage.amount,
                        unit: updated[scannedIndex].dosage.unit
                    }
                };
                return updated;
            });
            // Auto-fill purpose from FDA indications
            const indications = await openFdaService.getIndications(drugInfo.name);
            if (indications) {
                setPrescriptions(prev => {
                    const updated = [...prev];
                    if (updated[scannedIndex] && !updated[scannedIndex].purpose) {
                        updated[scannedIndex] = { ...updated[scannedIndex], purpose: indications };
                    }
                    return updated;
                });
            }
        }
        setScanningIndex(null);
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
            case 'doctorInput':
                return (
                    <DoctorInputField
                        doctors={doctors}
                        value={formData.doctor || { doctorId: formData.doctorId, doctorName: formData.doctorName }}
                        onChange={handleDoctorChange}
                        onDoctorCreated={onDoctorCreated}
                        placeholder="Select a doctor"
                        isMobile={isMobile}
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
                {scanningIndex !== null ? (
                    <BarcodeScanner
                        onScanSuccess={handleScanSuccess}
                        onScanError={() => {}}
                        onClose={() => setScanningIndex(null)}
                    />
                ) : (
                <>
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
                                {type === 'event' && (
                                    <div className="record-rx-section">
                                        <div className="record-rx-header">
                                            <h3 className="record-rx-title">Prescribed Medications</h3>
                                            <button
                                                type="button"
                                                className="record-rx-add-btn"
                                                onClick={handleAddPrescription}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                                Add Medication
                                            </button>
                                        </div>

                                        {prescriptions.length === 0 ? (
                                            <p className="record-rx-empty">
                                                No medications added. Click "Add Medication" if any were prescribed.
                                            </p>
                                        ) : (
                                            <div className="record-rx-list">
                                                {prescriptions.map((rx, index) => (
                                                    <div key={index} className="record-rx-card">
                                                        <div className="record-rx-card-header">
                                                            <span className="record-rx-card-number">
                                                                Medication {index + 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="record-rx-remove-btn"
                                                                onClick={() => handleRemovePrescription(index)}
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        <div className="form-group">
                                                            <label className="form-label">Medication Name *</label>
                                                            <button
                                                                type="button"
                                                                className="record-rx-scan-btn"
                                                                onClick={() => setScanningIndex(index)}
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                                                    <path d="M7 7h.01" />
                                                                    <path d="M7 12h10" />
                                                                    <path d="M7 17h.01" />
                                                                    <path d="M17 7h.01" />
                                                                    <path d="M17 17h.01" />
                                                                </svg>
                                                                Scan Barcode
                                                            </button>
                                                            <div className="record-rx-or-divider">
                                                                <span>Or</span>
                                                            </div>
                                                            <DrugSearch
                                                                onSelect={(drugData) => handleDrugSelect(index, drugData)}
                                                                placeholder="Search medications..."
                                                            />
                                                            {rx.medicationName && (
                                                                <div className="record-rx-name-display">
                                                                    <div className="record-rx-name-pill">
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M10.5 20.5L3.5 13.5C1.5 11.5 1.5 8.5 3.5 6.5C5.5 4.5 8.5 4.5 10.5 6.5L17.5 13.5C19.5 15.5 19.5 18.5 17.5 20.5C15.5 22.5 12.5 22.5 10.5 20.5Z" />
                                                                            <path d="M7 13.5L13.5 7" />
                                                                        </svg>
                                                                        <div className="record-rx-name-text">
                                                                            <span className="record-rx-name-brand">{rx.medicationName}</span>
                                                                            {rx.genericName && rx.genericName !== rx.medicationName && (
                                                                                <span className="record-rx-name-generic">{rx.genericName}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="form-group">
                                                            <label className="form-label">Purpose / Treatment</label>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={rx.purpose || ''}
                                                                onChange={(e) => handlePrescriptionChange(index, 'purpose', e.target.value)}
                                                                placeholder="e.g., Blood pressure, Heart failure"
                                                            />
                                                        </div>

                                                        <div className="form-row">
                                                            <div className="form-group">
                                                                <label className="form-label">Dosage</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    value={rx.dosage.amount}
                                                                    onChange={(e) => handlePrescriptionChange(index, 'dosage.amount', e.target.value)}
                                                                    placeholder="e.g., 500"
                                                                />
                                                            </div>
                                                            <div className="form-group form-group-small">
                                                                <label className="form-label">Unit</label>
                                                                <select
                                                                    className="form-select"
                                                                    value={rx.dosage.unit}
                                                                    onChange={(e) => handlePrescriptionChange(index, 'dosage.unit', e.target.value)}
                                                                >
                                                                    {rxUnitOptions.map(opt => (
                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="form-group">
                                                            <label className="form-label">Frequency</label>
                                                            <select
                                                                className="form-select"
                                                                value={rx.frequency}
                                                                onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                                                            >
                                                                {rxFrequencyOptions.map(opt => (
                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="form-group">
                                                            <label className="form-label">Instructions</label>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                value={rx.instructions}
                                                                onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                                                                placeholder="e.g., Take with food"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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
                </>
                )}
            </div>
        </div>
    );
};

export default RecordModal;
