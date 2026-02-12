import React, { useState } from 'react';
import './Header.css';

const Header = ({ onSignupClick, solid }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <>
            <div className={`header-wrapper ${solid ? 'header-wrapper-solid' : ''}`}>
            <header className="header-main">
                <div className="header-logo">
                    <a href="/">
                        <img
                            src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/logo-b2.svg"
                            alt="MyMedicalCabinet"
                            className="logo-img logo-full"
                        />
                        <img
                            src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/logo-b2-stacked.svg"
                            alt="MyMedicalCabinet"
                            className="logo-img logo-mobile"
                        />
                    </a>
                </div>

                <div className="header-right">
                    <button className="header-auth-btn" onClick={onSignupClick}>
                        Sign Up
                    </button>

                    <button
                        className="header-hamburger"
                        onClick={toggleMenu}
                        aria-label="Open menu"
                    >
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                    </button>
                </div>
            </header>
            </div>

            <div
                className={`menu-overlay ${menuOpen ? 'menu-overlay-active' : ''}`}
                onClick={closeMenu}
            ></div>

            <nav className={`slide-menu ${menuOpen ? 'slide-menu-open' : ''}`}>
                <button
                    className="menu-close-btn"
                    onClick={closeMenu}
                    aria-label="Close menu"
                >
                    <span className="close-icon"></span>
                </button>

                <ul className="menu-list">
                    <li className="menu-item">
                        <a href="/" className="menu-link">Home</a>
                    </li>
                    <li className="menu-item">
                        <a href="/about" className="menu-link">About Us</a>
                    </li>
                    <li className="menu-item">
                        <a href="/contact" className="menu-link">Contact Us</a>
                    </li>
                </ul>

                <div className="menu-cta-section">
                    <button className="menu-cta-btn menu-cta-signup" onClick={() => { closeMenu(); onSignupClick(); }}>
                        Sign Up
                    </button>
                    <a href="/login" className="menu-cta-btn menu-cta-login">
                        Login
                    </a>
                </div>
            </nav>
        </>
    );
};

export default Header;
