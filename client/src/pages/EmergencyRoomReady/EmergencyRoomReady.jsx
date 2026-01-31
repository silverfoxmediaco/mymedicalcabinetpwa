import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const EmergencyRoomReady = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">Be Prepared</span>
                    <h1>In an Emergency, Every Second Counts</h1>
                    <p className="landing-hero-subtitle">
                        When you're in the ER, can you remember all your medications? Your allergies?
                        Your surgical history? Have your critical health information ready when it matters most.
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Get Emergency Ready
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">The ER Reality Check</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">😵</div>
                            <h3>"What medications are you on?"</h3>
                            <p>You're in pain, stressed, maybe sedated. Trying to remember every pill you take, their dosages, and how often - it's nearly impossible under pressure.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">⚠️</div>
                            <h3>"Any drug allergies?"</h3>
                            <p>You know you're allergic to something - was it penicillin? A sulfa drug? Missing this information could mean a dangerous reaction.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📱</div>
                            <h3>"Can we contact your doctor?"</h3>
                            <p>It's 2 AM. Do you have your cardiologist's after-hours number? Does your spouse know who your doctors are?</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🏥</div>
                            <h3>"Have you had surgery before?"</h3>
                            <p>Anesthesiologists need to know your surgical history. That appendectomy from 15 years ago? The complications matter.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "My husband had a heart attack at home. In the ambulance, they were asking
                        me about his medications and I blanked. I knew he took blood pressure pills
                        and something for cholesterol, but I couldn't remember the names. I've never
                        felt so scared and unprepared."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>Linda K.</strong> — Wife of cardiac patient, age 67
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Your Health Information, Instantly Accessible</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">🚑</div>
                            <h3>Emergency Summary</h3>
                            <p>One screen with everything EMTs need: allergies, conditions, medications, emergency contacts, blood type.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📲</div>
                            <h3>Share with QR Code</h3>
                            <p>Let ER staff scan a code to instantly access your critical health information - no login required for them.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">👥</div>
                            <h3>Family Access</h3>
                            <p>Your spouse or caregiver can pull up your complete medical history even if you're unconscious.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">Critical Information at Your Fingertips</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Complete Allergy List</h4>
                                <p>Drug allergies, food allergies, latex sensitivity - everything documented with reaction severity.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Current Medication List</h4>
                                <p>Every prescription with exact dosages, frequencies, and prescribing doctors. Ready to show the ER team.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Medical Conditions</h4>
                                <p>Diabetes, heart disease, pacemaker, previous stroke - conditions that affect emergency treatment decisions.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Surgical History</h4>
                                <p>Past procedures, implants, and any surgical complications documented for anesthesiologists.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Emergency Contacts</h4>
                                <p>Family members, primary doctor, and specialists with phone numbers ready to share.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>145M</h3>
                        <p>ER visits in the US each year</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>27%</h3>
                        <p>of patients can't recall their medications</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>7,000+</h3>
                        <p>deaths yearly from medication errors</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>&lt; 1 min</h3>
                        <p>to share your health summary</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Don't Wait for an Emergency</h2>
                    <p>Set up your health profile now - before you need it.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">Takes less than 10 minutes to set up your emergency profile.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default EmergencyRoomReady;
