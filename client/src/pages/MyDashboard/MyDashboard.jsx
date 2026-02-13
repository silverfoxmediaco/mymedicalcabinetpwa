import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import ShareModal from '../../components/ShareModal';
import FamilyMemberTabs from '../../components/FamilyMemberTabs';
import { useFamilyMember } from '../../context/FamilyMemberContext';
import './MyDashboard.css';

const MyDashboard = ({ onLogout }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const { activeMemberId, getActiveMemberName, familyMembers, setActiveMemberId, loadFamilyMembers } = useFamilyMember();

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            // Ensure family members are loaded (context may have initialized before login)
            loadFamilyMembers();
        } else {
            // No user logged in, redirect to login
            navigate('/login');
        }
    }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAddMember = () => {
        setEditingMember(null);
        setIsFamilyModalOpen(true);
    };

    const handleEditMember = () => {
        if (!activeMemberId) return;
        const member = familyMembers.find(m => m._id === activeMemberId);
        if (member) {
            setEditingMember(member);
            setIsFamilyModalOpen(true);
        }
    };

    const activeMemberName = getActiveMemberName();

    if (!user) {
        return null; // Loading or redirecting
    }

    // Lazy import of FamilyMemberModal to avoid circular deps
    const FamilyMemberModal = React.lazy(() => import('../../components/FamilyMemberModal'));

    return (
        <div className="dashboard-page">
            <MemberHeader user={user} onLogout={onLogout} />

            <main className="dashboard-main">
                <div className="dashboard-container">
                    <div className="dashboard-welcome">
                        {activeMemberId ? (
                            <>
                                <h1 className="dashboard-title">
                                    Viewing {activeMemberName}'s Records
                                </h1>
                                <p className="dashboard-subtitle">
                                    Managing health information for {activeMemberName}.
                                    <button
                                        className="dashboard-edit-member-link"
                                        onClick={handleEditMember}
                                    >
                                        Edit
                                    </button>
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="dashboard-title">
                                    Welcome back, {user.firstName}
                                </h1>
                                <p className="dashboard-subtitle">
                                    Here's an overview of your health information.
                                </p>
                            </>
                        )}
                    </div>

                    <FamilyMemberTabs onAddMember={handleAddMember} />

                    <div className="dashboard-grid">
                        {activeMemberId ? (
                            <button
                                className="dashboard-card"
                                onClick={handleEditMember}
                            >
                                <div className="dashboard-card-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <h3 className="dashboard-card-title">{activeMemberName}'s Profile</h3>
                                <p className="dashboard-card-description">Edit name, DOB, and relationship</p>
                            </button>
                        ) : (
                            <a href="/settings" className="dashboard-card">
                                <div className="dashboard-card-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                </div>
                                <h3 className="dashboard-card-title">My Settings</h3>
                                <p className="dashboard-card-description">Profile and account settings</p>
                            </a>
                        )}

                        <a href="/doctors" className="dashboard-card">
                            <div className="dashboard-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" />
                                    <circle cx="12" cy="7" r="4" />
                                    <path d="M12 11V14" />
                                    <path d="M10.5 12.5H13.5" />
                                </svg>
                            </div>
                            <h3 className="dashboard-card-title">{activeMemberId ? `${activeMemberName}'s` : 'My'} Doctors</h3>
                            <p className="dashboard-card-description">Your healthcare providers</p>
                        </a>

                        <a href="/medications" className="dashboard-card">
                            <div className="dashboard-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.5 20.5L3.5 13.5C1.5 11.5 1.5 8.5 3.5 6.5C5.5 4.5 8.5 4.5 10.5 6.5L17.5 13.5C19.5 15.5 19.5 18.5 17.5 20.5C15.5 22.5 12.5 22.5 10.5 20.5Z" />
                                    <path d="M7 13.5L13.5 7" />
                                </svg>
                            </div>
                            <h3 className="dashboard-card-title">{activeMemberId ? `${activeMemberName}'s` : 'My'} Medications</h3>
                            <p className="dashboard-card-description">View and manage prescriptions</p>
                        </a>

                        <a href="/medical-records" className="dashboard-card">
                            <div className="dashboard-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
                                    <path d="M14 2V8H20" />
                                    <path d="M16 13H8" />
                                    <path d="M16 17H8" />
                                    <path d="M10 9H8" />
                                </svg>
                            </div>
                            <h3 className="dashboard-card-title">{activeMemberId ? `${activeMemberName}'s` : 'My'} Medical Records</h3>
                            <p className="dashboard-card-description">Conditions, allergies, and history</p>
                        </a>

                        <a href="/insurance" className="dashboard-card">
                            <div className="dashboard-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                                    <path d="M9 12L11 14L15 10" />
                                </svg>
                            </div>
                            <h3 className="dashboard-card-title">{activeMemberId ? `${activeMemberName}'s` : 'My'} Health Insurance</h3>
                            <p className="dashboard-card-description">Insurance plans and coverage</p>
                        </a>

                        <a href="/intake-form" className="dashboard-card">
                            <div className="dashboard-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                    <path d="M9 14l2 2 4-4" />
                                </svg>
                            </div>
                            <h3 className="dashboard-card-title">{activeMemberId ? `${activeMemberName}'s` : 'My'} Intake Form</h3>
                            <p className="dashboard-card-description">Pre-filled patient form for doctor visits</p>
                        </a>

                        <a href="/appointments" className="dashboard-card">
                            <div className="dashboard-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <path d="M16 2V6" />
                                    <path d="M8 2V6" />
                                    <path d="M3 10H21" />
                                    <path d="M8 14H8.01" />
                                    <path d="M12 14H12.01" />
                                    <path d="M16 14H16.01" />
                                    <path d="M8 18H8.01" />
                                    <path d="M12 18H12.01" />
                                </svg>
                            </div>
                            <h3 className="dashboard-card-title">{activeMemberId ? `${activeMemberName}'s` : 'My'} Appointments</h3>
                            <p className="dashboard-card-description">Upcoming and past visits</p>
                        </a>

                        <button
                            className="dashboard-card dashboard-share-card"
                            onClick={() => setIsShareModalOpen(true)}
                        >
                            <div className="dashboard-card-icon dashboard-share-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <path d="M8.59 13.51L15.42 17.49" />
                                    <path d="M15.41 6.51L8.59 10.49" />
                                </svg>
                            </div>
                            <h3 className="dashboard-card-title">Share Records</h3>
                            <p className="dashboard-card-description">Send to doctors or ER</p>
                        </button>

                        <a href="/medical-bills" className="dashboard-card">
                            <div className="dashboard-card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <h3 className="dashboard-card-title">{activeMemberId ? `${activeMemberName}'s` : 'My'} Medical Bills</h3>
                            <p className="dashboard-card-description">Track bills, find errors, and manage payments</p>
                        </a>
                    </div>
                </div>
            </main>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onSuccess={(data) => {
                    console.log('Share created:', data);
                }}
                familyMemberId={activeMemberId}
                familyMemberName={activeMemberName}
            />

            <React.Suspense fallback={null}>
                {isFamilyModalOpen && (
                    <FamilyMemberModal
                        isOpen={isFamilyModalOpen}
                        onClose={() => {
                            setIsFamilyModalOpen(false);
                            setEditingMember(null);
                        }}
                        member={editingMember}
                        onSaved={() => {
                            loadFamilyMembers();
                            setIsFamilyModalOpen(false);
                            setEditingMember(null);
                        }}
                        onDeleted={() => {
                            setActiveMemberId(null);
                            loadFamilyMembers();
                            setIsFamilyModalOpen(false);
                            setEditingMember(null);
                        }}
                    />
                )}
            </React.Suspense>
        </div>
    );
};

export default MyDashboard;
