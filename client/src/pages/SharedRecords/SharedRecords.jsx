import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
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
    const [isDownloading, setIsDownloading] = useState(false);
    // const [isBlurred, setIsBlurred] = useState(false); // SECURITY: Uncomment to enable blur protection
    const inputRefs = useRef([]);
    const recordsRef = useRef([]);

    /* ===========================================
     * OPTIONAL SECURITY MEASURES (Commented Out)
     * Uncomment if required by investors/regulatory
     * OTP verification is the primary security layer
     * =========================================== */

    // // Security: Blur content when page loses focus (prevent screenshots while switching apps)
    // useEffect(() => {
    //     const handleVisibilityChange = () => {
    //         if (document.hidden && state === 'records') {
    //             setIsBlurred(true);
    //         }
    //     };

    //     const handleBlur = () => {
    //         if (state === 'records') {
    //             setIsBlurred(true);
    //         }
    //     };

    //     const handleFocus = () => {
    //         setIsBlurred(false);
    //     };

    //     document.addEventListener('visibilitychange', handleVisibilityChange);
    //     window.addEventListener('blur', handleBlur);
    //     window.addEventListener('focus', handleFocus);

    //     return () => {
    //         document.removeEventListener('visibilitychange', handleVisibilityChange);
    //         window.removeEventListener('blur', handleBlur);
    //         window.removeEventListener('focus', handleFocus);
    //     };
    // }, [state]);

    // // Security: Disable context menu (right-click/long-press)
    // useEffect(() => {
    //     const handleContextMenu = (e) => {
    //         if (state === 'records') {
    //             e.preventDefault();
    //             return false;
    //         }
    //     };

    //     document.addEventListener('contextmenu', handleContextMenu);
    //     return () => document.removeEventListener('contextmenu', handleContextMenu);
    // }, [state]);

    // // Security: Disable keyboard shortcuts for copy/print
    // useEffect(() => {
    //     const handleKeyDown = (e) => {
    //         if (state === 'records') {
    //             // Disable Ctrl+C, Ctrl+P, Ctrl+S, Cmd+C, Cmd+P, Cmd+S
    //             if ((e.ctrlKey || e.metaKey) && ['c', 'p', 's', 'a'].includes(e.key.toLowerCase())) {
    //                 e.preventDefault();
    //                 return false;
    //             }
    //             // Disable Print Screen
    //             if (e.key === 'PrintScreen') {
    //                 e.preventDefault();
    //                 return false;
    //             }
    //         }
    //     };

    //     document.addEventListener('keydown', handleKeyDown);
    //     return () => document.removeEventListener('keydown', handleKeyDown);
    // }, [state]);

    /* END OPTIONAL SECURITY MEASURES */

    const handleDownloadPDF = async () => {
        if (!recordsRef.current || !records) return;

        setIsDownloading(true);

        const patientName = `${records.patient?.firstName || ''} ${records.patient?.lastName || ''}`.trim();
        const filename = `Medical_Records_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

        const options = {
            margin: [10, 10, 10, 10],
            filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        try {
            await html2pdf().set(options).from(recordsRef.current).save();
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setIsDownloading(false);
        }
    };

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
            const token = result.data.sessionToken;
            setSessionToken(token);

            setState('loading');

            try {
                const recordsResult = await getSharedRecords(accessCode, token);
                setRecords(recordsResult.data);
                setState('records');
            } catch (recordsErr) {
                console.error('Failed to fetch records:', recordsErr);
                setError(recordsErr.message || 'Failed to load records');
                setState('error');
            }
        } catch (err) {
            setError(err.message || 'Verification failed');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setState('otp');
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
            <div className="shared-records-container" ref={recordsRef}>
                {/* OPTIONAL SECURITY: Watermark - Uncomment if required
                <div className="shared-records-watermark">
                    CONFIDENTIAL - Accessed by {shareInfo?.recipientEmail || 'Verified User'} - {new Date().toLocaleDateString()}
                </div>
                */}

                {/* OPTIONAL SECURITY: Blur overlay - Uncomment if required (also uncomment isBlurred state)
                {isBlurred && (
                    <div className="shared-records-blur-overlay">
                        <div className="blur-message">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <h3>Content Protected</h3>
                            <p>Tap to view records</p>
                        </div>
                    </div>
                )}
                */}

                <div className="shared-records-header">
                    <div className="shared-records-header-left">
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
                    <button
                        className="shared-records-download-btn"
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {isDownloading ? 'Generating...' : 'Download PDF'}
                    </button>
                </div>

                {records.intakeForm?.reasonForVisit && (
                    <div className="shared-records-reason-visit">
                        <h2 className="shared-records-section-title">Reason for Visit</h2>
                        <p className="shared-records-reason-text">{records.intakeForm.reasonForVisit}</p>
                    </div>
                )}

                <div className="shared-records-patient">
                    <div className="shared-records-patient-avatar">
                        {patient?.firstName?.charAt(0) || 'P'}
                    </div>
                    <div className="shared-records-patient-info">
                        <h1>{patient?.firstName} {patient?.lastName}</h1>
                        {patient?.dateOfBirth && (
                            <p><strong>Date of Birth:</strong> {formatDate(patient.dateOfBirth)}</p>
                        )}
                        {patient?.phone && <p><strong>Phone:</strong> {patient.phone}</p>}
                        {patient?.email && <p><strong>Email:</strong> {patient.email}</p>}
                        {patient?.backupEmail && <p><strong>Backup Email:</strong> {patient.backupEmail}</p>}
                        {patient?.address && (patient.address.street || patient.address.city) && (
                            <p><strong>Address:</strong> {[
                                patient.address.street,
                                patient.address.city,
                                patient.address.state,
                                patient.address.zipCode
                            ].filter(Boolean).join(', ')}</p>
                        )}
                    </div>
                </div>

                {patient?.emergencyContact?.name && (
                    <div className="shared-records-emergency-contact">
                        <h2 className="shared-records-section-title">Emergency Contact</h2>
                        <div className="emergency-contact-card">
                            <p><strong>Name:</strong> {patient.emergencyContact.name}</p>
                            {patient.emergencyContact.relationship && (
                                <p><strong>Relationship:</strong> {patient.emergencyContact.relationship}</p>
                            )}
                            {patient.emergencyContact.phone && (
                                <p><strong>Phone:</strong> {patient.emergencyContact.phone}</p>
                            )}
                        </div>
                    </div>
                )}

                {shareInfo?.permissions?.allergies && (
                    <section className="shared-records-section shared-records-critical">
                        <h2 className="shared-records-section-title critical-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            ALLERGIES
                        </h2>
                        {records.allergies?.length > 0 ? (
                            <div className="shared-records-cards allergy-cards">
                                {records.allergies.map((allergy, index) => (
                                    <div key={index} className="shared-records-card allergy">
                                        <h3>{allergy.allergen || allergy.name}</h3>
                                        {allergy.severity && (
                                            <span className={`badge severity-${allergy.severity}`}>
                                                {allergy.severity.toUpperCase()}
                                            </span>
                                        )}
                                        {allergy.reaction && <p><strong>Reaction:</strong> {allergy.reaction}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-allergies-box">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                                <span>No Known Allergies (NKA)</span>
                            </div>
                        )}
                    </section>
                )}

                {shareInfo?.permissions?.medicalHistory && records.medicalHistory && (
                    <section className="shared-records-section vitals-critical">
                        <h2 className="shared-records-section-title">Critical Vitals</h2>
                        <div className="shared-records-vitals">
                            {records.medicalHistory.bloodType && records.medicalHistory.bloodType !== 'unknown' && (
                                <div className="vital-item vital-blood-type">
                                    <span className="vital-label">Blood Type</span>
                                    <span className="vital-value">{records.medicalHistory.bloodType}</span>
                                </div>
                            )}
                            {records.medicalHistory.height?.value && (
                                <div className="vital-item">
                                    <span className="vital-label">Height</span>
                                    <span className="vital-value">
                                        {records.medicalHistory.height.value} {records.medicalHistory.height.unit || 'in'}
                                    </span>
                                </div>
                            )}
                            {records.medicalHistory.weight?.value && (
                                <div className="vital-item">
                                    <span className="vital-label">Weight</span>
                                    <span className="vital-value">
                                        {records.medicalHistory.weight.value} {records.medicalHistory.weight.unit || 'lb'}
                                    </span>
                                </div>
                            )}
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
                                    {med.dosage?.amount && <p><strong>Dosage:</strong> {med.dosage.amount} {med.dosage.unit || ''}</p>}
                                    {med.frequency && <p><strong>Frequency:</strong> {med.frequency}</p>}
                                    {med.timeOfDay?.length > 0 && <p><strong>Time of Day:</strong> {med.timeOfDay.join(', ')}</p>}
                                    {med.purpose && <p><strong>Purpose:</strong> {med.purpose}</p>}
                                    {med.instructions && <p><strong>Instructions:</strong> {med.instructions}</p>}
                                    {med.sideEffects && <p><strong>Side Effects:</strong> {med.sideEffects}</p>}
                                    {med.prescribedBy && <p><strong>Prescribed By:</strong> {med.prescribedBy}</p>}
                                    {med.prescribedDate && <p><strong>Prescribed Date:</strong> {formatDate(med.prescribedDate)}</p>}
                                    {med.startDate && <p><strong>Start Date:</strong> {formatDate(med.startDate)}</p>}
                                    {med.refillsRemaining !== undefined && med.refillsRemaining !== null && (
                                        <p><strong>Refills Remaining:</strong> {med.refillsRemaining}</p>
                                    )}
                                    {med.nextRefillDate && <p><strong>Next Refill:</strong> {formatDate(med.nextRefillDate)}</p>}
                                    {med.pharmacy?.name && (
                                        <div className="pharmacy-info">
                                            <p><strong>Pharmacy:</strong> {med.pharmacy.name}</p>
                                            {med.pharmacy.phone && <p><strong>Pharmacy Phone:</strong> {med.pharmacy.phone}</p>}
                                            {med.pharmacy.address && <p><strong>Pharmacy Address:</strong> {med.pharmacy.address}</p>}
                                        </div>
                                    )}
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
                                            {condition.status && <span className={`badge ${condition.status}`}>{condition.status}</span>}
                                            {condition.diagnosedDate && (
                                                <p><strong>Diagnosed:</strong> {formatDate(condition.diagnosedDate)}</p>
                                            )}
                                            {condition.notes && <p><strong>Notes:</strong> {condition.notes}</p>}
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
                                            <h3>{surgery.procedure}</h3>
                                            {surgery.date && <p><strong>Date:</strong> {formatDate(surgery.date)}</p>}
                                            {surgery.hospital && <p><strong>Hospital:</strong> {surgery.hospital}</p>}
                                            {surgery.surgeon && <p><strong>Surgeon:</strong> {surgery.surgeon}</p>}
                                            {surgery.notes && <p><strong>Notes:</strong> {surgery.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {records.medicalHistory.familyHistory?.length > 0 && (
                            <section className="shared-records-section">
                                <h2 className="shared-records-section-title">Family Medical History</h2>
                                <div className="shared-records-cards">
                                    {records.medicalHistory.familyHistory.map((item, index) => (
                                        <div key={index} className="shared-records-card family-history">
                                            <h3>{item.condition}</h3>
                                            {item.relationship && <p><strong>Relationship:</strong> {item.relationship}</p>}
                                            {item.notes && <p><strong>Notes:</strong> {item.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {records.medicalHistory.events?.length > 0 && (
                            <section className="shared-records-section">
                                <h2 className="shared-records-section-title">Medical Events & Documents</h2>
                                <div className="shared-records-cards">
                                    {records.medicalHistory.events.map((event, index) => (
                                        <div key={index} className="shared-records-card event">
                                            <h3>{event.description}</h3>
                                            {event.eventType && <span className="badge event-type">{event.eventType.replace(/_/g, ' ')}</span>}
                                            {event.date && <p><strong>Date:</strong> {formatDate(event.date)}</p>}
                                            {event.provider && <p><strong>Provider:</strong> {event.provider}</p>}
                                            {event.providerAddress && <p><strong>Address:</strong> {event.providerAddress}</p>}
                                            {event.providerPhone && <p><strong>Phone:</strong> {event.providerPhone}</p>}
                                            {event.notes && <p><strong>Notes:</strong> {event.notes}</p>}

                                            {event.documents?.length > 0 && (
                                                <div className="event-documents">
                                                    <p className="documents-label"><strong>Attached Documents ({event.documents.length}):</strong></p>
                                                    <div className="documents-list">
                                                        {event.documents.map((doc, docIndex) => (
                                                            <a
                                                                key={docIndex}
                                                                href={doc.downloadUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="document-link"
                                                            >
                                                                <span className="document-icon">
                                                                    {doc.mimeType?.includes('pdf') ? (
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                                            <polyline points="14 2 14 8 20 8"/>
                                                                            <path d="M9 15h6"/>
                                                                            <path d="M9 11h6"/>
                                                                        </svg>
                                                                    ) : (
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                                                            <polyline points="21 15 16 10 5 21"/>
                                                                        </svg>
                                                                    )}
                                                                </span>
                                                                <span className="document-name">{doc.originalName || doc.filename}</span>
                                                                <span className="document-size">
                                                                    {doc.size ? `(${(doc.size / 1024 / 1024).toFixed(1)} MB)` : ''}
                                                                </span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {shareInfo?.permissions?.doctors && records.doctors?.length > 0 && (
                    <section className="shared-records-section">
                        <h2 className="shared-records-section-title">Healthcare Providers</h2>
                        <div className="shared-records-cards">
                            {records.doctors.map((doctor, index) => (
                                <div key={index} className="shared-records-card doctor">
                                    <h3>{doctor.name}</h3>
                                    {doctor.isPrimaryCare && <span className="badge primary">Primary Care</span>}
                                    {doctor.specialty && <p><strong>Specialty:</strong> {doctor.specialty}</p>}
                                    {doctor.practice?.name && <p><strong>Practice:</strong> {doctor.practice.name}</p>}
                                    {doctor.practice?.address && (
                                        <p><strong>Address:</strong> {[
                                            doctor.practice.address.street,
                                            doctor.practice.address.city,
                                            doctor.practice.address.state,
                                            doctor.practice.address.zipCode
                                        ].filter(Boolean).join(', ')}</p>
                                    )}
                                    {doctor.phone && <p><strong>Phone:</strong> {doctor.phone}</p>}
                                    {doctor.fax && <p><strong>Fax:</strong> {doctor.fax}</p>}
                                    {doctor.email && <p><strong>Email:</strong> {doctor.email}</p>}
                                    {doctor.npiNumber && <p><strong>NPI:</strong> {doctor.npiNumber}</p>}
                                    {doctor.notes && <p><strong>Notes:</strong> {doctor.notes}</p>}
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
                                    <h3>{ins.provider?.name || 'Insurance'}</h3>
                                    {ins.isPrimary && <span className="badge primary">Primary Insurance</span>}
                                    {ins.plan?.type && <p><strong>Plan Type:</strong> {ins.plan.type}</p>}
                                    {ins.plan?.name && <p><strong>Plan Name:</strong> {ins.plan.name}</p>}
                                    {ins.memberId && <p><strong>Member ID:</strong> {ins.memberId}</p>}
                                    {ins.groupNumber && <p><strong>Group Number:</strong> {ins.groupNumber}</p>}
                                    {ins.subscriberName && <p><strong>Subscriber:</strong> {ins.subscriberName}</p>}
                                    {ins.relationship && <p><strong>Relationship:</strong> {ins.relationship}</p>}
                                    {ins.effectiveDate && <p><strong>Effective Date:</strong> {formatDate(ins.effectiveDate)}</p>}
                                    {ins.terminationDate && <p><strong>Expiration Date:</strong> {formatDate(ins.terminationDate)}</p>}
                                    {ins.provider?.phone && <p><strong>Insurance Phone:</strong> {ins.provider.phone}</p>}
                                    {ins.provider?.website && <p><strong>Website:</strong> {ins.provider.website}</p>}
                                    {ins.coverage && (
                                        <div className="insurance-coverage">
                                            {ins.coverage.copay?.primaryCare && (
                                                <p><strong>Primary Care Copay:</strong> ${ins.coverage.copay.primaryCare}</p>
                                            )}
                                            {ins.coverage.copay?.specialist && (
                                                <p><strong>Specialist Copay:</strong> ${ins.coverage.copay.specialist}</p>
                                            )}
                                            {ins.coverage.copay?.urgentCare && (
                                                <p><strong>Urgent Care Copay:</strong> ${ins.coverage.copay.urgentCare}</p>
                                            )}
                                            {ins.coverage.copay?.emergency && (
                                                <p><strong>Emergency Copay:</strong> ${ins.coverage.copay.emergency}</p>
                                            )}
                                            {ins.coverage.deductible?.individual && (
                                                <p><strong>Individual Deductible:</strong> ${ins.coverage.deductible.individual}</p>
                                            )}
                                            {ins.coverage.deductible?.family && (
                                                <p><strong>Family Deductible:</strong> ${ins.coverage.deductible.family}</p>
                                            )}
                                            {ins.coverage.outOfPocketMax?.individual && (
                                                <p><strong>Out of Pocket Max:</strong> ${ins.coverage.outOfPocketMax.individual}</p>
                                            )}
                                        </div>
                                    )}

                                    {ins.documents?.length > 0 && (
                                        <div className="insurance-documents">
                                            <p className="documents-label"><strong>Insurance Documents ({ins.documents.length}):</strong></p>
                                            <div className="insurance-documents-grid">
                                                {ins.documents.map((doc, docIndex) => {
                                                    const isImage = doc.mimeType?.startsWith('image/');
                                                    return (
                                                        <div key={docIndex} className="insurance-document-item">
                                                            {isImage ? (
                                                                <a
                                                                    href={doc.downloadUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="insurance-document-image-link"
                                                                >
                                                                    <img
                                                                        src={doc.downloadUrl}
                                                                        alt={doc.originalName || 'Insurance card'}
                                                                        className="insurance-document-image"
                                                                    />
                                                                    <span className="insurance-document-caption">
                                                                        {doc.originalName || 'Insurance Card'}
                                                                    </span>
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={doc.downloadUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="document-link"
                                                                >
                                                                    <span className="document-icon">
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                                            <polyline points="14 2 14 8 20 8"/>
                                                                            <path d="M9 15h6"/>
                                                                            <path d="M9 11h6"/>
                                                                        </svg>
                                                                    </span>
                                                                    <span className="document-name">{doc.originalName || doc.filename}</span>
                                                                    <span className="document-size">
                                                                        {doc.size ? `(${(doc.size / 1024 / 1024).toFixed(1)} MB)` : ''}
                                                                    </span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
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
                                    <h3>{apt.title || apt.doctorName}</h3>
                                    {apt.status && <span className={`badge ${apt.status}`}>{apt.status}</span>}
                                    {apt.doctorName && <p><strong>Doctor:</strong> {apt.doctorName}</p>}
                                    {apt.specialty && <p><strong>Specialty:</strong> {apt.specialty}</p>}
                                    {apt.dateTime && <p><strong>Date & Time:</strong> {new Date(apt.dateTime).toLocaleString()}</p>}
                                    {apt.duration && <p><strong>Duration:</strong> {apt.duration} minutes</p>}
                                    {apt.type && <p><strong>Type:</strong> {apt.type}</p>}
                                    {apt.reason && <p><strong>Reason:</strong> {apt.reason}</p>}
                                    {apt.location?.name && <p><strong>Location:</strong> {apt.location.name}</p>}
                                    {apt.location?.address && <p><strong>Address:</strong> {apt.location.address}</p>}
                                    {apt.location?.phone && <p><strong>Location Phone:</strong> {apt.location.phone}</p>}
                                    {apt.notes && <p><strong>Notes:</strong> {apt.notes}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {shareInfo?.permissions?.intakeForm && records.intakeForm && (
                    <section className="shared-records-section shared-records-intake">
                        <h2 className="shared-records-section-title">Patient Intake Form</h2>

                        {records.intakeForm.demographics && (
                            <div className="shared-records-card intake-demographics">
                                <h3>Demographics</h3>
                                {records.intakeForm.demographics.gender && (
                                    <p><strong>Gender:</strong> {records.intakeForm.demographics.gender}</p>
                                )}
                                {records.intakeForm.demographics.race && (
                                    <p><strong>Race:</strong> {records.intakeForm.demographics.race}</p>
                                )}
                                {records.intakeForm.demographics.ethnicity && (
                                    <p><strong>Ethnicity:</strong> {records.intakeForm.demographics.ethnicity}</p>
                                )}
                                {records.intakeForm.demographics.preferredLanguage && (
                                    <p><strong>Preferred Language:</strong> {records.intakeForm.demographics.preferredLanguage}</p>
                                )}
                                {records.intakeForm.demographics.maritalStatus && (
                                    <p><strong>Marital Status:</strong> {records.intakeForm.demographics.maritalStatus}</p>
                                )}
                                {records.intakeForm.demographics.occupation && (
                                    <p><strong>Occupation:</strong> {records.intakeForm.demographics.occupation}</p>
                                )}
                                {records.intakeForm.demographics.employer && (
                                    <p><strong>Employer:</strong> {records.intakeForm.demographics.employer}</p>
                                )}
                            </div>
                        )}

                        {records.intakeForm.socialHistory && Object.keys(records.intakeForm.socialHistory).length > 0 && (
                            <div className="shared-records-card intake-social">
                                <h3>Social History</h3>
                                {records.intakeForm.socialHistory.smokingStatus && (
                                    <p><strong>Smoking:</strong> {records.intakeForm.socialHistory.smokingStatus}
                                        {records.intakeForm.socialHistory.smokingDetail && ` - ${records.intakeForm.socialHistory.smokingDetail}`}
                                    </p>
                                )}
                                {records.intakeForm.socialHistory.alcoholUse && (
                                    <p><strong>Alcohol:</strong> {records.intakeForm.socialHistory.alcoholUse}
                                        {records.intakeForm.socialHistory.alcoholDetail && ` - ${records.intakeForm.socialHistory.alcoholDetail}`}
                                    </p>
                                )}
                                {records.intakeForm.socialHistory.drugUse && records.intakeForm.socialHistory.drugUse !== 'none' && (
                                    <p><strong>Drug Use:</strong> {records.intakeForm.socialHistory.drugUse}
                                        {records.intakeForm.socialHistory.drugDetail && ` - ${records.intakeForm.socialHistory.drugDetail}`}
                                    </p>
                                )}
                                {records.intakeForm.socialHistory.exerciseFrequency && (
                                    <p><strong>Exercise:</strong> {records.intakeForm.socialHistory.exerciseFrequency.replace(/-/g, ' ')}
                                        {records.intakeForm.socialHistory.exerciseDetail && ` - ${records.intakeForm.socialHistory.exerciseDetail}`}
                                    </p>
                                )}
                                {records.intakeForm.socialHistory.dietRestrictions && (
                                    <p><strong>Diet Restrictions:</strong> {records.intakeForm.socialHistory.dietRestrictions}</p>
                                )}
                            </div>
                        )}

                        {records.intakeForm.advanceDirectives && (
                            <div className="shared-records-card intake-directives">
                                <h3>Advance Directives</h3>
                                <p><strong>Living Will:</strong> {records.intakeForm.advanceDirectives.hasLivingWill ? 'Yes' : 'No'}</p>
                                <p><strong>DNR:</strong> {records.intakeForm.advanceDirectives.isDNR ? 'Yes' : 'No'}</p>
                                <p><strong>Organ Donor:</strong> {records.intakeForm.advanceDirectives.isOrganDonor ? 'Yes' : 'No'}</p>
                                {records.intakeForm.advanceDirectives.hasHealthcarePOA && (
                                    <>
                                        <p><strong>Healthcare POA:</strong> {records.intakeForm.advanceDirectives.healthcarePOAName || 'Yes'}</p>
                                        {records.intakeForm.advanceDirectives.healthcarePOAPhone && (
                                            <p><strong>POA Phone:</strong> {records.intakeForm.advanceDirectives.healthcarePOAPhone}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {records.intakeForm.pharmacies?.length > 0 && (
                            <div className="shared-records-card intake-pharmacy">
                                <h3>Pharmacy</h3>
                                {records.intakeForm.pharmacies.map((pharmacy, idx) => (
                                    <div key={idx} style={{ marginBottom: idx < records.intakeForm.pharmacies.length - 1 ? '12px' : 0 }}>
                                        <p><strong>{pharmacy.name}</strong>{pharmacy.isPreferred ? ' (Preferred)' : ''}</p>
                                        {pharmacy.phone && <p>Phone: {pharmacy.phone}</p>}
                                        {pharmacy.address && (pharmacy.address.street || pharmacy.address.city) && (
                                            <p>{[pharmacy.address.street, pharmacy.address.city, pharmacy.address.state, pharmacy.address.zipCode].filter(Boolean).join(', ')}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
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
