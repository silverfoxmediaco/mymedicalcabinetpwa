import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const LostMedicalRecords = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">Sound Familiar?</span>
                    <h1>Can't Find Your Medical Records When You Need Them?</h1>
                    <p className="landing-hero-subtitle">
                        You're not alone. Millions of people struggle to locate vaccination records,
                        lab results, and medical history when switching doctors, traveling, or facing emergencies.
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Get Organized Free
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">The Frustration is Real</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📋</div>
                            <h3>"I need my vaccination records for work"</h3>
                            <p>Your employer or school needs proof of immunizations. You know you got them, but where's the paperwork? Was it at your old doctor's office that closed down?</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🏥</div>
                            <h3>"My old doctor retired"</h3>
                            <p>The practice closed, merged, or your doctor moved. Now your records are somewhere in a storage facility or transferred to an office you've never heard of.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📦</div>
                            <h3>"I moved and lost everything"</h3>
                            <p>Between the move and unpacking, that folder of medical records disappeared. Now you're starting from scratch with a new doctor who knows nothing about your history.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">😰</div>
                            <h3>"The hospital wants records I don't have"</h3>
                            <p>You're scheduling a procedure and they need your surgical history, allergies, and current medications. You remember some of it, but not the details they need.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "I spent three weeks trying to get my daughter's immunization records transferred
                        to her new school. Phone calls, fax requests, HIPAA forms - it was a nightmare.
                        By the time I got them, she'd already missed the enrollment deadline."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>Sarah M.</strong> — Mother of two, relocated for work
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Never Lose Your Records Again</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📱</div>
                            <h3>Always With You</h3>
                            <p>Access your complete medical history from your phone, anywhere, anytime. No more digging through file cabinets.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">☁️</div>
                            <h3>Secure Cloud Backup</h3>
                            <p>Your records are encrypted and backed up. Move across the country - your medical history moves with you.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📤</div>
                            <h3>Share Instantly</h3>
                            <p>New doctor? New school? Share your records in seconds instead of waiting weeks for transfers.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">Everything in One Place</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Vaccination Records</h4>
                                <p>Store all immunizations with dates, lot numbers, and boosters. Perfect for school, work, or travel requirements.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Lab Results & Test History</h4>
                                <p>Keep blood work, imaging results, and diagnostic tests organized and accessible.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Surgical History</h4>
                                <p>Document procedures, dates, hospitals, and surgeons so you never have to guess again.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Medication History</h4>
                                <p>Track current and past medications, dosages, and why they were prescribed or discontinued.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Document Upload</h4>
                                <p>Scan or photograph paper records, discharge summaries, and doctor's notes. Everything searchable.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>68%</h3>
                        <p>of patients can't locate their records when needed</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>3 weeks</h3>
                        <p>average time to transfer records between providers</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>$150+</h3>
                        <p>typical fee to retrieve old medical records</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>30 sec</h3>
                        <p>to share records with MyMedicalCabinet</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Take Control of Your Medical Records</h2>
                    <p>Stop losing track of your health history. Start organizing today.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">No credit card required. Free forever for basic features.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LostMedicalRecords;
