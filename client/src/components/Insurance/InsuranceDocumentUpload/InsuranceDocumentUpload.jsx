import React, { useState, useRef } from 'react';
import { insuranceService } from '../../../services/insuranceService';
import { documentService } from '../../../services/documentService';
import { explainInsuranceDocument } from '../../../services/aiService';
import InsuranceExplanationModal from '../InsuranceExplanationModal/InsuranceExplanationModal';
import './InsuranceDocumentUpload.css';

const InsuranceDocumentUpload = ({ insuranceId, documents = [], onDocumentAdded, onDocumentRemoved }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // AI Explanation state
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanationModal, setExplanationModal] = useState({
        isOpen: false,
        explanation: null,
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
            const result = await insuranceService.uploadDocument(insuranceId, file);
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
            await insuranceService.deleteDocument(insuranceId, doc._id);
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

    const handleExplainDocument = async (doc) => {
        if (!doc.s3Key) {
            setError('Document must be uploaded before it can be explained');
            return;
        }

        setIsExplaining(true);
        setExplanationModal({
            isOpen: true,
            explanation: null,
            documentName: doc.originalName || doc.name,
            error: null
        });

        try {
            const response = await explainInsuranceDocument(doc.s3Key, doc.originalName || doc.name);
            setExplanationModal(prev => ({
                ...prev,
                explanation: response.data.explanation
            }));
        } catch (err) {
            setExplanationModal(prev => ({
                ...prev,
                error: err.message || 'Failed to analyze document'
            }));
        } finally {
            setIsExplaining(false);
        }
    };

    const closeExplanationModal = () => {
        setExplanationModal({
            isOpen: false,
            explanation: null,
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
        <div className="ins-doc-upload">
            <div className="ins-doc-upload-header">
                <span className="ins-doc-upload-label">Documents</span>
                <span className="ins-doc-upload-count">{documents.length}</span>
            </div>

            {error && (
                <div className="ins-doc-upload-error">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {documents.length > 0 && (
                <div className="ins-doc-list">
                    {documents.map((doc, index) => (
                        <div key={doc._id || index} className="ins-doc-item">
                            <div className="ins-doc-item-icon">
                                {getFileIcon(doc.mimeType)}
                            </div>
                            <div className="ins-doc-item-info">
                                <span className="ins-doc-item-name">
                                    {doc.originalName || doc.filename}
                                </span>
                                <span className="ins-doc-item-size">
                                    {formatFileSize(doc.size)}
                                </span>
                            </div>
                            <div className="ins-doc-item-actions">
                                {doc.s3Key && (
                                    <>
                                        <button
                                            type="button"
                                            className="ins-doc-item-view"
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
                                            className="ins-doc-item-explain"
                                            onClick={() => handleExplainDocument(doc)}
                                            disabled={isExplaining}
                                            title="Get AI policy explanation"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="ins-doc-item-remove"
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

            <div className="ins-doc-upload-zone">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="ins-doc-upload-input"
                />
                <div className="ins-doc-upload-content">
                    {isUploading ? (
                        <>
                            <div className="ins-doc-upload-spinner"></div>
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>Tap to upload insurance cards, policy documents, or EOBs</span>
                            <span className="ins-doc-upload-hint">JPG, PNG, PDF up to 50MB</span>
                        </>
                    )}
                </div>
            </div>

            <InsuranceExplanationModal
                isOpen={explanationModal.isOpen}
                onClose={closeExplanationModal}
                explanation={explanationModal.explanation}
                documentName={explanationModal.documentName}
                isLoading={isExplaining}
                error={explanationModal.error}
            />
        </div>
    );
};

export default InsuranceDocumentUpload;
