import React, { useState, useEffect } from 'react';
import ShareModal from '../../components/Share/ShareModal';
import { getMyShares, revokeShare } from '../../services/shareService';
import './MyDashboard.css';

const MyDashboard = () => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shares, setShares] = useState([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [revoking, setRevoking] = useState(null);

  // Mock user data - in real app would come from auth context
  const user = {
    name: 'John Smith',
    email: 'john.smith@email.com'
  };

  // Fetch shares on component mount
  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    setIsLoadingShares(true);
    try {
      const result = await getMyShares();
      setShares(result.data || []);
    } catch (error) {
      console.error('Failed to fetch shares:', error);
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleShareSuccess = () => {
    fetchShares(); // Refresh the list
  };

  const handleRevokeShare = async (shareId) => {
    if (!window.confirm('Are you sure you want to revoke this share? The recipient will no longer be able to access your records.')) {
      return;
    }

    setRevoking(shareId);
    try {
      await revokeShare(shareId);
      fetchShares();
    } catch (error) {
      console.error('Failed to revoke share:', error);
      alert('Failed to revoke share. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (share) => {
    if (share.status === 'revoked') {
      return <span className="dashboard-share-status revoked">Revoked</span>;
    }
    if (share.status === 'expired' || new Date(share.expiresAt) < new Date()) {
      return <span className="dashboard-share-status expired">Expired</span>;
    }
    return <span className="dashboard-share-status active">Active</span>;
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">My Dashboard</h1>
          <p className="dashboard-welcome">Welcome back, {user.name}</p>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Quick Actions Section */}
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Quick Actions</h2>
          <div className="dashboard-cards-grid">
            {/* Share My Records Card */}
            <div
              className="dashboard-action-card share-records-card"
              onClick={() => setIsShareModalOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsShareModalOpen(true)}
            >
              <div className="dashboard-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <div className="dashboard-card-content">
                <h3 className="dashboard-card-title">Share My Records</h3>
                <p className="dashboard-card-description">
                  Securely share your medical records with healthcare providers via email
                </p>
              </div>
              <div className="dashboard-card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            {/* Placeholder cards for other features */}
            <div className="dashboard-action-card disabled">
              <div className="dashboard-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="dashboard-card-content">
                <h3 className="dashboard-card-title">My Records</h3>
                <p className="dashboard-card-description">
                  View and manage your medical records
                </p>
              </div>
              <span className="dashboard-card-coming-soon">Coming Soon</span>
            </div>

            <div className="dashboard-action-card disabled">
              <div className="dashboard-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="dashboard-card-content">
                <h3 className="dashboard-card-title">Appointments</h3>
                <p className="dashboard-card-description">
                  Schedule and manage appointments
                </p>
              </div>
              <span className="dashboard-card-coming-soon">Coming Soon</span>
            </div>
          </div>
        </section>

        {/* Active Shares Section */}
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Shared Access</h2>
            <button
              className="dashboard-refresh-btn"
              onClick={fetchShares}
              disabled={isLoadingShares}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {isLoadingShares ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {isLoadingShares && shares.length === 0 ? (
            <div className="dashboard-loading">
              <div className="dashboard-loading-spinner"></div>
              <p>Loading shares...</p>
            </div>
          ) : shares.length === 0 ? (
            <div className="dashboard-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <p>No shared access yet</p>
              <span>When you share your records, they will appear here</span>
            </div>
          ) : (
            <div className="dashboard-shares-list">
              {shares.map((share) => (
                <div key={share._id} className="dashboard-share-item">
                  <div className="dashboard-share-info">
                    <div className="dashboard-share-recipient">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>{share.recipientEmail}</span>
                      {share.recipientName && (
                        <span className="dashboard-share-name">({share.recipientName})</span>
                      )}
                    </div>
                    <div className="dashboard-share-meta">
                      <span>Shared: {formatDate(share.createdAt)}</span>
                      <span className="dashboard-share-divider">|</span>
                      <span>Expires: {formatDate(share.expiresAt)}</span>
                      {share.viewCount > 0 && (
                        <>
                          <span className="dashboard-share-divider">|</span>
                          <span>Views: {share.viewCount}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="dashboard-share-actions">
                    {getStatusBadge(share)}
                    {share.status === 'active' && new Date(share.expiresAt) > new Date() && (
                      <button
                        className="dashboard-revoke-btn"
                        onClick={() => handleRevokeShare(share._id)}
                        disabled={revoking === share._id}
                      >
                        {revoking === share._id ? 'Revoking...' : 'Revoke'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSuccess={handleShareSuccess}
      />
    </div>
  );
};

export default MyDashboard;
