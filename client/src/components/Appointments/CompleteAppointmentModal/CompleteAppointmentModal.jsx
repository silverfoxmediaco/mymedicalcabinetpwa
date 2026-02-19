import React, { useState, useMemo } from 'react';
import './CompleteAppointmentModal.css';

const CompleteAppointmentModal = ({
    isOpen,
    onClose,
    onComplete,
    onPostVisitActions,
    appointment,
    doctors = [],
    isMobile = false
}) => {
    const [step, setStep] = useState(1);
    const [visitSummary, setVisitSummary] = useState('');
    const [notes, setNotes] = useState('');
    const [prescriptions, setPrescriptions] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completionResult, setCompletionResult] = useState(null);
    const [wantFollowUp, setWantFollowUp] = useState(false);
    const [followUpDateTime, setFollowUpDateTime] = useState('');
    const [wantSaveDoctor, setWantSaveDoctor] = useState(false);
    const [isSavingActions, setIsSavingActions] = useState(false);

    const frequencyOptions = [
        { value: 'once daily', label: 'Once daily' },
        { value: 'twice daily', label: 'Twice daily' },
        { value: 'three times daily', label: 'Three times daily' },
        { value: 'four times daily', label: 'Four times daily' },
        { value: 'as needed', label: 'As needed' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'other', label: 'Other' }
    ];

    const unitOptions = [
        { value: 'mg', label: 'mg' },
        { value: 'mcg', label: 'mcg' },
        { value: 'g', label: 'g' },
        { value: 'ml', label: 'ml' },
        { value: 'units', label: 'units' },
        { value: 'other', label: 'other' }
    ];

    // Check if appointment doctor is already saved in user's doctors list
    const isDoctorAlreadySaved = useMemo(() => {
        if (!appointment || !doctors.length) return false;
        const apptDoctorName = (appointment.doctorName || '').toLowerCase().trim();
        return doctors.some(d => (d.name || '').toLowerCase().trim() === apptDoctorName);
    }, [appointment, doctors]);

    // Generate default follow-up date (2 weeks out) in local datetime format
    const defaultFollowUpDate = useMemo(() => {
        const twoWeeksOut = new Date();
        twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);
        twoWeeksOut.setHours(9, 0, 0, 0);
        // Format for datetime-local input: YYYY-MM-DDTHH:MM
        const year = twoWeeksOut.getFullYear();
        const month = String(twoWeeksOut.getMonth() + 1).padStart(2, '0');
        const day = String(twoWeeksOut.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T09:00`;
    }, []);

    const handleAddPrescription = () => {
        setPrescriptions([
            ...prescriptions,
            {
                medicationName: '',
                dosage: { amount: '', unit: 'mg' },
                frequency: 'once daily',
                duration: '',
                instructions: ''
            }
        ]);
    };

    const handleRemovePrescription = (index) => {
        setPrescriptions(prescriptions.filter((_, i) => i !== index));
    };

    const handlePrescriptionChange = (index, field, value) => {
        const updated = [...prescriptions];
        if (field.startsWith('dosage.')) {
            const dosageField = field.replace('dosage.', '');
            updated[index].dosage = {
                ...updated[index].dosage,
                [dosageField]: value
            };
        } else {
            updated[index][field] = value;
        }
        setPrescriptions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!visitSummary.trim()) {
            alert('Please provide a visit summary');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await onComplete({
                visitSummary: visitSummary.trim(),
                notes: notes.trim(),
                prescriptions: prescriptions.filter(p => p.medicationName.trim())
            });
            setCompletionResult(result);
            setFollowUpDateTime(defaultFollowUpDate);
            setStep(2);
        } catch (error) {
            console.error('Error completing appointment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStepTwoDone = async () => {
        if (!wantFollowUp && !wantSaveDoctor) {
            // Nothing selected, just close
            resetForm();
            return;
        }

        setIsSavingActions(true);
        try {
            const actions = {};

            if (wantFollowUp && followUpDateTime) {
                actions.followUp = { dateTime: followUpDateTime };
            }
            if (wantSaveDoctor) {
                actions.saveDoctor = true;
            }
            actions.appointment = appointment;

            await onPostVisitActions(actions);
            resetForm();
        } catch (error) {
            console.error('Error saving post-visit actions:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSavingActions(false);
        }
    };

    const handleSkipDone = () => {
        resetForm();
    };

    const resetForm = () => {
        setVisitSummary('');
        setNotes('');
        setPrescriptions([]);
        setStep(1);
        setCompletionResult(null);
        setWantFollowUp(false);
        setFollowUpDateTime('');
        setWantSaveDoctor(false);
        onClose();
    };

    const handleClose = () => {
        resetForm();
    };

    if (!isOpen || !appointment) return null;

    const medicationCount = completionResult?.medications?.length || 0;

    const CloseIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );

    const PlusIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );

    const TrashIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    );

    const CheckCircleIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );

    return (
        <div className="complete-modal-overlay" onClick={handleClose}>
            <div
                className={`complete-modal ${isMobile ? 'mobile' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="complete-modal-header">
                    <h2 className="complete-modal-title">
                        {step === 1
                            ? `Complete Visit: ${appointment.title}`
                            : 'Visit Completed'}
                    </h2>
                    <button
                        type="button"
                        className="complete-modal-close"
                        onClick={handleClose}
                    >
                        <CloseIcon />
                    </button>
                </div>

                <div className="complete-modal-content">
                    {step === 1 ? (
                        <form onSubmit={handleSubmit} className="complete-form">
                            <div className="form-group">
                                <label className="form-label" htmlFor="complete-visit-summary">
                                    Visit Summary *
                                </label>
                                <textarea
                                    id="complete-visit-summary"
                                    className="form-textarea"
                                    value={visitSummary}
                                    onChange={(e) => setVisitSummary(e.target.value)}
                                    placeholder="What happened during this visit?"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="complete-notes">
                                    Additional Notes
                                </label>
                                <textarea
                                    id="complete-notes"
                                    className="form-textarea"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any follow-up instructions, things to remember..."
                                    rows={3}
                                />
                            </div>

                            <div className="complete-prescriptions-section">
                                <div className="complete-prescriptions-header">
                                    <h3 className="complete-prescriptions-title">Prescriptions</h3>
                                    <button
                                        type="button"
                                        className="complete-add-prescription-btn"
                                        onClick={handleAddPrescription}
                                    >
                                        <PlusIcon />
                                        Add Prescription
                                    </button>
                                </div>

                                {prescriptions.length === 0 ? (
                                    <p className="complete-no-prescriptions">
                                        No prescriptions added. Click "Add Prescription" if any were given.
                                    </p>
                                ) : (
                                    <div className="complete-prescriptions-list">
                                        {prescriptions.map((prescription, index) => (
                                            <div key={index} className="complete-prescription-card">
                                                <div className="complete-prescription-header">
                                                    <span className="complete-prescription-number">
                                                        Prescription {index + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="complete-prescription-remove"
                                                        onClick={() => handleRemovePrescription(index)}
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Medication Name *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={prescription.medicationName}
                                                        onChange={(e) => handlePrescriptionChange(index, 'medicationName', e.target.value)}
                                                        placeholder="e.g., Amoxicillin"
                                                    />
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label className="form-label">Dosage</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={prescription.dosage.amount}
                                                            onChange={(e) => handlePrescriptionChange(index, 'dosage.amount', e.target.value)}
                                                            placeholder="e.g., 500"
                                                        />
                                                    </div>
                                                    <div className="form-group form-group-small">
                                                        <label className="form-label">Unit</label>
                                                        <select
                                                            className="form-select"
                                                            value={prescription.dosage.unit}
                                                            onChange={(e) => handlePrescriptionChange(index, 'dosage.unit', e.target.value)}
                                                        >
                                                            {unitOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label className="form-label">Frequency</label>
                                                        <select
                                                            className="form-select"
                                                            value={prescription.frequency}
                                                            onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                                                        >
                                                            {frequencyOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Duration</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={prescription.duration}
                                                            onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                                                            placeholder="e.g., 7 days"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">Instructions</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={prescription.instructions}
                                                        onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                                                        placeholder="e.g., Take with food"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>
                    ) : (
                        /* Step 2: Post-Visit Success & Actions */
                        <div className="complete-step2-container">
                            <div className="complete-step2-confirmations">
                                <div className="complete-step2-confirm-item">
                                    <CheckCircleIcon />
                                    <span>Visit recorded in your medical records</span>
                                </div>
                                {medicationCount > 0 && (
                                    <div className="complete-step2-confirm-item">
                                        <CheckCircleIcon />
                                        <span>
                                            {medicationCount} medication{medicationCount !== 1 ? 's' : ''} added to My Medications
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="complete-step2-divider">
                                <span>What's Next?</span>
                            </div>

                            <div className="complete-step2-actions">
                                <label className="complete-step2-action-toggle">
                                    <input
                                        type="checkbox"
                                        checked={wantFollowUp}
                                        onChange={(e) => setWantFollowUp(e.target.checked)}
                                    />
                                    <span className="complete-step2-action-label">
                                        Schedule a follow-up appointment
                                    </span>
                                </label>

                                {wantFollowUp && (
                                    <div className="complete-step2-followup-fields">
                                        <div className="form-group">
                                            <label className="form-label" htmlFor="complete-followup-datetime">
                                                Follow-up Date & Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                id="complete-followup-datetime"
                                                className="form-input"
                                                value={followUpDateTime}
                                                onChange={(e) => setFollowUpDateTime(e.target.value)}
                                            />
                                        </div>
                                        <p className="complete-step2-prefill-note">
                                            Doctor, specialty, and location will be copied from this visit.
                                        </p>
                                    </div>
                                )}

                                {!isDoctorAlreadySaved && appointment.doctorName && (
                                    <label className="complete-step2-action-toggle">
                                        <input
                                            type="checkbox"
                                            checked={wantSaveDoctor}
                                            onChange={(e) => setWantSaveDoctor(e.target.checked)}
                                        />
                                        <span className="complete-step2-action-label">
                                            Save Dr. {appointment.doctorName} to My Doctors
                                        </span>
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="complete-modal-footer">
                    <div className="complete-modal-actions">
                        {step === 1 ? (
                            <>
                                <button
                                    type="button"
                                    className="complete-modal-cancel"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="complete-modal-submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Completing...' : 'Complete Visit'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="complete-modal-cancel"
                                    onClick={handleSkipDone}
                                    disabled={isSavingActions}
                                >
                                    Done
                                </button>
                                {(wantFollowUp || wantSaveDoctor) && (
                                    <button
                                        type="button"
                                        className="complete-modal-submit complete-step2-save-btn"
                                        onClick={handleStepTwoDone}
                                        disabled={isSavingActions}
                                    >
                                        {isSavingActions ? 'Saving...' : 'Save & Done'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteAppointmentModal;
