import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const ChronicConditions = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">Chronic Illness</span>
                    <h1>Managing a Chronic Condition is a Full-Time Job</h1>
                    <p className="landing-hero-subtitle">
                        Diabetes, heart disease, autoimmune conditions - living with chronic illness means
                        constant monitoring, multiple medications, and endless appointments. We help you stay on top of it all.
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Start Tracking Free
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">The Daily Struggle</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📊</div>
                            <h3>"My doctor wants to see trends"</h3>
                            <p>You're supposed to track blood sugar, blood pressure, or symptoms daily. But where's that notebook? Did you write it in the app? Which app?</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">💊</div>
                            <h3>"I take so many pills"</h3>
                            <p>Morning pills, evening pills, pills with food, pills without food, insulin, inhalers. Keeping track of timing and doses is exhausting.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">👨‍⚕️</div>
                            <h3>"I see too many specialists"</h3>
                            <p>Endocrinologist, cardiologist, rheumatologist, primary care. They all want updates, and none of them talk to each other.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">😓</div>
                            <h3>"Am I getting better or worse?"</h3>
                            <p>Without tracking over time, it's hard to know if treatments are working. Is this new symptom related to your condition or something else?</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "I have Type 2 diabetes and high blood pressure. Between the glucose monitor,
                        blood pressure cuff, medications, and doctor appointments, I felt like I was
                        drowning in health management. I needed one place to track everything."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>David M.</strong> — Living with diabetes for 12 years, age 58
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Your Health Command Center</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📈</div>
                            <h3>Track Everything</h3>
                            <p>Log vitals, symptoms, and measurements in one place. See trends over weeks and months to share with your doctors.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">💊</div>
                            <h3>Medication Central</h3>
                            <p>All your prescriptions, supplements, and treatments organized with schedules, dosages, and refill tracking.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📋</div>
                            <h3>Appointment Ready</h3>
                            <p>Walk into every appointment with a summary of what's changed since your last visit. Make every minute count.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">Built for Chronic Condition Management</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Condition Tracking</h4>
                                <p>Document your diagnosis date, current status, treatments tried, and what's working. Build a complete picture of your health journey.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Vitals History</h4>
                                <p>Blood pressure, glucose levels, weight, and more. Track over time and spot patterns your doctor needs to see.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Multi-Provider Coordination</h4>
                                <p>Keep all your specialists organized. When one changes a medication, you can inform the others.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Lab Results Storage</h4>
                                <p>Upload A1C results, lipid panels, and other bloodwork. Compare results over time to see if treatments are working.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Drug Interaction Alerts</h4>
                                <p>Multiple conditions often mean multiple medications. We'll flag potential interactions between your prescriptions.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>133M</h3>
                        <p>Americans live with chronic conditions</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>40%</h3>
                        <p>have multiple chronic conditions</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>$4.1T</h3>
                        <p>annual US healthcare spending on chronic disease</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>90%</h3>
                        <p>of healthcare costs from chronic conditions</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Take Charge of Your Health</h2>
                    <p>Living with a chronic condition is hard enough. Let us help you stay organized.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">Track unlimited conditions and medications.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ChronicConditions;
