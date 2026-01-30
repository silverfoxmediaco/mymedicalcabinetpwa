import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import DoctorCard from '../../components/Doctors/DoctorCard';
import DoctorModal from '../../components/Doctors/DoctorModal';
import { doctorService } from '../../services/doctorService';
import './MyDoctors.css';

const MyDoctors = ({ onLogout }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
            return;
        }
        loadDoctors();
    }, [navigate]);

    const loadDoctors = async () => {
        setIsLoading(true);
        try {
            const response = await doctorService.getAll();
            setDoctors(response.doctors || []);
        } catch (error) {
            console.error('Error loading doctors:', error);
            setDoctors([]);
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
                await doctorService.update(editingDoctor._id, formData);
            } else {
                await doctorService.create(formData);
            }
            await loadDoctors();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving doctor:', error);
            alert('Failed to save doctor. Please try again.');
        }
    };

    const handleDeleteDoctor = async (doctorId) => {
        try {
            await doctorService.delete(doctorId);
            await loadDoctors();
            handleCloseModal();
        } catch (error) {
            console.error('Error deleting doctor:', error);
            alert('Failed to delete doctor. Please try again.');
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

    if (!user) {
        return null;
    }

    return (
        <div className="doctors-page">
            <MemberHeader user={user} onLogout={onLogout} />

            <main className="doctors-main">
                <div className="doctors-container">
                    <a href="/dashboard" className="back-to-dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Dashboard
                    </a>
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
