import React, { useState, useRef } from 'react';
import { medicalBillService } from '../../../services/medicalBillService';
import { documentService } from '../../../services/documentService';
import { analyzeMedicalBill } from '../../../services/aiService';
import BillAnalysisModal from '../BillAnalysisModal/BillAnalysisModal';
import './BillDocumentUpload.css';

const BillDocumentUpload = ({ billId, documents = [], onDocumentAdded, onDocumentRemoved, onAnalysisComplete }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisModal, setAnalysisModal] = useState({
        isOpen: false,
        analysis: null,
        documentName: '',
        error: null
    });

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
    ];

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setError(null);

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                setError(`${file.name}: File type not allowed. Use JPG, PNG, GIF, WebP, or PDF.`);
                continue;
            }

            if (file.size > 50 * 1024 * 1024) {
                setError(`${file.name}: File too large. Maximum size is 50MB.`);
                continue;
            }

            await uploadFile(file);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadFile = async (file) => {
        setIsUploading(true);

        try {
            const result = await medicalBillService.uploadDocument(billId, file);
            if (result.success && onDocumentAdded) {
                onDocumentAdded(result.document);
            }
        } catch (err) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveDocument = async (doc) => {
        try {
            await medicalBillService.deleteDocument(billId, doc._id);
            if (onDocumentRemoved) {
                onDocumentRemoved(doc._id);
            }
        } catch (err) {
            setError('Failed to remove document');
        }
    };

    const handleViewDocument = async (doc) => {
        const newWindow = window.open('', '_blank');
        try {
            const url = await documentService.getDownloadUrl(doc.s3Key);
            if (newWindow) {
                newWindow.location.href = url;
            }
        } catch (err) {
            if (newWindow) newWindow.close();
            setError('Failed to open document');
        }
    };

    const handleAnalyzeDocument = async (doc) => {
        if (!doc.s3Key) {
            setError('Document must be uploaded before it can be analyzed');
            return;
        }

        setIsAnalyzing(true);
        setAnalysisModal({
            isOpen: true,
            analysis: null,
            documentName: doc.originalName || doc.filename,
            error: null
        });

        try {
            const response = await analyzeMedicalBill(doc.s3Key, doc.originalName || doc.filename);
            setAnalysisModal(prev => ({
                ...prev,
                analysis: response.data.analysis
            }));
            if (onAnalysisComplete) {
                onAnalysisComplete(response.data.analysis);
            }
        } catch (err) {
            setAnalysisModal(prev => ({
                ...prev,
                error: err.message || 'Failed to analyze bill'
            }));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const closeAnalysisModal = () => {
        setAnalysisModal({
            isOpen: false,
            analysis: null,
            documentName: '',
            error: null
        });
    };

    const getFileIcon = (mimeType) => {
        if (mimeType && mimeType.startsWith('image/')) {
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            );
        } else if (mimeType === 'application/pdf') {
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            );
        }
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
        );
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="bill-doc-upload">
            <div className="bill-doc-upload-header">
                <span className="bill-doc-upload-label">Bill Documents</span>
                <span className="bill-doc-upload-count">{documents.length}</span>
            </div>

            {error && (
                <div className="bill-doc-upload-error">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {documents.length > 0 && (
                <div className="bill-doc-list">
                    {documents.map((doc, index) => (
                        <div key={doc._id || index} className="bill-doc-item">
                            <div className="bill-doc-item-icon">
                                {getFileIcon(doc.mimeType)}
                            </div>
                            <div className="bill-doc-item-info">
                                <span className="bill-doc-item-name">
                                    {doc.originalName || doc.filename}
                                </span>
                                <span className="bill-doc-item-size">
                                    {formatFileSize(doc.size)}
                                </span>
                            </div>
                            <div className="bill-doc-item-actions">
                                {doc.s3Key && (
                                    <>
                                        <button
                                            type="button"
                                            className="bill-doc-item-view"
                                            onClick={() => handleViewDocument(doc)}
                                            title="View document"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className="bill-doc-item-analyze-btn"
                                            onClick={() => handleAnalyzeDocument(doc)}
                                            disabled={isAnalyzing}
                                            title="AI bill analysis for errors"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4z" />
                                                <line x1="10" y1="14" x2="14" y2="14" />
                                                <line x1="10" y1="17" x2="14" y2="17" />
                                                <line x1="11" y1="20" x2="13" y2="20" />
                                            </svg>
                                            {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="bill-doc-item-remove"
                                    onClick={() => handleRemoveDocument(doc)}
                                    title="Remove document"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="bill-doc-upload-zone">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="bill-doc-upload-input"
                />
                <div className="bill-doc-upload-content">
                    {isUploading ? (
                        <>
                            <div className="bill-doc-upload-spinner"></div>
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>Tap to upload bill images, statements, or EOBs</span>
                            <span className="bill-doc-upload-hint">JPG, PNG, PDF up to 50MB</span>
                        </>
                    )}
                </div>
            </div>

            <BillAnalysisModal
                isOpen={analysisModal.isOpen}
                onClose={closeAnalysisModal}
                analysis={analysisModal.analysis}
                documentName={analysisModal.documentName}
                isLoading={isAnalyzing}
                error={analysisModal.error}
            />
        </div>
    );
};

export default BillDocumentUpload;
