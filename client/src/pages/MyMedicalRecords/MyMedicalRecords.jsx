import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import RecordModal from '../../components/MedicalRecords/RecordModal';
import ExplanationModal from '../../components/MedicalRecords/ExplanationModal/ExplanationModal';
import FamilyMemberTabs from '../../components/FamilyMemberTabs';
import { useFamilyMember } from '../../context/FamilyMemberContext';
import { medicalRecordsService } from '../../services/medicalRecordsService';
import { documentService } from '../../services/documentService';
import { explainDocument } from '../../services/aiService';
import doctorService from '../../services/doctorService';
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
    const [doctors, setDoctors] = useState([]);
    const [viewingEvent, setViewingEvent] = useState(null);
    const [viewingCondition, setViewingCondition] = useState(null);
    const [showDoctorDetails, setShowDoctorDetails] = useState(false);
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanationModal, setExplanationModal] = useState({
        isOpen: false, explanation: null, documentName: '', error: null
    });
    const { activeMemberId, getActiveMemberName } = useFamilyMember();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
            return;
        }
        loadRecords();
        fetchDoctors();
    }, [navigate]);

    useEffect(() => {
        loadRecords();
        fetchDoctors();
    }, [activeMemberId]);

    const fetchDoctors = async () => {
        try {
            const doctorsList = await doctorService.getAll(activeMemberId);
            setDoctors(doctorsList);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        }
    };

    const handleDoctorCreated = (newDoctor) => {
        setDoctors(prev => [...prev, newDoctor]);
    };

    const loadRecords = async () => {
        setIsLoading(true);
        try {
            const response = await medicalRecordsService.getAll(activeMemberId);
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
                await medicalRecordsService.updateVitals(formData, activeMemberId);
            } else if (editingRecord) {
                // No edit endpoint - delete and re-add
                await handleDeleteRecord(editingRecord._id);
                if (modalType === 'event') await medicalRecordsService.addEvent(formData, activeMemberId);
                else if (modalType === 'condition') await medicalRecordsService.addCondition(formData, activeMemberId);
                else if (modalType === 'allergy') await medicalRecordsService.addAllergy(formData, activeMemberId);
                else if (modalType === 'surgery') await medicalRecordsService.addSurgery(formData, activeMemberId);
                else if (modalType === 'familyHistory') await medicalRecordsService.addFamilyHistory(formData, activeMemberId);
            } else {
                if (modalType === 'event') await medicalRecordsService.addEvent(formData, activeMemberId);
                else if (modalType === 'condition') await medicalRecordsService.addCondition(formData, activeMemberId);
                else if (modalType === 'allergy') await medicalRecordsService.addAllergy(formData, activeMemberId);
                else if (modalType === 'surgery') await medicalRecordsService.addSurgery(formData, activeMemberId);
                else if (modalType === 'familyHistory') await medicalRecordsService.addFamilyHistory(formData, activeMemberId);
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

    const handleViewDocument = async (doc) => {
        const newWindow = window.open('', '_blank');
        try {
            const url = await documentService.getDownloadUrl(doc.s3Key);
            if (newWindow) newWindow.location.href = url;
        } catch (err) {
            if (newWindow) newWindow.close();
        }
    };

    const handleExplainDocument = async (doc) => {
        setIsExplaining(true);
        setExplanationModal({
            isOpen: true, explanation: null,
            documentName: doc.originalName || doc.name, error: null
        });
        try {
            const response = await explainDocument(doc.s3Key, doc.originalName || doc.name);
            setExplanationModal(prev => ({ ...prev, explanation: response.data.explanation }));
        } catch (err) {
            setExplanationModal(prev => ({ ...prev, error: err.message || 'Failed to analyze document' }));
        } finally {
            setIsExplaining(false);
        }
    };

    const closeExplanationModal = () => {
        setExplanationModal({ isOpen: false, explanation: null, documentName: '', error: null });
    };

    const getDocFileIcon = (mimeType) => {
        if (mimeType && mimeType.startsWith('image/')) {
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            );
        }
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        );
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 425;
    const activeMemberName = getActiveMemberName();
    const pageLabel = activeMemberId ? `${activeMemberName}'s Medical Records` : 'My Medical Records';

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

                    <FamilyMemberTabs />

                    <div className="records-header">
                        <h1 className="records-title">{pageLabel}</h1>
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
                                            >
                                                <div className="event-preview-dot"></div>
                                                <div className="event-preview-content">
                                                    <span className="event-preview-title">{event.description}</span>
                                                    <span className="event-preview-date">{getEventTypeLabel(event.eventType)} - {formatDate(event.date)}</span>
                                                </div>
                                                <button
                                                    className="event-preview-view-btn"
                                                    onClick={() => { setShowDoctorDetails(false); setViewingEvent(event); }}
                                                >
                                                    View
                                                </button>
                                                <svg className="event-preview-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
                                            </div>
                                        ))
                                    )}
                                </div>
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
                                                className="record-item cond-card-item"
                                            >
                                                <div className="record-item-main">
                                                    <span className="record-item-name">{condition.name}</span>
                                                    <div className="cond-card-actions">
                                                        <span className={`record-item-badge ${getStatusClass(condition.status)}`}>
                                                            {condition.status}
                                                        </span>
                                                        <button
                                                            className="cond-card-view-btn"
                                                            onClick={() => setViewingCondition(condition)}
                                                        >
                                                            View
                                                        </button>
                                                    </div>
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

            {/* Event View Modal */}
            {viewingEvent && (
                <div className="event-view-overlay" onClick={() => setViewingEvent(null)}>
                    <div
                        className={`event-view-modal ${isMobile ? 'mobile' : ''}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="event-view-header">
                            <h2 className="event-view-title">Event Details</h2>
                            <button
                                type="button"
                                className="event-view-close"
                                onClick={() => setViewingEvent(null)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="event-view-content">
                            <div className="event-view-row">
                                <span className="event-view-label">What Happened</span>
                                <span className="event-view-value">{viewingEvent.description}</span>
                            </div>
                            <div className="event-view-row">
                                <span className="event-view-label">Type</span>
                                <span className="event-view-value">{getEventTypeLabel(viewingEvent.eventType)}</span>
                            </div>
                            <div className="event-view-row">
                                <span className="event-view-label">Date</span>
                                <span className="event-view-value">{formatDate(viewingEvent.date)}</span>
                            </div>
                            {viewingEvent.doctorName && (() => {
                                const linkedDoctor = viewingEvent.doctorId
                                    ? doctors.find(d => d._id === viewingEvent.doctorId)
                                    : null;
                                return (
                                    <div className="event-view-row">
                                        <span className="event-view-label">Doctor</span>
                                        {linkedDoctor ? (
                                            <div className="event-view-doctor-section">
                                                <button
                                                    type="button"
                                                    className="event-view-doctor-link"
                                                    onClick={() => setShowDoctorDetails(prev => !prev)}
                                                >
                                                    {viewingEvent.doctorName}
                                                    <svg
                                                        className={`event-view-doctor-chevron ${showDoctorDetails ? 'open' : ''}`}
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <path d="M6 9l6 6 6-6" />
                                                    </svg>
                                                </button>
                                                {showDoctorDetails && (
                                                    <div className="event-view-doctor-card">
                                                        {linkedDoctor.specialty && (
                                                            <div className="event-view-doctor-detail">
                                                                <span className="event-view-doctor-detail-label">Specialty</span>
                                                                <span className="event-view-doctor-detail-value">{linkedDoctor.specialty}</span>
                                                            </div>
                                                        )}
                                                        {linkedDoctor.practice?.name && (
                                                            <div className="event-view-doctor-detail">
                                                                <span className="event-view-doctor-detail-label">Practice</span>
                                                                <span className="event-view-doctor-detail-value">{linkedDoctor.practice.name}</span>
                                                            </div>
                                                        )}
                                                        {(linkedDoctor.practice?.address?.street || linkedDoctor.practice?.address?.city) && (
                                                            <div className="event-view-doctor-detail">
                                                                <span className="event-view-doctor-detail-label">Address</span>
                                                                <span className="event-view-doctor-detail-value">
                                                                    {[
                                                                        linkedDoctor.practice.address.street,
                                                                        [linkedDoctor.practice.address.city, linkedDoctor.practice.address.state, linkedDoctor.practice.address.zipCode].filter(Boolean).join(', ')
                                                                    ].filter(Boolean).join('\n')}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {linkedDoctor.phone && (
                                                            <div className="event-view-doctor-detail">
                                                                <span className="event-view-doctor-detail-label">Phone</span>
                                                                <a href={`tel:${linkedDoctor.phone}`} className="event-view-doctor-phone">
                                                                    {linkedDoctor.phone}
                                                                </a>
                                                            </div>
                                                        )}
                                                        {linkedDoctor.fax && (
                                                            <div className="event-view-doctor-detail">
                                                                <span className="event-view-doctor-detail-label">Fax</span>
                                                                <span className="event-view-doctor-detail-value">{linkedDoctor.fax}</span>
                                                            </div>
                                                        )}
                                                        {linkedDoctor.email && (
                                                            <div className="event-view-doctor-detail">
                                                                <span className="event-view-doctor-detail-label">Email</span>
                                                                <a href={`mailto:${linkedDoctor.email}`} className="event-view-doctor-phone">
                                                                    {linkedDoctor.email}
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="event-view-value">{viewingEvent.doctorName}</span>
                                        )}
                                    </div>
                                );
                            })()}
                            {viewingEvent.provider && (
                                <div className="event-view-row">
                                    <span className="event-view-label">Provider / Facility</span>
                                    <span className="event-view-value">
                                        {viewingEvent.provider}
                                        {viewingEvent.providerAddress && (
                                            <span className="event-view-sub">{viewingEvent.providerAddress}</span>
                                        )}
                                    </span>
                                </div>
                            )}
                            {viewingEvent.notes && (
                                <div className="event-view-row">
                                    <span className="event-view-label">Notes</span>
                                    <span className="event-view-value">{viewingEvent.notes}</span>
                                </div>
                            )}

                            {/* Prescribed Medications */}
                            {viewingEvent.prescribedMedications && viewingEvent.prescribedMedications.length > 0 && (
                                <div className="event-view-rx-section">
                                    <span className="event-view-label">Prescribed Medications</span>
                                    <div className="event-view-rx-list">
                                        {viewingEvent.prescribedMedications.map((med, idx) => (
                                            <div key={med._id || idx} className="event-view-rx-card">
                                                <span className="event-view-rx-name">
                                                    {med.name || 'Unknown'}
                                                    {med.genericName && med.genericName !== med.name && (
                                                        <span className="event-view-rx-generic"> ({med.genericName})</span>
                                                    )}
                                                </span>
                                                {med.purpose && (
                                                    <span className="event-view-rx-purpose">{med.purpose}</span>
                                                )}
                                                <div className="event-view-rx-details">
                                                    {med.dosage?.amount && (
                                                        <span>{med.dosage.amount} {med.dosage.unit || 'mg'}</span>
                                                    )}
                                                    {med.frequency && (
                                                        <span>{med.frequency}</span>
                                                    )}
                                                </div>
                                                {med.instructions && (
                                                    <span className="event-view-rx-instructions">{med.instructions}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Documents */}
                            {viewingEvent.documents && viewingEvent.documents.length > 0 && (
                                <div className="event-view-docs-section">
                                    <span className="event-view-label">Documents</span>
                                    <div className="event-view-docs-list">
                                        {viewingEvent.documents.map((doc, idx) => (
                                            <div key={doc._id || idx} className="event-view-doc-item">
                                                <div className="event-view-doc-icon">
                                                    {getDocFileIcon(doc.mimeType)}
                                                </div>
                                                <div className="event-view-doc-info">
                                                    <span className="event-view-doc-name">{doc.originalName || doc.name || 'Document'}</span>
                                                    {doc.size > 0 && (
                                                        <span className="event-view-doc-size">{formatFileSize(doc.size)}</span>
                                                    )}
                                                </div>
                                                <div className="event-view-doc-actions">
                                                    {doc.s3Key && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="event-view-doc-view-btn"
                                                                onClick={() => handleViewDocument(doc)}
                                                                title="View document"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                    <circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="event-view-doc-ai-explain-btn"
                                                                onClick={() => handleExplainDocument(doc)}
                                                                disabled={isExplaining}
                                                                title="AI Explanation"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                                    <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4z" />
                                                                    <line x1="10" y1="14" x2="14" y2="14" />
                                                                    <line x1="10" y1="17" x2="14" y2="17" />
                                                                    <line x1="11" y1="20" x2="13" y2="20" />
                                                                </svg>
                                                                {isExplaining ? 'Analyzing...' : 'AI Explain'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="event-view-footer">
                            <button
                                type="button"
                                className="event-view-edit-btn"
                                onClick={() => {
                                    const eventToEdit = viewingEvent;
                                    setViewingEvent(null);
                                    handleOpenModal('event', eventToEdit);
                                }}
                            >
                                <EditIcon />
                                Edit Event
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Condition View Modal */}
            {viewingCondition && (
                <div className="cond-view-overlay" onClick={() => setViewingCondition(null)}>
                    <div
                        className={`cond-view-modal ${isMobile ? 'mobile' : ''}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="cond-view-header">
                            <h2 className="cond-view-title">Condition Details</h2>
                            <button
                                type="button"
                                className="cond-view-close"
                                onClick={() => setViewingCondition(null)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="cond-view-content">
                            <div className="cond-view-row">
                                <span className="cond-view-label">Condition</span>
                                <span className="cond-view-value">{viewingCondition.name}</span>
                            </div>
                            <div className="cond-view-row">
                                <span className="cond-view-label">Status</span>
                                <span className={`record-item-badge ${getStatusClass(viewingCondition.status)}`}>
                                    {viewingCondition.status}
                                </span>
                            </div>
                            {viewingCondition.diagnosedDate && (
                                <div className="cond-view-row">
                                    <span className="cond-view-label">Date Diagnosed</span>
                                    <span className="cond-view-value">{formatDate(viewingCondition.diagnosedDate)}</span>
                                </div>
                            )}
                            {viewingCondition.notes && (
                                <div className="cond-view-row">
                                    <span className="cond-view-label">Notes</span>
                                    <span className="cond-view-value">{viewingCondition.notes}</span>
                                </div>
                            )}
                        </div>

                        <div className="cond-view-footer">
                            <button
                                type="button"
                                className="cond-view-edit-btn"
                                onClick={() => {
                                    const condToEdit = viewingCondition;
                                    setViewingCondition(null);
                                    handleOpenModal('condition', condToEdit);
                                }}
                            >
                                <EditIcon />
                                Edit Condition
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <RecordModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveRecord}
                onDelete={handleDeleteRecord}
                type={modalType}
                record={editingRecord}
                isMobile={isMobile}
                doctors={doctors}
                onDoctorCreated={handleDoctorCreated}
            />

            <ExplanationModal
                isOpen={explanationModal.isOpen}
                onClose={closeExplanationModal}
                explanation={explanationModal.explanation}
                documentName={explanationModal.documentName}
                isLoading={isExplaining}
                error={explanationModal.error}
            />
        </div>
    );
};

export default MyMedicalRecords;
