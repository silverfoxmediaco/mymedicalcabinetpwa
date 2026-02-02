import React from 'react';
import './Hero.css';

const Hero = ({ onSignupClick }) => {
    return (
        <section className="hero-section">
            <div className="hero-video-wrapper">
                <video
                    className="hero-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source
                        src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/kling_20260129_Image_to_Video__5994_0.mp4"
                        type="video/mp4"
                    />
                </video>
                <div className="hero-video-overlay"></div>
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
