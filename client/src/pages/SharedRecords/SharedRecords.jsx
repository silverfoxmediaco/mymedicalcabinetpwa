import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { checkShareStatus, verifyOtp, getSharedRecords } from '../../services/shareService';
import './SharedRecords.css';

const SharedRecords = () => {
    const { accessCode } = useParams();
    const [state, setState] = useState('loading');
    const [error, setError] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [sessionToken, setSessionToken] = useState(null);
    const [records, setRecords] = useState(null);
    const inputRefs = useRef([]);

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

    useEffect(() => {
        if (state === 'otp' && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [state]);

    const handleOtpChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
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

            setState('loading');
            const recordsResult = await getSharedRecords(accessCode, result.data.sessionToken);
            setRecords(recordsResult.data);
            setState('records');
        } catch (err) {
            setError(err.message || 'Verification failed');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const renderOtpScreen = () => (
        <div className="shared-records-otp-container">
            <div className="shared-records-otp-card">
                <div className="shared-records-otp-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#017CFF" strokeWidth="2">
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
                    <div className="shared-records-otp-error">{error}</div>
                )}

                <button
                    className="shared-records-otp-btn"
                    onClick={handleVerify}
                    disabled={isVerifying || otp.join('').length !== 6}
                >
                    {isVerifying ? 'Verifying...' : 'Verify & View Records'}
                </button>

                <p className="shared-records-otp-note">
                    Didn't receive the code? Ask the patient to resend the invitation.
                </p>
            </div>
        </div>
    );

    const renderRecords = () => {
        if (!records) return null;

        const { patient, shareInfo } = records;

        return (
            <div className="shared-records-container">
                <div className="shared-records-header">
                    <div className="shared-records-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Verified Access
                    </div>
                    <span className="shared-records-expiry">
                        Expires: {formatDate(shareInfo?.expiresAt)}
                    </span>
                </div>

                <div className="shared-records-patient">
                    <div className="shared-records-patient-avatar">
                        {patient?.firstName?.charAt(0) || 'P'}
                    </div>
                    <div className="shared-records-patient-info">
                        <h1>{patient?.firstName} {patient?.lastName}</h1>
                        {patient?.dateOfBirth && (
                            <p>DOB: {formatDate(patient.dateOfBirth)}</p>
                        )}
                        {patient?.phone && <p>Phone: {patient.phone}</p>}
                    </div>
                </div>

                {shareInfo?.permissions?.allergies && records.allergies?.length > 0 && (
                    <section className="shared-records-section">
                        <h2 className="shared-records-section-title">Allergies</h2>
                        <div className="shared-records-cards">
                            {records.allergies.map((allergy, index) => (
                                <div key={index} className="shared-records-card allergy">
                                    <h3>{allergy.allergen || allergy.name}</h3>
                                    {allergy.reaction && <p><strong>Reaction:</strong> {allergy.reaction}</p>}
                                    {allergy.severity && <p><strong>Severity:</strong> {allergy.severity}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {shareInfo?.permissions?.medications && records.medications?.length > 0 && (
                    <section className="shared-records-section">
                        <h2 className="shared-records-section-title">Current Medications</h2>
                        <div className="shared-records-cards">
                            {records.medications.map((med, index) => (
                                <div key={index} className="shared-records-card medication">
                                    <h3>{med.name}</h3>
                                    {med.genericName && <p className="generic">{med.genericName}</p>}
                                    {med.dosage && <p><strong>Dosage:</strong> {med.dosage.amount} {med.dosage.unit}</p>}
                                    {med.frequency && <p><strong>Frequency:</strong> {med.frequency}</p>}
                                    {med.purpose && <p><strong>Purpose:</strong> {med.purpose}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {shareInfo?.permissions?.medicalHistory && records.medicalHistory && (
                    <>
                        {records.medicalHistory.conditions?.length > 0 && (
                            <section className="shared-records-section">
                                <h2 className="shared-records-section-title">Medical Conditions</h2>
                                <div className="shared-records-cards">
                                    {records.medicalHistory.conditions.map((condition, index) => (
                                        <div key={index} className="shared-records-card condition">
                                            <h3>{condition.name}</h3>
                                            {condition.diagnosedDate && (
                                                <p><strong>Diagnosed:</strong> {formatDate(condition.diagnosedDate)}</p>
                                            )}
                                            {condition.status && <p><strong>Status:</strong> {condition.status}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {records.medicalHistory.surgeries?.length > 0 && (
                            <section className="shared-records-section">
                                <h2 className="shared-records-section-title">Surgeries</h2>
                                <div className="shared-records-cards">
                                    {records.medicalHistory.surgeries.map((surgery, index) => (
                                        <div key={index} className="shared-records-card surgery">
                                            <h3>{surgery.name}</h3>
                                            {surgery.date && <p><strong>Date:</strong> {formatDate(surgery.date)}</p>}
                                            {surgery.hospital && <p><strong>Hospital:</strong> {surgery.hospital}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="shared-records-section">
                            <h2 className="shared-records-section-title">Vitals</h2>
                            <div className="shared-records-vitals">
                                {records.medicalHistory.bloodType && (
                                    <div className="vital-item">
                                        <span className="vital-label">Blood Type</span>
                                        <span className="vital-value">{records.medicalHistory.bloodType}</span>
                                    </div>
                                )}
                                {records.medicalHistory.height && (
                                    <div className="vital-item">
                                        <span className="vital-label">Height</span>
                                        <span className="vital-value">{records.medicalHistory.height}</span>
                                    </div>
                                )}
                                {records.medicalHistory.weight && (
                                    <div className="vital-item">
                                        <span className="vital-label">Weight</span>
                                        <span className="vital-value">{records.medicalHistory.weight} lbs</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}

                {shareInfo?.permissions?.doctors && records.doctors?.length > 0 && (
                    <section className="shared-records-section">
                        <h2 className="shared-records-section-title">Healthcare Providers</h2>
                        <div className="shared-records-cards">
                            {records.doctors.map((doctor, index) => (
                                <div key={index} className="shared-records-card doctor">
                                    <h3>{doctor.name}</h3>
                                    {doctor.specialty && <p><strong>Specialty:</strong> {doctor.specialty}</p>}
                                    {doctor.practice && <p><strong>Practice:</strong> {doctor.practice}</p>}
                                    {doctor.phone && <p><strong>Phone:</strong> {doctor.phone}</p>}
                                    {doctor.isPrimaryCare && <span className="badge primary">Primary Care</span>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {shareInfo?.permissions?.insurance && records.insurance?.length > 0 && (
                    <section className="shared-records-section">
                        <h2 className="shared-records-section-title">Insurance</h2>
                        <div className="shared-records-cards">
                            {records.insurance.map((ins, index) => (
                                <div key={index} className="shared-records-card insurance">
                                    <h3>{ins.provider}</h3>
                                    {ins.plan && <p><strong>Plan:</strong> {ins.plan}</p>}
                                    {ins.memberId && <p><strong>Member ID:</strong> {ins.memberId}</p>}
                                    {ins.groupNumber && <p><strong>Group:</strong> {ins.groupNumber}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {shareInfo?.permissions?.appointments && records.appointments?.length > 0 && (
                    <section className="shared-records-section">
                        <h2 className="shared-records-section-title">Upcoming Appointments</h2>
                        <div className="shared-records-cards">
                            {records.appointments.map((apt, index) => (
                                <div key={index} className="shared-records-card appointment">
                                    <h3>{apt.doctorName}</h3>
                                    <p><strong>Date:</strong> {formatDate(apt.dateTime)}</p>
                                    {apt.type && <p><strong>Type:</strong> {apt.type}</p>}
                                    {apt.location && <p><strong>Location:</strong> {apt.location}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="shared-records-footer">
                    <p>This is a read-only view of shared medical records.</p>
                    <p>Powered by MyMedicalCabinet</p>
                </div>
            </div>
        );
    };

    const renderError = () => (
        <div className="shared-records-error-container">
            <div className="shared-records-error-card">
                <div className="shared-records-error-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>
                <h1>{state === 'expired' ? 'Link Expired' : 'Unable to Access Records'}</h1>
                <p>{error}</p>
                <p className="note">Please contact the patient to request a new share link.</p>
            </div>
        </div>
    );

    const renderLoading = () => (
        <div className="shared-records-loading">
            <div className="shared-records-spinner"></div>
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
