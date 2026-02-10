import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './AboutUs.css';

const AboutUs = ({ onSignupClick }) => {
    return (
        <>
            <Header onSignupClick={onSignupClick} solid />
            <main className="about-us-page">
                <section className="about-us-hero">
                    <div className="about-us-hero-container">
                        <div className="about-us-tagline">
                            <span className="about-us-tagline-line"></span>
                            <span className="about-us-tagline-text">About Us</span>
                        </div>
                        <h1 className="about-us-hero-title">
                            Your Health Information,<br />
                            <span className="about-us-hero-accent">Always Accessible</span>
                        </h1>
                        <p className="about-us-hero-subtitle">
                            We're building the simplest way to store, track, and share your
                            medical information with the people who need it most.
                        </p>
                    </div>
                </section>

                <section className="about-us-mission">
                    <div className="about-us-container">
                        <div className="about-us-mission-content">
                            <h2 className="about-us-section-title">Our Mission</h2>
                            <p className="about-us-text">
                                At MyMedicalCabinet, we believe managing your health shouldn't be complicated.
                                Too often, critical medical information is scattered across doctor's offices,
                                pharmacies, and paper records—making it difficult to access when you need it most.
                            </p>
                            <p className="about-us-text">
                                We created MyMedicalCabinet to give you a single, secure place to keep all your
                                health information organized and easily shareable with healthcare providers,
                                caregivers, and family members.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="about-us-values">
                    <div className="about-us-container">
                        <h2 className="about-us-section-title about-us-section-title-center">What We Stand For</h2>
                        <div className="about-us-values-grid">
                            <div className="about-us-value-card">
                                <div className="about-us-value-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                    </svg>
                                </div>
                                <h3 className="about-us-value-title">Security First</h3>
                                <p className="about-us-value-text">
                                    Your health data is sensitive. We use industry-leading encryption and
                                    security practices to keep your information safe.
                                </p>
                            </div>
                            <div className="about-us-value-card">
                                <div className="about-us-value-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 6v6l4 2"/>
                                    </svg>
                                </div>
                                <h3 className="about-us-value-title">Simplicity</h3>
                                <p className="about-us-value-text">
                                    We designed MyMedicalCabinet to be intuitive for everyone—whether you're
                                    tech-savvy or prefer to keep things simple.
                                </p>
                            </div>
                            <div className="about-us-value-card">
                                <div className="about-us-value-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                </div>
                                <h3 className="about-us-value-title">You're In Control</h3>
                                <p className="about-us-value-text">
                                    Your data belongs to you. Share it when you want, with whom you want,
                                    and revoke access anytime.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about-us-cta">
                    <div className="about-us-container">
                        <h2 className="about-us-cta-title">Ready to Get Started?</h2>
                        <p className="about-us-cta-text">
                            Join thousands of people taking control of their health information.
                        </p>
                        <button className="about-us-cta-btn" onClick={onSignupClick}>
                            Create Your Free Account
                        </button>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default AboutUs;
