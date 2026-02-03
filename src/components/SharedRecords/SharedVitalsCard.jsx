import React from 'react';
import './SharedRecords.css';

const SharedVitalsCard = ({ vitals }) => {
  if (!vitals || vitals.length === 0) return null;

  // Get the most recent vitals
  const sortedVitals = [...vitals].sort((a, b) =>
    new Date(b.recordedAt || b.date) - new Date(a.recordedAt || a.date)
  );

  const latestVitals = sortedVitals[0];

  return (
    <div className="shared-card shared-vitals-card full-width">
      <div className="shared-card-header">
        <div className="shared-card-icon vitals">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <h3 className="shared-card-title">Latest Vitals</h3>
        {latestVitals?.recordedAt && (
          <span className="shared-vitals-date">
            Recorded: {new Date(latestVitals.recordedAt).toLocaleString()}
          </span>
        )}
      </div>
      <div className="shared-card-content shared-vitals-grid">
        {latestVitals?.bloodPressure && (
          <div className="shared-vital-item">
            <div className="shared-vital-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div className="shared-vital-info">
              <span className="shared-vital-label">Blood Pressure</span>
              <span className="shared-vital-value">{latestVitals.bloodPressure}</span>
              <span className="shared-vital-unit">mmHg</span>
            </div>
          </div>
        )}

        {latestVitals?.heartRate && (
          <div className="shared-vital-item">
            <div className="shared-vital-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="shared-vital-info">
              <span className="shared-vital-label">Heart Rate</span>
              <span className="shared-vital-value">{latestVitals.heartRate}</span>
              <span className="shared-vital-unit">bpm</span>
            </div>
          </div>
        )}

        {latestVitals?.temperature && (
          <div className="shared-vital-item">
            <div className="shared-vital-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
              </svg>
            </div>
            <div className="shared-vital-info">
              <span className="shared-vital-label">Temperature</span>
              <span className="shared-vital-value">{latestVitals.temperature}</span>
              <span className="shared-vital-unit">°F</span>
            </div>
          </div>
        )}

        {latestVitals?.respiratoryRate && (
          <div className="shared-vital-item">
            <div className="shared-vital-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                <path d="M12 22c4.97 0 9-2.239 9-5v-2.5" />
                <path d="M12 2C7.03 2 3 4.239 3 7v10c0 2.761 4.03 5 9 5" />
                <path d="M12 2c4.97 0 9 2.239 9 5v2" />
              </svg>
            </div>
            <div className="shared-vital-info">
              <span className="shared-vital-label">Respiratory Rate</span>
              <span className="shared-vital-value">{latestVitals.respiratoryRate}</span>
              <span className="shared-vital-unit">breaths/min</span>
            </div>
          </div>
        )}

        {latestVitals?.oxygenSaturation && (
          <div className="shared-vital-item">
            <div className="shared-vital-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="shared-vital-info">
              <span className="shared-vital-label">O2 Saturation</span>
              <span className="shared-vital-value">{latestVitals.oxygenSaturation}</span>
              <span className="shared-vital-unit">%</span>
            </div>
          </div>
        )}

        {latestVitals?.weight && (
          <div className="shared-vital-item">
            <div className="shared-vital-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <path d="M12 3a1 1 0 0 1 1 1v1h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V4a1 1 0 0 1 1-1z" />
              </svg>
            </div>
            <div className="shared-vital-info">
              <span className="shared-vital-label">Weight</span>
              <span className="shared-vital-value">{latestVitals.weight}</span>
              <span className="shared-vital-unit">lbs</span>
            </div>
          </div>
        )}

        {latestVitals?.height && (
          <div className="shared-vital-item">
            <div className="shared-vital-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <div className="shared-vital-info">
              <span className="shared-vital-label">Height</span>
              <span className="shared-vital-value">{latestVitals.height}</span>
              <span className="shared-vital-unit">in</span>
            </div>
          </div>
        )}
      </div>

      {vitals.length > 1 && (
        <div className="shared-vitals-history">
          <h4>Previous Readings</h4>
          <div className="shared-vitals-history-list">
            {sortedVitals.slice(1, 4).map((vital, index) => (
              <div key={index} className="shared-vitals-history-item">
                <span className="shared-vitals-history-date">
                  {new Date(vital.recordedAt || vital.date).toLocaleDateString()}
                </span>
                {vital.bloodPressure && <span>BP: {vital.bloodPressure}</span>}
                {vital.heartRate && <span>HR: {vital.heartRate}</span>}
                {vital.temperature && <span>Temp: {vital.temperature}°F</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedVitalsCard;
