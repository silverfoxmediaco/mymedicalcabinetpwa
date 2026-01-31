import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import RecordModal from '../../components/MedicalRecords/RecordModal';
import { medicalRecordsService } from '../../services/medicalRecordsService';
import './MyMedicalRecords.css';

const MyMedicalRecords = ({ onLogout }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [records, setRecords] = useState({
        events: [],
        conditions: [],
        allergies: [],
        surgeries: [],
        familyHistory: [],
        bloodType: 'unknown',
        height: { value: null, unit: 'in' },
        weight: { value: null, unit: 'lb' }
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('condition');
    const [editingRecord, setEditingRecord] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
            return;
        }
        loadRecords();
    }, [navigate]);

    const loadRecords = async () => {
        setIsLoading(true);
        try {
            const response = await medicalRecordsService.getAll();
            if (response.success && response.medicalHistory) {
                const mh = response.medicalHistory;
                setRecords({
                    events: mh.events || [],
                    conditions: mh.conditions || [],
                    allergies: mh.allergies || [],
                    surgeries: mh.surgeries || [],
                    familyHistory: mh.familyHistory || [],
                    bloodType: mh.bloodType || 'unknown',
                    height: mh.height || { value: null, unit: 'in' },
                    weight: mh.weight || { value: null, unit: 'lb' }
                });
            }
        } catch (error) {
            console.error('Error loading records:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (type, record = null) => {
        setModalType(type);
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
    };

    const handleSaveRecord = async (formData) => {
        try {
            if (modalType === 'vitals') {
                await medicalRecordsService.updateVitals(formData);
            } else if (editingRecord) {
                // No edit endpoint - delete and re-add
                await handleDeleteRecord(editingRecord._id);
                if (modalType === 'event') await medicalRecordsService.addEvent(formData);
                else if (modalType === 'condition') await medicalRecordsService.addCondition(formData);
                else if (modalType === 'allergy') await medicalRecordsService.addAllergy(formData);
                else if (modalType === 'surgery') await medicalRecordsService.addSurgery(formData);
                else if (modalType === 'familyHistory') await medicalRecordsService.addFamilyHistory(formData);
            } else {
                if (modalType === 'event') await medicalRecordsService.addEvent(formData);
                else if (modalType === 'condition') await medicalRecordsService.addCondition(formData);
                else if (modalType === 'allergy') await medicalRecordsService.addAllergy(formData);
                else if (modalType === 'surgery') await medicalRecordsService.addSurgery(formData);
                else if (modalType === 'familyHistory') await medicalRecordsService.addFamilyHistory(formData);
            }
            await loadRecords();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving record:', error);
            alert('Failed to save record. Please try again.');
        }
    };

    const handleDeleteRecord = async (recordId) => {
        try {
            if (modalType === 'event') await medicalRecordsService.deleteEvent(recordId);
            else if (modalType === 'condition') await medicalRecordsService.deleteCondition(recordId);
            else if (modalType === 'allergy') await medicalRecordsService.deleteAllergy(recordId);
            else if (modalType === 'surgery') await medicalRecordsService.deleteSurgery(recordId);
            else if (modalType === 'familyHistory') await medicalRecordsService.deleteFamilyHistory(recordId);
            const key = modalType === 'familyHistory' ? 'familyHistory' : `${modalType}s`;
            setRecords(prev => ({
                ...prev,
                [key]: prev[key].filter(r => r._id !== recordId)
            }));
            handleCloseModal();
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatHeight = () => {
        if (!records.height?.value) return '—';
        if (records.height.unit === 'in') {
            const feet = Math.floor(records.height.value / 12);
            const inches = records.height.value % 12;
            return `${feet}'${inches}"`;
        }
        return `${records.height.value} cm`;
    };

    const formatWeight = () => {
        if (!records.weight?.value) return '—';
        return `${records.weight.value} ${records.weight.unit}`;
    };

    const getSeverityClass = (severity) => {
        switch (severity) {
            case 'severe': return 'severity-severe';
            case 'moderate': return 'severity-moderate';
            case 'mild': return 'severity-mild';
            default: return '';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'active': return 'status-active';
            case 'managed': return 'status-managed';
            case 'resolved': return 'status-resolved';
            default: return '';
        }
    };

    const getEventTypeLabel = (eventType) => {
        const labels = {
            'physical': 'Annual Physical',
            'checkup': 'Check-up',
            'specialist': 'Specialist Visit',
            'urgent_care': 'Urgent Care',
            'er_visit': 'ER Visit',
            'hospital_stay': 'Hospital Stay',
            'procedure': 'Procedure',
            'lab_work': 'Lab Work',
            'imaging': 'Imaging',
            'vaccination': 'Vaccination',
            'therapy': 'Therapy Session',
            'other': 'Other'
        };
        return labels[eventType] || eventType;
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 425;

    const PlusIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );

    const EditIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );

    if (!user) {
        return null;
    }

    return (
        <div className="records-page">
            <MemberHeader user={user} onLogout={onLogout} />

            <main className="records-main">
                <div className="records-container">
                    <a href="/dashboard" className="back-to-dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Dashboard
                    </a>
                    <div className="records-header">
                        <h1 className="records-title">My Medical Records</h1>
                        <p className="records-subtitle">
                            Track your health history and important medical information
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="records-loading">
                            <div className="records-spinner"></div>
                            <p>Loading records...</p>
                        </div>
                    ) : (
                        <div className="records-sections">
                            {/* Events Section */}
                            <section className="records-section records-section-events">
                                <div className="records-section-header">
                                    <h2 className="records-section-title">
                                        <svg className="records-section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                        </svg>
                                        Events
                                        <span className="records-count">{records.events.length}</span>
                                    </h2>
                                    <button
                                        className="records-section-add"
                                        onClick={() => handleOpenModal('event')}
                                    >
                                        <PlusIcon />
                                        <span>Add</span>
                                    </button>
                                </div>
                                <p className="records-section-desc">Track health visits and episodes of care</p>
                                <div className="events-preview">
                                    {records.events.length === 0 ? (
                                        <div
                                            className="event-preview-item event-preview-sample"
                                            onClick={() => handleOpenModal('event')}
                                        >
                                            <div className="event-preview-dot"></div>
                                            <div className="event-preview-content">
                                                <span className="event-preview-title">Chest Pain</span>
                                                <span className="event-preview-date">ER Visit - Jan 15, 2026</span>
                                            </div>
                                            <svg className="event-preview-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 18l6-6-6-6" />
                                            </svg>
                                        </div>
                                    ) : (
                                        records.events.map(event => (
                                            <div
                                                key={event._id}
                                                className="event-preview-item"
                                                onClick={() => handleOpenModal('event', event)}
                                            >
                                                <div className="event-preview-dot"></div>
                                                <div className="event-preview-content">
                                                    <span className="event-preview-title">{event.description}</span>
                                                    <span className="event-preview-date">{getEventTypeLabel(event.eventType)} - {formatDate(event.date)}</span>
                                                </div>
                                                <svg className="event-preview-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                            </div>
                                        ))
                                    )}
                            </section>

                            {/* Vitals Section */}
                            <section className="records-section">
                                <div className="records-section-header">
                                    <h2 className="records-section-title">Vitals</h2>
                                    <button
                                        className="records-section-edit"
                                        onClick={() => handleOpenModal('vitals', records)}
                                    >
                                        <EditIcon />
                                        <span>Edit</span>
                                    </button>
                                </div>
                                <div className="vitals-grid">
                                    <div className="vitals-item">
                                        <span className="vitals-label">Blood Type</span>
                                        <span className="vitals-value">{records.bloodType || '—'}</span>
                                    </div>
                                    <div className="vitals-item">
                                        <span className="vitals-label">Height</span>
                                        <span className="vitals-value">{formatHeight()}</span>
                                    </div>
                                    <div className="vitals-item">
                                        <span className="vitals-label">Weight</span>
                                        <span className="vitals-value">{formatWeight()}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Conditions Section */}
                            <section className="records-section">
                                <div className="records-section-header">
                                    <h2 className="records-section-title">
                                        Conditions
                                        <span className="records-count">{records.conditions.length}</span>
                                    </h2>
                                    <button
                                        className="records-section-add"
                                        onClick={() => handleOpenModal('condition')}
                                    >
                                        <PlusIcon />
                                        <span>Add</span>
                                    </button>
                                </div>
                                {records.conditions.length === 0 ? (
                                    <p className="records-empty-text">No conditions recorded</p>
                                ) : (
                                    <div className="records-list">
                                        {records.conditions.map(condition => (
                                            <div
                                                key={condition._id}
                                                className="record-item"
                                                onClick={() => handleOpenModal('condition', condition)}
                                            >
                                                <div className="record-item-main">
                                                    <span className="record-item-name">{condition.name}</span>
                                                    <span className={`record-item-badge ${getStatusClass(condition.status)}`}>
                                                        {condition.status}
                                                    </span>
                                                </div>
                                                {condition.diagnosedDate && (
                                                    <span className="record-item-detail">
                                                        Diagnosed: {formatDate(condition.diagnosedDate)}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Allergies Section */}
                            <section className="records-section">
                                <div className="records-section-header">
                                    <h2 className="records-section-title">
                                        Allergies
                                        <span className="records-count">{records.allergies.length}</span>
                                    </h2>
                                    <button
                                        className="records-section-add"
                                        onClick={() => handleOpenModal('allergy')}
                                    >
                                        <PlusIcon />
                                        <span>Add</span>
                                    </button>
                                </div>
                                {records.allergies.length === 0 ? (
                                    <p className="records-empty-text">No allergies recorded</p>
                                ) : (
                                    <div className="records-list">
                                        {records.allergies.map(allergy => (
                                            <div
                                                key={allergy._id}
                                                className="record-item"
                                                onClick={() => handleOpenModal('allergy', allergy)}
                                            >
                                                <div className="record-item-main">
                                                    <span className="record-item-name">{allergy.allergen}</span>
                                                    <span className={`record-item-badge ${getSeverityClass(allergy.severity)}`}>
                                                        {allergy.severity}
                                                    </span>
                                                </div>
                                                {allergy.reaction && (
                                                    <span className="record-item-detail">{allergy.reaction}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Surgeries Section */}
                            <section className="records-section">
                                <div className="records-section-header">
                                    <h2 className="records-section-title">
                                        Surgeries
                                        <span className="records-count">{records.surgeries.length}</span>
                                    </h2>
                                    <button
                                        className="records-section-add"
                                        onClick={() => handleOpenModal('surgery')}
                                    >
                                        <PlusIcon />
                                        <span>Add</span>
                                    </button>
                                </div>
                                {records.surgeries.length === 0 ? (
                                    <p className="records-empty-text">No surgeries recorded</p>
                                ) : (
                                    <div className="records-list">
                                        {records.surgeries.map(surgery => (
                                            <div
                                                key={surgery._id}
                                                className="record-item"
                                                onClick={() => handleOpenModal('surgery', surgery)}
                                            >
                                                <div className="record-item-main">
                                                    <span className="record-item-name">{surgery.procedure}</span>
                                                    {surgery.date && (
                                                        <span className="record-item-date">{formatDate(surgery.date)}</span>
                                                    )}
                                                </div>
                                                {surgery.hospital && (
                                                    <span className="record-item-detail">{surgery.hospital}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Family History Section */}
                            <section className="records-section">
                                <div className="records-section-header">
                                    <h2 className="records-section-title">
                                        Family History
                                        <span className="records-count">{records.familyHistory.length}</span>
                                    </h2>
                                    <button
                                        className="records-section-add"
                                        onClick={() => handleOpenModal('familyHistory')}
                                    >
                                        <PlusIcon />
                                        <span>Add</span>
                                    </button>
                                </div>
                                {records.familyHistory.length === 0 ? (
                                    <p className="records-empty-text">No family history recorded</p>
                                ) : (
                                    <div className="records-list">
                                        {records.familyHistory.map(history => (
                                            <div
                                                key={history._id}
                                                className="record-item"
                                                onClick={() => handleOpenModal('familyHistory', history)}
                                            >
                                                <div className="record-item-main">
                                                    <span className="record-item-name">{history.condition}</span>
                                                    <span className="record-item-relationship">
                                                        {history.relationship?.charAt(0).toUpperCase() + history.relationship?.slice(1)}
                                                    </span>
                                                </div>
                                                {history.notes && (
                                                    <span className="record-item-detail">{history.notes}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </main>

            <RecordModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveRecord}
                onDelete={handleDeleteRecord}
                type={modalType}
                record={editingRecord}
                isMobile={isMobile}
            />
        </div>
    );
};

export default MyMedicalRecords;
