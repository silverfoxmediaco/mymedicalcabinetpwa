import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const InsuranceClaims = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">Fight Back</span>
                    <h1>Your Insurance Claim Was Denied. Now What?</h1>
                    <p className="landing-hero-subtitle">
                        Insurance denials, surprise bills, and coverage disputes are exhausting. Having your
                        medical records organized can be the difference between winning and losing an appeal.
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Get Organized
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">The Insurance Nightmare</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📄</div>
                            <h3>"Claim denied: Not medically necessary"</h3>
                            <p>Your doctor ordered the test, but insurance says it wasn't needed. Now you're stuck with a $3,000 bill and no idea how to prove it was necessary.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🔍</div>
                            <h3>"We need documentation"</h3>
                            <p>The insurance company wants records from three years ago to prove your condition is ongoing. Do you have them? Do you even know where to look?</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">⏰</div>
                            <h3>"You have 30 days to appeal"</h3>
                            <p>The clock is ticking, but gathering the medical records you need to prove your case takes weeks. Most people miss the deadline.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">💰</div>
                            <h3>"That's out of network"</h3>
                            <p>You went to an in-network hospital but the anesthesiologist wasn't covered. Surprise bills for thousands of dollars, and you had no way to know.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "My insurance denied my son's ADHD medication, saying we hadn't tried other treatments first.
                        But we had - two years ago with a different insurer. I couldn't prove it because I didn't
                        have the records. We spent months getting documentation while he went without his medication."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>Karen W.</strong> — Mother fighting insurance denial, age 41
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Build Your Case Before You Need It</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📋</div>
                            <h3>Complete Documentation</h3>
                            <p>Every diagnosis, treatment, and prescription documented with dates. Prove medical necessity with a clear timeline.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📁</div>
                            <h3>Document Storage</h3>
                            <p>Upload lab results, doctor's notes, and imaging reports. Everything you need for an appeal, organized and searchable.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📤</div>
                            <h3>Quick Export</h3>
                            <p>Generate reports and gather documentation in minutes instead of weeks. Meet appeal deadlines with time to spare.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">Be Ready for the Fight</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Treatment History Timeline</h4>
                                <p>Show what treatments you've tried, when, and why they did or didn't work. Essential for step therapy appeals.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Diagnosis Documentation</h4>
                                <p>Keep records of when conditions were diagnosed, by whom, and supporting test results. Prove pre-existing coverage.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Insurance Plan Details</h4>
                                <p>Store your policy information, coverage limits, deductibles, and out-of-pocket maximums all in one place.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Provider Records</h4>
                                <p>Keep contact information for every doctor who's treated you. When you need supporting letters, you'll know who to ask.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Medication History</h4>
                                <p>Document every medication you've tried, including why it was stopped. Critical for prior authorization appeals.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>200M</h3>
                        <p>insurance claims denied each year</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>< 1%</h3>
                        <p>of patients appeal denied claims</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>50%+</h3>
                        <p>of appeals are successful when filed</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>$400</h3>
                        <p>average unexpected medical bill</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Don't Let Insurance Win</h2>
                    <p>When denial letters come, you'll be ready to fight back with documentation.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">Your records are your evidence. Start building your case today.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default InsuranceClaims;
