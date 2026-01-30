import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import MedicationCard from '../../components/Medications/MedicationCard';
import MedicationModal from '../../components/Medications/MedicationModal';
import { medicationService } from '../../services/medicationService';
import { interactionService } from '../../services/interactionService';
import { rxNavService } from '../../services/rxNavService';
import './MyMedications.css';

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || '/api');

const MyMedications = ({ onLogout }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [medications, setMedications] = useState([]);
    const [interactions, setInteractions] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [newDrugInteractions, setNewDrugInteractions] = useState([]);
    const [userPharmacies, setUserPharmacies] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
            return;
        }
        loadMedications();
        loadUserPharmacies();
    }, [navigate]);

    const loadUserPharmacies = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/users/pharmacies`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserPharmacies(data.pharmacies || []);
            }
        } catch (error) {
            console.error('Error loading pharmacies:', error);
        }
    };

    const loadMedications = async () => {
        setIsLoading(true);
        try {
            const response = await medicationService.getAll();
            const meds = response.medications || [];
            setMedications(meds);
            await checkAllInteractions(meds);
        } catch (error) {
            console.error('Error loading medications:', error);
            setMedications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const checkAllInteractions = async (meds) => {
        const activeMeds = meds.filter(m => m.status === 'active' && m.rxcui);
        if (activeMeds.length < 2) {
            setInteractions({});
            return;
        }

        try {
            const rxcuiList = activeMeds.map(m => m.rxcui);
            const result = await interactionService.checkInteractions(rxcuiList);

            if (result.hasInteractions) {
                const interactionMap = {};
                for (const interaction of result.interactions) {
                    for (const drug of interaction.drugs) {
                        const med = activeMeds.find(m => m.rxcui === drug.rxcui);
                        if (med) {
                            if (!interactionMap[med._id]) {
                                interactionMap[med._id] = [];
                            }
                            interactionMap[med._id].push(interaction);
                        }
                    }
                }
                setInteractions(interactionMap);
            }
        } catch (error) {
            console.error('Error checking interactions:', error);
        }
    };

    const checkNewDrugInteractions = async (rxcui) => {
        if (!rxcui) {
            setNewDrugInteractions([]);
            return;
        }

        const activeMeds = medications.filter(m => m.status === 'active' && m.rxcui);
        if (activeMeds.length === 0) {
            setNewDrugInteractions([]);
            return;
        }

        try {
            const rxcuiList = [...activeMeds.map(m => m.rxcui), rxcui];
            const result = await interactionService.checkInteractions(rxcuiList);
            setNewDrugInteractions(result.interactions || []);
        } catch (error) {
            console.error('Error checking new drug interactions:', error);
            setNewDrugInteractions([]);
        }
    };

    const handleOpenAddModal = () => {
        setEditingMedication(null);
        setNewDrugInteractions([]);
        setIsModalOpen(true);
    };

    const handleEditMedication = (medication) => {
        setEditingMedication(medication);
        setNewDrugInteractions([]);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMedication(null);
        setNewDrugInteractions([]);
    };

    const handleSaveMedication = async (formData) => {
        try {
            if (editingMedication) {
                await medicationService.update(editingMedication._id, formData);
            } else {
                await medicationService.create(formData);
            }
            await loadMedications();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving medication:', error);
            alert('Failed to save medication. Please try again.');
        }
    };

    const handleDeleteMedication = async (medicationId) => {
        try {
            await medicationService.delete(medicationId);
            await loadMedications();
            handleCloseModal();
        } catch (error) {
            console.error('Error deleting medication:', error);
            alert('Failed to delete medication. Please try again.');
        }
    };

    const activeMedications = medications.filter(m => m.status === 'active');
    const historyMedications = medications.filter(m => m.status !== 'active');

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 425;

    const PlusIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );

    const PillIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 20.5L3.5 13.5C1.5 11.5 1.5 8.5 3.5 6.5C5.5 4.5 8.5 4.5 10.5 6.5L17.5 13.5C19.5 15.5 19.5 18.5 17.5 20.5C15.5 22.5 12.5 22.5 10.5 20.5Z" />
            <path d="M7 13.5L13.5 7" />
        </svg>
    );

    if (!user) {
        return null;
    }

    return (
        <div className="medications-page">
            <MemberHeader user={user} onLogout={onLogout} />

            <main className="medications-main">
                <div className="medications-container">
                    <a href="/dashboard" className="back-to-dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Dashboard
                    </a>
                    <div className="medications-header">
                        <div className="medications-header-left">
                            <h1 className="medications-title">My Medications</h1>
                            <p className="medications-subtitle">
                                Manage your prescriptions and track refills
                            </p>
                        </div>
                        <button
                            className="medications-add-btn"
                            onClick={handleOpenAddModal}
                        >
                            <PlusIcon />
                            <span>Add Medication</span>
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="medications-loading">
                            <div className="medications-spinner"></div>
                            <p>Loading medications...</p>
                        </div>
                    ) : (
                        <>
                            {activeMedications.length === 0 && historyMedications.length === 0 ? (
                                <div className="medications-empty">
                                    <div className="medications-empty-icon">
                                        <PillIcon />
                                    </div>
                                    <h2>No medications yet</h2>
                                    <p>Add your first medication to start tracking</p>
                                    <button
                                        className="medications-empty-btn"
                                        onClick={handleOpenAddModal}
                                    >
                                        <PlusIcon />
                                        <span>Add Medication</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {activeMedications.length > 0 && (
                                        <section className="medications-section">
                                            <h2 className="medications-section-title">
                                                Current Medications
                                                <span className="medications-count">
                                                    {activeMedications.length}
                                                </span>
                                            </h2>
                                            <div className="medications-grid">
                                                {activeMedications.map(medication => (
                                                    <MedicationCard
                                                        key={medication._id}
                                                        medication={medication}
                                                        onEdit={handleEditMedication}
                                                        interactions={interactions[medication._id] || []}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {historyMedications.length > 0 && (
                                        <section className="medications-section">
                                            <h2 className="medications-section-title medications-section-title-history">
                                                Medication History
                                                <span className="medications-count">
                                                    {historyMedications.length}
                                                </span>
                                            </h2>
                                            <div className="medications-grid">
                                                {historyMedications.map(medication => (
                                                    <MedicationCard
                                                        key={medication._id}
                                                        medication={medication}
                                                        onEdit={handleEditMedication}
                                                        interactions={[]}
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>

            <MedicationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveMedication}
                onDelete={handleDeleteMedication}
                medication={editingMedication}
                interactions={newDrugInteractions}
                isMobile={isMobile}
                userPharmacies={userPharmacies}
            />
        </div>
    );
};

export default MyMedications;
