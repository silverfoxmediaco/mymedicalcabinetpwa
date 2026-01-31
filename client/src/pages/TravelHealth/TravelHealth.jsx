import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const TravelHealth = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">Travel Ready</span>
                    <h1>Medical Emergency While Traveling? Are You Prepared?</h1>
                    <p className="landing-hero-subtitle">
                        Whether you're across the country or across the world, a medical emergency away from
                        home is terrifying. Having your health information accessible could save your life.
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Get Travel Ready
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">When Health Emergencies Strike Away From Home</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🌍</div>
                            <h3>"I'm in a foreign hospital"</h3>
                            <p>The doctors don't speak English well, and you can't remember the name of your blood pressure medication. You just know it's "the little white pill."</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">💊</div>
                            <h3>"I lost my medication"</h3>
                            <p>Your luggage was lost with your prescriptions inside. You need a refill in a city where no one knows you or your medical history.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🚑</div>
                            <h3>"The resort called an ambulance"</h3>
                            <p>You're on vacation and suddenly in an ER. Your spouse is panicking, trying to remember your allergies and what medications you take.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📋</div>
                            <h3>"What's your medical history?"</h3>
                            <p>A doctor who's never seen you needs to make treatment decisions fast. Your regular doctor is 2,000 miles away and it's the middle of the night.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "I had a heart attack in Mexico. I don't speak Spanish, and I couldn't remember
                        if I was on Metoprolol or Lisinopril - I just knew they were for blood pressure.
                        The doctors had to guess at treatment. I was so scared. When I got home, I immediately
                        started keeping my health records on my phone."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>Thomas B.</strong> — Heart attack survivor, age 63
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Your Health Information, Anywhere in the World</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📱</div>
                            <h3>On Your Phone</h3>
                            <p>Access your complete medical history from anywhere with an internet connection. No paper to lose, no files to carry.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">🔗</div>
                            <h3>Emergency Sharing</h3>
                            <p>Generate a QR code or shareable link that gives emergency responders access to your critical health information.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">🗣️</div>
                            <h3>Clear Communication</h3>
                            <p>Show foreign doctors exact medication names, dosages, and allergies. No confusion, no translation errors.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">Pack Your Health Records</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Complete Medication List</h4>
                                <p>Generic names, brand names, dosages, and what each medication is for. Get prescriptions filled anywhere.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Allergy Information</h4>
                                <p>Drug allergies, food allergies, and reaction descriptions. Critical for any medical treatment abroad.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Vaccination Records</h4>
                                <p>Proof of immunizations for travel requirements. COVID vaccines, yellow fever, typhoid - all documented.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Insurance Information</h4>
                                <p>Policy numbers, international coverage details, and emergency contact numbers for your insurer.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Emergency Contacts</h4>
                                <p>Family members and your regular doctors with phone numbers. So hospitals know who to call.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>2.8M</h3>
                        <p>Americans hospitalized abroad yearly</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>50%</h3>
                        <p>of travelers don't carry health info</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>$25K</h3>
                        <p>average cost of medical evacuation</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>73%</h3>
                        <p>of emergencies happen unexpectedly</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Travel with Peace of Mind</h2>
                    <p>Don't leave home without your health information. Set up your profile before your next trip.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">Takes 10 minutes to set up. Could save your life.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default TravelHealth;
