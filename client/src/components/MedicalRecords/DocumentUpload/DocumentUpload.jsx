import React, { useState, useRef } from 'react';
import { documentService } from '../../../services/documentService';
import './DocumentUpload.css';

const DocumentUpload = ({ eventId, documents = [], onDocumentAdded, onDocumentRemoved, isNewEvent = false }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [pendingFiles, setPendingFiles] = useState([]); // For new events that don't have an ID yet
    const fileInputRef = useRef(null);

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
            // Validate file type
            if (!allowedTypes.includes(file.type)) {
                setError(`${file.name}: File type not allowed. Use JPG, PNG, GIF, WebP, or PDF.`);
                continue;
            }

            // Validate file size (50MB)
            if (file.size > 50 * 1024 * 1024) {
                setError(`${file.name}: File too large. Maximum size is 50MB.`);
                continue;
            }

            if (isNewEvent) {
                // For new events, store file locally until event is saved
                const reader = new FileReader();
                reader.onload = (e) => {
                    setPendingFiles(prev => [...prev, {
                        file,
                        preview: file.type.startsWith('image/') ? e.target.result : null,
                        name: file.name,
                        size: file.size,
                        type: file.type
                    }]);
                };
                reader.readAsDataURL(file);
            } else {
                // Upload immediately for existing events
                await uploadFile(file);
            }
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadFile = async (file) => {
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const result = await documentService.uploadToEvent(eventId, file);
            if (result.success && onDocumentAdded) {
                onDocumentAdded(result.document);
            }
        } catch (err) {
            setError(err.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleRemoveDocument = async (doc) => {
        if (isNewEvent) {
            // Remove from pending files
            setPendingFiles(prev => prev.filter(f => f.name !== doc.name));
        } else {
            // Delete from server
            try {
                await documentService.deleteFromEvent(eventId, doc._id);
                if (onDocumentRemoved) {
                    onDocumentRemoved(doc._id);
                }
            } catch (err) {
                setError('Failed to remove document');
            }
        }
    };

    const handleViewDocument = async (doc) => {
        try {
            const url = await documentService.getDownloadUrl(doc.s3Key);
            window.open(url, '_blank');
        } catch (err) {
            setError('Failed to open document');
        }
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.startsWith('image/')) {
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

    // Get pending files for new events
    const getPendingFiles = () => pendingFiles;

    // Combine existing documents with pending files for display
    const allDocuments = isNewEvent ? pendingFiles : documents;

    return (
        <div className="document-upload">
            <div className="document-upload-header">
                <span className="document-upload-label">Documents</span>
                <span className="document-upload-count">{allDocuments.length}</span>
            </div>

            {error && (
                <div className="document-upload-error">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {allDocuments.length > 0 && (
                <div className="document-list">
                    {allDocuments.map((doc, index) => (
                        <div key={doc._id || index} className="document-item">
                            <div className="document-item-icon">
                                {getFileIcon(doc.mimeType || doc.type)}
                            </div>
                            <div className="document-item-info">
                                <span className="document-item-name">
                                    {doc.originalName || doc.name}
                                </span>
                                <span className="document-item-size">
                                    {formatFileSize(doc.size)}
                                </span>
                            </div>
                            <div className="document-item-actions">
                                {!isNewEvent && doc.s3Key && (
                                    <button
                                        type="button"
                                        className="document-item-view"
                                        onClick={() => handleViewDocument(doc)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="document-item-remove"
                                    onClick={() => handleRemoveDocument(doc)}
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

            <div className="document-upload-zone">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="document-upload-input"
                />
                <div className="document-upload-content">
                    {isUploading ? (
                        <>
                            <div className="document-upload-spinner"></div>
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>Tap to upload CT scans, MRIs, lab results, or other documents</span>
                            <span className="document-upload-hint">JPG, PNG, PDF up to 50MB</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentUpload;
