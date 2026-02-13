const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Get AI explanation for a medical document
 * @param {string} s3Key - S3 key of the document
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} - Explanation data
 */
export const explainDocument = async (s3Key, filename) => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/ai/explain-document`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ s3Key, filename })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to explain document');
    }

    return data;
};

/**
 * Get AI explanation for an insurance document
 * @param {string} s3Key - S3 key of the document
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} - Insurance explanation data
 */
export const explainInsuranceDocument = async (s3Key, filename) => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/ai/explain-insurance-document`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ s3Key, filename })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to explain insurance document');
    }

    return data;
};

/**
 * Get AI analysis of a medical bill for errors and overcharges
 * @param {string} s3Key - S3 key of the document
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} - Bill analysis data
 */
export const analyzeMedicalBill = async (s3Key, filename) => {
    const token = localStorage.getItem('token');

    if (!token) {
        throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/ai/analyze-medical-bill`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ s3Key, filename })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze medical bill');
    }

    return data;
};

/**
 * Check AI service health
 * @returns {Promise<Object>} - Health status
 */
export const checkAiHealth = async () => {
    const response = await fetch(`${API_URL}/api/ai/health`);
    return response.json();
};

export const aiService = {
    explainDocument,
    explainInsuranceDocument,
    analyzeMedicalBill,
    checkAiHealth
};

export default aiService;
