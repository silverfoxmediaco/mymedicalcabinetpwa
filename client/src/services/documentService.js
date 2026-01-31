const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const documentService = {
    /**
     * Upload a file to an event
     */
    async uploadToEvent(eventId, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/documents/event/${eventId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload document');
        }

        return response.json();
    },

    /**
     * Get a download URL for a document
     */
    async getDownloadUrl(s3Key) {
        const response = await fetch(`${API_BASE}/documents/download/${encodeURIComponent(s3Key)}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to get download URL');
        }

        const data = await response.json();
        return data.downloadUrl;
    },

    /**
     * Delete a document from an event
     */
    async deleteFromEvent(eventId, documentId) {
        const response = await fetch(`${API_BASE}/documents/event/${eventId}/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete document');
        }

        return response.json();
    },

    /**
     * Upload a file directly (standalone, not attached to event)
     */
    async upload(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload document');
        }

        return response.json();
    },

    /**
     * Get file type icon based on mime type
     */
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) {
            return 'image';
        } else if (mimeType === 'application/pdf') {
            return 'pdf';
        } else if (mimeType.includes('dicom')) {
            return 'dicom';
        }
        return 'file';
    },

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
};

export default documentService;
