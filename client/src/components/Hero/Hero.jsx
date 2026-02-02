import React from 'react';
import './Hero.css';

const Hero = ({ onSignupClick }) => {
    return (
        <section className="hero-section">
            <div className="hero-bg-wrapper">
                <picture>
                    <source
                        media="(max-width: 768px)"
                        srcSet="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/mobilebgimage.jpeg"
                    />
                    <img
                        className="hero-bg-image"
                        src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/landscapeteamofdoctors.jpeg"
                        alt="Medical team"
                    />
                </picture>
                <div className="hero-bg-overlay"></div>
            </div>
            <div className="hero-container">
            <div className="hero-content">
                <div className="hero-tagline">
                    <span className="hero-tagline-line"></span>
                    <span className="hero-tagline-text">Your Health, Simplified</span>
                </div>

                <h1 className="hero-title">
                    <span className="hero-title-line">STORE.</span>
                    <span className="hero-title-line hero-title-green">TRACK.</span>
                    <span className="hero-title-line hero-title-blue">SHARE.</span>
                </h1>

                <p className="hero-subtitle">
                    All your medications, appointments, and medical records
                    in one secure place. Share instantly with doctors and caregivers.
                </p>

                <div className="hero-cta-group">
                    <button className="hero-cta-primary" onClick={onSignupClick}>
                        Get Started
                    </button>
                </div>
            </div>
            </div>
        </section>
    );
};

export default Hero;
