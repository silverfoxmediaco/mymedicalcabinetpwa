import React, { useState } from 'react';
import './ConsentModal.css';

const ConsentModal = ({ isOpen, onAccept, onDecline }) => {
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);
    const [acceptHipaa, setAcceptHipaa] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');

    const canSubmit = acceptTerms && acceptPrivacy && acceptHipaa && !isSubmitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        try {
            await onAccept(acceptTerms, acceptPrivacy, acceptHipaa);
        } catch (error) {
            console.error('Error accepting consent:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="consent-modal-overlay">
            <div className="consent-modal">
                <div className="consent-modal-header">
                    <div className="consent-modal-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                            <path d="M9 12L11 14L15 10" />
                        </svg>
                    </div>
                    <h2 className="consent-modal-title">Before You Continue</h2>
                    <p className="consent-modal-subtitle">
                        Please review and accept our policies to use MyMedicalCabinet
                    </p>
                </div>

                <div className="consent-modal-tabs">
                    <button
                        type="button"
                        className={`consent-tab ${activeTab === 'summary' ? 'active' : ''}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        Summary
                    </button>
                    <button
                        type="button"
                        className={`consent-tab ${activeTab === 'terms' ? 'active' : ''}`}
                        onClick={() => setActiveTab('terms')}
                    >
                        Terms
                    </button>
                    <button
                        type="button"
                        className={`consent-tab ${activeTab === 'privacy' ? 'active' : ''}`}
                        onClick={() => setActiveTab('privacy')}
                    >
                        Privacy
                    </button>
                    <button
                        type="button"
                        className={`consent-tab ${activeTab === 'hipaa' ? 'active' : ''}`}
                        onClick={() => setActiveTab('hipaa')}
                    >
                        HIPAA
                    </button>
                </div>

                <div className="consent-modal-content">
                    {activeTab === 'summary' && (
                        <div className="consent-summary">
                            <div className="consent-summary-item">
                                <div className="consent-summary-icon terms">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
                                        <path d="M14 2V8H20" />
                                    </svg>
                                </div>
                                <div className="consent-summary-text">
                                    <h4>Terms of Service</h4>
                                    <p>Rules for using our platform, your responsibilities, and our liability limitations.</p>
                                </div>
                            </div>

                            <div className="consent-summary-item">
                                <div className="consent-summary-icon privacy">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" />
                                    </svg>
                                </div>
                                <div className="consent-summary-text">
                                    <h4>Privacy Policy</h4>
                                    <p>How we collect, use, store, and protect your personal information.</p>
                                </div>
                            </div>

                            <div className="consent-summary-item">
                                <div className="consent-summary-icon hipaa">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                                        <path d="M12 8V12" />
                                        <path d="M12 16H12.01" />
                                    </svg>
                                </div>
                                <div className="consent-summary-text">
                                    <h4>HIPAA Notice</h4>
                                    <p>How we handle your protected health information in compliance with federal law.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'terms' && (
                        <div className="consent-document">
                            <h3>Terms of Service</h3>
                            <p className="consent-version">Version 1.0 - Effective January 2026</p>

                            <h4>1. Acceptance of Terms</h4>
                            <p>By accessing or using MyMedicalCabinet ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>

                            <h4>2. Description of Service</h4>
                            <p>MyMedicalCabinet provides a personal health information management platform that allows you to store, organize, and share your medical records, medications, and healthcare provider information.</p>

                            <h4>3. User Responsibilities</h4>
                            <p>You are responsible for:</p>
                            <ul>
                                <li>Maintaining the confidentiality of your account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Ensuring the accuracy of information you provide</li>
                                <li>Complying with all applicable laws and regulations</li>
                            </ul>

                            <h4>4. Medical Disclaimer</h4>
                            <p>MyMedicalCabinet is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>

                            <h4>5. Limitation of Liability</h4>
                            <p>To the maximum extent permitted by law, MyMedicalCabinet shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>

                            <h4>6. Modifications</h4>
                            <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the modified terms.</p>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="consent-document">
                            <h3>Privacy Policy</h3>
                            <p className="consent-version">Version 1.0 - Effective January 2026</p>

                            <h4>1. Information We Collect</h4>
                            <p>We collect information you provide directly, including:</p>
                            <ul>
                                <li>Account information (name, email, password)</li>
                                <li>Health information (medications, conditions, allergies)</li>
                                <li>Healthcare provider information</li>
                                <li>Usage data and device information</li>
                            </ul>

                            <h4>2. How We Use Your Information</h4>
                            <p>We use your information to:</p>
                            <ul>
                                <li>Provide and improve our services</li>
                                <li>Send important notifications about your account</li>
                                <li>Respond to your requests and support needs</li>
                                <li>Ensure the security of our platform</li>
                            </ul>

                            <h4>3. Information Sharing</h4>
                            <p>We do not sell your personal information. We may share information:</p>
                            <ul>
                                <li>With healthcare providers you authorize</li>
                                <li>With service providers who assist our operations</li>
                                <li>When required by law or legal process</li>
                            </ul>

                            <h4>4. Data Security</h4>
                            <p>We implement industry-standard security measures including encryption, secure servers, and access controls to protect your information.</p>

                            <h4>5. Your Rights</h4>
                            <p>You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.</p>
                        </div>
                    )}

                    {activeTab === 'hipaa' && (
                        <div className="consent-document">
                            <h3>HIPAA Notice of Privacy Practices</h3>
                            <p className="consent-version">Version 1.0 - Effective January 2026</p>

                            <h4>Your Information. Your Rights. Our Responsibilities.</h4>
                            <p>This notice describes how medical information about you may be used and disclosed and how you can get access to this information.</p>

                            <h4>Your Rights</h4>
                            <p>When it comes to your health information, you have certain rights:</p>
                            <ul>
                                <li><strong>Access:</strong> You can ask to see or get a copy of your health records</li>
                                <li><strong>Correction:</strong> You can ask us to correct your health records if you believe they are incorrect</li>
                                <li><strong>Confidential Communication:</strong> You can ask us to contact you in a specific way</li>
                                <li><strong>Limit Sharing:</strong> You can ask us to limit the information we share</li>
                                <li><strong>Accounting:</strong> You can ask for a list of those with whom we've shared your information</li>
                                <li><strong>Copy of Notice:</strong> You can ask for a paper copy of this notice at any time</li>
                            </ul>

                            <h4>Our Responsibilities</h4>
                            <p>We are required by law to:</p>
                            <ul>
                                <li>Maintain the privacy and security of your protected health information</li>
                                <li>Notify you promptly if a breach occurs that may have compromised your information</li>
                                <li>Follow the duties and privacy practices described in this notice</li>
                            </ul>

                            <h4>Uses and Disclosures</h4>
                            <p>We will not use or share your information other than as described here unless you give us written permission. You may revoke permission at any time by contacting us in writing.</p>

                            <h4>Contact Information</h4>
                            <p>For questions about this notice or to exercise your rights, contact our Privacy Officer at privacy@mymedicalcabinet.com</p>
                        </div>
                    )}
                </div>

                <div className="consent-modal-checkboxes">
                    <label className="consent-checkbox-label">
                        <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                        />
                        <span className="consent-checkbox-custom"></span>
                        <span className="consent-checkbox-text">
                            I have read and agree to the <button type="button" onClick={() => setActiveTab('terms')}>Terms of Service</button>
                        </span>
                    </label>

                    <label className="consent-checkbox-label">
                        <input
                            type="checkbox"
                            checked={acceptPrivacy}
                            onChange={(e) => setAcceptPrivacy(e.target.checked)}
                        />
                        <span className="consent-checkbox-custom"></span>
                        <span className="consent-checkbox-text">
                            I have read and agree to the <button type="button" onClick={() => setActiveTab('privacy')}>Privacy Policy</button>
                        </span>
                    </label>

                    <label className="consent-checkbox-label">
                        <input
                            type="checkbox"
                            checked={acceptHipaa}
                            onChange={(e) => setAcceptHipaa(e.target.checked)}
                        />
                        <span className="consent-checkbox-custom"></span>
                        <span className="consent-checkbox-text">
                            I acknowledge receipt of the <button type="button" onClick={() => setActiveTab('hipaa')}>HIPAA Notice of Privacy Practices</button>
                        </span>
                    </label>
                </div>

                <div className="consent-modal-footer">
                    <button
                        type="button"
                        className="consent-decline-btn"
                        onClick={onDecline}
                    >
                        Decline & Logout
                    </button>
                    <button
                        type="button"
                        className={`consent-accept-btn ${canSubmit ? '' : 'disabled'}`}
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {isSubmitting ? 'Processing...' : 'I Agree & Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConsentModal;
