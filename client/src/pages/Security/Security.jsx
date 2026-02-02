import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './Security.css';

const Security = ({ onSignupClick }) => {
    return (
        <>
            <Header onSignupClick={onSignupClick} solid />
            <main className="security-page">
                <section className="security-hero">
                    <div className="security-hero-container">
                        <div className="security-tagline">
                            <span className="security-tagline-line"></span>
                            <span className="security-tagline-text">Security</span>
                        </div>
                        <h1 className="security-hero-title">
                            Your Data Security Is<br />
                            <span className="security-hero-accent">Our Top Priority</span>
                        </h1>
                        <p className="security-hero-subtitle">
                            We use industry-leading security practices to protect your
                            sensitive health information at every step.
                        </p>
                    </div>
                </section>

                <section className="security-overview">
                    <div className="security-container">
                        <div className="security-overview-content">
                            <h2 className="security-section-title">How We Protect Your Data</h2>
                            <p className="security-text">
                                At MyMedicalCabinet, we understand that your health information is deeply personal.
                                That's why we've built our platform with security at its core, using the same
                                technologies trusted by banks and healthcare organizations worldwide.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="security-features">
                    <div className="security-container">
                        <div className="security-features-grid">
                            <div className="security-feature-card">
                                <div className="security-feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                </div>
                                <h3 className="security-feature-title">Encryption at Rest</h3>
                                <p className="security-feature-text">
                                    All data stored in our database is encrypted using AES-256 encryption,
                                    the same standard used by government agencies. Your information is
                                    unreadable without proper authentication.
                                </p>
                                <div className="security-feature-tech">
                                    <span>MongoDB Atlas</span>
                                    <span>AES-256</span>
                                </div>
                            </div>

                            <div className="security-feature-card">
                                <div className="security-feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                        <path d="M9 12l2 2 4-4"/>
                                    </svg>
                                </div>
                                <h3 className="security-feature-title">Encryption in Transit</h3>
                                <p className="security-feature-text">
                                    All data transmitted between your device and our servers is protected
                                    with TLS 1.3 encryption. This prevents anyone from intercepting your
                                    information while it's being sent.
                                </p>
                                <div className="security-feature-tech">
                                    <span>HTTPS</span>
                                    <span>TLS 1.3</span>
                                </div>
                            </div>

                            <div className="security-feature-card">
                                <div className="security-feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                                    </svg>
                                </div>
                                <h3 className="security-feature-title">Secure Authentication</h3>
                                <p className="security-feature-text">
                                    Your password is never stored in plain text. We use bcrypt hashing
                                    with salt to ensure that even if our database were compromised,
                                    your password would remain protected.
                                </p>
                                <div className="security-feature-tech">
                                    <span>JWT Tokens</span>
                                    <span>bcrypt</span>
                                </div>
                            </div>

                            <div className="security-feature-card">
                                <div className="security-feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                </div>
                                <h3 className="security-feature-title">Rate Limiting</h3>
                                <p className="security-feature-text">
                                    We protect against brute-force attacks and abuse by limiting the
                                    number of requests that can be made to our servers. This keeps
                                    your account safe from automated attacks.
                                </p>
                                <div className="security-feature-tech">
                                    <span>API Protection</span>
                                    <span>DDoS Prevention</span>
                                </div>
                            </div>

                            <div className="security-feature-card">
                                <div className="security-feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                        <line x1="8" y1="21" x2="16" y2="21"/>
                                        <line x1="12" y1="17" x2="12" y2="21"/>
                                    </svg>
                                </div>
                                <h3 className="security-feature-title">Client-Side Processing</h3>
                                <p className="security-feature-text">
                                    When you scan your insurance card, the image processing happens
                                    entirely on your device. The actual image never leaves your phone—only
                                    the extracted text is sent to our servers.
                                </p>
                                <div className="security-feature-tech">
                                    <span>Local OCR</span>
                                    <span>Privacy by Design</span>
                                </div>
                            </div>

                            <div className="security-feature-card">
                                <div className="security-feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                        <line x1="16" y1="13" x2="8" y2="13"/>
                                        <line x1="16" y1="17" x2="8" y2="17"/>
                                        <polyline points="10 9 9 9 8 9"/>
                                    </svg>
                                </div>
                                <h3 className="security-feature-title">Secure Document Storage</h3>
                                <p className="security-feature-text">
                                    Medical documents you upload are stored in AWS S3 with server-side
                                    encryption. Access is controlled through secure, time-limited URLs
                                    that only you can generate.
                                </p>
                                <div className="security-feature-tech">
                                    <span>AWS S3</span>
                                    <span>Presigned URLs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="security-practices">
                    <div className="security-container">
                        <h2 className="security-section-title security-section-title-center">
                            Our Security Practices
                        </h2>
                        <div className="security-practices-list">
                            <div className="security-practice-item">
                                <div className="security-practice-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <div className="security-practice-content">
                                    <h4>Regular Security Updates</h4>
                                    <p>We keep all our systems and dependencies updated to protect against known vulnerabilities.</p>
                                </div>
                            </div>
                            <div className="security-practice-item">
                                <div className="security-practice-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <div className="security-practice-content">
                                    <h4>Input Validation</h4>
                                    <p>All user inputs are validated and sanitized to prevent injection attacks and data corruption.</p>
                                </div>
                            </div>
                            <div className="security-practice-item">
                                <div className="security-practice-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <div className="security-practice-content">
                                    <h4>Secure Environment Variables</h4>
                                    <p>All sensitive credentials and API keys are stored as encrypted environment variables, never in code.</p>
                                </div>
                            </div>
                            <div className="security-practice-item">
                                <div className="security-practice-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <div className="security-practice-content">
                                    <h4>Access Control</h4>
                                    <p>Each user can only access their own data. All API requests are authenticated and authorized.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="security-questions">
                    <div className="security-container">
                        <h2 className="security-section-title security-section-title-center">
                            Have Security Questions?
                        </h2>
                        <p className="security-questions-text">
                            We take security seriously and are happy to answer any questions you may have
                            about how we protect your data.
                        </p>
                        <a href="/contact" className="security-contact-btn">
                            Contact Us
                        </a>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default Security;
