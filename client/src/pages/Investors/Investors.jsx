import React, { useState, useEffect } from 'react';
import './Investors.css';

// Product screenshots from S3
const SCREENSHOTS = {
    dashboard: 'https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/screenshots/dashboard.png',
    medications: 'https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/screenshots/medications.png',
    doctors: 'https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/screenshots/doctors.png',
    records: 'https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/screenshots/records.png',
    insurance: 'https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/screenshots/insurance.png',
    appointments: 'https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/screenshots/appointments.png',
};

const Investors = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const CORRECT_PASSCODE = 'MLM100381';

    useEffect(() => {
        const authenticated = sessionStorage.getItem('investor_authenticated');
        if (authenticated === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            if (passcode === CORRECT_PASSCODE) {
                sessionStorage.setItem('investor_authenticated', 'true');
                setIsAuthenticated(true);
            } else {
                setError('Invalid passcode. Please try again.');
                setPasscode('');
            }
            setIsLoading(false);
        }, 500);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('investor_authenticated');
        setIsAuthenticated(false);
        setPasscode('');
    };

    // Passcode Entry Screen
    if (!isAuthenticated) {
        return (
            <div className="investor-gate">
                <div className="investor-gate-container">
                    <div className="investor-gate-logo">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C10.8954 2 10 2.89543 10 4V10H4C2.89543 10 2 10.8954 2 12C2 13.1046 2.89543 14 4 14H10V20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20V14H20C21.1046 14 22 13.1046 22 12C22 10.8954 21.1046 10 20 10H14V4C14 2.89543 13.1046 2 12 2Z" fill="#00D26A"/>
                        </svg>
                        <span className="investor-gate-brand">
                            <span className="brand-my">My</span>
                            <span className="brand-medical">Medical</span>
                            <span className="brand-cabinet">Cabinet</span>
                        </span>
                    </div>

                    <div className="investor-gate-card">
                        <div className="investor-gate-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>

                        <h1 className="investor-gate-title">Investor Portal</h1>
                        <p className="investor-gate-subtitle">Enter your passcode to access confidential materials</p>

                        <form onSubmit={handleSubmit} className="investor-gate-form">
                            <div className="investor-gate-input-group">
                                <input
                                    type="password"
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="Enter passcode"
                                    className={`investor-gate-input ${error ? 'error' : ''}`}
                                    autoFocus
                                    disabled={isLoading}
                                />
                                {error && <p className="investor-gate-error">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                className="investor-gate-btn"
                                disabled={isLoading || !passcode}
                            >
                                {isLoading ? (
                                    <span className="investor-gate-spinner"></span>
                                ) : (
                                    'Access Portal'
                                )}
                            </button>
                        </form>

                        <p className="investor-gate-note">
                            This portal contains confidential information intended only for authorized investors.
                        </p>
                    </div>

                    <p className="investor-gate-contact">
                        Need access? Contact <a href="mailto:investors@mymedicalcabinet.com">investors@mymedicalcabinet.com</a>
                    </p>
                </div>
            </div>
        );
    }

    // Authenticated - Full Pitch Deck as HTML
    return (
        <div className="investor-deck">
            {/* Navigation */}
            <nav className="investor-nav">
                <div className="investor-nav-content">
                    <div className="investor-nav-logo">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C10.8954 2 10 2.89543 10 4V10H4C2.89543 10 2 10.8954 2 12C2 13.1046 2.89543 14 4 14H10V20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20V14H20C21.1046 14 22 13.1046 22 12C22 10.8954 21.1046 10 20 10H14V4C14 2.89543 13.1046 2 12 2Z" fill="#00D26A"/>
                        </svg>
                        <span><span className="brand-my">My</span><span className="brand-medical">Medical</span><span className="brand-cabinet">Cabinet</span></span>
                    </div>
                    <button onClick={handleLogout} className="investor-nav-exit">Exit Portal</button>
                </div>
            </nav>

            {/* Slide 1: Title */}
            <section className="slide slide-title">
                <div className="slide-content">
                    <div className="title-logo">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C10.8954 2 10 2.89543 10 4V10H4C2.89543 10 2 10.8954 2 12C2 13.1046 2.89543 14 4 14H10V20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20V14H20C21.1046 14 22 13.1046 22 12C22 10.8954 21.1046 10 20 10H14V4C14 2.89543 13.1046 2 12 2Z" fill="#00D26A"/>
                        </svg>
                        <span><span className="brand-my">My</span><span className="brand-medical">Medical</span><span className="brand-cabinet">Cabinet</span></span>
                    </div>
                    <h1>MMC L.L.C. &<br/>MyMedicalCabinet.com</h1>
                    <p className="title-tagline">Seed Round Strategy: Professionalizing the Clinical Data Bridge</p>
                    <div className="title-meta">
                        <span className="confidential-badge">Confidential</span>
                        <p className="title-team">David Disbrow (CEO) | Patrick Morocco (CFO) | James McEwen Founder & (CTO)</p>
                    </div>
                </div>
            </section>

            {/* Slide 2: Leadership */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">The Leadership "Power Triangle"</h2>
                    <div className="leadership-grid">
                        <div className="leader-card">
                            <div className="leader-icon leader-icon-blue">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <h3>David Disbrow</h3>
                            <span className="leader-role">CEO</span>
                            <p>30+ years in medical administration<br/>Former AVP at Mednax<br/>Clinical strategy & hospital-system distribution</p>
                        </div>
                        <div className="leader-card">
                            <div className="leader-icon leader-icon-blue">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                </svg>
                            </div>
                            <h3>Patrick Morocco</h3>
                            <span className="leader-role">CFO</span>
                            <p>Business Solutions Architect at DXC Technology<br/>Former Dell/HPE<br/>Enterprise SaaS pricing & financial scaling</p>
                        </div>
                        <div className="leader-card">
                            <div className="leader-icon leader-icon-blue">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <h3>James McEwen</h3>
                            <span className="leader-role">CTO</span>
                            <p>Technical Founder<br/>Full-Stack MERN Architect<br/>Built the 100% functional MVP</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 3: Problem & Solution */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">The Problem & Solution</h2>
                    <div className="problem-solution-grid">
                        <div className="problem-card">
                            <h3 className="problem-label">THE PROBLEM</h3>
                            <div className="problem-item">
                                <h4>Fragmented Records</h4>
                                <p>Patient data scattered across multiple portals with no unified view</p>
                            </div>
                            <div className="problem-item">
                                <h4>Caregiver Data Fatigue</h4>
                                <p>Parents and caregivers overwhelmed managing family health info</p>
                            </div>
                            <div className="problem-item">
                                <h4>2026 Regulatory Pressure</h4>
                                <p>FTC Health Breach Rule creates new compliance mandates</p>
                            </div>
                        </div>
                        <div className="solution-card">
                            <h3 className="solution-label">THE SOLUTION</h3>
                            <h4>MyMedicalCabinet</h4>
                            <p>A mobile-first PWA that centralizes:</p>
                            <ul>
                                <li>Medications</li>
                                <li>Doctors & Providers</li>
                                <li>Insurance Information</li>
                                <li>Medical Records</li>
                            </ul>
                            <p className="solution-tagline"><em>One secure, patient-owned hub.</em></p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 4: Technical MVP Status */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <div className="mvp-header">
                        <h2 className="slide-heading">Technical MVP Status</h2>
                        <span className="ready-badge">IT'S READY</span>
                    </div>
                    <div className="mvp-features">
                        <div className="mvp-feature">
                            <div className="mvp-icon mvp-icon-green">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                </svg>
                            </div>
                            <div>
                                <h4>Platform</h4>
                                <p>Fully functional MERN stack deployed at mymedicalcabinet.com</p>
                            </div>
                        </div>
                        <div className="mvp-feature">
                            <div className="mvp-icon mvp-icon-green">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                                </svg>
                            </div>
                            <div>
                                <h4>Smart Entry</h4>
                                <p>NDC barcode scanning for medications and client-side OCR for insurance cards</p>
                            </div>
                        </div>
                        <div className="mvp-feature">
                            <div className="mvp-icon mvp-icon-green">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h4>Clinical Integrity</h4>
                                <p>Real-time drug interaction alerts (RxNav) and NPI doctor verification</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 5: Product Experience */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">The Product Experience</h2>
                    <div className="product-showcase">
                        <div className="product-screens">
                            <div className="phone-mockup">
                                <div className="phone-screen">
                                    <img src={SCREENSHOTS.dashboard} alt="Dashboard" onError={(e) => e.target.style.display='none'} />
                                </div>
                                <span>Dashboard</span>
                            </div>
                            <div className="phone-mockup">
                                <div className="phone-screen">
                                    <img src={SCREENSHOTS.medications} alt="Medications" onError={(e) => e.target.style.display='none'} />
                                </div>
                                <span>Medications</span>
                            </div>
                            <div className="phone-mockup">
                                <div className="phone-screen">
                                    <img src={SCREENSHOTS.doctors} alt="Doctors" onError={(e) => e.target.style.display='none'} />
                                </div>
                                <span>Doctors</span>
                            </div>
                            <div className="phone-mockup">
                                <div className="phone-screen">
                                    <img src={SCREENSHOTS.records} alt="Records" onError={(e) => e.target.style.display='none'} />
                                </div>
                                <span>Records</span>
                            </div>
                        </div>
                        <p className="product-tagline">Mobile-first PWA | Works offline | No app store required</p>
                    </div>
                </div>
            </section>

            {/* Slide 6: Technical Moat & Security */}
            <section className="slide slide-dark">
                <div className="slide-content">
                    <h2 className="slide-heading-light">Technical Moat & Security</h2>
                    <div className="security-grid">
                        <div className="security-card">
                            <div className="security-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <h4>Privacy-by-Design</h4>
                            <p>Client-side OCR (Tesseract.js) means we never store raw ePHI images</p>
                        </div>
                        <div className="security-card">
                            <div className="security-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <h4>Zero-Trust Architecture</h4>
                            <p>AES-256 encryption at rest, JWT authentication, and rate-limiting</p>
                        </div>
                        <div className="security-card">
                            <div className="security-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <h4>GDPR Ready</h4>
                            <p>Full account deletion with complete data purge already implemented</p>
                        </div>
                        <div className="security-card">
                            <div className="security-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                                </svg>
                            </div>
                            <h4>Audit-Ready</h4>
                            <p>Built for compliance from day one, not retrofitted</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 7: Target Market */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">Target Market: The Pediatric Niche</h2>
                    <div className="market-layout">
                        <div className="market-stat-big">
                            <span className="big-number">53M+</span>
                            <span className="big-label">US Caregivers</span>
                            <span className="big-sublabel">Primary ICP</span>
                        </div>
                        <div className="market-details">
                            <div className="market-card">
                                <h4>Entry Strategy</h4>
                                <p>Pediatric centers (utilizing David's Mednax background)</p>
                            </div>
                            <div className="market-card">
                                <h4>Why Pediatrics?</h4>
                                <ul>
                                    <li>Fragmented records across multiple providers</li>
                                    <li>High parent engagement</li>
                                    <li>Viral "Share Access" potential</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="market-insight">
                        <h4>Market Insight</h4>
                        <p>Parents managing children's health across pediatricians, specialists, and urgent care are underserved by enterprise-focused platforms like HealthMark Group.</p>
                    </div>
                </div>
            </section>

            {/* Slide 8: Competitive Landscape */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">Competitive Landscape</h2>
                    <div className="competitive-table">
                        <div className="table-header">
                            <span>Company</span>
                            <span>Model</span>
                            <span>Weakness</span>
                            <span>Ownership</span>
                        </div>
                        <div className="table-row">
                            <span>HealthMark Group</span>
                            <span>B2B Enterprise</span>
                            <span className="weakness">Poor UX, hospital-focused</span>
                            <span>TA Associates</span>
                        </div>
                        <div className="table-row">
                            <span>Verisma / Ciox</span>
                            <span>B2B Enterprise</span>
                            <span className="weakness">Legacy systems, slow</span>
                            <span>Private Equity</span>
                        </div>
                        <div className="table-row">
                            <span>MyChart (Epic)</span>
                            <span>Portal (Siloed)</span>
                            <span className="weakness">Single health system only</span>
                            <span>Epic Systems</span>
                        </div>
                        <div className="table-row highlight">
                            <span className="our-company">My Medical Cabinet</span>
                            <span>B2C Consumer</span>
                            <span>—</span>
                            <span>Founder-led</span>
                        </div>
                    </div>
                    <div className="why-we-win">
                        <h4>Why We Win</h4>
                        <p>Consumer-first UX | Cross-provider data ownership | Privacy-by-design architecture | No enterprise sales cycle</p>
                    </div>
                </div>
            </section>

            {/* Slide 9: Business Model */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">Business & Monetization Model</h2>
                    <div className="business-model-grid">
                        <div className="model-card model-b2c">
                            <h3>B2C</h3>
                            <span className="model-subtitle">Consumer Direct</span>
                            <p>Freemium model with premium tiers for unlimited S3 storage and family accounts</p>
                        </div>
                        <div className="model-card model-b2b2c">
                            <h3>B2B2C</h3>
                            <span className="model-subtitle">Healthcare Partners</span>
                            <p>Licensing to pediatric groups (PMPM model) to reduce their admin burden</p>
                        </div>
                        <div className="model-card model-data">
                            <h3>Data Insights</h3>
                            <span className="model-subtitle">Research Revenue</span>
                            <p>Anonymized real-world evidence for pharma/researchers (Opt-in only)</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 10: Regulatory Landscape */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">2026 Regulatory Landscape</h2>
                    <div className="regulatory-content">
                        <div className="regulatory-alert">
                            <h4>FTC Health Breach Notification Rule</h4>
                            <p>Effective 2026 — New mandates for personal health record vendors and apps handling consumer health data. Non-compliance carries significant penalties.</p>
                        </div>
                        <div className="regulatory-edge">
                            <h4>Our Competitive Edge</h4>
                            <p>While others scramble to audit and retrofit their systems, My Medical Cabinet's architecture is already privacy-first and audit-ready.</p>
                            <div className="edge-tags">
                                <span>Client-side processing</span>
                                <span>No raw ePHI storage</span>
                                <span>Full data purge capability</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 11: Timeline */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">Timeline & Milestones</h2>
                    <div className="timeline">
                        <div className="timeline-item">
                            <span className="timeline-date">Q1 2026</span>
                            <div className="timeline-dot active"></div>
                            <h4>Seed Close</h4>
                            <p>$2.5M secured</p>
                        </div>
                        <div className="timeline-item">
                            <span className="timeline-date">Q2 2026</span>
                            <div className="timeline-dot"></div>
                            <h4>Pilot Launch</h4>
                            <p>3-5 pediatric practices</p>
                        </div>
                        <div className="timeline-item">
                            <span className="timeline-date">Q3 2026</span>
                            <div className="timeline-dot"></div>
                            <h4>SOC 2 Type II</h4>
                            <p>Compliance certified</p>
                        </div>
                        <div className="timeline-item">
                            <span className="timeline-date">Q4 2026</span>
                            <div className="timeline-dot"></div>
                            <h4>FHIR Integration</h4>
                            <p>EHR connectivity live</p>
                        </div>
                        <div className="timeline-item">
                            <span className="timeline-date">Q1 2027</span>
                            <div className="timeline-dot future"></div>
                            <h4>Series A Ready</h4>
                            <p>Scale metrics proven</p>
                        </div>
                    </div>
                    <div className="current-status">
                        <h4>Current Status: MVP Complete & Deployed</h4>
                        <p>mymedicalcabinet.com is live with full functionality. Ready for pilot deployment immediately upon funding.</p>
                    </div>
                </div>
            </section>

            {/* Slide 12: The Ask */}
            <section className="slide slide-dark">
                <div className="slide-content">
                    <h2 className="slide-heading-light">Founder Commitment & Governance</h2>
                    <div className="governance-grid">
                        <div className="governance-card">
                            <h4>Alignment</h4>
                            <p>4-year vesting schedule with a 1-year cliff for all executives</p>
                        </div>
                        <div className="governance-card">
                            <h4>IP Control</h4>
                            <p>100% IP assignment of source code and mapping logic to MMC L.L.C.</p>
                        </div>
                    </div>
                    <div className="the-ask">
                        <span className="ask-label">THE ASK</span>
                        <h2>$2.5M Seed Round</h2>
                        <p>18-24 Month Runway</p>
                    </div>
                </div>
            </section>

            {/* Slide 13: Use of Funds */}
            <section className="slide slide-dark">
                <div className="slide-content">
                    <h2 className="slide-heading-light">Use of Funds & Roadmap</h2>
                    <div className="funds-breakdown">
                        <div className="fund-item">
                            <span className="fund-percent fund-blue">40%</span>
                            <div>
                                <h4>Scale Infrastructure</h4>
                                <p>FHIR integration and senior engineering hires</p>
                            </div>
                        </div>
                        <div className="fund-item">
                            <span className="fund-percent fund-green">30%</span>
                            <div>
                                <h4>Clinical Pilots</h4>
                                <p>3-5 pediatric practice pilots via Mednax network</p>
                            </div>
                        </div>
                        <div className="fund-item">
                            <span className="fund-percent fund-purple">30%</span>
                            <div>
                                <h4>Regulatory Hardening</h4>
                                <p>SOC 2 Type II and HIPAA compliance audits</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Slide 14: Market Sizing */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">Appendix: Market Sizing</h2>
                    <div className="market-sizing">
                        <div className="market-circles">
                            <div className="circle-tam"></div>
                            <div className="circle-sam"></div>
                            <div className="circle-som"></div>
                        </div>
                        <div className="market-numbers">
                            <div className="market-row">
                                <span className="market-label">TAM</span>
                                <span className="market-value">$12B+</span>
                                <span className="market-desc">US Personal Health Record Market</span>
                            </div>
                            <div className="market-row">
                                <span className="market-label">SAM</span>
                                <span className="market-value">$3.2B</span>
                                <span className="market-desc">Caregiver/Family Health Management</span>
                            </div>
                            <div className="market-row">
                                <span className="market-label">SOM</span>
                                <span className="market-value">$180M</span>
                                <span className="market-desc">Pediatric Caregiver Segment (Year 3)</span>
                            </div>
                        </div>
                    </div>
                    <p className="market-sources">Sources: Grand View Research, KLAS Research, internal analysis</p>
                </div>
            </section>

            {/* Slide 15: Technical Architecture */}
            <section className="slide slide-light">
                <div className="slide-content">
                    <h2 className="slide-heading">Appendix: Technical Architecture</h2>
                    <div className="architecture-stack">
                        <div className="arch-layer arch-frontend">
                            <h4>Frontend (Client)</h4>
                            <p>React PWA | Tesseract.js OCR | IndexedDB offline | Service Workers</p>
                        </div>
                        <div className="arch-layer arch-api">
                            <h4>API Layer</h4>
                            <p>Node.js / Express | JWT Auth | Rate Limiting | Input Validation</p>
                        </div>
                        <div className="arch-layer arch-data">
                            <h4>Data Layer</h4>
                            <p>MongoDB Atlas | AES-256 Encryption | S3 Document Storage</p>
                        </div>
                        <div className="arch-layer arch-integrations">
                            <h4>Integrations</h4>
                            <p>RxNav Drug API | NPI Registry | FHIR Ready (Roadmap)</p>
                        </div>
                    </div>
                    <p className="arch-footer">Privacy-First: No raw ePHI stored | Client-side processing | Zero-trust architecture</p>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="slide slide-cta">
                <div className="slide-content">
                    <div className="cta-logo">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C10.8954 2 10 2.89543 10 4V10H4C2.89543 10 2 10.8954 2 12C2 13.1046 2.89543 14 4 14H10V20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20V14H20C21.1046 14 22 13.1046 22 12C22 10.8954 21.1046 10 20 10H14V4C14 2.89543 13.1046 2 12 2Z" fill="#00D26A"/>
                        </svg>
                    </div>
                    <h2>Ready to Learn More?</h2>
                    <p>We'd love to discuss how MyMedicalCabinet is positioned to capture the consumer health record market.</p>
                    <div className="cta-buttons">
                        <a href="mailto:investors@mymedicalcabinet.com" className="cta-btn-primary">Contact Us</a>
                        <a href="https://mymedicalcabinet.com" target="_blank" rel="noopener noreferrer" className="cta-btn-secondary">View Live Product</a>
                    </div>
                    <p className="cta-footer">Confidential | MMC L.L.C. | mymedicalcabinet.com</p>
                </div>
            </section>
        </div>
    );
};

export default Investors;
