import React, { useState, useEffect } from 'react';
import MemberHeader from '../../components/MemberHeader';
import DoctorCard from '../../components/Doctors/DoctorCard';
import DoctorModal from '../../components/Doctors/DoctorModal';
import './MyDoctors.css';

const MyDoctors = ({ user, onLogout }) => {
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);

    const mockUser = user || {
        firstName: 'James',
        lastName: 'McEwen',
        email: 'james@example.com'
    };

    // Mock doctors for development
    const mockDoctors = [
        {
            _id: '1',
            name: 'Dr. Sarah Johnson',
            specialty: 'Primary Care',
            practice: {
                name: 'Downtown Family Medicine',
                address: {
                    street: '123 Main Street',
                    city: 'Austin',
                    state: 'TX',
                    zipCode: '78701'
                }
            },
            phone: '(512) 555-1234',
            fax: '(512) 555-1235',
            email: 'sjohnson@dfm.com',
            isPrimaryCare: true,
            notes: 'Great bedside manner, usually runs on time.'
        },
        {
            _id: '2',
            name: 'Dr. Michael Chen',
            specialty: 'Cardiology',
            practice: {
                name: 'Heart & Vascular Institute',
                address: {
                    street: '456 Medical Center Blvd',
                    city: 'Austin',
                    state: 'TX',
                    zipCode: '78756'
                }
            },
            phone: '(512) 555-2345',
            email: 'mchen@hvi.com',
            isPrimaryCare: false
        },
        {
            _id: '3',
            name: 'Dr. Emily Rodriguez',
            specialty: 'Dermatology',
            practice: {
                name: 'Clear Skin Dermatology',
                address: {
                    street: '789 Oak Lane',
                    city: 'Austin',
                    state: 'TX',
                    zipCode: '78704'
                }
            },
            phone: '(512) 555-3456',
            isPrimaryCare: false,
            notes: 'Referred by Dr. Johnson for annual skin check.'
        }
    ];

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        setIsLoading(true);
        try {
            // TODO: Replace with actual API call
            // const response = await doctorService.getAll();
            // setDoctors(response.data);
            setDoctors(mockDoctors);
        } catch (error) {
            console.error('Error loading doctors:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingDoctor(null);
        setIsModalOpen(true);
    };

    const handleEditDoctor = (doctor) => {
        setEditingDoctor(doctor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDoctor(null);
    };

    const handleSaveDoctor = async (formData) => {
        try {
            if (editingDoctor) {
                // TODO: Replace with actual API call
                // await doctorService.update(editingDoctor._id, formData);

                // If setting as primary, unset others
                if (formData.isPrimaryCare && !editingDoctor.isPrimaryCare) {
                    setDoctors(prev =>
                        prev.map(d => ({
                            ...d,
                            isPrimaryCare: d._id === editingDoctor._id ? true : false
                        }))
                    );
                }

                setDoctors(prev =>
                    prev.map(d =>
                        d._id === editingDoctor._id
                            ? { ...d, ...formData }
                            : d
                    )
                );
            } else {
                // TODO: Replace with actual API call
                // const response = await doctorService.create(formData);

                // If setting as primary, unset others
                if (formData.isPrimaryCare) {
                    setDoctors(prev =>
                        prev.map(d => ({ ...d, isPrimaryCare: false }))
                    );
                }

                const newDoctor = {
                    _id: Date.now().toString(),
                    ...formData
                };
                setDoctors(prev => [newDoctor, ...prev]);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error saving doctor:', error);
        }
    };

    const handleDeleteDoctor = async (doctorId) => {
        try {
            // TODO: Replace with actual API call
            // await doctorService.delete(doctorId);
            setDoctors(prev => prev.filter(d => d._id !== doctorId));
            handleCloseModal();
        } catch (error) {
            console.error('Error deleting doctor:', error);
        }
    };

    // Sort: Primary care first, then alphabetically
    const sortedDoctors = [...doctors].sort((a, b) => {
        if (a.isPrimaryCare && !b.isPrimaryCare) return -1;
        if (!a.isPrimaryCare && b.isPrimaryCare) return 1;
        return a.name.localeCompare(b.name);
    });

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 425;

    const PlusIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );

    const DoctorIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" />
            <circle cx="12" cy="7" r="4" />
            <path d="M12 11V14" />
            <path d="M10.5 12.5H13.5" />
        </svg>
    );

    return (
        <div className="doctors-page">
            <MemberHeader user={mockUser} onLogout={onLogout} />

            <main className="doctors-main">
                <div className="doctors-container">
                    <div className="doctors-header">
                        <div className="doctors-header-left">
                            <h1 className="doctors-title">My Doctors</h1>
                            <p className="doctors-subtitle">
                                Manage your healthcare providers
                            </p>
                        </div>
                        <button
                            className="doctors-add-btn"
                            onClick={handleOpenAddModal}
                        >
                            <PlusIcon />
                            <span>Add Doctor</span>
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="doctors-loading">
                            <div className="doctors-spinner"></div>
                            <p>Loading doctors...</p>
                        </div>
                    ) : (
                        <>
                            {doctors.length === 0 ? (
                                <div className="doctors-empty">
                                    <div className="doctors-empty-icon">
                                        <DoctorIcon />
                                    </div>
                                    <h2>No doctors yet</h2>
                                    <p>Add your healthcare providers to keep their info handy</p>
                                    <button
                                        className="doctors-empty-btn"
                                        onClick={handleOpenAddModal}
                                    >
                                        <PlusIcon />
                                        <span>Add Doctor</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="doctors-grid">
                                    {sortedDoctors.map(doctor => (
                                        <DoctorCard
                                            key={doctor._id}
                                            doctor={doctor}
                                            onEdit={handleEditDoctor}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <DoctorModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveDoctor}
                onDelete={handleDeleteDoctor}
                doctor={editingDoctor}
                isMobile={isMobile}
            />
        </div>
    );
};

export default MyDoctors;
