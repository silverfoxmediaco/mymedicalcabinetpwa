import React, { useState } from 'react';
import './MemberHeader.css';

const MemberHeader = ({ user, onLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const handleLogout = () => {
        closeMenu();
        if (onLogout) onLogout();
    };

    return (
        <>
            <div className="member-header-wrapper">
                <header className="member-header-main">
                    <div className="member-header-logo">
                        <a href="/dashboard">
                            <img
                                src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/logo.png"
                                alt="MyMedicalCabinet"
                                className="member-logo-img member-logo-full"
                            />
                            <img
                                src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/images/mmcicononlylogo.svg"
                                alt="MyMedicalCabinet"
                                className="member-logo-img member-logo-mobile"
                            />
                        </a>
                    </div>

                    <button
                        className="member-header-hamburger"
                        onClick={toggleMenu}
                        aria-label="Open menu"
                    >
                        <span className="member-hamburger-line"></span>
                        <span className="member-hamburger-line"></span>
                        <span className="member-hamburger-line"></span>
                    </button>
                </header>
            </div>

            <div
                className={`member-menu-overlay ${menuOpen ? 'member-menu-overlay-active' : ''}`}
                onClick={closeMenu}
            ></div>

            <nav className={`member-slide-menu ${menuOpen ? 'member-slide-menu-open' : ''}`}>
                <button
                    className="member-menu-close-btn"
                    onClick={closeMenu}
                    aria-label="Close menu"
                >
                    <span className="member-close-icon"></span>
                </button>

                {user && (
                    <div className="member-menu-user">
                        <span className="member-menu-user-name">
                            {user.firstName} {user.lastName}
                        </span>
                        <span className="member-menu-user-email">{user.email}</span>
                    </div>
                )}

                <ul className="member-menu-list">
                    <li className="member-menu-item">
                        <a href="/dashboard" className="member-menu-link" onClick={closeMenu}>
                            My Dashboard
                        </a>
                    </li>
                    <li className="member-menu-item">
                        <a href="/medications" className="member-menu-link" onClick={closeMenu}>
                            My Medications
                        </a>
                    </li>
                    <li className="member-menu-item">
                        <a href="/doctors" className="member-menu-link" onClick={closeMenu}>
                            My Doctors
                        </a>
                    </li>
                    <li className="member-menu-item">
                        <a href="/medical-records" className="member-menu-link" onClick={closeMenu}>
                            My Medical Records
                        </a>
                    </li>
                    <li className="member-menu-item">
                        <a href="/insurance" className="member-menu-link" onClick={closeMenu}>
                            My Health Insurance
                        </a>
                    </li>
                    <li className="member-menu-item">
                        <a href="/appointments" className="member-menu-link" onClick={closeMenu}>
                            My Appointments
                        </a>
                    </li>
                </ul>

                <div className="member-menu-divider"></div>

                <ul className="member-menu-list member-menu-list-secondary">
                    <li className="member-menu-item">
                        <a href="/settings" className="member-menu-link member-menu-link-secondary" onClick={closeMenu}>
                            Settings
                        </a>
                    </li>
                    <li className="member-menu-item">
                        <button className="member-menu-link member-menu-link-secondary member-menu-logout" onClick={handleLogout}>
                            Logout
                        </button>
                    </li>
                </ul>
            </nav>
        </>
    );
};

export default MemberHeader;
