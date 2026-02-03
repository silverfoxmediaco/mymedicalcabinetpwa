/**
 * Share Service - API calls for medical records sharing functionality
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get auth header with JWT token
 */
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Create a new email share with OTP verification
 * @param {string} recipientEmail - Email of the recipient
 * @param {string} recipientName - Optional name of the recipient
 * @param {Object} permissions - Permissions object for what data to share
 * @returns {Promise<Object>} Share creation response
 */
export const createEmailShare = async (recipientEmail, recipientName = '', permissions = {}) => {
  const response = await fetch(`${API_URL}/share/email-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({
      recipientEmail,
      recipientName,
      permissions
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create share');
  }

  return data;
};

/**
 * Verify OTP and get session token
 * @param {string} accessCode - The access code from the URL
 * @param {string} otp - The 6-digit OTP
 * @returns {Promise<Object>} Session token and expiry
 */
export const verifyOtp = async (accessCode, otp) => {
  const response = await fetch(`${API_URL}/share/verify-otp/${accessCode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ otp })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'OTP verification failed');
  }

  return data;
};

/**
 * Get shared records using session token
 * @param {string} accessCode - The access code from the URL
 * @param {string} sessionToken - The session token from OTP verification
 * @returns {Promise<Object>} Shared records data
 */
export const getSharedRecords = async (accessCode, sessionToken) => {
  const response = await fetch(`${API_URL}/share/records/${accessCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve records');
  }

  return data;
};

/**
 * Get all shares created by the current user
 * @returns {Promise<Object>} List of shares
 */
export const getMyShares = async () => {
  const response = await fetch(`${API_URL}/share`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve shares');
  }

  return data;
};

/**
 * Get a specific share by ID
 * @param {string} shareId - The share ID
 * @returns {Promise<Object>} Share details
 */
export const getShareById = async (shareId) => {
  const response = await fetch(`${API_URL}/share/${shareId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to retrieve share');
  }

  return data;
};

/**
 * Revoke a share
 * @param {string} shareId - The share ID to revoke
 * @param {string} reason - Optional reason for revocation
 * @returns {Promise<Object>} Revocation confirmation
 */
export const revokeShare = async (shareId, reason = '') => {
  const response = await fetch(`${API_URL}/share/${shareId}/revoke`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ reason })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to revoke share');
  }

  return data;
};

/**
 * Check share status (public endpoint)
 * @param {string} accessCode - The access code to check
 * @returns {Promise<Object>} Share status
 */
export const checkShareStatus = async (accessCode) => {
  const response = await fetch(`${API_URL}/share/status/${accessCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to check share status');
  }

  return data;
};

export default {
  createEmailShare,
  verifyOtp,
  getSharedRecords,
  getMyShares,
  getShareById,
  revokeShare,
  checkShareStatus
};
