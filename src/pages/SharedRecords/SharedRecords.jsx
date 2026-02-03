import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { checkShareStatus, verifyOtp, getSharedRecords } from '../../services/shareService';
import {
  SharedPatientHeader,
  SharedEmergencyContactCard,
  SharedMedicationCard,
  SharedDoctorCard,
  SharedInsuranceCard,
  SharedConditionCard,
  SharedAllergyCard,
  SharedVitalsCard,
  SharedProcedureCard,
  SharedEventCard
} from '../../components/SharedRecords';
import './SharedRecords.css';

const SharedRecords = () => {
  const { accessCode } = useParams();
  const [state, setState] = useState('loading'); // loading, otp, records, error, expired
  const [error, setError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [records, setRecords] = useState(null);
  const [shareInfo, setShareInfo] = useState(null);
  const inputRefs = useRef([]);

  // Check share status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkShareStatus(accessCode);
        if (result.data.isValid) {
          setState('otp');
        } else {
          setState('expired');
          setError(result.data.status === 'revoked'
            ? 'This share has been revoked by the patient.'
            : 'This share link has expired.');
        }
      } catch (err) {
        setState('error');
        setError(err.message || 'Share not found');
      }
    };

    if (accessCode) {
      checkStatus();
    }
  }, [accessCode]);

  // Focus first OTP input when OTP state is reached
  useEffect(() => {
    if (state === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [state]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);

      // Focus the input after the last pasted digit
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyOtp(accessCode, otpValue);
      setSessionToken(result.data.sessionToken);

      // Fetch records
      setState('loading');
      const recordsResult = await getSharedRecords(accessCode, result.data.sessionToken);
      setRecords(recordsResult.data);
      setShareInfo(recordsResult.data.shareInfo);
      setState('records');
    } catch (err) {
      setError(err.message || 'Verification failed');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const renderOtpScreen = () => (
    <div className="shared-records-otp-container">
      <div className="shared-records-otp-card">
        <div className="shared-records-otp-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4DACF2" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="shared-records-otp-title">Enter Verification Code</h1>
        <p className="shared-records-otp-subtitle">
          Enter the 6-digit code sent to your email to access the shared medical records.
        </p>

        <div className="shared-records-otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              onPaste={handleOtpPaste}
              className={`shared-records-otp-input ${error ? 'error' : ''}`}
              disabled={isVerifying}
              autoComplete="off"
            />
          ))}
        </div>

        {error && (
          <div className="shared-records-otp-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <button
          className="shared-records-otp-verify-btn"
          onClick={handleVerify}
          disabled={isVerifying || otp.join('').length !== 6}
        >
          {isVerifying ? (
            <>
              <span className="shared-records-spinner"></span>
              Verifying...
            </>
          ) : (
            'Verify & View Records'
          )}
        </button>

        <p className="shared-records-otp-note">
          Didn't receive the code? Ask the patient to resend the invitation.
        </p>
      </div>
    </div>
  );

  const renderRecords = () => {
    if (!records) return null;

    const { patient, permissions } = records.shareInfo || {};

    return (
      <div className="shared-records-container">
        <div className="shared-records-header-bar">
          <div className="shared-records-header-content">
            <div className="shared-records-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Verified Access
            </div>
            <div className="shared-records-expiry">
              Access expires: {new Date(shareInfo?.expiresAt).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="shared-records-content">
          <SharedPatientHeader patient={records.patient} />

          {permissions?.emergencyContacts && records.emergencyContacts?.length > 0 && (
            <section className="shared-records-section">
              <h2 className="shared-records-section-title">Emergency Contacts</h2>
              <div className="shared-records-cards-grid">
                {records.emergencyContacts.map((contact, index) => (
                  <SharedEmergencyContactCard key={index} contact={contact} />
                ))}
              </div>
            </section>
          )}

          {permissions?.medications && records.medications?.length > 0 && (
            <section className="shared-records-section">
              <h2 className="shared-records-section-title">Medications</h2>
              <div className="shared-records-cards-grid">
                {records.medications.map((med, index) => (
                  <SharedMedicationCard key={index} medication={med} />
                ))}
              </div>
            </section>
          )}

          {permissions?.doctors && records.doctors?.length > 0 && (
            <section className="shared-records-section">
              <h2 className="shared-records-section-title">Healthcare Providers</h2>
              <div className="shared-records-cards-grid">
                {records.doctors.map((doctor, index) => (
                  <SharedDoctorCard key={index} doctor={doctor} />
                ))}
              </div>
            </section>
          )}

          {permissions?.insurance && records.insurance && (
            <section className="shared-records-section">
              <h2 className="shared-records-section-title">Insurance Information</h2>
              <SharedInsuranceCard insurance={records.insurance} />
            </section>
          )}

          {permissions?.medicalHistory && records.conditions?.length > 0 && (
            <section className="shared-records-section">
              <h2 className="shared-records-section-title">Medical Conditions</h2>
              <div className="shared-records-cards-grid">
                {records.conditions.map((condition, index) => (
                  <SharedConditionCard key={index} condition={condition} />
                ))}
              </div>
            </section>
          )}

          {permissions?.allergies && records.allergies?.length > 0 && (
            <section className="shared-records-section">
              <h2 className="shared-records-section-title">Allergies</h2>
              <div className="shared-records-cards-grid">
                {records.allergies.map((allergy, index) => (
                  <SharedAllergyCard key={index} allergy={allergy} />
                ))}
              </div>
            </section>
          )}

          {permissions?.vitals && records.vitals?.length > 0 && (
            <section className="shared-records-section">
              <h2 className="shared-records-section-title">Vitals</h2>
              <SharedVitalsCard vitals={records.vitals} />
            </section>
          )}

          {permissions?.procedures && records.procedures?.length > 0 && (
            <section className="shared-records-section">
              <h2 className="shared-records-section-title">Procedures</h2>
              <div className="shared-records-cards-grid">
                {records.procedures.map((procedure, index) => (
                  <SharedProcedureCard key={index} procedure={procedure} />
                ))}
              </div>
            </section>
          )}

          {permissions?.events && records.events?.length > 0 && (
            <section className="shared-records-section">
              <h2 className="shared-records-section-title">Medical Events</h2>
              <div className="shared-records-cards-grid">
                {records.events.map((event, index) => (
                  <SharedEventCard key={index} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Show message if no data available */}
          {!records.emergencyContacts?.length &&
            !records.medications?.length &&
            !records.doctors?.length &&
            !records.insurance &&
            !records.conditions?.length &&
            !records.allergies?.length &&
            !records.vitals?.length &&
            !records.procedures?.length &&
            !records.events?.length && (
              <div className="shared-records-empty">
                <p>No medical records data available at this time.</p>
              </div>
            )}
        </div>

        <div className="shared-records-footer">
          <p>This is a read-only view of shared medical records.</p>
          <p>Powered by Vista RX MD</p>
        </div>
      </div>
    );
  };

  const renderError = () => (
    <div className="shared-records-error-container">
      <div className="shared-records-error-card">
        <div className="shared-records-error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="shared-records-error-title">
          {state === 'expired' ? 'Link Expired' : 'Unable to Access Records'}
        </h1>
        <p className="shared-records-error-message">{error}</p>
        <p className="shared-records-error-note">
          Please contact the patient to request a new share link.
        </p>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="shared-records-loading-container">
      <div className="shared-records-loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );

  return (
    <div className="shared-records-page">
      {state === 'loading' && renderLoading()}
      {state === 'otp' && renderOtpScreen()}
      {state === 'records' && renderRecords()}
      {(state === 'error' || state === 'expired') && renderError()}
    </div>
  );
};

export default SharedRecords;
