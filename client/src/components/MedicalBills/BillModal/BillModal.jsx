import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import BillDocumentUpload from '../BillDocumentUpload/BillDocumentUpload';
import BillPaymentLedger from '../BillPaymentLedger/BillPaymentLedger';
import BillerSearch from '../BillerSearch/BillerSearch';
import { medicalBillService } from '../../../services/medicalBillService';
import { analyzeMedicalBill } from '../../../services/aiService';
import './BillModal.css';

const BillNegotiationTab = React.lazy(() => import('../BillNegotiationTab/BillNegotiationTab'));
const StripeProvider = React.lazy(() => import('../../StripeProvider/StripeProvider'));
const SettlementPaymentForm = React.lazy(() => import('../SettlementPaymentForm/SettlementPaymentForm'));

const BillModal = ({
    isOpen,
    onClose,
    bill,
    viewMode,
    initialTab,
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
    const [stagedDocuments, setStagedDocuments] = useState([]);
    const [isStaging, setIsStaging] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanAnalysis, setScanAnalysis] = useState(null);
    const [stripeClientSecret, setStripeClientSecret] = useState(null);
    const [stripePaymentAmount, setStripePaymentAmount] = useState(null);
    const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
    const [isNegotiatePaymentActive, setIsNegotiatePaymentActive] = useState(false);
    const [showAmountPicker, setShowAmountPicker] = useState(false);
    const [customPaymentAmount, setCustomPaymentAmount] = useState('');
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        biller: { name: '', address: '', phone: '', website: '', paymentPortalUrl: '' },
        account: { guarantorName: '', guarantorId: '', myChartCode: '' },
        dateOfService: '',
        dateReceived: '',
        statementDate: '',
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
                account: {
                    guarantorName: bill.account?.guarantorName || '',
                    guarantorId: bill.account?.guarantorId || '',
                    myChartCode: bill.account?.myChartCode || ''
                },
                dateOfService: bill.dateOfService ? new Date(bill.dateOfService).toISOString().split('T')[0] : '',
                dateReceived: bill.dateReceived ? new Date(bill.dateReceived).toISOString().split('T')[0] : '',
                statementDate: bill.statementDate ? new Date(bill.statementDate).toISOString().split('T')[0] : '',
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
                account: { guarantorName: '', guarantorId: '', myChartCode: '' },
                dateOfService: '',
                dateReceived: '',
                statementDate: '',
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
        setActiveTab(initialTab || 'details');
        setError(null);
        setShowDeleteConfirm(false);
        setStagedDocuments([]);
        setIsStaging(false);
        setIsExtracting(false);
        setIsAnalyzing(false);
        setScanAnalysis(null);
        setStripeClientSecret(null);
        setStripePaymentAmount(null);
        setIsCreatingPaymentIntent(false);
        setIsNegotiatePaymentActive(false);
    }, [bill, isOpen, initialTab]);

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

    const runAiAnalysis = async (doc) => {
        setIsAnalyzing(true);
        try {
            const response = await analyzeMedicalBill(doc.s3Key, doc.originalName || doc.filename);
            if (response?.data?.analysis) {
                setScanAnalysis(response.data.analysis);
            }
        } catch (err) {
            console.error('AI analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleStageFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsStaging(true);
        setError(null);

        try {
            const result = await medicalBillService.stageBillFile(file);
            if (result.success && result.document) {
                const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
                setStagedDocuments(prev => [...prev, { ...result.document, previewUrl }]);
            }
        } catch (err) {
            setError(err.message || 'Failed to upload page');
        } finally {
            setIsStaging(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveStagedDoc = (index) => {
        setStagedDocuments(prev => {
            const removed = prev[index];
            if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleExtractAll = async () => {
        if (stagedDocuments.length === 0) return;

        setIsExtracting(true);
        setError(null);
        setScanAnalysis(null);

        try {
            const result = await medicalBillService.extractFromDocuments(stagedDocuments);
            if (result.success && result.extracted) {
                const ext = result.extracted;
                setFormData(prev => ({
                    ...prev,
                    biller: {
                        name: ext.biller?.name || prev.biller.name,
                        address: ext.biller?.address || prev.biller.address,
                        phone: ext.biller?.phone || prev.biller.phone,
                        website: ext.biller?.website || prev.biller.website,
                        paymentPortalUrl: ext.biller?.paymentPortalUrl || prev.biller.paymentPortalUrl
                    },
                    account: {
                        guarantorName: ext.account?.guarantorName || prev.account.guarantorName,
                        guarantorId: ext.account?.guarantorId || prev.account.guarantorId,
                        myChartCode: ext.account?.myChartCode || prev.account.myChartCode
                    },
                    dateOfService: ext.dateOfService || prev.dateOfService,
                    dateReceived: ext.dateReceived || prev.dateReceived,
                    statementDate: ext.statementDate || prev.statementDate,
                    dueDate: ext.dueDate || prev.dueDate,
                    notes: ext.notes || prev.notes,
                    totals: {
                        amountBilled: ext.totals?.amountBilled || prev.totals.amountBilled,
                        insurancePaid: ext.totals?.insurancePaid || prev.totals.insurancePaid,
                        insuranceAdjusted: ext.totals?.insuranceAdjusted || prev.totals.insuranceAdjusted,
                        patientResponsibility: ext.totals?.patientResponsibility || prev.totals.patientResponsibility
                    }
                }));
                // Run AI analysis on the first staged document
                if (stagedDocuments[0]) {
                    runAiAnalysis(stagedDocuments[0]);
                }
            }
        } catch (err) {
            setError(err.message || 'Failed to extract bill data');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleBillerSelect = (billerData) => {
        setFormData(prev => ({
            ...prev,
            biller: {
                ...prev.biller,
                name: billerData.name !== undefined ? billerData.name : prev.biller.name,
                address: billerData.address !== undefined ? billerData.address : prev.biller.address,
                phone: billerData.phone !== undefined ? billerData.phone : prev.biller.phone,
                website: billerData.website !== undefined ? billerData.website : prev.biller.website
            }
        }));
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

            // Include staged documents in the save payload
            if (stagedDocuments.length > 0) {
                data.documents = stagedDocuments.map(doc => ({
                    filename: doc.filename,
                    originalName: doc.originalName,
                    mimeType: doc.mimeType,
                    size: doc.size,
                    s3Key: doc.s3Key,
                    uploadedAt: new Date()
                }));
            }

            // Include AI analysis if available
            if (scanAnalysis) {
                data.aiAnalysis = {
                    summary: scanAnalysis.summary,
                    errorsFound: scanAnalysis.errorsFound || [],
                    estimatedSavings: scanAnalysis.totals?.estimatedSavings || 0,
                    totals: scanAnalysis.totals ? {
                        amountBilled: scanAnalysis.totals.amountBilled || 0,
                        insurancePaid: scanAnalysis.totals.insurancePaid || 0,
                        adjustments: scanAnalysis.totals.adjustments || 0,
                        fairPriceTotal: scanAnalysis.totals.fairPriceTotal || 0,
                        patientBalance: scanAnalysis.totals.patientBalance || 0,
                        estimatedSavings: scanAnalysis.totals.estimatedSavings || 0,
                        recommendedPatientOffer: scanAnalysis.totals.recommendedPatientOffer || 0
                    } : null,
                    disputeLetterText: scanAnalysis.disputeLetterText || null,
                    analyzedAt: new Date()
                };
            }

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

    const handleAnalysisComplete = async (analysis) => {
        if (!bill?._id) return;
        try {
            await medicalBillService.update(bill._id, {
                aiAnalysis: {
                    summary: analysis.summary,
                    errorsFound: analysis.errorsFound || [],
                    estimatedSavings: analysis.totals?.estimatedSavings || 0,
                    totals: analysis.totals ? {
                        amountBilled: analysis.totals.amountBilled || 0,
                        insurancePaid: analysis.totals.insurancePaid || 0,
                        adjustments: analysis.totals.adjustments || 0,
                        fairPriceTotal: analysis.totals.fairPriceTotal || 0,
                        patientBalance: analysis.totals.patientBalance || 0,
                        estimatedSavings: analysis.totals.estimatedSavings || 0,
                        recommendedPatientOffer: analysis.totals.recommendedPatientOffer || 0
                    } : null,
                    disputeLetterText: analysis.disputeLetterText || null,
                    analyzedAt: new Date()
                }
            });
            // Refresh the bill so aiAnalysis prop updates
            onSave(null, true);
        } catch (err) {
            console.error('Failed to save AI analysis:', err);
        }
    };

    const handleMakePayment = () => {
        if (!bill?._id) return;
        const totalPaid = (bill.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const remaining = Math.max((bill.totals?.patientResponsibility || 0) - totalPaid, 0);
        setCustomPaymentAmount(remaining > 0 ? remaining.toFixed(2) : '');
        setShowAmountPicker(true);
    };

    const handleConfirmPaymentAmount = async () => {
        if (!bill?._id) return;
        const amount = Number(customPaymentAmount);
        if (!amount || amount <= 0) return;
        setIsCreatingPaymentIntent(true);
        setError(null);
        try {
            const result = await medicalBillService.createPaymentIntent(bill._id, amount);
            if (result.success && result.clientSecret) {
                setStripeClientSecret(result.clientSecret);
                setStripePaymentAmount(result.amount);
                setShowAmountPicker(false);
            }
        } catch (err) {
            setError(err.message || 'Failed to start payment');
        } finally {
            setIsCreatingPaymentIntent(false);
        }
    };

    const handleStripePaymentSuccess = () => {
        setStripeClientSecret(null);
        setStripePaymentAmount(null);
        setActiveTab('payments');
        onSave(null, true); // refresh bill data
    };

    const handleCancelStripePayment = () => {
        setStripeClientSecret(null);
        setStripePaymentAmount(null);
    };

    const handleCancelAmountPicker = () => {
        setShowAmountPicker(false);
        setCustomPaymentAmount('');
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

                    {showAmountPicker && !stripeClientSecret && (
                        <div className="bill-modal-amount-picker">
                            <div className="bill-modal-amount-picker-header">
                                <h3 className="bill-modal-amount-picker-title">Payment Amount</h3>
                                <button
                                    className="bill-modal-stripe-payment-cancel"
                                    onClick={handleCancelAmountPicker}
                                    type="button"
                                >
                                    Cancel
                                </button>
                            </div>
                            <p className="bill-modal-amount-picker-desc">
                                Enter the amount you'd like to pay. You can pay the full balance or a partial amount.
                            </p>
                            <div className="bill-modal-amount-picker-input-row">
                                <span className="bill-modal-amount-picker-dollar">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.50"
                                    className="bill-modal-amount-picker-input"
                                    value={customPaymentAmount}
                                    onChange={(e) => setCustomPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            {(() => {
                                const totalPaid = (bill?.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                                const remaining = Math.max((bill?.totals?.patientResponsibility || 0) - totalPaid, 0);
                                const isFullBalance = Number(customPaymentAmount) === remaining;
                                return (
                                    <div className="bill-modal-amount-picker-quick">
                                        {!isFullBalance && remaining > 0 && (
                                            <button
                                                type="button"
                                                className="bill-modal-amount-picker-full-btn"
                                                onClick={() => setCustomPaymentAmount(remaining.toFixed(2))}
                                            >
                                                Pay full balance: ${remaining.toFixed(2)}
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
                            {error && (
                                <div className="bill-modal-error" style={{ marginTop: 12 }}>
                                    {error}
                                    <button onClick={() => setError(null)}>×</button>
                                </div>
                            )}
                            <button
                                type="button"
                                className="bill-modal-amount-picker-proceed"
                                onClick={handleConfirmPaymentAmount}
                                disabled={isCreatingPaymentIntent || !customPaymentAmount || Number(customPaymentAmount) <= 0}
                            >
                                {isCreatingPaymentIntent ? (
                                    <>
                                        <div className="bill-modal-scan-spinner bill-modal-spinner-sm" />
                                        Setting up payment...
                                    </>
                                ) : (
                                    `Continue to Payment — $${Number(customPaymentAmount || 0).toFixed(2)}`
                                )}
                            </button>
                        </div>
                    )}

                    {stripeClientSecret && (
                        <div className="bill-modal-stripe-payment-overlay">
                            <div className="bill-modal-stripe-payment-header">
                                <h3 className="bill-modal-stripe-payment-title">Pay Your Bill</h3>
                                <button
                                    className="bill-modal-stripe-payment-cancel"
                                    onClick={handleCancelStripePayment}
                                    type="button"
                                >
                                    Cancel
                                </button>
                            </div>
                            <React.Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading payment form...</div>}>
                                <StripeProvider clientSecret={stripeClientSecret}>
                                    <SettlementPaymentForm
                                        amount={stripePaymentAmount}
                                        billerName={bill?.biller?.name || 'Medical Provider'}
                                        onSuccess={handleStripePaymentSuccess}
                                        onError={(msg) => setError(msg)}
                                    />
                                </StripeProvider>
                            </React.Suspense>
                        </div>
                    )}

                    {!stripeClientSecret && !showAmountPicker && (activeTab === 'details' || !bill) && (
                        <div className="bill-modal-details-tab">
                            {isEditing && (
                                <>
                                    <div className="bill-modal-scan-zone">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="bill-modal-scan-file-input"
                                            onChange={handleStageFile}
                                            disabled={isStaging || isExtracting}
                                        />

                                        {stagedDocuments.length > 0 && (
                                            <div className="bill-modal-staged-pages">
                                                <span className="bill-modal-staged-label">
                                                    {stagedDocuments.length} page{stagedDocuments.length !== 1 ? 's' : ''} added
                                                </span>
                                                <div className="bill-modal-staged-thumbs">
                                                    {stagedDocuments.map((doc, index) => (
                                                        <div key={index} className="bill-modal-staged-thumb">
                                                            {doc.previewUrl ? (
                                                                <img src={doc.previewUrl} alt={`Page ${index + 1}`} className="bill-modal-staged-img" />
                                                            ) : (
                                                                <div className="bill-modal-staged-pdf">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                        <polyline points="14 2 14 8 20 8" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            <span className="bill-modal-staged-page-num">{index + 1}</span>
                                                            <button
                                                                type="button"
                                                                className="bill-modal-staged-remove"
                                                                onClick={() => handleRemoveStagedDoc(index)}
                                                                title="Remove page"
                                                            >
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {isStaging ? (
                                            <div className="bill-modal-scan-loading">
                                                <div className="bill-modal-scan-spinner" />
                                                <span>Uploading page...</span>
                                            </div>
                                        ) : (
                                            <div className="bill-modal-scan-buttons">
                                                <button
                                                    type="button"
                                                    className="bill-modal-scan-btn"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isExtracting}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="bill-modal-scan-icon">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <line x1="3" y1="9" x2="21" y2="9" />
                                                        <line x1="9" y1="3" x2="9" y2="21" />
                                                    </svg>
                                                    {stagedDocuments.length > 0 ? 'Add Another Page' : 'Scan / Upload Bill'}
                                                </button>
                                                {stagedDocuments.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className="bill-modal-extract-btn"
                                                        onClick={handleExtractAll}
                                                        disabled={isExtracting}
                                                    >
                                                        {isExtracting ? (
                                                            <>
                                                                <div className="bill-modal-scan-spinner bill-modal-spinner-sm" />
                                                                Extracting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="bill-modal-scan-icon">
                                                                    <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4z" />
                                                                    <line x1="10" y1="14" x2="14" y2="14" />
                                                                    <line x1="10" y1="17" x2="14" y2="17" />
                                                                    <line x1="11" y1="20" x2="13" y2="20" />
                                                                </svg>
                                                                Analyze with AI
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {isAnalyzing && (
                                        <div className="bill-modal-analysis-loading">
                                            <div className="bill-modal-scan-spinner" />
                                            <span>AI is checking your bill for fair pricing...</span>
                                        </div>
                                    )}

                                    {scanAnalysis && !isAnalyzing && (
                                        <div className="bill-modal-analysis-card">
                                            <div className="bill-modal-analysis-header">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="bill-modal-analysis-icon">
                                                    <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4z" />
                                                    <line x1="10" y1="14" x2="14" y2="14" />
                                                    <line x1="10" y1="17" x2="14" y2="17" />
                                                    <line x1="11" y1="20" x2="13" y2="20" />
                                                </svg>
                                                <span className="bill-modal-analysis-title">AI Bill Analysis</span>
                                            </div>
                                            <p className="bill-modal-analysis-summary">{scanAnalysis.summary}</p>
                                            {scanAnalysis.totals && (
                                                <div className="bill-modal-analysis-totals">
                                                    <div className="bill-modal-analysis-total-item">
                                                        <span className="bill-modal-analysis-total-label">Billed</span>
                                                        <span className="bill-modal-analysis-total-value">
                                                            ${Number(scanAnalysis.totals.amountBilled || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    {scanAnalysis.totals.insurancePaid > 0 && (
                                                        <div className="bill-modal-analysis-total-item">
                                                            <span className="bill-modal-analysis-total-label">Insurance Paid</span>
                                                            <span className="bill-modal-analysis-total-value bill-modal-analysis-insurance">
                                                                -${Number(scanAnalysis.totals.insurancePaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="bill-modal-analysis-total-item">
                                                        <span className="bill-modal-analysis-total-label">Fair Price</span>
                                                        <span className="bill-modal-analysis-total-value bill-modal-analysis-fair">
                                                            ${Number(scanAnalysis.totals.fairPriceTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    {scanAnalysis.totals.estimatedSavings > 0 && (
                                                        <div className="bill-modal-analysis-total-item">
                                                            <span className="bill-modal-analysis-total-label">Potential Savings</span>
                                                            <span className="bill-modal-analysis-total-value bill-modal-analysis-savings">
                                                                ${Number(scanAnalysis.totals.estimatedSavings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {scanAnalysis.errorsFound?.length > 0 && (
                                                <div className="bill-modal-analysis-issues">
                                                    <span className="bill-modal-analysis-issues-title">
                                                        Billing Issues Found ({scanAnalysis.errorsFound.length})
                                                    </span>
                                                    {scanAnalysis.errorsFound.map((err, idx) => (
                                                        <div key={idx} className="bill-modal-analysis-issue-item">
                                                            <span className="bill-modal-analysis-issue-type">{
                                                                (err.type || 'issue').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                                            }</span>
                                                            <p className="bill-modal-analysis-issue-desc">{err.description}</p>
                                                            {err.estimatedOvercharge > 0 && (
                                                                <span className="bill-modal-analysis-issue-amount">
                                                                    Overcharge: ${Number(err.estimatedOvercharge).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {(scanAnalysis.totals?.recommendedPatientOffer > 0 || scanAnalysis.totals?.fairPriceTotal > 0) && (
                                                <div className="bill-modal-analysis-offer">
                                                    <span className="bill-modal-analysis-offer-label">Recommended offer amount:</span>
                                                    <span className="bill-modal-analysis-offer-value">
                                                        ${Number(scanAnalysis.totals.recommendedPatientOffer || scanAnalysis.totals.fairPriceTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="bill-modal-section">
                                <h3 className="bill-modal-section-title">Biller Information</h3>
                                <div className="bill-modal-form-group">
                                    <label className="bill-modal-label">Biller Name *</label>
                                    {isEditing ? (
                                        <BillerSearch
                                            value={formData.biller.name}
                                            onSelect={handleBillerSelect}
                                            placeholder="Search hospital or provider..."
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
                                <h3 className="bill-modal-section-title">Account Information</h3>
                                <div className="bill-modal-form-row bill-modal-form-row-3">
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Guarantor Name</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="bill-modal-input"
                                                value={formData.account.guarantorName}
                                                onChange={(e) => handleFieldChange('account.guarantorName', e.target.value)}
                                                placeholder="Name on statement"
                                            />
                                        ) : (
                                            <p className="bill-modal-value">{formData.account.guarantorName || '—'}</p>
                                        )}
                                    </div>
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Guarantor ID</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="bill-modal-input"
                                                value={formData.account.guarantorId}
                                                onChange={(e) => handleFieldChange('account.guarantorId', e.target.value)}
                                                placeholder="e.g. 103491740"
                                            />
                                        ) : (
                                            <p className="bill-modal-value">{formData.account.guarantorId || '—'}</p>
                                        )}
                                    </div>
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">MyChart Code</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="bill-modal-input"
                                                value={formData.account.myChartCode}
                                                onChange={(e) => handleFieldChange('account.myChartCode', e.target.value)}
                                                placeholder="e.g. NM5VR-8GT3Z-W3VF8"
                                            />
                                        ) : (
                                            <p className="bill-modal-value bill-modal-value-mono">{formData.account.myChartCode || '—'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bill-modal-section">
                                <h3 className="bill-modal-section-title">Dates</h3>
                                <div className="bill-modal-form-row">
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
                                </div>
                                <div className="bill-modal-form-row">
                                    <div className="bill-modal-form-group">
                                        <label className="bill-modal-label">Statement Date</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                className="bill-modal-input"
                                                value={formData.statementDate}
                                                onChange={(e) => handleFieldChange('statementDate', e.target.value)}
                                            />
                                        ) : (
                                            <p className="bill-modal-value">
                                                {formData.statementDate ? new Date(formData.statementDate).toLocaleDateString() : '—'}
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

                    {!stripeClientSecret && !showAmountPicker && activeTab === 'documents' && bill && (
                        <BillDocumentUpload
                            billId={bill._id}
                            documents={documents}
                            onDocumentAdded={(doc) => setDocuments(prev => [...prev, doc])}
                            onDocumentRemoved={(docId) => setDocuments(prev => prev.filter(d => d._id !== docId))}
                            onAnalysisComplete={handleAnalysisComplete}
                            aiAnalysis={bill.aiAnalysis}
                        />
                    )}

                    {!stripeClientSecret && !showAmountPicker && activeTab === 'payments' && bill && (
                        <BillPaymentLedger
                            payments={bill.payments || []}
                            patientResponsibility={bill.totals?.patientResponsibility || 0}
                            onMakePayment={handleMakePayment}
                            onDeletePayment={async (paymentId) => {
                                await medicalBillService.deletePayment(bill._id, paymentId);
                                onSave(null, true);
                            }}
                            isProcessing={isCreatingPaymentIntent}
                            billStatus={bill.status}
                        />
                    )}

                    {!stripeClientSecret && !showAmountPicker && activeTab === 'negotiate' && bill && (
                        <React.Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>}>
                            <BillNegotiationTab
                                bill={bill}
                                onRefresh={() => onSave(null, true)}
                                onPaymentFormChange={setIsNegotiatePaymentActive}
                                aiAnalysis={bill.aiAnalysis}
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
                    {viewMode && !stripeClientSecret && !showAmountPicker && !isNegotiatePaymentActive && (
                        <div className="bill-modal-view-footer">
                            {activeTab === 'details' && bill && bill.status !== 'paid' && bill.status !== 'resolved' && (
                                <>
                                    <button
                                        className="bill-modal-pay-btn"
                                        onClick={handleMakePayment}
                                        disabled={isCreatingPaymentIntent}
                                    >
                                        {isCreatingPaymentIntent ? (
                                            <>
                                                <div className="bill-modal-scan-spinner bill-modal-spinner-sm" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                                    <line x1="1" y1="10" x2="23" y2="10" />
                                                </svg>
                                                Make Payment
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className="bill-modal-negotiate-btn"
                                        onClick={() => setActiveTab('negotiate')}
                                    >
                                        Negotiate Bill
                                    </button>
                                </>
                            )}
                            <button className="bill-modal-close-btn" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BillModal;
