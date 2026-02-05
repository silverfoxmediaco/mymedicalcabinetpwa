import React, { useState } from 'react';
import insuranceService from '../../../services/insuranceService';
import './ConnectInsurance.css';

const ConnectInsurance = ({ insurance, onSyncComplete }) => {
    const [syncing, setSyncing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [error, setError] = useState(null);

    const isConnected = insurance?.fhirConnection?.connected;
    const lastSynced = insurance?.fhirConnection?.lastSynced;
    const providerName = insurance?.fhirConnection?.provider === 'wellmark' ? 'Wellmark' : 'Insurance Provider';

    const formatLastSynced = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const handleConnect = async () => {
        try {
            setError(null);
            const { authorizeUrl } = await insuranceService.getFhirAuthUrl('wellmark');
            window.location.href = authorizeUrl;
        } catch (err) {
            console.error('FHIR connect error:', err);
            setError('Unable to connect. Please try again.');
        }
    };

    const handleSync = async () => {
        if (!insurance?._id) return;

        try {
            setSyncing(true);
            setError(null);
            await insuranceService.syncFhirData(insurance._id);
            if (onSyncComplete) onSyncComplete();
        } catch (err) {
            console.error('FHIR sync error:', err);
            setError(err.message || 'Sync failed. Please try again.');
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        if (!insurance?._id) return;

        try {
            setDisconnecting(true);
            setError(null);
            await insuranceService.disconnectFhir(insurance._id);
            if (onSyncComplete) onSyncComplete();
        } catch (err) {
            console.error('FHIR disconnect error:', err);
            setError('Unable to disconnect. Please try again.');
        } finally {
            setDisconnecting(false);
        }
    };

    return (
        <div className="fhir-connect-container">
            <div className="fhir-connect-header">
                <div className="fhir-connect-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                </div>
                <div className="fhir-connect-title-group">
                    <h4 className="fhir-connect-title">Insurance Data Sync</h4>
                    <p className="fhir-connect-subtitle">
                        {isConnected
                            ? `Connected to ${providerName}`
                            : 'Sync your coverage, claims, and medications automatically'
                        }
                    </p>
                </div>
            </div>

            {error && (
                <div className="fhir-connect-error">{error}</div>
            )}

            {!isConnected ? (
                <>
                    <div className="fhir-connect-notice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <div className="fhir-connect-notice-text">
                            <strong>ACA Marketplace Plans Only</strong>
                            <span>Wellmark data sync is currently available only for plans purchased through HealthCare.gov. Employer-sponsored and direct-purchase plans are not supported at this time.</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="fhir-connect-btn"
                        onClick={handleConnect}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                        </svg>
                        Connect to Wellmark
                    </button>
                </>
            ) : (
                <div className="fhir-connect-connected">
                    <div className="fhir-connect-status">
                        <div className="fhir-connect-status-badge">
                            <span className="fhir-connect-status-dot"></span>
                            Connected
                        </div>
                        <span className="fhir-connect-last-synced">
                            Last synced: {formatLastSynced(lastSynced)}
                        </span>
                    </div>

                    <div className="fhir-connect-actions">
                        <button
                            type="button"
                            className="fhir-connect-sync-btn"
                            onClick={handleSync}
                            disabled={syncing}
                        >
                            {syncing ? (
                                <>
                                    <span className="fhir-connect-spinner"></span>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10" />
                                        <polyline points="1 20 1 14 7 14" />
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                    </svg>
                                    Sync Now
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="fhir-connect-disconnect-btn"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                        >
                            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConnectInsurance;
