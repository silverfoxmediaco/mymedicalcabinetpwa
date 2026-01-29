import React, { useState, useEffect } from 'react';
import MemberHeader from '../../components/MemberHeader';
import MedicationCard from '../../components/Medications/MedicationCard';
import MedicationModal from '../../components/Medications/MedicationModal';
import { medicationService } from '../../services/medicationService';
import { interactionService } from '../../services/interactionService';
import { rxNavService } from '../../services/rxNavService';
import './MyMedications.css';

const MyMedications = ({ user, onLogout }) => {
    const [medications, setMedications] = useState([]);
    const [interactions, setInteractions] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState(null);
    const [newDrugInteractions, setNewDrugInteractions] = useState([]);

    const mockUser = user || {
        firstName: 'James',
        lastName: 'McEwen',
        email: 'james@example.com'
    };

    // Mock medications for development
    const mockMedications = [
        {
            _id: '1',
            name: 'Lisinopril',
            genericName: 'Prinivil',
            dosage: { amount: '10', unit: 'mg' },
            frequency: 'once daily',
            timeOfDay: ['morning'],
            prescribedBy: 'Dr. Smith',
            pharmacy: { name: 'CVS - Main St', phone: '(555) 123-4567', address: '123 Main St' },
            nextRefillDate: '2026-02-15',
            refillsRemaining: 2,
            status: 'active',
            reminderEnabled: true,
            rxcui: '314076'
        },
        {
            _id: '2',
            name: 'Metformin',
            genericName: 'Glucophage',
            dosage: { amount: '500', unit: 'mg' },
            frequency: 'twice daily',
            timeOfDay: ['morning', 'evening'],
            prescribedBy: 'Dr. Johnson',
            pharmacy: { name: 'Walgreens', phone: '(555) 987-6543', address: '456 Oak Ave' },
            nextRefillDate: '2026-03-01',
            refillsRemaining: 5,
            status: 'active',
            reminderEnabled: false,
            rxcui: '860975'
        },
        {
            _id: '3',
            name: 'Aspirin',
            genericName: 'Acetylsalicylic acid',
            dosage: { amount: '81', unit: 'mg' },
            frequency: 'once daily',
            timeOfDay: ['morning'],
            prescribedBy: 'Dr. Smith',
            pharmacy: { name: 'CVS - Main St', phone: '(555) 123-4567', address: '123 Main St' },
            nextRefillDate: null,
            refillsRemaining: 0,
            status: 'active',
            reminderEnabled: false,
            rxcui: '243670'
        },
        {
            _id: '4',
            name: 'Omeprazole',
            genericName: 'Prilosec',
            dosage: { amount: '20', unit: 'mg' },
            frequency: 'once daily',
            timeOfDay: ['morning'],
            prescribedBy: 'Dr. Garcia',
            pharmacy: { name: 'CVS - Main St', phone: '(555) 123-4567', address: '123 Main St' },
            nextRefillDate: '2026-01-20',
            refillsRemaining: 1,
            status: 'discontinued',
            reminderEnabled: false,
            rxcui: '200329'
        }
    ];

    useEffect(() => {
        loadMedications();
    }, []);

    const loadMedications = async () => {
        setIsLoading(true);
        try {
            // TODO: Replace with actual API call
            // const response = await medicationService.getAll();
            // setMedications(response.data);
            setMedications(mockMedications);
            await checkAllInteractions(mockMedications);
        } catch (error) {
            console.error('Error loading medications:', error);
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
                // TODO: Replace with actual API call
                // await medicationService.update(editingMedication._id, formData);
                setMedications(prev =>
                    prev.map(m =>
                        m._id === editingMedication._id
                            ? { ...m, ...formData }
                            : m
                    )
                );
            } else {
                // TODO: Replace with actual API call
                // const response = await medicationService.create(formData);
                const newMed = {
                    _id: Date.now().toString(),
                    ...formData,
                    status: 'active'
                };
                setMedications(prev => [newMed, ...prev]);
            }
            handleCloseModal();
            // Recheck interactions after save
            await checkAllInteractions(medications);
        } catch (error) {
            console.error('Error saving medication:', error);
        }
    };

    const handleDeleteMedication = async (medicationId) => {
        try {
            // TODO: Replace with actual API call
            // await medicationService.delete(medicationId);
            setMedications(prev => prev.filter(m => m._id !== medicationId));
            handleCloseModal();
        } catch (error) {
            console.error('Error deleting medication:', error);
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

    return (
        <div className="medications-page">
            <MemberHeader user={mockUser} onLogout={onLogout} />

            <main className="medications-main">
                <div className="medications-container">
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
            />
        </div>
    );
};

export default MyMedications;
