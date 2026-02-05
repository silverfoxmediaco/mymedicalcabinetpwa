import React, { useState, useEffect } from 'react';
import InsuranceCardScanner from '../InsuranceCardScanner';
import InsuranceProviderSearch from '../InsuranceProviderSearch';
import InsuranceDocumentUpload from '../InsuranceDocumentUpload';
import ConnectInsurance from '../ConnectInsurance';
import './InsuranceModal.css';

const InsuranceModal = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    onFhirSync,
    insurance = null,
    isMobile = false
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [showScanner, setShowScanner] = useState(false);
    const [insuranceDocs, setInsuranceDocs] = useState([]);
    const [formData, setFormData] = useState({
        provider: { name: '', phone: '', website: '' },
        plan: { name: '', type: 'PPO' },
        memberId: '',
        groupNumber: '',
        subscriberName: '',
        relationship: 'self',
        effectiveDate: '',
        isPrimary: false,
        isActive: true,
        coverage: {
            deductible: { individual: '', family: '', met: '' },
            outOfPocketMax: { individual: '', family: '', met: '' },
            copay: { primaryCare: '', specialist: '', urgentCare: '', emergency: '' },
            coinsurance: ''
        }
    });

    const isEditMode = !!insurance;

    useEffect(() => {
        if (insurance) {
            setFormData({
                provider: insurance.provider || { name: '', phone: '', website: '' },
                plan: insurance.plan || { name: '', type: 'PPO' },
                memberId: insurance.memberId || '',
                groupNumber: insurance.groupNumber || '',
                subscriberName: insurance.subscriberName || '',
                relationship: insurance.relationship || 'self',
                effectiveDate: insurance.effectiveDate
                    ? new Date(insurance.effectiveDate).toISOString().split('T')[0]
                    : '',
                isPrimary: insurance.isPrimary || false,
                isActive: insurance.isActive !== false,
                coverage: {
                    deductible: insurance.coverage?.deductible || { individual: '', family: '', met: '' },
                    outOfPocketMax: insurance.coverage?.outOfPocketMax || { individual: '', family: '', met: '' },
                    copay: insurance.coverage?.copay || { primaryCare: '', specialist: '', urgentCare: '', emergency: '' },
                    coinsurance: insurance.coverage?.coinsurance || ''
                }
            });
            setInsuranceDocs(insurance.documents || []);
            setActiveTab('basic');
        } else {
            resetForm();
        }
    }, [insurance, isOpen]);

    const resetForm = () => {
        setFormData({
            provider: { name: '', phone: '', website: '' },
            plan: { name: '', type: 'PPO' },
            memberId: '',
            groupNumber: '',
            subscriberName: '',
            relationship: 'self',
            effectiveDate: '',
            isPrimary: false,
            isActive: true,
            coverage: {
                deductible: { individual: '', family: '', met: '' },
                outOfPocketMax: { individual: '', family: '', met: '' },
                copay: { primaryCare: '', specialist: '', urgentCare: '', emergency: '' },
                coinsurance: ''
            }
        });
        setInsuranceDocs([]);
        setActiveTab('basic');
        setShowDeleteConfirm(false);
    };

    const handleDocumentAdded = (doc) => {
        setInsuranceDocs(prev => [...prev, doc]);
    };

    const handleDocumentRemoved = (docId) => {
        setInsuranceDocs(prev => prev.filter(d => d._id !== docId));
    };

    const handleScanComplete = (scannedData) => {
        setFormData(prev => ({
            ...prev,
            provider: {
                ...prev.provider,
                name: scannedData.provider?.name || prev.provider.name,
                phone: scannedData.provider?.phone || prev.provider.phone
            },
            plan: {
                ...prev.plan,
                name: scannedData.plan?.name || prev.plan.name
            },
            memberId: scannedData.memberId || prev.memberId,
            groupNumber: scannedData.groupNumber || prev.groupNumber,
            subscriberName: scannedData.subscriberName || prev.subscriberName
        }));
        setShowScanner(false);
    };

    const handleProviderSelect = (provider) => {
        setFormData(prev => ({
            ...prev,
            provider: {
                ...prev.provider,
                name: provider.name,
                phone: provider.phone || prev.provider.phone,
                website: provider.website || prev.provider.website
            }
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (name.includes('.')) {
            const parts = name.split('.');
            if (parts.length === 2) {
                setFormData(prev => ({
                    ...prev,
                    [parts[0]]: {
                        ...prev[parts[0]],
                        [parts[1]]: val
                    }
                }));
            } else if (parts.length === 3) {
                setFormData(prev => ({
                    ...prev,
                    [parts[0]]: {
                        ...prev[parts[0]],
                        [parts[1]]: {
                            ...prev[parts[0]][parts[1]],
                            [parts[2]]: val
                        }
                    }
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: val
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Convert string numbers to actual numbers for coverage
        const processedData = {
            ...formData,
            coverage: {
                deductible: {
                    individual: formData.coverage.deductible.individual ? Number(formData.coverage.deductible.individual) : undefined,
                    family: formData.coverage.deductible.family ? Number(formData.coverage.deductible.family) : undefined,
                    met: formData.coverage.deductible.met ? Number(formData.coverage.deductible.met) : undefined
                },
                outOfPocketMax: {
                    individual: formData.coverage.outOfPocketMax.individual ? Number(formData.coverage.outOfPocketMax.individual) : undefined,
                    family: formData.coverage.outOfPocketMax.family ? Number(formData.coverage.outOfPocketMax.family) : undefined,
                    met: formData.coverage.outOfPocketMax.met ? Number(formData.coverage.outOfPocketMax.met) : undefined
                },
                copay: {
                    primaryCare: formData.coverage.copay.primaryCare ? Number(formData.coverage.copay.primaryCare) : undefined,
                    specialist: formData.coverage.copay.specialist ? Number(formData.coverage.copay.specialist) : undefined,
                    urgentCare: formData.coverage.copay.urgentCare ? Number(formData.coverage.copay.urgentCare) : undefined,
                    emergency: formData.coverage.copay.emergency ? Number(formData.coverage.copay.emergency) : undefined
                },
                coinsurance: formData.coverage.coinsurance ? Number(formData.coverage.coinsurance) : undefined
            }
        };

        onSave(processedData);
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete(insurance._id);
            setShowDeleteConfirm(false);
        } else {
            setShowDeleteConfirm(true);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const planTypes = ['HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'Medicare', 'Medicaid', 'Other'];
    const relationships = [
        { value: 'self', label: 'Self' },
        { value: 'spouse', label: 'Spouse' },
        { value: 'child', label: 'Child' },
        { value: 'other', label: 'Other' }
    ];

    return (
        <div className="insurance-modal-overlay" onClick={handleClose}>
            <div
                className={`insurance-modal ${isMobile ? 'mobile' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="insurance-modal-header">
                    <h2 className="insurance-modal-title">
                        {isEditMode ? 'Edit Insurance' : 'Add Insurance'}
                    </h2>
                    <button
                        type="button"
                        className="insurance-modal-close"
                        onClick={handleClose}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="insurance-modal-tabs">
                    <button
                        type="button"
                        className={`insurance-modal-tab ${activeTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('basic')}
                    >
                        Basic Info
                    </button>
                    <button
                        type="button"
                        className={`insurance-modal-tab ${activeTab === 'coverage' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coverage')}
                    >
                        Coverage
                    </button>
                    {isEditMode && (
                        <button
                            type="button"
                            className={`insurance-modal-tab ${activeTab === 'documents' ? 'active' : ''}`}
                            onClick={() => setActiveTab('documents')}
                        >
                            Documents
                            {insuranceDocs.length > 0 && (
                                <span className="insurance-modal-tab-count">{insuranceDocs.length}</span>
                            )}
                        </button>
                    )}
                </div>

                <div className="insurance-modal-content">
                    <form onSubmit={handleSubmit} className="insurance-form">
                        {activeTab === 'basic' && (
                            <>
                                {!isEditMode && (
                                    <button
                                        type="button"
                                        className="scan-card-btn"
                                        onClick={() => setShowScanner(true)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                            <circle cx="12" cy="13" r="4"/>
                                        </svg>
                                        Scan Insurance Card
                                    </button>
                                )}

                                <div className="form-group">
                                    <label className="form-label" htmlFor="provider-name">
                                        Insurance Provider *
                                    </label>
                                    <InsuranceProviderSearch
                                        value={formData.provider.name}
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            provider: { ...prev.provider, name: value }
                                        }))}
                                        onSelect={handleProviderSelect}
                                        placeholder="e.g., Blue Cross Blue Shield"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="plan-name">
                                            Plan Name
                                        </label>
                                        <input
                                            id="plan-name"
                                            type="text"
                                            name="plan.name"
                                            className="form-input"
                                            value={formData.plan.name}
                                            onChange={handleChange}
                                            placeholder="e.g., Gold 1500"
                                        />
                                    </div>
                                    <div className="form-group form-group-small">
                                        <label className="form-label" htmlFor="plan-type">
                                            Type
                                        </label>
                                        <select
                                            id="plan-type"
                                            name="plan.type"
                                            className="form-select"
                                            value={formData.plan.type}
                                            onChange={handleChange}
                                        >
                                            {planTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="member-id">
                                            Member ID *
                                        </label>
                                        <input
                                            id="member-id"
                                            type="text"
                                            name="memberId"
                                            className="form-input"
                                            value={formData.memberId}
                                            onChange={handleChange}
                                            placeholder="e.g., XYZ123456789"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="group-number">
                                            Group Number
                                        </label>
                                        <input
                                            id="group-number"
                                            type="text"
                                            name="groupNumber"
                                            className="form-input"
                                            value={formData.groupNumber}
                                            onChange={handleChange}
                                            placeholder="e.g., 12345"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="subscriber-name">
                                            Subscriber Name
                                        </label>
                                        <input
                                            id="subscriber-name"
                                            type="text"
                                            name="subscriberName"
                                            className="form-input"
                                            value={formData.subscriberName}
                                            onChange={handleChange}
                                            placeholder="Primary policyholder"
                                        />
                                    </div>
                                    <div className="form-group form-group-small">
                                        <label className="form-label" htmlFor="relationship">
                                            Relationship
                                        </label>
                                        <select
                                            id="relationship"
                                            name="relationship"
                                            className="form-select"
                                            value={formData.relationship}
                                            onChange={handleChange}
                                        >
                                            {relationships.map(rel => (
                                                <option key={rel.value} value={rel.value}>{rel.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="effective-date">
                                            Effective Date
                                        </label>
                                        <input
                                            id="effective-date"
                                            type="date"
                                            name="effectiveDate"
                                            className="form-input"
                                            value={formData.effectiveDate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="provider-phone">
                                            Provider Phone
                                        </label>
                                        <input
                                            id="provider-phone"
                                            type="tel"
                                            name="provider.phone"
                                            className="form-input"
                                            value={formData.provider.phone}
                                            onChange={handleChange}
                                            placeholder="(800) 123-4567"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-toggle-label">
                                        <input
                                            type="checkbox"
                                            name="isPrimary"
                                            checked={formData.isPrimary}
                                            onChange={handleChange}
                                        />
                                        <span className="form-toggle"></span>
                                        <span className="form-toggle-text">This is my primary insurance</span>
                                    </label>
                                </div>

                                {isEditMode && (
                                    <div className="form-group">
                                        <label className="form-toggle-label">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleChange}
                                            />
                                            <span className="form-toggle"></span>
                                            <span className="form-toggle-text">Plan is currently active</span>
                                        </label>
                                    </div>
                                )}

                                {isEditMode && (
                                    <ConnectInsurance
                                        insurance={insurance}
                                        onSyncComplete={onFhirSync}
                                    />
                                )}
                            </>
                        )}

                        {activeTab === 'documents' && isEditMode && (
                            <InsuranceDocumentUpload
                                insuranceId={insurance._id}
                                documents={insuranceDocs}
                                onDocumentAdded={handleDocumentAdded}
                                onDocumentRemoved={handleDocumentRemoved}
                            />
                        )}

                        {activeTab === 'coverage' && (
                            <>
                                <div className="form-divider">
                                    <span>Deductible</span>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="deductible-individual">
                                            Individual
                                        </label>
                                        <div className="form-input-prefix">
                                            <span>$</span>
                                            <input
                                                id="deductible-individual"
                                                type="number"
                                                name="coverage.deductible.individual"
                                                className="form-input"
                                                value={formData.coverage.deductible.individual}
                                                onChange={handleChange}
                                                placeholder="1500"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="deductible-met">
                                            Met So Far
                                        </label>
                                        <div className="form-input-prefix">
                                            <span>$</span>
                                            <input
                                                id="deductible-met"
                                                type="number"
                                                name="coverage.deductible.met"
                                                className="form-input"
                                                value={formData.coverage.deductible.met}
                                                onChange={handleChange}
                                                placeholder="500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-divider">
                                    <span>Out-of-Pocket Maximum</span>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="oop-individual">
                                            Individual
                                        </label>
                                        <div className="form-input-prefix">
                                            <span>$</span>
                                            <input
                                                id="oop-individual"
                                                type="number"
                                                name="coverage.outOfPocketMax.individual"
                                                className="form-input"
                                                value={formData.coverage.outOfPocketMax.individual}
                                                onChange={handleChange}
                                                placeholder="6000"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="oop-met">
                                            Met So Far
                                        </label>
                                        <div className="form-input-prefix">
                                            <span>$</span>
                                            <input
                                                id="oop-met"
                                                type="number"
                                                name="coverage.outOfPocketMax.met"
                                                className="form-input"
                                                value={formData.coverage.outOfPocketMax.met}
                                                onChange={handleChange}
                                                placeholder="1200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-divider">
                                    <span>Copays</span>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="copay-pcp">
                                            Primary Care
                                        </label>
                                        <div className="form-input-prefix">
                                            <span>$</span>
                                            <input
                                                id="copay-pcp"
                                                type="number"
                                                name="coverage.copay.primaryCare"
                                                className="form-input"
                                                value={formData.coverage.copay.primaryCare}
                                                onChange={handleChange}
                                                placeholder="25"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="copay-specialist">
                                            Specialist
                                        </label>
                                        <div className="form-input-prefix">
                                            <span>$</span>
                                            <input
                                                id="copay-specialist"
                                                type="number"
                                                name="coverage.copay.specialist"
                                                className="form-input"
                                                value={formData.coverage.copay.specialist}
                                                onChange={handleChange}
                                                placeholder="50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="copay-urgent">
                                            Urgent Care
                                        </label>
                                        <div className="form-input-prefix">
                                            <span>$</span>
                                            <input
                                                id="copay-urgent"
                                                type="number"
                                                name="coverage.copay.urgentCare"
                                                className="form-input"
                                                value={formData.coverage.copay.urgentCare}
                                                onChange={handleChange}
                                                placeholder="75"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="copay-er">
                                            Emergency
                                        </label>
                                        <div className="form-input-prefix">
                                            <span>$</span>
                                            <input
                                                id="copay-er"
                                                type="number"
                                                name="coverage.copay.emergency"
                                                className="form-input"
                                                value={formData.coverage.copay.emergency}
                                                onChange={handleChange}
                                                placeholder="250"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="coinsurance">
                                        Coinsurance (%)
                                    </label>
                                    <input
                                        id="coinsurance"
                                        type="number"
                                        name="coverage.coinsurance"
                                        className="form-input"
                                        value={formData.coverage.coinsurance}
                                        onChange={handleChange}
                                        placeholder="20"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </>
                        )}
                    </form>
                </div>

                <div className="insurance-modal-footer">
                    {isEditMode && (
                        <button
                            type="button"
                            className={`insurance-modal-delete ${showDeleteConfirm ? 'confirm' : ''}`}
                            onClick={handleDelete}
                        >
                            {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
                        </button>
                    )}
                    <div className="insurance-modal-actions">
                        <button
                            type="button"
                            className="insurance-modal-cancel"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="insurance-modal-save"
                            onClick={handleSubmit}
                        >
                            {isEditMode ? 'Save Changes' : 'Add Insurance'}
                        </button>
                    </div>
                </div>
            </div>

            {showScanner && (
                <InsuranceCardScanner
                    onScanComplete={handleScanComplete}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};

export default InsuranceModal;
