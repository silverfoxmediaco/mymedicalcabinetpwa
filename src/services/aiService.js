const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Get AI explanation for a medical document
 * @param {string} s3Key - S3 key of the document
 * @param {string} eventId - Associated event ID
 * @returns {Promise<Object>} - Explanation data
 */
export const explainDocument = async (s3Key, eventId) => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/ai/explain-document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ s3Key, eventId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to explain document');
  }

  return data;
};

/**
 * Get AI explanation for a document from base64 data
 * @param {string} base64Data - Base64 encoded document
 * @param {string} mimeType - MIME type of the document
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} - Explanation data
 */
export const explainDocumentBase64 = async (base64Data, mimeType, filename) => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/ai/explain-document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ base64Data, mimeType, filename }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to explain document');
  }

  return data;
};

/**
 * Check AI service health
 * @returns {Promise<Object>} - Health status
 */
export const checkAiHealth = async () => {
  const response = await fetch(`${API_BASE}/ai/health`);
  return response.json();
};

export default {
  explainDocument,
  explainDocumentBase64,
  checkAiHealth,
};
