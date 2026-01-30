import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import InsuranceCard from '../../components/Insurance/InsuranceCard';
import InsuranceModal from '../../components/Insurance/InsuranceModal';
import insuranceService from '../../services/insuranceService';
import './MyInsurance.css';

const MyInsurance = ({ onLogout }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInsurance, setEditingInsurance] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 425);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 425);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
            return;
        }
        fetchInsurances();
    }, [navigate]);

    const fetchInsurances = async () => {
        try {
            setLoading(true);
            const data = await insuranceService.getAll();
            setInsurances(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching insurance:', err);
            setError('Unable to load insurance information');
            setInsurances([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingInsurance(null);
        setIsModalOpen(true);
    };

    const handleEdit = (insurance) => {
        setEditingInsurance(insurance);
        setIsModalOpen(true);
    };

    const handleSave = async (insuranceData) => {
        try {
            if (editingInsurance) {
                await insuranceService.update(editingInsurance._id, insuranceData);
            } else {
                await insuranceService.create(insuranceData);
            }
            await fetchInsurances();
            setIsModalOpen(false);
            setEditingInsurance(null);
        } catch (err) {
            console.error('Error saving insurance:', err);
            alert('Failed to save insurance. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await insuranceService.delete(id);
            await fetchInsurances();
            setIsModalOpen(false);
            setEditingInsurance(null);
        } catch (err) {
            console.error('Error deleting insurance:', err);
            alert('Failed to delete insurance. Please try again.');
        }
    };

    const activeInsurances = insurances.filter(ins => ins.isActive);
    const inactiveInsurances = insurances.filter(ins => !ins.isActive);

    const ShieldPlusIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
            <line x1="12" y1="9" x2="12" y2="15" />
            <line x1="9" y1="12" x2="15" y2="12" />
        </svg>
    );

    if (!user) {
        return null;
    }

    return (
        <div className="my-insurance-page">
            <MemberHeader user={user} onLogout={onLogout} />

            <main className="my-insurance-main">
                <a href="/dashboard" className="back-to-dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Dashboard
                </a>
                <div className="my-insurance-header">
                    <h1 className="my-insurance-title">My Insurance</h1>
                    <button
                        className="my-insurance-add-btn"
                        onClick={handleAdd}
                        type="button"
                    >
                        <ShieldPlusIcon />
                        Add Insurance
                    </button>
                </div>

                {loading ? (
                    <div className="my-insurance-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading insurance...</p>
                    </div>
                ) : error && insurances.length === 0 ? (
                    <div className="my-insurance-error">
                        <p>{error}</p>
                    </div>
                ) : insurances.length === 0 ? (
                    <div className="my-insurance-empty">
                        <div className="empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                            </svg>
                        </div>
                        <h3>No Insurance Added</h3>
                        <p>Add your health insurance information to keep track of coverage and copays.</p>
                        <button
                            className="empty-add-btn"
                            onClick={handleAdd}
                            type="button"
                        >
                            Add Your First Insurance
                        </button>
                    </div>
                ) : (
                    <>
                        {activeInsurances.length > 0 && (
                            <section className="my-insurance-section">
                                <h2 className="my-insurance-section-title">
                                    Active Plans
                                    <span className="section-count">{activeInsurances.length}</span>
                                </h2>
                                <div className="my-insurance-grid">
                                    {activeInsurances.map(insurance => (
                                        <InsuranceCard
                                            key={insurance._id}
                                            insurance={insurance}
                                            onEdit={handleEdit}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {inactiveInsurances.length > 0 && (
                            <section className="my-insurance-section">
                                <h2 className="my-insurance-section-title inactive">
                                    Inactive Plans
                                    <span className="section-count">{inactiveInsurances.length}</span>
                                </h2>
                                <div className="my-insurance-grid">
                                    {inactiveInsurances.map(insurance => (
                                        <InsuranceCard
                                            key={insurance._id}
                                            insurance={insurance}
                                            onEdit={handleEdit}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            <InsuranceModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingInsurance(null);
                }}
                onSave={handleSave}
                onDelete={handleDelete}
                insurance={editingInsurance}
                isMobile={isMobile}
            />
        </div>
    );
};

export default MyInsurance;
