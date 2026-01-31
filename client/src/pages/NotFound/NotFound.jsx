import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './NotFound.css';

const NotFound = () => {
    return (
        <>
            <Header />
            <main className="not-found-page">
                <div className="not-found-container">
                    <div className="not-found-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                    </div>
                    <h1 className="not-found-title">404</h1>
                    <h2 className="not-found-subtitle">Page Not Found</h2>
                    <p className="not-found-message">
                        Sorry, the page you're looking for doesn't exist or has been moved.
                    </p>
                    <div className="not-found-actions">
                        <Link to="/" className="not-found-btn-primary">
                            Go to Homepage
                        </Link>
                        <Link to="/contact" className="not-found-btn-secondary">
                            Contact Support
                        </Link>
                    </div>
                    <div className="not-found-links">
                        <p>Or try one of these:</p>
                        <ul>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/dashboard">Dashboard</Link></li>
                        </ul>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default NotFound;
