import React from 'react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-section">
            <div className="footer-container">
                <div className="footer-logo">
                    <img
                        src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/logo-b2.svg"
                        alt="MyMedicalCabinet"
                        className="footer-logo-img"
                    />
                </div>

                <nav className="footer-nav">
                    <a href="/" className="footer-link">Home</a>
                    <a href="/about" className="footer-link">About</a>
                    <a href="/features" className="footer-link">Features</a>
                    <a href="/contact" className="footer-link">Contact</a>
                </nav>

                <nav className="footer-nav footer-nav-secondary">
                    <a href="/privacy" className="footer-link">Privacy Policy</a>
                    <a href="/security" className="footer-link">Security</a>
                    <a href="/terms" className="footer-link">Terms of Service</a>
                </nav>

                <div className="footer-divider"></div>

                <p className="footer-copyright">
                    &copy; {currentYear} MyMedicalCabinet. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
