import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberHeader from '../../components/MemberHeader';
import FamilyMemberTabs from '../../components/FamilyMemberTabs';
import { useFamilyMember } from '../../context/FamilyMemberContext';
import intakeService from '../../services/intakeService';
import './IntakeForm.css';

const IntakeForm = ({ onLogout }) => {
    const navigate = useNavigate();
    const { activeMemberId, getActiveMemberName } = useFamilyMember();
    const activeMemberName = getActiveMemberName();

    const [user, setUser] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await intakeService.getIntakeData(activeMemberId);
                setData(result);
            } catch (err) {
                console.error('Error loading intake data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user, activeMemberId]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    // Section completeness checks
    const isPersonalInfoComplete = () => {
        if (!data?.user) return false;
        const u = data.user;
        return !!(u.firstName && u.lastName && u.dateOfBirth);
    };

    const isContactComplete = () => {
        if (!data?.user) return false;
        const u = data.user;
        return !!(u.phone || u.email);
    };

    const isEmergencyComplete = () => {
        if (!data?.user) return false;
        const ec = data.user.emergencyContact;
        return !!(ec && ec.name && ec.phone);
    };

    const isInsuranceComplete = () => {
        return data?.insurance?.length > 0;
    };

    const isDoctorsComplete = () => {
        return data?.doctors?.length > 0;
    };

    const isPharmacyComplete = () => {
        return data?.user?.pharmacies?.length > 0;
    };

    const isMedicalHistoryComplete = () => {
        if (!data?.medicalHistory) return false;
        const h = data.medicalHistory;
        return (h.conditions?.length > 0 || h.allergies?.length > 0 || h.bloodType);
    };

    const isMedicationsComplete = () => {
        return data?.medications?.length > 0;
    };

    const isSocialHistoryComplete = () => {
        if (!data?.medicalHistory?.socialHistory) return false;
        const sh = data.medicalHistory.socialHistory;
        return !!(sh.smokingStatus || sh.alcoholUse || sh.exerciseFrequency);
    };

    const isAdvanceDirectivesComplete = () => {
        if (!data?.user?.advanceDirectives) return false;
        const ad = data.user.advanceDirectives;
        return !!(ad.hasLivingWill || ad.hasHealthcarePOA || ad.isDNR || ad.isOrganDonor);
    };

    const completedCount = [
        isPersonalInfoComplete(),
        isContactComplete(),
        isEmergencyComplete(),
        isInsuranceComplete(),
        isDoctorsComplete(),
        isPharmacyComplete(),
        isMedicalHistoryComplete(),
        isMedicationsComplete(),
        isSocialHistoryComplete(),
        isAdvanceDirectivesComplete()
    ].filter(Boolean).length;

    // Section previews
    const getPersonalPreview = () => {
        if (!data?.user) return 'Add your personal information';
        const u = data.user;
        const parts = [`${u.firstName || ''} ${u.lastName || ''}`.trim()];
        if (u.dateOfBirth) parts.push(`DOB: ${formatDate(u.dateOfBirth)}`);
        if (u.gender) parts.push(u.gender);
        return parts.join(' | ') || 'Add your personal information';
    };

    const getContactPreview = () => {
        if (!data?.user) return 'Add your contact information';
        const u = data.user;
        const parts = [];
        if (u.phone) parts.push(u.phone);
        if (u.email) parts.push(u.email);
        return parts.join(' | ') || 'Add your contact information';
    };

    const getEmergencyPreview = () => {
        if (!data?.user?.emergencyContact?.name) return 'Add emergency contact';
        const ec = data.user.emergencyContact;
        return `${ec.name}${ec.relationship ? ` (${ec.relationship})` : ''}`;
    };

    const getInsurancePreview = () => {
        if (!data?.insurance?.length) return 'Add insurance on the Insurance page';
        return `${data.insurance.length} plan${data.insurance.length > 1 ? 's' : ''} on file`;
    };

    const getDoctorsPreview = () => {
        if (!data?.doctors?.length) return 'Add doctors on the Doctors page';
        return `${data.doctors.length} doctor${data.doctors.length > 1 ? 's' : ''} on file`;
    };

    const getPharmacyPreview = () => {
        if (!data?.user?.pharmacies?.length) return 'Add pharmacy in Settings';
        const preferred = data.user.pharmacies.find(p => p.isPreferred);
        return preferred ? preferred.name : data.user.pharmacies[0].name;
    };

    const getMedHistoryPreview = () => {
        if (!data?.medicalHistory) return 'Add medical history on the Records page';
        const h = data.medicalHistory;
        const parts = [];
        if (h.conditions?.length) parts.push(`${h.conditions.length} condition${h.conditions.length > 1 ? 's' : ''}`);
        if (h.allergies?.length) parts.push(`${h.allergies.length} allerg${h.allergies.length > 1 ? 'ies' : 'y'}`);
        if (h.surgeries?.length) parts.push(`${h.surgeries.length} surger${h.surgeries.length > 1 ? 'ies' : 'y'}`);
        return parts.join(', ') || 'Add medical history on the Records page';
    };

    const getMedicationsPreview = () => {
        if (!data?.medications?.length) return 'Add medications on the Medications page';
        const active = data.medications.filter(m => m.status === 'active');
        return `${active.length} active medication${active.length !== 1 ? 's' : ''}`;
    };

    const getSocialPreview = () => {
        if (!data?.medicalHistory?.socialHistory) return 'Complete this section';
        const sh = data.medicalHistory.socialHistory;
        const parts = [];
        if (sh.smokingStatus && sh.smokingStatus !== 'never') parts.push(`Smoking: ${sh.smokingStatus}`);
        else if (sh.smokingStatus === 'never') parts.push('Non-smoker');
        if (sh.alcoholUse && sh.alcoholUse !== 'none') parts.push(`Alcohol: ${sh.alcoholUse}`);
        if (sh.exerciseFrequency && sh.exerciseFrequency !== 'none') parts.push(`Exercise: ${sh.exerciseFrequency.replace(/-/g, ' ')}`);
        return parts.join(' | ') || 'Complete this section';
    };

    const getDirectivesPreview = () => {
        if (!data?.user?.advanceDirectives) return 'Complete this section';
        const ad = data.user.advanceDirectives;
        const parts = [];
        if (ad.hasLivingWill) parts.push('Living Will');
        if (ad.hasHealthcarePOA) parts.push('Healthcare POA');
        if (ad.isOrganDonor) parts.push('Organ Donor');
        if (ad.isDNR) parts.push('DNR');
        return parts.join(', ') || 'Complete this section';
    };

    // Open editable sections
    const openPersonalInfo = () => {
        setActiveSection('personal');
        setFormData({
            firstName: data?.user?.firstName || '',
            lastName: data?.user?.lastName || '',
            dateOfBirth: data?.user?.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : '',
            gender: data?.user?.gender || '',
            race: data?.user?.race || '',
            ethnicity: data?.user?.ethnicity || '',
            preferredLanguage: data?.user?.preferredLanguage || 'English',
            maritalStatus: data?.user?.maritalStatus || '',
            occupation: data?.user?.occupation || '',
            employer: data?.user?.employer || ''
        });
    };

    const openContactInfo = () => {
        setActiveSection('contact');
        setFormData({
            phone: data?.user?.phone || '',
            email: data?.user?.email || '',
            'address.street': data?.user?.address?.street || '',
            'address.city': data?.user?.address?.city || '',
            'address.state': data?.user?.address?.state || '',
            'address.zipCode': data?.user?.address?.zipCode || ''
        });
    };

    const openEmergencyContact = () => {
        setActiveSection('emergency');
        setFormData({
            'emergencyContact.name': data?.user?.emergencyContact?.name || '',
            'emergencyContact.relationship': data?.user?.emergencyContact?.relationship || '',
            'emergencyContact.phone': data?.user?.emergencyContact?.phone || ''
        });
    };

    const openSocialHistory = () => {
        setActiveSection('social');
        const sh = data?.medicalHistory?.socialHistory || {};
        setFormData({
            smokingStatus: sh.smokingStatus || 'never',
            smokingDetail: sh.smokingDetail || '',
            alcoholUse: sh.alcoholUse || 'none',
            alcoholDetail: sh.alcoholDetail || '',
            drugUse: sh.drugUse || 'none',
            drugDetail: sh.drugDetail || '',
            exerciseFrequency: sh.exerciseFrequency || 'none',
            exerciseDetail: sh.exerciseDetail || '',
            dietRestrictions: sh.dietRestrictions || ''
        });
    };

    const openAdvanceDirectives = () => {
        setActiveSection('directives');
        const ad = data?.user?.advanceDirectives || {};
        setFormData({
            hasLivingWill: ad.hasLivingWill || false,
            hasHealthcarePOA: ad.hasHealthcarePOA || false,
            healthcarePOAName: ad.healthcarePOAName || '',
            healthcarePOAPhone: ad.healthcarePOAPhone || '',
            isDNR: ad.isDNR || false,
            isOrganDonor: ad.isOrganDonor || false
        });
    };

    const closeSection = () => {
        setActiveSection(null);
        setFormData({});
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (activeSection === 'personal') {
                await intakeService.updateUserProfile({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    race: formData.race,
                    ethnicity: formData.ethnicity,
                    preferredLanguage: formData.preferredLanguage,
                    maritalStatus: formData.maritalStatus,
                    occupation: formData.occupation,
                    employer: formData.employer
                });
            } else if (activeSection === 'contact') {
                await intakeService.updateUserProfile({
                    phone: formData.phone,
                    address: {
                        street: formData['address.street'],
                        city: formData['address.city'],
                        state: formData['address.state'],
                        zipCode: formData['address.zipCode']
                    }
                });
            } else if (activeSection === 'emergency') {
                await intakeService.updateUserProfile({
                    emergencyContact: {
                        name: formData['emergencyContact.name'],
                        relationship: formData['emergencyContact.relationship'],
                        phone: formData['emergencyContact.phone']
                    }
                });
            } else if (activeSection === 'social') {
                await intakeService.updateSocialHistory({
                    smokingStatus: formData.smokingStatus,
                    smokingDetail: formData.smokingDetail,
                    alcoholUse: formData.alcoholUse,
                    alcoholDetail: formData.alcoholDetail,
                    drugUse: formData.drugUse,
                    drugDetail: formData.drugDetail,
                    exerciseFrequency: formData.exerciseFrequency,
                    exerciseDetail: formData.exerciseDetail,
                    dietRestrictions: formData.dietRestrictions
                }, activeMemberId);
            } else if (activeSection === 'directives') {
                await intakeService.updateUserProfile({
                    advanceDirectives: {
                        hasLivingWill: formData.hasLivingWill,
                        hasHealthcarePOA: formData.hasHealthcarePOA,
                        healthcarePOAName: formData.healthcarePOAName,
                        healthcarePOAPhone: formData.healthcarePOAPhone,
                        isDNR: formData.isDNR,
                        isOrganDonor: formData.isOrganDonor
                    }
                });
            }

            // Refresh data
            const result = await intakeService.getIntakeData(activeMemberId);
            setData(result);
            closeSection();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    // SVG icons
    const PersonIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );

    const PhoneIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    );

    const AlertIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );

    const ShieldIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
            <path d="M9 12L11 14L15 10" />
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

    const PharmacyIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8V16" />
            <path d="M8 12H16" />
        </svg>
    );

    const FileIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
            <path d="M14 2V8H20" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
        </svg>
    );

    const PillIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 20.5L3.5 13.5C1.5 11.5 1.5 8.5 3.5 6.5C5.5 4.5 8.5 4.5 10.5 6.5L17.5 13.5C19.5 15.5 19.5 18.5 17.5 20.5C15.5 22.5 12.5 22.5 10.5 20.5Z" />
            <path d="M7 13.5L13.5 7" />
        </svg>
    );

    const HeartIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );

    const ClipboardIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M9 14l2 2 4-4" />
        </svg>
    );

    const CheckIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );

    const ArrowIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );

    // Section card renderer
    const renderSectionCard = (icon, title, preview, isComplete, onClick, isLink = false, linkHint = null) => {
        const Tag = isLink ? 'a' : 'button';
        const props = isLink ? { href: onClick, className: `intake-section-card${isComplete ? ' intake-section-complete' : ''}` }
            : { onClick, className: `intake-section-card${isComplete ? ' intake-section-complete' : ''}` };

        return (
            <Tag key={title} {...props}>
                <div className="intake-section-icon">{icon}</div>
                <div className="intake-section-content">
                    <h3 className="intake-section-title">{title}</h3>
                    <p className="intake-section-preview">{preview}</p>
                    {linkHint && <p className="intake-section-link-hint">{linkHint}</p>}
                </div>
                <div className="intake-section-status">
                    {isComplete ? (
                        <div className="intake-status-complete"><CheckIcon /></div>
                    ) : (
                        <span className="intake-status-incomplete">Needed</span>
                    )}
                </div>
                <div className="intake-status-arrow"><ArrowIcon /></div>
            </Tag>
        );
    };

    // Modal renderers
    const renderPersonalModal = () => (
        <>
            <div className="intake-modal-overlay" onClick={closeSection}></div>
            <div className="intake-modal">
                <div className="intake-modal-header">
                    <h2 className="intake-modal-title">Personal Information</h2>
                    <button className="intake-modal-close" onClick={closeSection}>
                        <span className="intake-modal-close-icon"></span>
                    </button>
                </div>
                <div className="intake-modal-body">
                    <div className="intake-form">
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">First Name</label>
                                <input className="intake-input" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" />
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">Last Name</label>
                                <input className="intake-input" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" />
                            </div>
                        </div>
                        <div className="intake-form-group">
                            <label className="intake-label">Date of Birth</label>
                            <input className="intake-input" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                        </div>
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">Gender</label>
                                <select className="intake-select" name="gender" value={formData.gender} onChange={handleChange}>
                                    <option value="">Select...</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="non-binary">Non-binary</option>
                                    <option value="other">Other</option>
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                </select>
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">Marital Status</label>
                                <select className="intake-select" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange}>
                                    <option value="">Select...</option>
                                    <option value="single">Single</option>
                                    <option value="married">Married</option>
                                    <option value="divorced">Divorced</option>
                                    <option value="widowed">Widowed</option>
                                    <option value="separated">Separated</option>
                                    <option value="domestic-partner">Domestic Partner</option>
                                </select>
                            </div>
                        </div>
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">Race</label>
                                <input className="intake-input" name="race" value={formData.race} onChange={handleChange} placeholder="e.g. White, Black, Asian" />
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">Ethnicity</label>
                                <input className="intake-input" name="ethnicity" value={formData.ethnicity} onChange={handleChange} placeholder="e.g. Hispanic, Non-Hispanic" />
                            </div>
                        </div>
                        <div className="intake-form-group">
                            <label className="intake-label">Preferred Language</label>
                            <input className="intake-input" name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} placeholder="English" />
                        </div>
                        <div className="intake-form-divider"><span>Employment</span></div>
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">Occupation</label>
                                <input className="intake-input" name="occupation" value={formData.occupation} onChange={handleChange} placeholder="Your job title" />
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">Employer</label>
                                <input className="intake-input" name="employer" value={formData.employer} onChange={handleChange} placeholder="Company name" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="intake-modal-footer">
                    <button className="intake-btn-cancel" onClick={closeSection}>Cancel</button>
                    <button className="intake-btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </>
    );

    const renderContactModal = () => (
        <>
            <div className="intake-modal-overlay" onClick={closeSection}></div>
            <div className="intake-modal">
                <div className="intake-modal-header">
                    <h2 className="intake-modal-title">Contact Information</h2>
                    <button className="intake-modal-close" onClick={closeSection}>
                        <span className="intake-modal-close-icon"></span>
                    </button>
                </div>
                <div className="intake-modal-body">
                    <div className="intake-form">
                        <div className="intake-form-group">
                            <label className="intake-label">Phone Number</label>
                            <input className="intake-input" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 555-5555" />
                        </div>
                        <div className="intake-form-group">
                            <label className="intake-label">Email (read-only)</label>
                            <input className="intake-input" value={formData.email} readOnly style={{ backgroundColor: '#f0f0f0', color: 'rgb(140,140,140)' }} />
                        </div>
                        <div className="intake-form-divider"><span>Address</span></div>
                        <div className="intake-form-group">
                            <label className="intake-label">Street</label>
                            <input className="intake-input" name="address.street" value={formData['address.street']} onChange={handleChange} placeholder="123 Main St" />
                        </div>
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">City</label>
                                <input className="intake-input" name="address.city" value={formData['address.city']} onChange={handleChange} placeholder="City" />
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">State</label>
                                <input className="intake-input" name="address.state" value={formData['address.state']} onChange={handleChange} placeholder="State" />
                            </div>
                        </div>
                        <div className="intake-form-group">
                            <label className="intake-label">ZIP Code</label>
                            <input className="intake-input" name="address.zipCode" value={formData['address.zipCode']} onChange={handleChange} placeholder="12345" />
                        </div>
                    </div>
                </div>
                <div className="intake-modal-footer">
                    <button className="intake-btn-cancel" onClick={closeSection}>Cancel</button>
                    <button className="intake-btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </>
    );

    const renderEmergencyModal = () => (
        <>
            <div className="intake-modal-overlay" onClick={closeSection}></div>
            <div className="intake-modal">
                <div className="intake-modal-header">
                    <h2 className="intake-modal-title">Emergency Contact</h2>
                    <button className="intake-modal-close" onClick={closeSection}>
                        <span className="intake-modal-close-icon"></span>
                    </button>
                </div>
                <div className="intake-modal-body">
                    <div className="intake-form">
                        <div className="intake-form-group">
                            <label className="intake-label">Contact Name</label>
                            <input className="intake-input" name="emergencyContact.name" value={formData['emergencyContact.name']} onChange={handleChange} placeholder="Full name" />
                        </div>
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">Relationship</label>
                                <input className="intake-input" name="emergencyContact.relationship" value={formData['emergencyContact.relationship']} onChange={handleChange} placeholder="e.g. Spouse, Parent" />
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">Phone</label>
                                <input className="intake-input" name="emergencyContact.phone" value={formData['emergencyContact.phone']} onChange={handleChange} placeholder="(555) 555-5555" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="intake-modal-footer">
                    <button className="intake-btn-cancel" onClick={closeSection}>Cancel</button>
                    <button className="intake-btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </>
    );

    const renderSocialModal = () => (
        <>
            <div className="intake-modal-overlay" onClick={closeSection}></div>
            <div className="intake-modal">
                <div className="intake-modal-header">
                    <h2 className="intake-modal-title">Social History</h2>
                    <button className="intake-modal-close" onClick={closeSection}>
                        <span className="intake-modal-close-icon"></span>
                    </button>
                </div>
                <div className="intake-modal-body">
                    <div className="intake-form">
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">Smoking Status</label>
                                <select className="intake-select" name="smokingStatus" value={formData.smokingStatus} onChange={handleChange}>
                                    <option value="never">Never</option>
                                    <option value="former">Former</option>
                                    <option value="current">Current</option>
                                </select>
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">Details</label>
                                <input className="intake-input" name="smokingDetail" value={formData.smokingDetail} onChange={handleChange} placeholder="e.g. 1 pack/day for 10 years" />
                            </div>
                        </div>
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">Alcohol Use</label>
                                <select className="intake-select" name="alcoholUse" value={formData.alcoholUse} onChange={handleChange}>
                                    <option value="none">None</option>
                                    <option value="occasional">Occasional</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="heavy">Heavy</option>
                                </select>
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">Details</label>
                                <input className="intake-input" name="alcoholDetail" value={formData.alcoholDetail} onChange={handleChange} placeholder="e.g. 2-3 drinks per week" />
                            </div>
                        </div>
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">Drug Use</label>
                                <select className="intake-select" name="drugUse" value={formData.drugUse} onChange={handleChange}>
                                    <option value="none">None</option>
                                    <option value="former">Former</option>
                                    <option value="current">Current</option>
                                </select>
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">Details</label>
                                <input className="intake-input" name="drugDetail" value={formData.drugDetail} onChange={handleChange} placeholder="If applicable" />
                            </div>
                        </div>
                        <div className="intake-form-divider"><span>Lifestyle</span></div>
                        <div className="intake-form-row">
                            <div className="intake-form-group">
                                <label className="intake-label">Exercise Frequency</label>
                                <select className="intake-select" name="exerciseFrequency" value={formData.exerciseFrequency} onChange={handleChange}>
                                    <option value="none">None</option>
                                    <option value="occasional">Occasional</option>
                                    <option value="1-2-per-week">1-2 per week</option>
                                    <option value="3-4-per-week">3-4 per week</option>
                                    <option value="daily">Daily</option>
                                </select>
                            </div>
                            <div className="intake-form-group">
                                <label className="intake-label">Exercise Details</label>
                                <input className="intake-input" name="exerciseDetail" value={formData.exerciseDetail} onChange={handleChange} placeholder="e.g. Walking, weights" />
                            </div>
                        </div>
                        <div className="intake-form-group">
                            <label className="intake-label">Diet Restrictions</label>
                            <input className="intake-input" name="dietRestrictions" value={formData.dietRestrictions} onChange={handleChange} placeholder="e.g. Vegetarian, gluten-free" />
                        </div>
                    </div>
                </div>
                <div className="intake-modal-footer">
                    <button className="intake-btn-cancel" onClick={closeSection}>Cancel</button>
                    <button className="intake-btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </>
    );

    const renderDirectivesModal = () => (
        <>
            <div className="intake-modal-overlay" onClick={closeSection}></div>
            <div className="intake-modal">
                <div className="intake-modal-header">
                    <h2 className="intake-modal-title">Advance Directives</h2>
                    <button className="intake-modal-close" onClick={closeSection}>
                        <span className="intake-modal-close-icon"></span>
                    </button>
                </div>
                <div className="intake-modal-body">
                    <div className="intake-form">
                        <div className="intake-checkbox-group">
                            <label className="intake-checkbox-label">
                                <input type="checkbox" name="hasLivingWill" checked={formData.hasLivingWill} onChange={handleChange} />
                                I have a Living Will
                            </label>
                            <label className="intake-checkbox-label">
                                <input type="checkbox" name="isDNR" checked={formData.isDNR} onChange={handleChange} />
                                Do Not Resuscitate (DNR)
                            </label>
                            <label className="intake-checkbox-label">
                                <input type="checkbox" name="isOrganDonor" checked={formData.isOrganDonor} onChange={handleChange} />
                                Organ Donor
                            </label>
                        </div>
                        <div className="intake-form-divider"><span>Healthcare Power of Attorney</span></div>
                        <label className="intake-checkbox-label">
                            <input type="checkbox" name="hasHealthcarePOA" checked={formData.hasHealthcarePOA} onChange={handleChange} />
                            I have a Healthcare Power of Attorney
                        </label>
                        {formData.hasHealthcarePOA && (
                            <div className="intake-form-row">
                                <div className="intake-form-group">
                                    <label className="intake-label">POA Name</label>
                                    <input className="intake-input" name="healthcarePOAName" value={formData.healthcarePOAName} onChange={handleChange} placeholder="Full name" />
                                </div>
                                <div className="intake-form-group">
                                    <label className="intake-label">POA Phone</label>
                                    <input className="intake-input" name="healthcarePOAPhone" value={formData.healthcarePOAPhone} onChange={handleChange} placeholder="(555) 555-5555" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="intake-modal-footer">
                    <button className="intake-btn-cancel" onClick={closeSection}>Cancel</button>
                    <button className="intake-btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </>
    );

    if (!user) return null;

    return (
        <div className="intake-page">
            <MemberHeader user={user} onLogout={onLogout} />

            <main className="intake-main">
                <div className="intake-container">
                    <a href="/dashboard" className="intake-back-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        Back to Dashboard
                    </a>

                    <FamilyMemberTabs />

                    <div className="intake-header">
                        <h1 className="intake-title">
                            {activeMemberId ? `${activeMemberName}'s Intake Form` : 'Patient Intake Form'}
                        </h1>
                        <p className="intake-subtitle">
                            Pre-filled from your records. Complete any missing sections before your visit.
                        </p>
                    </div>

                    {loading ? (
                        <div className="intake-loading">
                            <div className="intake-spinner"></div>
                            <p>Loading your records...</p>
                        </div>
                    ) : (
                        <>
                            <div className="intake-progress">
                                <div className="intake-progress-text">
                                    <span className="intake-progress-label">Form Completion</span>
                                    <span className="intake-progress-count">{completedCount} of 10</span>
                                </div>
                                <div className="intake-progress-bar">
                                    <div className="intake-progress-fill" style={{ width: `${(completedCount / 10) * 100}%` }}></div>
                                </div>
                            </div>

                            <div className="intake-sections">
                                {renderSectionCard(<PersonIcon />, 'Personal Information', getPersonalPreview(), isPersonalInfoComplete(), openPersonalInfo)}
                                {renderSectionCard(<PhoneIcon />, 'Contact Information', getContactPreview(), isContactComplete(), openContactInfo)}
                                {renderSectionCard(<AlertIcon />, 'Emergency Contact', getEmergencyPreview(), isEmergencyComplete(), openEmergencyContact)}
                                {renderSectionCard(<ShieldIcon />, 'Insurance', getInsurancePreview(), isInsuranceComplete(), '/insurance', true, 'Edit on Insurance page')}
                                {renderSectionCard(<DoctorIcon />, 'Primary Care & Doctors', getDoctorsPreview(), isDoctorsComplete(), '/doctors', true, 'Edit on Doctors page')}
                                {renderSectionCard(<PharmacyIcon />, 'Pharmacy', getPharmacyPreview(), isPharmacyComplete(), '/settings', true, 'Edit in Settings')}
                                {renderSectionCard(<FileIcon />, 'Medical History', getMedHistoryPreview(), isMedicalHistoryComplete(), '/medical-records', true, 'Edit on Medical Records page')}
                                {renderSectionCard(<PillIcon />, 'Current Medications', getMedicationsPreview(), isMedicationsComplete(), '/medications', true, 'Edit on Medications page')}
                                {renderSectionCard(<HeartIcon />, 'Social History', getSocialPreview(), isSocialHistoryComplete(), openSocialHistory)}
                                {renderSectionCard(<ClipboardIcon />, 'Advance Directives', getDirectivesPreview(), isAdvanceDirectivesComplete(), openAdvanceDirectives)}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {activeSection === 'personal' && renderPersonalModal()}
            {activeSection === 'contact' && renderContactModal()}
            {activeSection === 'emergency' && renderEmergencyModal()}
            {activeSection === 'social' && renderSocialModal()}
            {activeSection === 'directives' && renderDirectivesModal()}
        </div>
    );
};

export default IntakeForm;
