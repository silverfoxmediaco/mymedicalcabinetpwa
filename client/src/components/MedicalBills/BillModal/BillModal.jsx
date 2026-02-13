import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import BillDocumentUpload from '../BillDocumentUpload/BillDocumentUpload';
import BillPaymentLedger from '../BillPaymentLedger/BillPaymentLedger';
const BillNegotiationTab = React.lazy(() => import('../BillNegotiationTab/BillNegotiationTab'));
import { medicalBillService } from '../../../services/medicalBillService';
import './BillModal.css';

const BillModal = ({
    isOpen,
    onClose,
    bill,
    viewMode,
    onSave,
    onDelete,
    onSwitchToEdit
}) => {
    const modalRef = useRef(null);
    const [activeTab, setActiveTab] = useState('details');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState(null);
    const [documents, setDocuments] = useState([]);

    const [formData, setFormData] = useState({
        biller: { name: '', address: '', phone: '', website: '', paymentPortalUrl: '' },
        dateOfService: '',
        dateReceived: '',
        dueDate: '',
        status: 'unpaid',
        notes: '',
        totals: {
            amountBilled: '',
            insurancePaid: '',
            insuranceAdjusted: '',
            patientResponsibility: ''
        }
    });

    useEffect(() => {
        if (bill) {
            setFormData({
                biller: {
                    name: bill.biller?.name || '',
                    address: bill.biller?.address || '',
                    phone: bill.biller?.phone || '',
                    website: bill.biller?.website || '',
                    paymentPortalUrl: bill.biller?.paymentPortalUrl || ''
                },
                dateOfService: bill.dateOfService ? new Date(bill.dateOfService).toISOString().split('T')[0] : '',
                dateReceived: bill.dateReceived ? new Date(bill.dateReceived).toISOString().split('T')[0] : '',
                dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
                status: bill.status || 'unpaid',
                notes: bill.notes || '',
                totals: {
                    amountBilled: bill.totals?.amountBilled || '',
                    insurancePaid: bill.totals?.insurancePaid || '',
                    insuranceAdjusted: bill.totals?.insuranceAdjusted || '',
                    patientResponsibility: bill.totals?.patientResponsibility || ''
                }
            });
            setDocuments(bill.documents || []);
        } else {
            setFormData({
                biller: { name: '', address: '', phone: '', website: '', paymentPortalUrl: '' },
                dateOfService: '',
                dateReceived: '',
                dueDate: '',
                status: 'unpaid',
                notes: '',
                totals: {
                    amountBilled: '',
                    insurancePaid: '',
                    insuranceAdjusted: '',
                    patientResponsibility: ''
                }
            });
            setDocuments([]);
        }
        setActiveTab('details');
        setError(null);
        setShowDeleteConfirm(false);
    }, [bill, isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === modalRef.current) {
            onClose();
        }
    };

    const handleFieldChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        if (!formData.biller.name.trim()) {
            setError('Biller name is required');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const data = {
                ...formData,
                totals: {
                    amountBilled: Number(formData.totals.amountBilled) || 0,
                    insurancePaid: Number(formData.totals.insurancePaid) || 0,
                    insuranceAdjusted: Number(formData.totals.insuranceAdjusted) || 0,
                    patientResponsibility: Number(formData.totals.patientResponsibility) || 0
                }
            };

            await onSave(data);
        } catch (err) {
            setError(err.message || 'Failed to save bill');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete();
        } catch (err) {
            setError(err.message || 'Failed to delete bill');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleAddPayment = async (paymentData) => {
        if (!bill?._id) return;
        const result = await medicalBillService.addPayment(bill._id, paymentData);
        if (result.success && result.data) {
            // Refresh the bill to get updated payments and totals
            onSave(null, true); // signal refresh
        }
    };

    const handleAnalysisComplete = async (analysis) => {
        if (!bill?._id) return;
        try {
            await medicalBillService.update(bill._id, {
                aiAnalysis: {
                    summary: analysis.summary,
                    errorsFound: analysis.errorsFound || [],
                    estimatedSavings: analysis.totals?.estimatedSavings || 0,
                    disputeLetterText: analysis.disputeLetterText || null,
                    analyzedAt: new Date()
                }
            });
        } catch (err) {
            console.error('Failed to save AI analysis:', err);
        }
    };

    if (!isOpen) return null;

    const isEditing = !viewMode;
    const isNew = !bill;

    return createPortal(
        <div
            className="bill-modal-overlay"
            ref={modalRef}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
        >
            <div className="bill-modal-container">
                <div className="bill-modal-header">
                    <h2 className="bill-modal-title">
                        {isNew ? 'Add Medical Bill' : viewMode ? 'Bill Details' : 'Edit Bill'}
                    </h2>
                    <div className="bill-modal-header-actions">
                        {viewMode && onSwitchToEdit && (
                            <button
                                className="bill-modal-edit-btn"
                                onClick={onSwitchToEdit}
                                type="button"
                            >
                                Edit
                            </button>
                        )}
                        <button
                            className="bill-modal-close"
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {bill && (
                    <div className="bill-modal-tabs">
                        <button
                            className={`bill-modal-tab ${activeTab === 'details' ? 'bill-modal-tab-active' : ''}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Details
                        </button>
                        <button
                            className={`bill-modal-tab ${activeTab === 'documents' ? 'bill-modal-tab-active' : ''}`}
                            onClick={() => setActiveTab('documents')}
                        >
                            Documents ({documents.length})
                        </button>
                        <button
                            className={`bill-modal-tab ${activeTab === 'payments' ? 'bill-modal-tab-active' : ''}`}
                            onClick={() => setActiveTab('payments')}
                        >
                            Payments ({bill.payments?.length || 0})
                        </button>
                        <button
                            className={`bill-modal-tab ${activeTab === 'negotiate' ? 'bill-modal-tab-active' : ''}`}
                            onClick={() => setActiveTab('negotiate')}
                        >
                            Negotiate
                        </button>
                    </div>
                )}

                <div className="bill-modal-content">
                    {error && (
                        <div className="bill-modal-error">
                            {error}
                            <button onClick={() => setError(null)}>×</button>
                        </div>
                    )}

                    {(activeTab === 'details' || !bill) && (
                        <div className="bill-modal-details-tab">
                            <div className="bill-modal-section">
                                <h3 className="bill-modal-section-title">Biller Information</h3>
                                <div className="bill-modal-form-group">
                                    <label className="bill-modal-label">Biller Name *</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="bill-modal-input"
                                            value={formData.biller.name}
                                            onChange={(e) => handleFieldChange('biller.name', e.target.value)}
                                            placeholder="Hospital, clinic, or provider name"
                                        />
                                    ) : (
                                        <p className="bill-modal-value">{formData.biller.name || '—'}</p>
                                    )}
                                </div>
                                <div className="bill-modal-form-row">
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Phone</label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                className="bill-modal-input"
                                                value={formData.biller.phone}
                                                onChange={(e) => handleFieldChange('biller.phone', e.target.value)}
                                                placeholder="(555) 123-4567"
                                            />
                                        ) : (
                                            <p className="bill-modal-value">{formData.biller.phone || '—'}</p>
                                        )}
                                    </div>
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Website</label>
                                        {isEditing ? (
                                            <input
                                                type="url"
                                                className="bill-modal-input"
                                                value={formData.biller.website}
                                                onChange={(e) => handleFieldChange('biller.website', e.target.value)}
                                                placeholder="https://"
                                            />
                                        ) : (
                                            <p className="bill-modal-value">{formData.biller.website || '—'}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bill-modal-form-group">
                                    <label className="bill-modal-label">Address</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="bill-modal-input"
                                            value={formData.biller.address}
                                            onChange={(e) => handleFieldChange('biller.address', e.target.value)}
                                            placeholder="Billing address"
                                        />
                                    ) : (
                                        <p className="bill-modal-value">{formData.biller.address || '—'}</p>
                                    )}
                                </div>
                                <div className="bill-modal-form-group">
                                    <label className="bill-modal-label">Payment Portal URL</label>
                                    {isEditing ? (
                                        <input
                                            type="url"
                                            className="bill-modal-input"
                                            value={formData.biller.paymentPortalUrl}
                                            onChange={(e) => handleFieldChange('biller.paymentPortalUrl', e.target.value)}
                                            placeholder="Online payment link"
                                        />
                                    ) : (
                                        formData.biller.paymentPortalUrl ? (
                                            <a href={formData.biller.paymentPortalUrl} target="_blank" rel="noopener noreferrer" className="bill-modal-link">
                                                Pay Online
                                            </a>
                                        ) : (
                                            <p className="bill-modal-value">—</p>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="bill-modal-section">
                                <h3 className="bill-modal-section-title">Dates</h3>
                                <div className="bill-modal-form-row bill-modal-form-row-3">
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Date of Service</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                className="bill-modal-input"
                                                value={formData.dateOfService}
                                                onChange={(e) => handleFieldChange('dateOfService', e.target.value)}
                                            />
                                        ) : (
                                            <p className="bill-modal-value">
                                                {formData.dateOfService ? new Date(formData.dateOfService).toLocaleDateString() : '—'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Date Received</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                className="bill-modal-input"
                                                value={formData.dateReceived}
                                                onChange={(e) => handleFieldChange('dateReceived', e.target.value)}
                                            />
                                        ) : (
                                            <p className="bill-modal-value">
                                                {formData.dateReceived ? new Date(formData.dateReceived).toLocaleDateString() : '—'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Due Date</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                className="bill-modal-input"
                                                value={formData.dueDate}
                                                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                                            />
                                        ) : (
                                            <p className="bill-modal-value">
                                                {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : '—'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bill-modal-section">
                                <h3 className="bill-modal-section-title">Amounts</h3>
                                <div className="bill-modal-form-row">
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Amount Billed ($)</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="bill-modal-input"
                                                value={formData.totals.amountBilled}
                                                onChange={(e) => handleFieldChange('totals.amountBilled', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        ) : (
                                            <p className="bill-modal-value">${Number(formData.totals.amountBilled || 0).toFixed(2)}</p>
                                        )}
                                    </div>
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Insurance Paid ($)</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="bill-modal-input"
                                                value={formData.totals.insurancePaid}
                                                onChange={(e) => handleFieldChange('totals.insurancePaid', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        ) : (
                                            <p className="bill-modal-value">${Number(formData.totals.insurancePaid || 0).toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bill-modal-form-row">
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Adjusted ($)</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="bill-modal-input"
                                                value={formData.totals.insuranceAdjusted}
                                                onChange={(e) => handleFieldChange('totals.insuranceAdjusted', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        ) : (
                                            <p className="bill-modal-value">${Number(formData.totals.insuranceAdjusted || 0).toFixed(2)}</p>
                                        )}
                                    </div>
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Your Responsibility ($)</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="bill-modal-input"
                                                value={formData.totals.patientResponsibility}
                                                onChange={(e) => handleFieldChange('totals.patientResponsibility', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        ) : (
                                            <p className="bill-modal-value bill-modal-value-highlight">
                                                ${Number(formData.totals.patientResponsibility || 0).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bill-modal-section">
                                <div className="bill-modal-form-row">
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Status</label>
                                        {isEditing ? (
                                            <select
                                                className="bill-modal-input"
                                                value={formData.status}
                                                onChange={(e) => handleFieldChange('status', e.target.value)}
                                            >
                                                <option value="unpaid">Unpaid</option>
                                                <option value="partially_paid">Partially Paid</option>
                                                <option value="paid">Paid</option>
                                                <option value="disputed">Disputed</option>
                                                <option value="in_review">In Review</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        ) : (
                                            <p className="bill-modal-value">{formData.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bill-modal-form-group">
                                    <label className="bill-modal-label">Notes</label>
                                    {isEditing ? (
                                        <textarea
                                            className="bill-modal-textarea"
                                            value={formData.notes}
                                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                                            placeholder="Any additional notes..."
                                            rows={3}
                                        />
                                    ) : (
                                        <p className="bill-modal-value">{formData.notes || '—'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'documents' && bill && (
                        <BillDocumentUpload
                            billId={bill._id}
                            documents={documents}
                            onDocumentAdded={(doc) => setDocuments(prev => [...prev, doc])}
                            onDocumentRemoved={(docId) => setDocuments(prev => prev.filter(d => d._id !== docId))}
                            onAnalysisComplete={handleAnalysisComplete}
                        />
                    )}

                    {activeTab === 'payments' && bill && (
                        <BillPaymentLedger
                            payments={bill.payments || []}
                            patientResponsibility={bill.totals?.patientResponsibility || 0}
                            onAddPayment={handleAddPayment}
                        />
                    )}

                    {activeTab === 'negotiate' && bill && (
                        <React.Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
                            <BillNegotiationTab
                                bill={bill}
                                onRefresh={() => onSave(null, true)}
                            />
                        </React.Suspense>
                    )}
                </div>

                <div className="bill-modal-footer">
                    {isEditing && (
                        <>
                            {bill && (
                                <div className="bill-modal-delete-area">
                                    {showDeleteConfirm ? (
                                        <div className="bill-modal-delete-confirm">
                                            <span>Delete this bill?</span>
                                            <button
                                                className="bill-modal-delete-yes"
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                            </button>
                                            <button
                                                className="bill-modal-delete-no"
                                                onClick={() => setShowDeleteConfirm(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="bill-modal-delete-btn"
                                            onClick={() => setShowDeleteConfirm(true)}
                                        >
                                            Delete Bill
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="bill-modal-save-area">
                                <button
                                    className="bill-modal-cancel-btn"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="bill-modal-save-btn"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : bill ? 'Save Changes' : 'Add Bill'}
                                </button>
                            </div>
                        </>
                    )}
                    {viewMode && (
                        <button className="bill-modal-close-btn" onClick={onClose}>
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BillModal;
