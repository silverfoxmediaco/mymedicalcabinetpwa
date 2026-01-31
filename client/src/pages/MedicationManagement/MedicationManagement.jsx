import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const MedicationManagement = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">Medication Help</span>
                    <h1>Too Many Pills to Keep Track Of?</h1>
                    <p className="landing-hero-subtitle">
                        Multiple medications, different schedules, various pharmacies - managing prescriptions
                        shouldn't require a spreadsheet. We make it simple and safe.
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Get Organized Free
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">The Medication Juggling Act</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">💊</div>
                            <h3>"Did I take my morning pills?"</h3>
                            <p>You're staring at the pill bottles trying to remember if you already took your medication. Take it twice? Skip it? Both options are bad.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🔄</div>
                            <h3>"The pharmacy says it's too early"</h3>
                            <p>You're out of pills but insurance won't cover the refill yet. Now you're rationing medication or paying out of pocket.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">⚠️</div>
                            <h3>"Can I take these together?"</h3>
                            <p>You have a headache but you're on blood thinners. Is ibuprofen safe? What about that new prescription from the specialist?</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🏪</div>
                            <h3>"Which pharmacy has which med?"</h3>
                            <p>Some prescriptions at CVS, others at Walgreens, one mail-order. Coordinating refills is a part-time job.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "I take 8 different medications. One is twice daily, two are once in the morning,
                        one is with food, one is without food, one is every other day. I was constantly
                        confused and my doctor said I was taking some of them wrong for months."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>Robert T.</strong> — Retired teacher managing multiple conditions, age 71
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Medication Management Made Simple</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📷</div>
                            <h3>Scan to Add</h3>
                            <p>Point your phone at the barcode on any prescription bottle. We'll automatically pull in the drug name, dosage, and details.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">⚠️</div>
                            <h3>Interaction Alerts</h3>
                            <p>We check every medication against your list and warn you about dangerous combinations before you take them.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">🔔</div>
                            <h3>Refill Reminders</h3>
                            <p>Never run out of medication. Get notified when it's time to refill - with enough lead time to avoid gaps.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">Everything You Need</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Complete Medication List</h4>
                                <p>Every prescription and over-the-counter medication in one place with dosages, schedules, and instructions.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Drug Interaction Checker</h4>
                                <p>Powered by the National Library of Medicine database. Know if your medications are safe to take together.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Pharmacy Information</h4>
                                <p>Store all your pharmacy details - which meds are filled where, phone numbers, and addresses.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Prescriber Tracking</h4>
                                <p>Know which doctor prescribed what. Helpful when you need refills or have questions about a medication.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Medication History</h4>
                                <p>Track past medications - what worked, what didn't, and why you stopped taking something.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>50%</h3>
                        <p>of patients don't take meds as prescribed</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>125K</h3>
                        <p>deaths yearly from medication non-adherence</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>$528B</h3>
                        <p>annual cost of medication mismanagement</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>5+</h3>
                        <p>meds taken by average American over 65</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Take Control of Your Medications</h2>
                    <p>Stop guessing. Start managing your prescriptions the smart way.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">Scan your first prescription in under 30 seconds.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default MedicationManagement;
