import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import PharmacySearch from '../../components/PharmacySearch';
import './Settings.css';

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

const Settings = ({ onLogout }) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }

                const data = await response.json();
                if (data.success) {
                    setUserData({
                        ...data.user,
                        backupEmail: data.user.backupEmail || '',
                        phone: data.user.phone || '',
                        dateOfBirth: data.user.dateOfBirth || '',
                        ssnLast4: data.user.ssnLast4 || '',
                        address: data.user.address || {
                            street: '',
                            city: '',
                            state: '',
                            zipCode: ''
                        },
                        emergencyContact: data.user.emergencyContact || {
                            name: '',
                            relationship: '',
                            phone: ''
                        },
                        pharmacies: data.user.pharmacies || []
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const [activeSection, setActiveSection] = useState(null);
    const [formData, setFormData] = useState({});
    const [editingPharmacy, setEditingPharmacy] = useState(null);
    const [pharmacyFormData, setPharmacyFormData] = useState({
        name: '',
        phone: '',
        fax: '',
        address: { street: '', city: '', state: '', zipCode: '' },
        isPreferred: false
    });

    const openSection = (section) => {
        setActiveSection(section);
        setFormData({ ...userData });
    };

    const closeSection = () => {
        setActiveSection(null);
        setFormData({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData({
                ...formData,
                [parent]: {
                    ...formData[parent],
                    [child]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Build update payload with only profile fields
        const updateData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || undefined,
            backupEmail: formData.backupEmail || undefined,
            dateOfBirth: formData.dateOfBirth || undefined,
            ssnLast4: formData.ssnLast4 || undefined,
            address: formData.address,
            emergencyContact: formData.emergencyContact
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                setUserData(formData);
                closeSection();
            } else {
                console.error('Save failed:', data.message);
                alert(data.message || 'Failed to save changes');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save changes. Please try again.');
        }
    };

    // Pharmacy functions
    const openPharmacyForm = (pharmacy = null) => {
        if (pharmacy) {
            setEditingPharmacy(pharmacy);
            setPharmacyFormData({
                name: pharmacy.name || '',
                phone: pharmacy.phone || '',
                fax: pharmacy.fax || '',
                address: pharmacy.address || { street: '', city: '', state: '', zipCode: '' },
                isPreferred: pharmacy.isPreferred || false
            });
        } else {
            setEditingPharmacy('new');
            setPharmacyFormData({
                name: '',
                phone: '',
                fax: '',
                address: { street: '', city: '', state: '', zipCode: '' },
                isPreferred: false
            });
        }
    };

    const closePharmacyForm = () => {
        setEditingPharmacy(null);
        setPharmacyFormData({
            name: '',
            phone: '',
            fax: '',
            address: { street: '', city: '', state: '', zipCode: '' },
            isPreferred: false
        });
    };

    const handlePharmacyChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('address.')) {
            const field = name.split('.')[1];
            setPharmacyFormData(prev => ({
                ...prev,
                address: { ...prev.address, [field]: value }
            }));
        } else {
            setPharmacyFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSavePharmacy = async () => {
        const token = localStorage.getItem('token');
        if (!token || !pharmacyFormData.name) return;

        try {
            let response;
            if (editingPharmacy === 'new') {
                response = await fetch(`${API_URL}/users/pharmacies`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(pharmacyFormData)
                });
            } else {
                response = await fetch(`${API_URL}/users/pharmacies/${editingPharmacy._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(pharmacyFormData)
                });
            }

            const data = await response.json();
            if (data.success) {
                // Refresh user data
                const meResponse = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const meData = await meResponse.json();
                if (meData.success) {
                    setUserData(prev => ({ ...prev, pharmacies: meData.user.pharmacies || [] }));
                }
                closePharmacyForm();
            } else {
                alert(data.message || 'Failed to save pharmacy');
            }
        } catch (error) {
            console.error('Save pharmacy error:', error);
            alert('Failed to save pharmacy');
        }
    };

    const handleDeletePharmacy = async (pharmacyId) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!window.confirm('Delete this pharmacy?')) return;

        try {
            const response = await fetch(`${API_URL}/users/pharmacies/${pharmacyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setUserData(prev => ({
                    ...prev,
                    pharmacies: prev.pharmacies.filter(p => p._id !== pharmacyId)
                }));
                closePharmacyForm();
            }
        } catch (error) {
            console.error('Delete pharmacy error:', error);
            alert('Failed to delete pharmacy');
        }
    };

    const handlePharmacySearchSelect = (pharmacyData) => {
        setPharmacyFormData({
            name: pharmacyData.name,
            phone: pharmacyData.phone,
            fax: '',
            address: pharmacyData.address,
            isPreferred: false
        });
    };

    const handleDeleteAccount = async () => {
        const confirmText = window.prompt(
            'This will permanently delete your account and all your data (medications, doctors, appointments, insurance, medical records). This cannot be undone.\n\nType "DELETE" to confirm:'
        );

        if (confirmText !== 'DELETE') {
            if (confirmText !== null) {
                alert('Account deletion cancelled. You must type DELETE exactly to confirm.');
            }
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/account`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('userConsent');
                alert('Your account has been deleted. We\'re sorry to see you go.');
                navigate('/');
            } else {
                alert(data.message || 'Failed to delete account. Please try again.');
            }
        } catch (error) {
            console.error('Delete account error:', error);
            alert('Failed to delete account. Please try again.');
        }
    };

    const getSectionStatus = (fields) => {
        if (!userData) return { filled: 0, total: fields.length };
        const filledCount = fields.filter(f => {
            if (f.includes('.')) {
                const [parent, child] = f.split('.');
                return userData[parent]?.[child];
            }
            return userData[f];
        }).length;
        return { filled: filledCount, total: fields.length };
    };

    const sections = [
        {
            id: 'personal',
            title: 'Personal Information',
            description: 'Name, date of birth, and identification',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
            fields: ['firstName', 'lastName', 'dateOfBirth', 'ssnLast4']
        },
        {
            id: 'contact',
            title: 'Contact Information',
            description: 'Email and phone number',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92V19.92C22 20.48 21.56 20.93 21 20.98C20.24 21.05 19.49 21.08 18.75 21.08C9.92 21.08 2.75 13.91 2.75 5.08C2.75 4.34 2.78 3.59 2.85 2.83C2.9 2.27 3.35 1.83 3.91 1.83H6.91C7.41 1.83 7.84 2.19 7.93 2.68C8.1 3.62 8.38 4.53 8.75 5.39C8.92 5.78 8.82 6.23 8.51 6.54L7.18 7.87C8.78 10.67 11.09 12.98 13.89 14.58L15.22 13.25C15.53 12.94 15.98 12.84 16.37 13.01C17.23 13.38 18.14 13.66 19.08 13.83C19.57 13.92 19.93 14.35 19.93 14.85V17.85C19.93 17.88 19.93 17.91 19.92 17.93" />
                </svg>
            ),
            fields: ['backupEmail', 'phone']
        },
        {
            id: 'address',
            title: 'Home Address',
            description: 'Your residential address',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9L12 2L21 9V20C21 20.53 20.79 21.04 20.41 21.41C20.04 21.79 19.53 22 19 22H5C4.47 22 3.96 21.79 3.59 21.41C3.21 21.04 3 20.53 3 20V9Z" />
                    <path d="M9 22V12H15V22" />
                </svg>
            ),
            fields: ['address.street', 'address.city', 'address.state', 'address.zipCode']
        },
        {
            id: 'emergency',
            title: 'Emergency Contact',
            description: 'Who to contact in an emergency',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.73C2.86 20.91 3.21 21 3.56 21H20.49C20.84 21 21.19 20.91 21.49 20.73C21.79 20.56 22.05 20.3 22.23 20C22.41 19.7 22.5 19.36 22.5 19C22.5 18.64 22.41 18.3 22.23 18L13.77 3.86C13.59 3.56 13.33 3.32 13.03 3.15C12.73 2.98 12.38 2.89 12.03 2.89C11.68 2.89 11.33 2.98 11.03 3.15C10.73 3.32 10.47 3.56 10.29 3.86Z" />
                    <path d="M12 9V13" />
                    <path d="M12 17H12.01" />
                </svg>
            ),
            fields: ['emergencyContact.name', 'emergencyContact.relationship', 'emergencyContact.phone']
        },
        {
            id: 'pharmacies',
            title: 'My Pharmacies',
            description: 'Save your pharmacies for quick access',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                </svg>
            ),
            fields: [],
            isPharmacies: true
        },
        {
            id: 'security',
            title: 'Account Security',
            description: 'Password and security settings',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" />
                </svg>
            ),
            fields: []
        }
    ];

    const completedSections = sections.filter(s => {
        if (s.fields.length === 0) return false;
        const status = getSectionStatus(s.fields);
        return status.filled === status.total;
    }).length;

    const totalSections = sections.filter(s => s.fields.length > 0).length;

    if (loading || !userData) {
        return null; // Loading or redirecting
    }

    return (
        <div className="settings-page">
            <MemberHeader user={userData} onLogout={onLogout} />

            <main className="settings-main">
                <div className="settings-container">
                    <a href="/dashboard" className="back-to-dashboard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Dashboard
                    </a>
                    <div className="settings-header">
                        <h1 className="settings-title">My Settings</h1>
                        <p className="settings-subtitle">Manage your profile and account settings</p>
                    </div>

                    {completedSections < totalSections && (
                        <div className="settings-progress">
                            <div className="settings-progress-text">
                                <span className="settings-progress-label">Profile Completion</span>
                                <span className="settings-progress-count">{completedSections} of {totalSections} sections</span>
                            </div>
                            <div className="settings-progress-bar">
                                <div
                                    className="settings-progress-fill"
                                    style={{ width: `${(completedSections / totalSections) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="settings-sections">
                        {sections.map((section) => {
                            const status = getSectionStatus(section.fields);
                            const isComplete = section.fields.length > 0 && status.filled === status.total;
                            const pharmacyCount = section.isPharmacies ? (userData?.pharmacies?.length || 0) : 0;

                            return (
                                <button
                                    key={section.id}
                                    className={`settings-section-card ${isComplete ? 'settings-section-complete' : ''}`}
                                    onClick={() => openSection(section.id)}
                                >
                                    <div className="settings-section-icon">
                                        {section.icon}
                                    </div>
                                    <div className="settings-section-content">
                                        <h3 className="settings-section-title">{section.title}</h3>
                                        <p className="settings-section-description">{section.description}</p>
                                    </div>
                                    <div className="settings-section-status">
                                        {isComplete ? (
                                            <span className="settings-status-complete">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 6L9 17L4 12" />
                                                </svg>
                                            </span>
                                        ) : section.fields.length > 0 ? (
                                            <span className="settings-status-incomplete">{status.filled}/{status.total}</span>
                                        ) : section.isPharmacies ? (
                                            <span className="settings-status-count">{pharmacyCount} saved</span>
                                        ) : (
                                            <span className="settings-status-arrow">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 18L15 12L9 6" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Section Edit Modals */}
            {activeSection && (
                <>
                    <div className="settings-modal-overlay" onClick={closeSection}></div>
                    <div className="settings-modal">
                        <div className="settings-modal-header">
                            <h2 className="settings-modal-title">
                                {sections.find(s => s.id === activeSection)?.title}
                            </h2>
                            <button className="settings-modal-close" onClick={closeSection}>
                                <span className="settings-modal-close-icon"></span>
                            </button>
                        </div>

                        <div className="settings-modal-body">
                            {activeSection === 'personal' && (
                                <form className="settings-form">
                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label className="settings-label">First Name</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                className="settings-input"
                                                value={formData.firstName || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="settings-form-group">
                                            <label className="settings-label">Last Name</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                className="settings-input"
                                                value={formData.lastName || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            className="settings-input"
                                            value={formData.dateOfBirth || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">Last 4 of SSN</label>
                                        <input
                                            type="text"
                                            name="ssnLast4"
                                            className="settings-input"
                                            maxLength="4"
                                            pattern="[0-9]{4}"
                                            placeholder="1234"
                                            value={formData.ssnLast4 || ''}
                                            onChange={handleChange}
                                        />
                                        <span className="settings-input-hint">Used for identification at clinics</span>
                                    </div>
                                </form>
                            )}

                            {activeSection === 'contact' && (
                                <form className="settings-form">
                                    <div className="settings-form-group">
                                        <label className="settings-label">Primary Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="settings-input settings-input-readonly"
                                            value={formData.email || ''}
                                            readOnly
                                        />
                                        <span className="settings-input-hint">Primary email cannot be changed</span>
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">Backup Email</label>
                                        <input
                                            type="email"
                                            name="backupEmail"
                                            className="settings-input"
                                            placeholder="backup@example.com"
                                            value={formData.backupEmail || ''}
                                            onChange={handleChange}
                                        />
                                        <span className="settings-input-hint">Used for account recovery</span>
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="settings-input"
                                            placeholder="(555) 555-5555"
                                            value={formData.phone || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </form>
                            )}

                            {activeSection === 'address' && (
                                <form className="settings-form">
                                    <div className="settings-form-group">
                                        <label className="settings-label">Street Address</label>
                                        <input
                                            type="text"
                                            name="address.street"
                                            className="settings-input"
                                            value={formData.address?.street || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">City</label>
                                        <input
                                            type="text"
                                            name="address.city"
                                            className="settings-input"
                                            value={formData.address?.city || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label className="settings-label">State</label>
                                            <input
                                                type="text"
                                                name="address.state"
                                                className="settings-input"
                                                value={formData.address?.state || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="settings-form-group">
                                            <label className="settings-label">ZIP Code</label>
                                            <input
                                                type="text"
                                                name="address.zipCode"
                                                className="settings-input"
                                                value={formData.address?.zipCode || ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </form>
                            )}

                            {activeSection === 'emergency' && (
                                <form className="settings-form">
                                    <div className="settings-form-group">
                                        <label className="settings-label">Contact Name</label>
                                        <input
                                            type="text"
                                            name="emergencyContact.name"
                                            className="settings-input"
                                            value={formData.emergencyContact?.name || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">Relationship</label>
                                        <input
                                            type="text"
                                            name="emergencyContact.relationship"
                                            className="settings-input"
                                            placeholder="Spouse, Parent, Sibling, etc."
                                            value={formData.emergencyContact?.relationship || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="emergencyContact.phone"
                                            className="settings-input"
                                            placeholder="(555) 555-5555"
                                            value={formData.emergencyContact?.phone || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </form>
                            )}

                            {activeSection === 'security' && (
                                <form className="settings-form">
                                    <div className="settings-form-group">
                                        <label className="settings-label">Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            className="settings-input"
                                            value={formData.currentPassword || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            className="settings-input"
                                            value={formData.newPassword || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            className="settings-input"
                                            value={formData.confirmPassword || ''}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="settings-danger-zone">
                                        <h3 className="settings-danger-title">Danger Zone</h3>
                                        <p className="settings-danger-text">
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                        <button
                                            type="button"
                                            className="settings-btn-danger"
                                            onClick={handleDeleteAccount}
                                        >
                                            Delete My Account
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeSection === 'pharmacies' && !editingPharmacy && (
                                <div className="settings-pharmacies">
                                    {userData?.pharmacies?.length === 0 ? (
                                        <div className="settings-pharmacies-empty">
                                            <p>No pharmacies saved yet</p>
                                        </div>
                                    ) : (
                                        <div className="settings-pharmacies-list">
                                            {userData?.pharmacies?.map(pharmacy => (
                                                <div
                                                    key={pharmacy._id}
                                                    className="settings-pharmacy-item"
                                                    onClick={() => openPharmacyForm(pharmacy)}
                                                >
                                                    <div className="settings-pharmacy-info">
                                                        <span className="settings-pharmacy-name">
                                                            {pharmacy.name}
                                                            {pharmacy.isPreferred && (
                                                                <span className="settings-pharmacy-preferred">Preferred</span>
                                                            )}
                                                        </span>
                                                        {pharmacy.phone && (
                                                            <span className="settings-pharmacy-phone">{pharmacy.phone}</span>
                                                        )}
                                                    </div>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-pharmacy-arrow">
                                                        <path d="M9 18L15 12L9 6" />
                                                    </svg>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="settings-pharmacy-add-btn"
                                        onClick={() => openPharmacyForm()}
                                    >
                                        + Add Pharmacy
                                    </button>
                                </div>
                            )}

                            {activeSection === 'pharmacies' && editingPharmacy && (
                                <form className="settings-form">
                                    {editingPharmacy === 'new' && (
                                        <div className="settings-form-group">
                                            <label className="settings-label">Find Pharmacy</label>
                                            <PharmacySearch
                                                onSelect={handlePharmacySearchSelect}
                                                placeholder="Search pharmacies near you..."
                                            />
                                        </div>
                                    )}

                                    {editingPharmacy === 'new' && pharmacyFormData.name && (
                                        <div className="settings-pharmacy-divider">
                                            <span>or edit details below</span>
                                        </div>
                                    )}

                                    <div className="settings-form-group">
                                        <label className="settings-label">Pharmacy Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="settings-input"
                                            placeholder="e.g., Kroger Pharmacy"
                                            value={pharmacyFormData.name}
                                            onChange={handlePharmacyChange}
                                            required
                                        />
                                    </div>
                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label className="settings-label">Phone</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                className="settings-input"
                                                placeholder="(555) 123-4567"
                                                value={pharmacyFormData.phone}
                                                onChange={handlePharmacyChange}
                                            />
                                        </div>
                                        <div className="settings-form-group">
                                            <label className="settings-label">Fax</label>
                                            <input
                                                type="tel"
                                                name="fax"
                                                className="settings-input"
                                                placeholder="(555) 123-4568"
                                                value={pharmacyFormData.fax}
                                                onChange={handlePharmacyChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-label">Street Address</label>
                                        <input
                                            type="text"
                                            name="address.street"
                                            className="settings-input"
                                            value={pharmacyFormData.address?.street || ''}
                                            onChange={handlePharmacyChange}
                                        />
                                    </div>
                                    <div className="settings-form-row">
                                        <div className="settings-form-group">
                                            <label className="settings-label">City</label>
                                            <input
                                                type="text"
                                                name="address.city"
                                                className="settings-input"
                                                value={pharmacyFormData.address?.city || ''}
                                                onChange={handlePharmacyChange}
                                            />
                                        </div>
                                        <div className="settings-form-group" style={{flex: '0 0 80px'}}>
                                            <label className="settings-label">State</label>
                                            <input
                                                type="text"
                                                name="address.state"
                                                className="settings-input"
                                                maxLength={2}
                                                value={pharmacyFormData.address?.state || ''}
                                                onChange={handlePharmacyChange}
                                            />
                                        </div>
                                        <div className="settings-form-group" style={{flex: '0 0 100px'}}>
                                            <label className="settings-label">ZIP</label>
                                            <input
                                                type="text"
                                                name="address.zipCode"
                                                className="settings-input"
                                                value={pharmacyFormData.address?.zipCode || ''}
                                                onChange={handlePharmacyChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="settings-form-group">
                                        <label className="settings-checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="isPreferred"
                                                checked={pharmacyFormData.isPreferred}
                                                onChange={handlePharmacyChange}
                                            />
                                            <span>Set as preferred pharmacy</span>
                                        </label>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="settings-modal-footer">
                            {activeSection === 'pharmacies' ? (
                                editingPharmacy ? (
                                    <>
                                        {editingPharmacy !== 'new' && (
                                            <button
                                                className="settings-btn-delete"
                                                onClick={() => handleDeletePharmacy(editingPharmacy._id)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                        <div className="settings-modal-actions">
                                            <button className="settings-btn-cancel" onClick={closePharmacyForm}>
                                                Cancel
                                            </button>
                                            <button className="settings-btn-save" onClick={handleSavePharmacy}>
                                                {editingPharmacy === 'new' ? 'Add Pharmacy' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <button className="settings-btn-cancel" onClick={closeSection} style={{marginLeft: 'auto'}}>
                                        Done
                                    </button>
                                )
                            ) : (
                                <>
                                    <button className="settings-btn-cancel" onClick={closeSection}>
                                        Cancel
                                    </button>
                                    <button className="settings-btn-save" onClick={handleSave}>
                                        Save Changes
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Settings;
