import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const SwitchingDoctors = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">New Doctor?</span>
                    <h1>Switching Doctors Shouldn't Mean Starting Over</h1>
                    <p className="landing-hero-subtitle">
                        Whether you've moved, changed insurance, or your doctor retired, you shouldn't
                        have to rebuild your medical history from memory. Bring your complete health record with you.
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Keep Your Records
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">The New Patient Nightmare</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📝</div>
                            <h3>"Fill out these 15 forms"</h3>
                            <p>You're sitting in the waiting room with a clipboard, trying to remember dates of surgeries from 10 years ago and medications you stopped taking in 2019.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📠</div>
                            <h3>"We'll request your records"</h3>
                            <p>The new office says they'll fax your old doctor. Three weeks later, the records still haven't arrived. Or they got the wrong patient's file.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🔁</div>
                            <h3>"We need to redo those tests"</h3>
                            <p>Without your records, the new doctor orders the same bloodwork and scans you just had. More copays, more needles, more time.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🤷</div>
                            <h3>"Why are you on this medication?"</h3>
                            <p>Your new doctor asks why you're taking a certain prescription. You know your old doctor had a reason, but you can't remember what it was.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "When I changed jobs, I had to find all new doctors because of insurance.
                        My first appointment with my new PCP was basically useless - I couldn't answer
                        half her questions about my history. She said 'let's start fresh' which meant
                        redoing tests I'd already done."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>Jennifer L.</strong> — Changed doctors after job switch, age 38
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Your Records, Your Control</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📋</div>
                            <h3>Complete History</h3>
                            <p>Walk into any new doctor's office with your full medical history - conditions, surgeries, allergies, medications, test results.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📤</div>
                            <h3>Instant Sharing</h3>
                            <p>Share your records with a new provider in seconds. No fax machines, no HIPAA forms, no 3-week waits.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">🔒</div>
                            <h3>Always Yours</h3>
                            <p>Your medical records don't belong to a doctor's office - they belong to you. Keep them forever, no matter how many times you switch.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">Never Start Over Again</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>New Patient Form Ready</h4>
                                <p>Generate a complete health summary that answers every question on those intake forms. Print or show on your phone.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Test Results & Lab History</h4>
                                <p>Upload past bloodwork and test results. Show your new doctor trends over time instead of starting from scratch.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Medication Reasons</h4>
                                <p>Document why you're on each medication. When your new doctor asks "why this dose?", you'll have the answer.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Previous Doctors List</h4>
                                <p>Keep contact information for past providers. If records need to be requested, you'll know exactly who to contact.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Insurance Transitions</h4>
                                <p>Changing insurance? Track your new plan details alongside your health records for seamless transitions.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>30%</h3>
                        <p>of Americans switch doctors each year</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>21 days</h3>
                        <p>average time to transfer medical records</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>$125</h3>
                        <p>average cost to retrieve old records</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>60%</h3>
                        <p>of record transfers have errors or delays</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Own Your Medical History</h2>
                    <p>Switch doctors on your terms. Bring your complete health record with you.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">Start building your personal health record today.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default SwitchingDoctors;
