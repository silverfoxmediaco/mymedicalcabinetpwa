import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './PrivacyPolicy.css';

const PrivacyPolicy = ({ onSignupClick }) => {
    const lastUpdated = 'February 2, 2026';

    return (
        <>
            <Header onSignupClick={onSignupClick} solid />
            <main className="privacy-page">
                <section className="privacy-hero">
                    <div className="privacy-hero-container">
                        <div className="privacy-tagline">
                            <span className="privacy-tagline-line"></span>
                            <span className="privacy-tagline-text">Legal</span>
                        </div>
                        <h1 className="privacy-hero-title">Privacy Policy</h1>
                        <p className="privacy-hero-subtitle">
                            Last updated: {lastUpdated}
                        </p>
                    </div>
                </section>

                <section className="privacy-content">
                    <div className="privacy-container">
                        <div className="privacy-section">
                            <h2>Introduction</h2>
                            <p>
                                MyMedicalCabinet ("we," "our," or "us") is committed to protecting your privacy.
                                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                                information when you use our web application and services.
                            </p>
                            <p>
                                By using MyMedicalCabinet, you agree to the collection and use of information
                                in accordance with this policy. If you do not agree with our policies, please
                                do not use our services.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>Information We Collect</h2>
                            <h3>Information You Provide</h3>
                            <p>When you use MyMedicalCabinet, you may voluntarily provide:</p>
                            <ul>
                                <li><strong>Account Information:</strong> Email address, name, password, phone number</li>
                                <li><strong>Medical Information:</strong> Medications, medical conditions, allergies, surgeries, family health history</li>
                                <li><strong>Healthcare Provider Information:</strong> Doctor names, contact information, appointment details</li>
                                <li><strong>Insurance Information:</strong> Insurance provider, plan details, member ID, group number</li>
                                <li><strong>Documents:</strong> Medical records, test results, or other documents you choose to upload</li>
                            </ul>

                            <h3>Information Collected Automatically</h3>
                            <p>We may automatically collect certain information when you use our service:</p>
                            <ul>
                                <li>Device type and browser information</li>
                                <li>IP address (for security and rate limiting purposes)</li>
                                <li>Usage data (pages visited, features used)</li>
                            </ul>
                        </div>

                        <div className="privacy-section">
                            <h2>How We Use Your Information</h2>
                            <p>We use the information we collect to:</p>
                            <ul>
                                <li>Provide, maintain, and improve our services</li>
                                <li>Send you medication reminders and appointment notifications (when enabled)</li>
                                <li>Check for potential drug interactions</li>
                                <li>Enable you to share your information with healthcare providers</li>
                                <li>Respond to your requests and provide customer support</li>
                                <li>Protect against fraud and unauthorized access</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </div>

                        <div className="privacy-section">
                            <h2>How We Protect Your Information</h2>
                            <p>
                                We implement robust security measures to protect your personal information:
                            </p>
                            <ul>
                                <li><strong>Encryption at Rest:</strong> All data stored in our database is encrypted using AES-256 encryption via MongoDB Atlas</li>
                                <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers uses HTTPS with TLS 1.3</li>
                                <li><strong>Password Security:</strong> Passwords are hashed using bcrypt and are never stored in plain text</li>
                                <li><strong>Access Control:</strong> Your data is accessible only to you unless you explicitly share it</li>
                                <li><strong>Rate Limiting:</strong> We protect against brute-force attacks with API rate limiting</li>
                                <li><strong>Client-Side Processing:</strong> Insurance card scanning uses on-device OCR—images never leave your device</li>
                            </ul>
                        </div>

                        <div className="privacy-section">
                            <h2>Data Sharing and Disclosure</h2>
                            <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
                            <ul>
                                <li><strong>With Your Consent:</strong> When you use our sharing features to grant access to healthcare providers or caregivers</li>
                                <li><strong>Service Providers:</strong> With third-party services that help us operate (e.g., email delivery via SendGrid, file storage via AWS S3)</li>
                                <li><strong>Legal Requirements:</strong> If required by law, court order, or government request</li>
                                <li><strong>Safety:</strong> To protect the rights, property, or safety of our users or the public</li>
                            </ul>
                        </div>

                        <div className="privacy-section">
                            <h2>Third-Party Services</h2>
                            <p>We integrate with the following third-party services to provide our features:</p>
                            <ul>
                                <li><strong>MongoDB Atlas:</strong> Database hosting with encryption at rest</li>
                                <li><strong>AWS S3:</strong> Secure document storage</li>
                                <li><strong>SendGrid:</strong> Email delivery for reminders and notifications</li>
                                <li><strong>Google Calendar API:</strong> Calendar integration (when you connect your calendar)</li>
                                <li><strong>RxNav (NIH):</strong> Drug information and interaction checking</li>
                                <li><strong>NPI Registry (CMS):</strong> Healthcare provider verification</li>
                            </ul>
                            <p>
                                Each of these services has their own privacy policies. We only share the minimum
                                information necessary to provide the requested functionality.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>Your Rights and Choices</h2>
                            <p>You have the following rights regarding your data:</p>
                            <ul>
                                <li><strong>Access:</strong> You can view all your stored information through your account</li>
                                <li><strong>Correction:</strong> You can update or correct your information at any time</li>
                                <li><strong>Deletion:</strong> You can delete individual records or request complete account deletion</li>
                                <li><strong>Export:</strong> You can request a copy of your data</li>
                                <li><strong>Notifications:</strong> You can enable or disable email reminders in your settings</li>
                            </ul>
                            <p>
                                To exercise any of these rights, please contact us at privacy@mymedicalcabinet.com
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>Data Retention</h2>
                            <p>
                                We retain your information for as long as your account is active or as needed to
                                provide you services. If you delete your account, we will delete your personal
                                information within 30 days, except where we are required to retain it for legal
                                or regulatory purposes.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>HIPAA Notice</h2>
                            <p>
                                MyMedicalCabinet is a personal health record (PHR) tool where you voluntarily
                                enter your own health information. As such, we are not a "covered entity" under
                                the Health Insurance Portability and Accountability Act (HIPAA).
                            </p>
                            <p>
                                However, we are committed to protecting your health information with the same
                                rigor expected of HIPAA-covered entities. We use industry-standard encryption,
                                access controls, and security practices to keep your data safe.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>Children's Privacy</h2>
                            <p>
                                MyMedicalCabinet is not intended for use by children under 13 years of age.
                                We do not knowingly collect personal information from children under 13. If you
                                are a parent or guardian and believe your child has provided us with personal
                                information, please contact us.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any
                                changes by posting the new Privacy Policy on this page and updating the "Last
                                Updated" date. We encourage you to review this Privacy Policy periodically.
                            </p>
                        </div>

                        <div className="privacy-section">
                            <h2>Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy or our data practices,
                                please contact us at:
                            </p>
                            <div className="privacy-contact-info">
                                <p><strong>Email:</strong> privacy@mymedicalcabinet.com</p>
                                <p><strong>Website:</strong> <a href="/contact">Contact Form</a></p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default PrivacyPolicy;
