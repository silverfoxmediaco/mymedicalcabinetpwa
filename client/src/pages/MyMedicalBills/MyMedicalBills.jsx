import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import FamilyMemberTabs from '../../components/FamilyMemberTabs';
import BillCard from '../../components/MedicalBills/BillCard';
import BillModal from '../../components/MedicalBills/BillModal';
import BillSummaryStats from '../../components/MedicalBills/BillSummaryStats';
import { medicalBillService } from '../../services/medicalBillService';
import { useFamilyMember } from '../../context/FamilyMemberContext';
import './MyMedicalBills.css';

const MyMedicalBills = ({ onLogout }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [bills, setBills] = useState([]);
    const [summary, setSummary] = useState({
        totalOwed: 0,
        totalPaid: 0,
        totalAiSavings: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [viewMode, setViewMode] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    const { activeMemberId, getActiveMemberName } = useFamilyMember();
    const activeMemberName = getActiveMemberName();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (user) {
            fetchBills();
            fetchSummary();
        }
    }, [user, activeMemberId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchBills = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await medicalBillService.getAll(activeMemberId);
            setBills(data);
        } catch (err) {
            setError(err.message || 'Failed to load bills');
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const data = await medicalBillService.getSummary(activeMemberId);
            setSummary(data);
        } catch (err) {
            console.error('Summary fetch error:', err);
        }
    };

    const handleAdd = () => {
        setEditingBill(null);
        setViewMode(false);
        setIsModalOpen(true);
    };

    const handleEdit = (bill) => {
        setEditingBill(bill);
        setViewMode(false);
        setIsModalOpen(true);
    };

    const handleView = (bill) => {
        setEditingBill(bill);
        setViewMode(true);
        setIsModalOpen(true);
    };

    const handleSwitchToEdit = () => {
        setViewMode(false);
    };

    const handleSave = async (data, isRefresh) => {
        if (isRefresh) {
            await fetchBills();
            await fetchSummary();
            // Refresh the editing bill too
            if (editingBill?._id) {
                const updated = await medicalBillService.getById(editingBill._id);
                setEditingBill(updated);
            }
            return;
        }

        try {
            let result;
            if (editingBill) {
                result = await medicalBillService.update(editingBill._id, data);
            } else {
                result = await medicalBillService.create(data, activeMemberId);
            }
            setIsModalOpen(false);
            setEditingBill(null);
            await fetchBills();
            await fetchSummary();
            return result;
        } catch (err) {
            throw err;
        }
    };

    const handleDelete = async () => {
        if (!editingBill) return;
        await medicalBillService.delete(editingBill._id);
        setIsModalOpen(false);
        setEditingBill(null);
        await fetchBills();
        await fetchSummary();
    };

    const getFilteredBills = () => {
        if (statusFilter === 'all') return bills;
        if (statusFilter === 'unpaid') return bills.filter(b => b.status === 'unpaid' || b.status === 'partially_paid');
        if (statusFilter === 'disputed') return bills.filter(b => b.status === 'disputed' || b.status === 'in_review');
        if (statusFilter === 'paid') return bills.filter(b => b.status === 'paid' || b.status === 'resolved');
        return bills;
    };

    const filteredBills = getFilteredBills();

    // Group bills
    const outstandingBills = filteredBills.filter(b => b.status === 'unpaid' || b.status === 'partially_paid');
    const disputedBills = filteredBills.filter(b => b.status === 'disputed' || b.status === 'in_review');
    const resolvedBills = filteredBills.filter(b => b.status === 'paid' || b.status === 'resolved');

    if (!user) return null;

    return (
        <div className="my-medical-bills-page">
            <MemberHeader user={user} onLogout={onLogout} />

            <main className="my-medical-bills-main">
                <div className="my-medical-bills-container">
                    <a href="/dashboard" className="my-medical-bills-back">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5" />
                            <path d="M12 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </a>

                    <FamilyMemberTabs />

                    <div className="my-medical-bills-header">
                        <h1 className="my-medical-bills-title">
                            {activeMemberId ? `${activeMemberName}'s Medical Bills` : 'My Medical Bills'}
                        </h1>
                        <button
                            className="my-medical-bills-add-btn"
                            onClick={handleAdd}
                        >
                            + Add Bill
                        </button>
                    </div>

                    {!loading && bills.length > 0 && (
                        <BillSummaryStats summary={summary} />
                    )}

                    {!loading && bills.length > 0 && (
                        <div className="my-medical-bills-filters">
                            <button
                                className={`my-medical-bills-filter ${statusFilter === 'all' ? 'my-medical-bills-filter-active' : ''}`}
                                onClick={() => setStatusFilter('all')}
                            >
                                All ({bills.length})
                            </button>
                            <button
                                className={`my-medical-bills-filter ${statusFilter === 'unpaid' ? 'my-medical-bills-filter-active' : ''}`}
                                onClick={() => setStatusFilter('unpaid')}
                            >
                                Unpaid ({bills.filter(b => b.status === 'unpaid' || b.status === 'partially_paid').length})
                            </button>
                            <button
                                className={`my-medical-bills-filter ${statusFilter === 'disputed' ? 'my-medical-bills-filter-active' : ''}`}
                                onClick={() => setStatusFilter('disputed')}
                            >
                                Disputed ({bills.filter(b => b.status === 'disputed' || b.status === 'in_review').length})
                            </button>
                            <button
                                className={`my-medical-bills-filter ${statusFilter === 'paid' ? 'my-medical-bills-filter-active' : ''}`}
                                onClick={() => setStatusFilter('paid')}
                            >
                                Paid ({bills.filter(b => b.status === 'paid' || b.status === 'resolved').length})
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="my-medical-bills-loading">
                            <div className="my-medical-bills-spinner"></div>
                            <p>Loading bills...</p>
                        </div>
                    )}

                    {error && (
                        <div className="my-medical-bills-error-msg">
                            {error}
                            <button onClick={fetchBills}>Retry</button>
                        </div>
                    )}

                    {!loading && !error && bills.length === 0 && (
                        <div className="my-medical-bills-empty">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            <h3>No Medical Bills Yet</h3>
                            <p>Add your medical bills to track payments, find errors, and save money.</p>
                            <button
                                className="my-medical-bills-empty-add"
                                onClick={handleAdd}
                            >
                                + Add Your First Bill
                            </button>
                        </div>
                    )}

                    {!loading && !error && filteredBills.length > 0 && (
                        <div className="my-medical-bills-sections">
                            {outstandingBills.length > 0 && (
                                <div className="my-medical-bills-section">
                                    <h2 className="my-medical-bills-section-title">
                                        Outstanding
                                        <span className="my-medical-bills-section-count">{outstandingBills.length}</span>
                                    </h2>
                                    <div className="my-medical-bills-grid">
                                        {outstandingBills.map(bill => (
                                            <BillCard
                                                key={bill._id}
                                                bill={bill}
                                                onEdit={handleEdit}
                                                onView={handleView}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {disputedBills.length > 0 && (
                                <div className="my-medical-bills-section">
                                    <h2 className="my-medical-bills-section-title">
                                        Disputed
                                        <span className="my-medical-bills-section-count">{disputedBills.length}</span>
                                    </h2>
                                    <div className="my-medical-bills-grid">
                                        {disputedBills.map(bill => (
                                            <BillCard
                                                key={bill._id}
                                                bill={bill}
                                                onEdit={handleEdit}
                                                onView={handleView}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {resolvedBills.length > 0 && (
                                <div className="my-medical-bills-section">
                                    <h2 className="my-medical-bills-section-title">
                                        Resolved
                                        <span className="my-medical-bills-section-count">{resolvedBills.length}</span>
                                    </h2>
                                    <div className="my-medical-bills-grid">
                                        {resolvedBills.map(bill => (
                                            <BillCard
                                                key={bill._id}
                                                bill={bill}
                                                onEdit={handleEdit}
                                                onView={handleView}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <BillModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingBill(null);
                    setViewMode(false);
                }}
                bill={editingBill}
                viewMode={viewMode}
                onSave={handleSave}
                onDelete={handleDelete}
                onSwitchToEdit={handleSwitchToEdit}
            />
        </div>
    );
};

export default MyMedicalBills;
