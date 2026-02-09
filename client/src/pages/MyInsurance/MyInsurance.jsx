import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import InsuranceCard from '../../components/Insurance/InsuranceCard';
import InsuranceModal from '../../components/Insurance/InsuranceModal';
import FamilyMemberTabs from '../../components/FamilyMemberTabs';
import { useFamilyMember } from '../../context/FamilyMemberContext';
import insuranceService from '../../services/insuranceService';
import './MyInsurance.css';

const MyInsurance = ({ onLogout }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [user, setUser] = useState(null);
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fhirStatus, setFhirStatus] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInsurance, setEditingInsurance] = useState(null);
    const [viewMode, setViewMode] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 425);
    const { activeMemberId, getActiveMemberName } = useFamilyMember();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 425);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle FHIR OAuth callback redirect
    useEffect(() => {
        const fhirParam = searchParams.get('fhir');
        if (fhirParam === 'success') {
            setFhirStatus({ type: 'success', message: 'Insurance connected successfully! Open your plan to sync data.' });
            fetchInsurances();
            searchParams.delete('fhir');
            searchParams.delete('insuranceId');
            setSearchParams(searchParams, { replace: true });
        } else if (fhirParam === 'error') {
            const reason = searchParams.get('reason') || 'unknown';
            setFhirStatus({ type: 'error', message: `Connection failed: ${reason}. Please try again.` });
            searchParams.delete('fhir');
            searchParams.delete('reason');
            setSearchParams(searchParams, { replace: true });
        }
    }, []);

    // Auto-dismiss FHIR status after 6 seconds
    useEffect(() => {
        if (fhirStatus) {
            const timer = setTimeout(() => setFhirStatus(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [fhirStatus]);

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

    useEffect(() => {
        fetchInsurances();
    }, [activeMemberId]);

    const fetchInsurances = async () => {
        try {
            setLoading(true);
            const data = await insuranceService.getAll(activeMemberId);
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

    const handleView = (insurance) => {
        setEditingInsurance(insurance);
        setViewMode(true);
        setIsModalOpen(true);
    };

    const handleEdit = (insurance) => {
        setEditingInsurance(insurance);
        setViewMode(false);
        setIsModalOpen(true);
    };

    const handleSwitchToEdit = () => {
        setViewMode(false);
    };

    const handleSave = async (insuranceData) => {
        try {
            if (editingInsurance) {
                await insuranceService.update(editingInsurance._id, insuranceData);
            } else {
                await insuranceService.create(insuranceData, activeMemberId);
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

    const handleFhirSync = async () => {
        await fetchInsurances();
        if (editingInsurance) {
            const updated = await insuranceService.getById(editingInsurance._id);
            setEditingInsurance(updated);
        }
    };

    const activeMemberName = getActiveMemberName();
    const pageLabel = activeMemberId ? `${activeMemberName}'s Insurance` : 'My Insurance';

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

            {fhirStatus && (
                <div className={`fhir-toast fhir-toast-${fhirStatus.type}`}>
                    <span>{fhirStatus.message}</span>
                    <button
                        type="button"
                        className="fhir-toast-close"
                        onClick={() => setFhirStatus(null)}
                    >
                        &times;
                    </button>
                </div>
            )}

            <main className="my-insurance-main">
                <a href="/dashboard" className="back-to-dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Dashboard
                </a>

                <FamilyMemberTabs />

                <div className="my-insurance-header">
                    <h1 className="my-insurance-title">{pageLabel}</h1>
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
                                            onView={handleView}
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
                                            onView={handleView}
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
                    setViewMode(false);
                }}
                onSave={handleSave}
                onDelete={handleDelete}
                onFhirSync={handleFhirSync}
                insurance={editingInsurance}
                isMobile={isMobile}
                viewMode={viewMode}
                onSwitchToEdit={handleSwitchToEdit}
            />
        </div>
    );
};

export default MyInsurance;
