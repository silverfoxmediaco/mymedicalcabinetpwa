import React from 'react';
import './PreFooter.css';

const PreFooter = ({ onSignupClick }) => {
    return (
        <section className="prefooter-section">
            <div className="prefooter-container">
                <h2 className="prefooter-title">
                    Ready to Take Control of Your Health Records?
                </h2>
                <p className="prefooter-subtitle">
                    Join thousands of users who trust MyMedicalCabinet to keep their health information safe and accessible.
                </p>
                <div className="prefooter-cta-group">
                    <button className="prefooter-cta-primary" onClick={onSignupClick}>
                        Get Started Free
                    </button>
                    <button className="prefooter-cta-secondary">
                        Contact Us
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PreFooter;
