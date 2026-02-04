import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import ExplanationModal from '../ExplanationModal';
import { explainDocument, explainDocumentBase64 } from '../../../services/aiService';
import './DocumentUpload.css';

const DocumentUpload = ({
  eventId,
  documents,
  onDocumentsChange,
  onViewDocument,
  maxFiles,
  acceptedTypes,
  maxFileSize,
}) => {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationModal, setExplanationModal] = useState({
    isOpen: false,
    explanation: null,
    documentName: '',
    error: null,
  });
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadError(null);

    if (documents.length + files.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!acceptedTypes.includes(file.type)) {
        setUploadError(`Invalid file type: ${file.name}`);
        continue;
      }
      if (file.size > maxFileSize) {
        setUploadError(`File too large: ${file.name} (max ${maxFileSize / 1024 / 1024}MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0 && onDocumentsChange) {
      const newDocs = validFiles.map((file) => ({
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        uploadedAt: new Date().toISOString(),
      }));
      onDocumentsChange([...documents, ...newDocs]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = (docId) => {
    if (onDocumentsChange) {
      onDocumentsChange(documents.filter((doc) => doc.id !== docId));
    }
  };

  const handleView = (doc) => {
    if (onViewDocument) {
      onViewDocument(doc);
    } else if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      window.open(url, '_blank');
    } else if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  const handleExplain = async (doc) => {
    setIsExplaining(true);
    setExplanationModal({
      isOpen: true,
      explanation: null,
      documentName: doc.name,
      error: null,
    });

    try {
      let response;

      if (doc.s3Key) {
        response = await explainDocument(doc.s3Key, eventId);
      } else if (doc.file) {
        const base64Data = await fileToBase64(doc.file);
        response = await explainDocumentBase64(base64Data, doc.type, doc.name);
      } else {
        throw new Error('No document data available');
      }

      setExplanationModal((prev) => ({
        ...prev,
        explanation: response.data.explanation,
      }));
    } catch (error) {
      setExplanationModal((prev) => ({
        ...prev,
        error: error.message || 'Failed to analyze document',
      }));
    } finally {
      setIsExplaining(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const closeExplanationModal = () => {
    setExplanationModal({
      isOpen: false,
      explanation: null,
      documentName: '',
      error: null,
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    }
    if (type === 'application/pdf') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
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

  return (
    <div className="document-upload-container">
      <div className="document-upload-header">
        <h3 className="document-upload-title">Documents</h3>
        <span className="document-upload-count">
          {documents.length} / {maxFiles}
        </span>
      </div>

      {uploadError && (
        <div className="document-upload-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} aria-label="Dismiss error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {documents.length > 0 && (
        <div className="document-list">
          {documents.map((doc) => (
            <div key={doc.id} className="document-item">
              <div className="document-item-icon">{getFileIcon(doc.type)}</div>
              <div className="document-item-info">
                <span className="document-item-name">{doc.name}</span>
                <span className="document-item-size">{formatFileSize(doc.size)}</span>
              </div>
              <div className="document-item-actions">
                <button
                  className="document-action-btn document-action-view"
                  onClick={() => handleView(doc)}
                  title="View document"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  View
                </button>
                <button
                  className="document-action-btn document-action-explain"
                  onClick={() => handleExplain(doc)}
                  disabled={isExplaining}
                  title="Get AI explanation"
                >
                  {isExplaining && explanationModal.documentName === doc.name ? (
                    <>
                      <span className="document-action-spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Explain
                    </>
                  )}
                </button>
                <button
                  className="document-action-btn document-action-remove"
                  onClick={() => handleRemoveDocument(doc.id)}
                  title="Remove document"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {documents.length < maxFiles && (
        <div className="document-upload-area">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={acceptedTypes.join(',')}
            multiple={documents.length + 1 < maxFiles}
            className="document-upload-input"
            id="document-upload-input"
          />
          <label htmlFor="document-upload-input" className="document-upload-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span className="document-upload-text">
              <strong>Click to upload</strong> or drag and drop
            </span>
            <span className="document-upload-hint">
              PDF, JPG, PNG up to {maxFileSize / 1024 / 1024}MB
            </span>
          </label>
        </div>
      )}

      <ExplanationModal
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

DocumentUpload.propTypes = {
  eventId: PropTypes.string,
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      size: PropTypes.number.isRequired,
      file: PropTypes.object,
      s3Key: PropTypes.string,
      url: PropTypes.string,
    })
  ),
  onDocumentsChange: PropTypes.func,
  onViewDocument: PropTypes.func,
  maxFiles: PropTypes.number,
  acceptedTypes: PropTypes.arrayOf(PropTypes.string),
  maxFileSize: PropTypes.number,
};

DocumentUpload.defaultProps = {
  eventId: '',
  documents: [],
  onDocumentsChange: null,
  onViewDocument: null,
  maxFiles: 10,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  maxFileSize: 10 * 1024 * 1024,
};

export default DocumentUpload;
