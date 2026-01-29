import React, { useState, useEffect } from 'react';
import MemberHeader from '../../components/MemberHeader';
import InsuranceCard from '../../components/Insurance/InsuranceCard';
import InsuranceModal from '../../components/Insurance/InsuranceModal';
import insuranceService from '../../services/insuranceService';
import './MyInsurance.css';

const MyInsurance = () => {
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
        fetchInsurances();
    }, []);

    const fetchInsurances = async () => {
        try {
            setLoading(true);
            const data = await insuranceService.getAll();
            setInsurances(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching insurance:', err);
            setError('Unable to load insurance information');
            // Mock data for development
            setInsurances([
                {
                    _id: '1',
                    provider: { name: 'Blue Cross Blue Shield', phone: '(800) 262-2583' },
                    plan: { name: 'Gold 1500', type: 'PPO' },
                    memberId: 'XYZ123456789',
                    groupNumber: '12345',
                    effectiveDate: '2024-01-01',
                    isPrimary: true,
                    isActive: true,
                    coverage: {
                        deductible: { individual: 1500, met: 850 },
                        outOfPocketMax: { individual: 6000, met: 1200 },
                        copay: { primaryCare: 25, specialist: 50, urgentCare: 75, emergency: 250 }
                    }
                },
                {
                    _id: '2',
                    provider: { name: 'Delta Dental', phone: '(800) 765-6003' },
                    plan: { name: 'Premier', type: 'PPO' },
                    memberId: 'DD987654321',
                    groupNumber: '54321',
                    effectiveDate: '2024-01-01',
                    isPrimary: false,
                    isActive: true,
                    coverage: {
                        deductible: { individual: 50, met: 50 },
                        outOfPocketMax: { individual: 1500, met: 300 }
                    }
                }
            ]);
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
            fetchInsurances();
            setIsModalOpen(false);
            setEditingInsurance(null);
        } catch (err) {
            console.error('Error saving insurance:', err);
            // Mock save for development
            if (editingInsurance) {
                setInsurances(prev =>
                    prev.map(ins =>
                        ins._id === editingInsurance._id
                            ? { ...ins, ...insuranceData }
                            : ins
                    )
                );
            } else {
                setInsurances(prev => [
                    ...prev,
                    { ...insuranceData, _id: Date.now().toString() }
                ]);
            }
            setIsModalOpen(false);
            setEditingInsurance(null);
        }
    };

    const handleDelete = async (id) => {
        try {
            await insuranceService.delete(id);
            fetchInsurances();
            setIsModalOpen(false);
            setEditingInsurance(null);
        } catch (err) {
            console.error('Error deleting insurance:', err);
            // Mock delete for development
            setInsurances(prev => prev.filter(ins => ins._id !== id));
            setIsModalOpen(false);
            setEditingInsurance(null);
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

    return (
        <div className="my-insurance-page">
            <MemberHeader />

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
