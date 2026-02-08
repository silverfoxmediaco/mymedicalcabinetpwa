import React, { useState, useEffect } from 'react';
import BarcodeScanner from '../BarcodeScanner';
import DrugSearch from '../DrugSearch';
import InteractionAlert from '../InteractionAlert';
import './MedicationModal.css';

const MedicationModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    medication = null,
    interactions = [],
    isMobile = false,
    userPharmacies = [],
    userDoctors = []
}) => {
    const [activeTab, setActiveTab] = useState(isMobile ? 'scan' : 'manual');
    const [showScanner, setShowScanner] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        dosage: { amount: '', unit: 'mg' },
        frequency: 'once daily',
        timeOfDay: [],
        prescribedBy: '',
        prescribedDate: '',
        pharmacy: { name: '', phone: '', address: '' },
        refillsRemaining: 0,
        nextRefillDate: '',
        purpose: '',
        instructions: '',
        reminderEnabled: false,
        reminderTimes: [],
        scannedData: null
    });

    const isEditMode = !!medication;

    useEffect(() => {
        if (medication) {
            setFormData({
                name: medication.name || '',
                genericName: medication.genericName || '',
                dosage: medication.dosage || { amount: '', unit: 'mg' },
                frequency: medication.frequency || 'once daily',
                timeOfDay: medication.timeOfDay || [],
                prescribedBy: medication.prescribedBy || '',
                prescribedDate: medication.prescribedDate
                    ? new Date(medication.prescribedDate).toISOString().split('T')[0]
                    : '',
                pharmacy: medication.pharmacy || { name: '', phone: '', address: '' },
                refillsRemaining: medication.refillsRemaining || 0,
                nextRefillDate: medication.nextRefillDate
                    ? new Date(medication.nextRefillDate).toISOString().split('T')[0]
                    : '',
                purpose: medication.purpose || '',
                instructions: medication.instructions || '',
                reminderEnabled: medication.reminderEnabled || false,
                reminderTimes: medication.reminderTimes || [],
                scannedData: medication.scannedData || null
            });
            // Try to match existing pharmacy to user's saved pharmacies
            if (medication.pharmacy?.name && userPharmacies.length > 0) {
                const matchedPharmacy = userPharmacies.find(
                    p => p.name.toLowerCase() === medication.pharmacy.name.toLowerCase()
                );
                setSelectedPharmacyId(matchedPharmacy?._id || 'other');
            } else {
                setSelectedPharmacyId(medication.pharmacy?.name ? 'other' : '');
            }
            setActiveTab('manual');
        } else {
            resetForm();
        }
    }, [medication, isOpen, userPharmacies]);

    const resetForm = () => {
        setFormData({
            name: '',
            genericName: '',
            dosage: { amount: '', unit: 'mg' },
            frequency: 'once daily',
            timeOfDay: [],
            prescribedBy: '',
            prescribedDate: '',
            pharmacy: { name: '', phone: '', address: '' },
            refillsRemaining: 0,
            nextRefillDate: '',
            purpose: '',
            instructions: '',
            reminderEnabled: false,
            reminderTimes: [],
            scannedData: null
        });
        setActiveTab(isMobile ? 'scan' : 'manual');
        setShowScanner(false);
        setShowDeleteConfirm(false);
        setSelectedPharmacyId('');
    };

    const handlePharmacySelect = (e) => {
        const pharmacyId = e.target.value;
        setSelectedPharmacyId(pharmacyId);

        if (pharmacyId === '' || pharmacyId === 'other') {
            // Clear pharmacy or enable manual entry
            if (pharmacyId === '') {
                setFormData(prev => ({
                    ...prev,
                    pharmacy: { name: '', phone: '', address: '' }
                }));
            }
            // For 'other', keep the fields but let user edit
        } else {
            // Find selected pharmacy and populate fields
            const selectedPharmacy = userPharmacies.find(p => p._id === pharmacyId);
            if (selectedPharmacy) {
                const addressStr = selectedPharmacy.address
                    ? [
                        selectedPharmacy.address.street,
                        selectedPharmacy.address.city,
                        selectedPharmacy.address.state,
                        selectedPharmacy.address.zipCode
                    ].filter(Boolean).join(', ')
                    : '';
                setFormData(prev => ({
                    ...prev,
                    pharmacy: {
                        name: selectedPharmacy.name,
                        phone: selectedPharmacy.phone || '',
                        address: addressStr
                    }
                }));
            }
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleTimeOfDayChange = (time) => {
        setFormData(prev => ({
            ...prev,
            timeOfDay: prev.timeOfDay.includes(time)
                ? prev.timeOfDay.filter(t => t !== time)
                : [...prev.timeOfDay, time]
        }));
    };

    const handleDrugSelect = (drugInfo) => {
        console.log('Drug selected:', drugInfo); // Debug log

        // Extract values with fallbacks
        const medicationName = drugInfo.fullName || drugInfo.name || '';
        const genericName = drugInfo.genericName || drugInfo.synonym || '';
        const strength = drugInfo.strength || '';
        const unit = drugInfo.unit || 'mg';

        setFormData(prev => ({
            ...prev,
            name: medicationName || prev.name,
            genericName: genericName || prev.genericName,
            dosage: {
                amount: strength || prev.dosage.amount,
                unit: unit || prev.dosage.unit
            },
            rxcui: drugInfo.rxcui || prev.rxcui
        }));
    };

    const handleScanSuccess = (drugInfo) => {
        setFormData(prev => ({
            ...prev,
            name: drugInfo.name || '',
            genericName: drugInfo.genericName || '',
            dosage: {
                amount: drugInfo.strength?.replace(/[^\d.]/g, '') || '',
                unit: prev.dosage.unit
            },
            scannedData: drugInfo.scannedData || null
        }));
        setShowScanner(false);
        setActiveTab('manual');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete(medication._id);
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

    const frequencyOptions = [
        { value: 'once daily', label: 'Once daily' },
        { value: 'twice daily', label: 'Twice daily' },
        { value: 'three times daily', label: 'Three times daily' },
        { value: 'four times daily', label: 'Four times daily' },
        { value: 'as needed', label: 'As needed' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'other', label: 'Other' }
    ];

    const timeOfDayOptions = [
        { value: 'morning', label: 'Morning' },
        { value: 'afternoon', label: 'Afternoon' },
        { value: 'evening', label: 'Evening' },
        { value: 'bedtime', label: 'Bedtime' },
        { value: 'with meals', label: 'With meals' }
    ];

    const unitOptions = [
        { value: 'mg', label: 'mg' },
        { value: 'mcg', label: 'mcg' },
        { value: 'g', label: 'g' },
        { value: 'ml', label: 'ml' },
        { value: 'units', label: 'units' },
        { value: 'other', label: 'other' }
    ];

    return (
        <div className="medication-modal-overlay" onClick={handleClose}>
            <div
                className={`medication-modal ${isMobile ? 'mobile' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                {showScanner ? (
                    <BarcodeScanner
                        onScanSuccess={handleScanSuccess}
                        onScanError={() => {}}
                        onClose={() => setShowScanner(false)}
                    />
                ) : (
                    <>
                        <div className="medication-modal-header">
                            <h2 className="medication-modal-title">
                                {isEditMode ? 'Edit Medication' : 'Add Medication'}
                            </h2>
                            <button
                                type="button"
                                className="medication-modal-close"
                                onClick={handleClose}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {!isEditMode && (
                            <div className="medication-modal-tabs">
                                <button
                                    type="button"
                                    className={`medication-modal-tab ${activeTab === 'scan' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('scan')}
                                >
                                    Scan
                                </button>
                                <button
                                    type="button"
                                    className={`medication-modal-tab ${activeTab === 'manual' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('manual')}
                                >
                                    Manual
                                </button>
                            </div>
                        )}

                        <div className="medication-modal-content">
                            {activeTab === 'scan' && !isEditMode ? (
                                <div className="medication-modal-scan-prompt">
                                    <div className="scan-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <path d="M7 7h.01" />
                                            <path d="M17 7h.01" />
                                            <path d="M7 17h.01" />
                                            <path d="M17 17h.01" />
                                            <path d="M7 12h10" />
                                        </svg>
                                    </div>
                                    <h3>Scan Medication Barcode</h3>
                                    <p>Use your camera to scan the barcode on your medication packaging</p>
                                    <button
                                        type="button"
                                        className="scan-start-btn"
                                        onClick={() => setShowScanner(true)}
                                    >
                                        Open Camera
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="medication-form">
                                    {interactions.length > 0 && (
                                        <InteractionAlert interactions={interactions} />
                                    )}

                                    {!isEditMode && (
                                        <div className="form-group">
                                            <label className="form-label">Search Medication</label>
                                            <DrugSearch
                                                onSelect={handleDrugSelect}
                                                placeholder="Type medication name..."
                                            />
                                        </div>
                                    )}

                                    <div className="form-divider">
                                        <span>Medication Details</span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="med-name">
                                            Medication Name *
                                        </label>
                                        <input
                                            id="med-name"
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g., Lisinopril"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="med-generic">
                                            Generic Name
                                        </label>
                                        <input
                                            id="med-generic"
                                            type="text"
                                            name="genericName"
                                            className="form-input"
                                            value={formData.genericName}
                                            onChange={handleChange}
                                            placeholder="e.g., Prinivil"
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="med-dosage-amount">
                                                Dosage
                                            </label>
                                            <input
                                                id="med-dosage-amount"
                                                type="text"
                                                name="dosage.amount"
                                                className="form-input"
                                                value={formData.dosage.amount}
                                                onChange={handleChange}
                                                placeholder="e.g., 10"
                                            />
                                        </div>
                                        <div className="form-group form-group-small">
                                            <label className="form-label" htmlFor="med-dosage-unit">
                                                Unit
                                            </label>
                                            <select
                                                id="med-dosage-unit"
                                                name="dosage.unit"
                                                className="form-select"
                                                value={formData.dosage.unit}
                                                onChange={handleChange}
                                            >
                                                {unitOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="med-frequency">
                                            Frequency
                                        </label>
                                        <select
                                            id="med-frequency"
                                            name="frequency"
                                            className="form-select"
                                            value={formData.frequency}
                                            onChange={handleChange}
                                        >
                                            {frequencyOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Time of Day</label>
                                        <div className="form-checkbox-group">
                                            {timeOfDayOptions.map(opt => (
                                                <label key={opt.value} className="form-checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.timeOfDay.includes(opt.value)}
                                                        onChange={() => handleTimeOfDayChange(opt.value)}
                                                    />
                                                    <span className="form-checkbox-text">{opt.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-divider">
                                        <span>Prescription Info</span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="med-prescriber">
                                            Prescribing Doctor
                                        </label>
                                        {userDoctors.length > 0 ? (
                                            <select
                                                id="med-prescriber"
                                                name="prescribedBy"
                                                className="form-select"
                                                value={formData.prescribedBy}
                                                onChange={handleChange}
                                            >
                                                <option value="">-- Select a doctor --</option>
                                                {userDoctors.map(doctor => (
                                                    <option key={doctor._id} value={doctor.name}>
                                                        {doctor.name}
                                                        {doctor.specialty ? ` (${doctor.specialty})` : ''}
                                                    </option>
                                                ))}
                                                <option value="__other__">Other (enter manually)</option>
                                            </select>
                                        ) : (
                                            <div className="form-no-doctors">
                                                <p>No doctors added yet.</p>
                                                <a href="/doctors" className="form-add-doctor-link">
                                                    Add your doctors first →
                                                </a>
                                            </div>
                                        )}
                                        {formData.prescribedBy === '__other__' && (
                                            <input
                                                type="text"
                                                name="prescribedByManual"
                                                className="form-input"
                                                placeholder="Enter doctor's name"
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    prescribedBy: e.target.value || '__other__'
                                                }))}
                                                style={{ marginTop: '8px' }}
                                            />
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="med-prescribed-date">
                                            Prescribed Date
                                        </label>
                                        <input
                                            id="med-prescribed-date"
                                            type="date"
                                            name="prescribedDate"
                                            className="form-input"
                                            value={formData.prescribedDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-divider">
                                        <span>Pharmacy</span>
                                    </div>

                                    {userPharmacies.length > 0 && (
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="med-pharmacy-select">
                                                Select Pharmacy
                                            </label>
                                            <select
                                                id="med-pharmacy-select"
                                                className="form-select"
                                                value={selectedPharmacyId}
                                                onChange={handlePharmacySelect}
                                            >
                                                <option value="">-- Select a pharmacy --</option>
                                                {userPharmacies.map(pharmacy => (
                                                    <option key={pharmacy._id} value={pharmacy._id}>
                                                        {pharmacy.name}
                                                        {pharmacy.isPreferred ? ' (Preferred)' : ''}
                                                    </option>
                                                ))}
                                                <option value="other">Other (enter manually)</option>
                                            </select>
                                        </div>
                                    )}

                                    {(selectedPharmacyId === 'other' || userPharmacies.length === 0) && (
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="med-pharmacy-name">
                                                Pharmacy Name
                                            </label>
                                            <input
                                                id="med-pharmacy-name"
                                                type="text"
                                                name="pharmacy.name"
                                                className="form-input"
                                                value={formData.pharmacy.name}
                                                onChange={handleChange}
                                                placeholder="e.g., CVS Pharmacy"
                                            />
                                        </div>
                                    )}

                                    {(selectedPharmacyId === 'other' || userPharmacies.length === 0) && (
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="med-pharmacy-phone">
                                                    Phone
                                                </label>
                                                <input
                                                    id="med-pharmacy-phone"
                                                    type="tel"
                                                    name="pharmacy.phone"
                                                    className="form-input"
                                                    value={formData.pharmacy.phone}
                                                    onChange={handleChange}
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="med-refills">
                                                    Refills Remaining
                                                </label>
                                                <input
                                                    id="med-refills"
                                                    type="number"
                                                    name="refillsRemaining"
                                                    className="form-input"
                                                    value={formData.refillsRemaining}
                                                    onChange={handleChange}
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedPharmacyId && selectedPharmacyId !== 'other' && userPharmacies.length > 0 && (
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="med-refills">
                                                Refills Remaining
                                            </label>
                                            <input
                                                id="med-refills"
                                                type="number"
                                                name="refillsRemaining"
                                                className="form-input"
                                                value={formData.refillsRemaining}
                                                onChange={handleChange}
                                                min="0"
                                            />
                                        </div>
                                    )}

                                    {(selectedPharmacyId === 'other' || userPharmacies.length === 0) && (
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="med-pharmacy-address">
                                                Address
                                            </label>
                                            <input
                                                id="med-pharmacy-address"
                                                type="text"
                                                name="pharmacy.address"
                                                className="form-input"
                                                value={formData.pharmacy.address}
                                                onChange={handleChange}
                                                placeholder="123 Main St, City, State"
                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="med-next-refill">
                                            Next Refill Date
                                        </label>
                                        <input
                                            id="med-next-refill"
                                            type="date"
                                            name="nextRefillDate"
                                            className="form-input"
                                            value={formData.nextRefillDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-divider">
                                        <span>Additional Info</span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="med-purpose">
                                            Purpose
                                        </label>
                                        <textarea
                                            id="med-purpose"
                                            name="purpose"
                                            className="form-textarea"
                                            value={formData.purpose}
                                            onChange={handleChange}
                                            placeholder="e.g., Blood pressure control"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="med-instructions">
                                            Special Instructions
                                        </label>
                                        <textarea
                                            id="med-instructions"
                                            name="instructions"
                                            className="form-textarea"
                                            value={formData.instructions}
                                            onChange={handleChange}
                                            placeholder="e.g., Take with food"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="form-divider">
                                        <span>Reminders</span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-toggle-label">
                                            <input
                                                type="checkbox"
                                                name="reminderEnabled"
                                                checked={formData.reminderEnabled}
                                                onChange={handleChange}
                                            />
                                            <span className="form-toggle"></span>
                                            <span className="form-toggle-text">Enable medication reminders</span>
                                        </label>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="medication-modal-footer">
                            {isEditMode && (
                                <button
                                    type="button"
                                    className={`medication-modal-delete ${showDeleteConfirm ? 'confirm' : ''}`}
                                    onClick={handleDelete}
                                >
                                    {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
                                </button>
                            )}
                            <div className="medication-modal-actions">
                                <button
                                    type="button"
                                    className="medication-modal-cancel"
                                    onClick={handleClose}
                                >
                                    Cancel
                                </button>
                                {(activeTab === 'manual' || isEditMode) && (
                                    <button
                                        type="submit"
                                        className="medication-modal-save"
                                        onClick={handleSubmit}
                                    >
                                        {isEditMode ? 'Save Changes' : 'Add Medication'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MedicationModal;
