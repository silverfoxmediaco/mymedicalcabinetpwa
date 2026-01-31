import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const ElderlyParentCare = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">For Caregivers</span>
                    <h1>Managing Your Elderly Parent's Health Shouldn't Be This Hard</h1>
                    <p className="landing-hero-subtitle">
                        Between doctor appointments, medications, and insurance calls, caring for aging
                        parents can feel like a full-time job. We help you stay organized and in control.
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Start Managing Care
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">The Caregiver Struggle</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">💊</div>
                            <h3>"Mom takes 12 different medications"</h3>
                            <p>Keeping track of what she takes, when she takes it, and which pharmacy fills what is overwhelming. Miss a refill and she's without critical medication.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">👨‍⚕️</div>
                            <h3>"Dad sees 5 different specialists"</h3>
                            <p>Cardiologist, neurologist, primary care, endocrinologist, urologist. None of them talk to each other, and you're the one trying to coordinate everything.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📞</div>
                            <h3>"I live 3 hours away"</h3>
                            <p>You can't be there for every appointment. When the doctor calls with questions about medications, you're scrambling to remember what they're taking.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🤷</div>
                            <h3>"My siblings aren't helping"</h3>
                            <p>You're doing all the medical coordination, but your siblings don't know what's going on. When emergencies happen, no one else has the information.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "My father was hospitalized and the ER doctor asked about his medications.
                        I was at work, 200 miles away, trying to remember what pills were in which
                        bottles. I felt so helpless. That's when I knew I needed a better system."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>Michael R.</strong> — Son and primary caregiver, age 52
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Caregiving Made Manageable</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📋</div>
                            <h3>Complete Medication List</h3>
                            <p>Every medication, dosage, and schedule in one place. Scan barcodes to add new prescriptions instantly.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">👥</div>
                            <h3>Family Sharing</h3>
                            <p>Give siblings access to view (or help manage) your parent's health information. Everyone stays informed.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">🚨</div>
                            <h3>Emergency Ready</h3>
                            <p>Pull up a complete health summary for EMTs or ER doctors in seconds - allergies, conditions, medications, everything.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">Built for Caregivers</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Medication Reminders</h4>
                                <p>Get notified when it's time for refills. Never run out of critical medications again.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Drug Interaction Alerts</h4>
                                <p>When specialists prescribe new medications, we'll warn you about potential interactions with existing prescriptions.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Doctor Directory</h4>
                                <p>All their doctors in one place - names, specialties, phone numbers, addresses. No more searching for that cardiologist's number.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Appointment Tracking</h4>
                                <p>Keep track of upcoming appointments across all providers. Add them to your calendar with one tap.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Insurance Information</h4>
                                <p>Store insurance cards, policy numbers, and coverage details. Ready when the billing department calls.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>53M</h3>
                        <p>Americans provide unpaid care to adults</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>24 hrs</h3>
                        <p>average weekly time spent caregiving</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>7+</h3>
                        <p>medications taken by average senior</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>61%</h3>
                        <p>of caregivers also work full-time</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Make Caregiving Easier</h2>
                    <p>You're already doing so much. Let us help you stay organized.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">Manage care for multiple family members on one account.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ElderlyParentCare;
