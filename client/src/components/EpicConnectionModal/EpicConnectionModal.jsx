import React, { useState, useEffect } from 'react';
import { epicService } from '../../services/epicService';
import HealthSystemSearch from '../HealthSystemSearch/HealthSystemSearch';
import './EpicConnectionModal.css';

const EpicConnectionModal = ({ isOpen, onClose, familyMemberId, familyMemberName }) => {
    const [epicStatus, setEpicStatus] = useState(null);
    const [epicLoading, setEpicLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [selectedHealthSystem, setSelectedHealthSystem] = useState(null);
    const [showImportPrompt, setShowImportPrompt] = useState(false);

    const isFamilyMemberMode = !!familyMemberId;

    // Lock body scroll when open
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

    // Fetch epic status when modal opens or familyMemberId changes
    useEffect(() => {
        if (!isOpen) return;
        const fetchStatus = async () => {
            try {
                const status = await epicService.getStatus(familyMemberId);
                setEpicStatus(status);
                setSyncResult(null);
                setSelectedHealthSystem(null);
                setShowImportPrompt(false);
            } catch (error) {
                console.error('Error fetching Epic status:', error);
            }
        };
        fetchStatus();
    }, [isOpen, familyMemberId]);

    const handleEpicConnect = async () => {
        setEpicLoading(true);
        try {
            const healthSystemId = selectedHealthSystem ? selectedHealthSystem._id : null;
            const authUrl = await epicService.getAuthorizationUrl(familyMemberId, healthSystemId);
            window.location.href = authUrl;
        } catch (error) {
            console.error('Epic connect error:', error);
            alert(error.message || 'Failed to connect to Epic. Please try again.');
            setEpicLoading(false);
        }
    };

    const handleEpicDisconnect = async () => {
        if (!window.confirm('Disconnect your Epic MyChart account? You can reconnect anytime.')) return;
        setEpicLoading(true);
        try {
            await epicService.disconnect(familyMemberId);
            setEpicStatus({ connected: false });
        } catch (error) {
            console.error('Epic disconnect error:', error);
            alert('Failed to disconnect. Please try again.');
        } finally {
            setEpicLoading(false);
        }
    };

    const handleEpicSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        try {
            const result = await epicService.sync(familyMemberId);
            setSyncResult(result.summary);
            const status = await epicService.getStatus(familyMemberId);
            setEpicStatus(status);
        } catch (error) {
            console.error('Epic sync error:', error);
            alert(error.message || 'Failed to import records. Please try again.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleClose = () => {
        setSyncResult(null);
        setShowImportPrompt(false);
        setSelectedHealthSystem(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="epic-modal-overlay" onClick={handleClose}></div>

            <div className="epic-modal-sheet">
                <div className="epic-modal-header">
                    <h2 className="epic-modal-title">
                        {isFamilyMemberMode ? `${familyMemberName}'s Epic MyChart` : 'Epic MyChart'}
                    </h2>
                    <button
                        className="epic-modal-close"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <span className="epic-modal-close-icon"></span>
                    </button>
                </div>

                <div className="epic-modal-body">
                    <div className="epic-modal-section">
                        {epicStatus?.connected ? (
                            <>
                                <div className="epic-modal-connected-banner">
                                    <div className="epic-modal-connected-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M20 6L9 17L4 12" />
                                        </svg>
                                    </div>
                                    <div className="epic-modal-connected-text">
                                        <span className="epic-modal-connected-label">Connected to {epicStatus.healthSystemName || 'Epic MyChart'}{isFamilyMemberMode ? ` for ${familyMemberName}` : ''}</span>
                                        {epicStatus.patientName && (
                                            <span className="epic-modal-patient-name">{epicStatus.patientName}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="epic-modal-details">
                                    <div className="epic-modal-detail-row">
                                        <span className="epic-modal-detail-label">Connected</span>
                                        <span className="epic-modal-detail-value">
                                            {epicStatus.connectedAt ? new Date(epicStatus.connectedAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="epic-modal-detail-row">
                                        <span className="epic-modal-detail-label">Last Sync</span>
                                        <span className="epic-modal-detail-value">
                                            {epicStatus.lastSyncAt ? new Date(epicStatus.lastSyncAt).toLocaleDateString() : 'Never'}
                                        </span>
                                    </div>
                                    <div className="epic-modal-detail-row">
                                        <span className="epic-modal-detail-label">Status</span>
                                        <span className={`epic-modal-status-badge ${epicStatus.tokenExpired ? 'epic-modal-status-expired' : 'epic-modal-status-active'}`}>
                                            {epicStatus.tokenExpired ? 'Session Expired' : 'Active'}
                                        </span>
                                    </div>
                                </div>

                                <div className="epic-modal-sync-section">
                                    {showImportPrompt && !isSyncing && !syncResult && (
                                        <div className="epic-modal-import-prompt">
                                            <div className="epic-modal-import-prompt-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                            </div>
                                            <h4 className="epic-modal-import-prompt-title">Ready to import{isFamilyMemberMode ? ` ${familyMemberName}'s` : ' your'} records!</h4>
                                            <p className="epic-modal-import-prompt-desc">Your account is connected. Import your medical records now to populate your dashboard.</p>
                                            <button
                                                className="epic-modal-import-prompt-btn"
                                                onClick={() => { setShowImportPrompt(false); handleEpicSync(); }}
                                            >
                                                Import Records Now
                                            </button>
                                        </div>
                                    )}
                                    {isSyncing ? (
                                        <div className="epic-modal-syncing">
                                            <div className="epic-modal-syncing-spinner"></div>
                                            <span className="epic-modal-syncing-text">Updating your records...</span>
                                        </div>
                                    ) : syncResult ? (
                                        <div className="epic-modal-sync-result">
                                            <div className="epic-modal-sync-header">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="epic-modal-sync-check">
                                                    <path d="M20 6L9 17L4 12" />
                                                </svg>
                                                <span>Update Complete</span>
                                            </div>
                                            {(() => {
                                                const rows = [
                                                    { label: 'Medications', data: syncResult.medications },
                                                    { label: 'Conditions', data: syncResult.conditions },
                                                    { label: 'Allergies', data: syncResult.allergies },
                                                    { label: 'Immunizations', data: syncResult.events },
                                                    { label: 'Procedures', data: syncResult.surgeries },
                                                    { label: 'Doctors', data: syncResult.doctors }
                                                ].filter(r => r.data && (r.data.created + r.data.updated) > 0);

                                                if (rows.length === 0) {
                                                    return (
                                                        <p className="epic-modal-sync-empty">Your records are up to date.</p>
                                                    );
                                                }

                                                return rows.map(row => (
                                                    <div key={row.label} className="epic-modal-sync-row">
                                                        <span className="epic-modal-sync-label">{row.label}</span>
                                                        <span className="epic-modal-sync-count">
                                                            {[
                                                                row.data.created > 0 ? `${row.data.created} new` : null,
                                                                row.data.updated > 0 ? `${row.data.updated} updated` : null
                                                            ].filter(Boolean).join(', ')}
                                                        </span>
                                                    </div>
                                                ));
                                            })()}
                                            <button
                                                className="epic-modal-import-btn epic-modal-import-btn-again"
                                                onClick={handleEpicSync}
                                                disabled={isSyncing || epicLoading}
                                            >
                                                Update Again
                                            </button>
                                        </div>
                                    ) : !showImportPrompt ? (
                                        <>
                                            {epicStatus.lastSyncAt ? (
                                                <button
                                                    className="epic-modal-sync-btn"
                                                    onClick={handleEpicSync}
                                                    disabled={isSyncing || epicLoading || epicStatus.tokenExpired}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="epic-modal-sync-btn-icon">
                                                        <polyline points="23 4 23 10 17 10" />
                                                        <polyline points="1 20 1 14 7 14" />
                                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                                                        <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
                                                    </svg>
                                                    Update My Records
                                                </button>
                                            ) : (
                                                <button
                                                    className="epic-modal-import-btn"
                                                    onClick={handleEpicSync}
                                                    disabled={isSyncing || epicLoading || epicStatus.tokenExpired}
                                                >
                                                    Import My Records
                                                </button>
                                            )}
                                            <p className="epic-modal-import-desc">
                                                {epicStatus.lastSyncAt
                                                    ? 'Pull the latest records from your health system'
                                                    : 'Imports medications, conditions, allergies, immunizations, & doctors'
                                                }
                                            </p>
                                        </>
                                    ) : null}
                                </div>

                                <div className="epic-modal-actions">
                                    {epicStatus.tokenExpired && (
                                        <button
                                            className="epic-modal-reconnect-btn"
                                            onClick={handleEpicConnect}
                                            disabled={epicLoading}
                                        >
                                            {epicLoading ? 'Connecting...' : 'Reconnect'}
                                        </button>
                                    )}
                                    <button
                                        className="epic-modal-disconnect-btn"
                                        onClick={handleEpicDisconnect}
                                        disabled={epicLoading || isSyncing}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="epic-modal-intro">
                                    <div className="epic-modal-intro-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                            <path d="M2 17l10 5 10-5" />
                                            <path d="M2 12l10 5 10-5" />
                                        </svg>
                                    </div>
                                    <h3 className="epic-modal-intro-title">Import from Epic MyChart{isFamilyMemberMode ? ` for ${familyMemberName}` : ''}</h3>
                                    <p className="epic-modal-intro-desc">
                                        Connect {isFamilyMemberMode ? `${familyMemberName}'s` : 'your'} Epic MyChart account to automatically import medications, conditions, allergies, immunizations, lab results, and more.
                                    </p>
                                </div>

                                <div className="epic-modal-features">
                                    <div className="epic-modal-feature-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="epic-modal-feature-icon">
                                            <path d="M20 6L9 17L4 12" />
                                        </svg>
                                        <span>Medications & prescriptions</span>
                                    </div>
                                    <div className="epic-modal-feature-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="epic-modal-feature-icon">
                                            <path d="M20 6L9 17L4 12" />
                                        </svg>
                                        <span>Conditions & diagnoses</span>
                                    </div>
                                    <div className="epic-modal-feature-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="epic-modal-feature-icon">
                                            <path d="M20 6L9 17L4 12" />
                                        </svg>
                                        <span>Allergies & immunizations</span>
                                    </div>
                                    <div className="epic-modal-feature-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="epic-modal-feature-icon">
                                            <path d="M20 6L9 17L4 12" />
                                        </svg>
                                        <span>Lab results & vitals</span>
                                    </div>
                                    <div className="epic-modal-feature-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="epic-modal-feature-icon">
                                            <path d="M20 6L9 17L4 12" />
                                        </svg>
                                        <span>Insurance & claims data</span>
                                    </div>
                                </div>

                                <div className="epic-modal-hs-picker">
                                    <label className="epic-modal-hs-label">Select your health system</label>
                                    {selectedHealthSystem ? (
                                        <div className="epic-modal-hs-selected">
                                            <div className="epic-modal-hs-selected-info">
                                                <span className="epic-modal-hs-selected-name">{selectedHealthSystem.name}</span>
                                                {(selectedHealthSystem.city || selectedHealthSystem.state) && (
                                                    <span className="epic-modal-hs-selected-location">
                                                        {[selectedHealthSystem.city, selectedHealthSystem.state].filter(Boolean).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="epic-modal-hs-change-btn"
                                                onClick={() => setSelectedHealthSystem(null)}
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <HealthSystemSearch
                                            onSelect={(hs) => setSelectedHealthSystem(hs)}
                                            placeholder="Search by hospital or health system name..."
                                        />
                                    )}
                                </div>

                                <button
                                    className="epic-modal-connect-btn"
                                    onClick={handleEpicConnect}
                                    disabled={epicLoading || !selectedHealthSystem}
                                >
                                    {epicLoading ? 'Connecting...' : selectedHealthSystem ? `Connect to ${selectedHealthSystem.name}` : 'Select a health system above'}
                                </button>

                                <p className="epic-modal-privacy-note">
                                    Your data stays private. We only read your records — nothing is shared back with Epic.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EpicConnectionModal;
