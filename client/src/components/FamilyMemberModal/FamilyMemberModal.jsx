import React, { useState, useEffect } from 'react';
import { familyMemberService } from '../../services/familyMemberService';
import './FamilyMemberModal.css';

const FamilyMemberModal = ({ isOpen, onClose, member, onSaved, onDeleted }) => {
    const isEditMode = !!member;
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        relationship: 'child',
        dateOfBirth: '',
        gender: '',
        email: '',
        phone: ''
    });
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 425;

    useEffect(() => {
        if (member) {
            setFormData({
                firstName: member.firstName || '',
                lastName: member.lastName || '',
                relationship: member.relationship || 'child',
                dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split('T')[0] : '',
                gender: member.gender || '',
                email: member.email || '',
                phone: member.phone || ''
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                relationship: 'child',
                dateOfBirth: '',
                gender: '',
                email: '',
                phone: ''
            });
        }
        setShowDeleteConfirm(false);
    }, [member, isOpen]);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.firstName.trim()) return;

        setSaving(true);
        try {
            const data = { ...formData };
            if (!data.dateOfBirth) delete data.dateOfBirth;
            if (!data.gender) delete data.gender;
            if (!data.lastName) delete data.lastName;
            if (!data.email) delete data.email;
            if (!data.phone) delete data.phone;

            if (isEditMode) {
                await familyMemberService.update(member._id, data);
            } else {
                await familyMemberService.create(data);
            }
            onSaved();
        } catch (error) {
            console.error('Error saving family member:', error);
            alert(error.message || 'Failed to save family member.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            await familyMemberService.delete(member._id);
            onDeleted();
        } catch (error) {
            console.error('Error deleting family member:', error);
            alert('Failed to delete family member.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fm-modal-overlay" onClick={onClose}>
            <div
                className={`fm-modal ${isMobile ? 'fm-modal-mobile' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="fm-modal-header">
                    <h2 className="fm-modal-title">
                        {isEditMode ? 'Edit Family Member' : 'Add Family Member'}
                    </h2>
                    <button type="button" className="fm-modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="fm-modal-body">
                    <div className="fm-modal-field">
                        <label className="fm-modal-label">First Name *</label>
                        <input
                            type="text"
                            className="fm-modal-input"
                            value={formData.firstName}
                            onChange={e => handleChange('firstName', e.target.value)}
                            placeholder="Enter first name"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="fm-modal-field">
                        <label className="fm-modal-label">Last Name</label>
                        <input
                            type="text"
                            className="fm-modal-input"
                            value={formData.lastName}
                            onChange={e => handleChange('lastName', e.target.value)}
                            placeholder="Enter last name"
                        />
                    </div>

                    <div className="fm-modal-field">
                        <label className="fm-modal-label">Relationship *</label>
                        <select
                            className="fm-modal-select"
                            value={formData.relationship}
                            onChange={e => handleChange('relationship', e.target.value)}
                        >
                            <option value="spouse">Spouse</option>
                            <option value="child">Child</option>
                            <option value="parent">Parent</option>
                            <option value="sibling">Sibling</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="fm-modal-row">
                        <div className="fm-modal-field">
                            <label className="fm-modal-label">Date of Birth</label>
                            <input
                                type="date"
                                className="fm-modal-input"
                                value={formData.dateOfBirth}
                                onChange={e => handleChange('dateOfBirth', e.target.value)}
                            />
                        </div>

                        <div className="fm-modal-field">
                            <label className="fm-modal-label">Gender</label>
                            <select
                                className="fm-modal-select"
                                value={formData.gender}
                                onChange={e => handleChange('gender', e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    <div className="fm-modal-field">
                        <label className="fm-modal-label">Email</label>
                        <input
                            type="email"
                            className="fm-modal-input"
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                            placeholder="Enter email address"
                        />
                    </div>

                    <div className="fm-modal-field">
                        <label className="fm-modal-label">Phone</label>
                        <input
                            type="tel"
                            className="fm-modal-input"
                            value={formData.phone}
                            onChange={e => handleChange('phone', e.target.value)}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="fm-modal-footer">
                        {isEditMode && !showDeleteConfirm && (
                            <button
                                type="button"
                                className="fm-modal-delete-btn"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                Delete
                            </button>
                        )}

                        {showDeleteConfirm && (
                            <div className="fm-modal-delete-confirm">
                                <p className="fm-modal-delete-warning">
                                    This will permanently delete {member.firstName}'s records including medications, doctors, appointments, and insurance.
                                </p>
                                <div className="fm-modal-delete-actions">
                                    <button
                                        type="button"
                                        className="fm-modal-cancel-delete"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="fm-modal-confirm-delete"
                                        onClick={handleDelete}
                                        disabled={saving}
                                    >
                                        {saving ? 'Deleting...' : 'Delete Everything'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!showDeleteConfirm && (
                            <button
                                type="submit"
                                className="fm-modal-save-btn"
                                disabled={saving || !formData.firstName.trim()}
                            >
                                {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Member'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FamilyMemberModal;
