import React from 'react';
import './AboutPlatform.css';

const AboutPlatform = () => {
    const features = [
        {
            id: 'medications',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.5 20.5L3.5 13.5C1.5 11.5 1.5 8.5 3.5 6.5C5.5 4.5 8.5 4.5 10.5 6.5L17.5 13.5C19.5 15.5 19.5 18.5 17.5 20.5C15.5 22.5 12.5 22.5 10.5 20.5Z" />
                    <path d="M7 13.5L13.5 7" />
                </svg>
            ),
            title: 'My Medications',
            description: 'Track all your prescriptions, dosages, and refill schedules in one place.'
        },
        {
            id: 'doctors',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" />
                    <circle cx="12" cy="7" r="4" />
                    <path d="M12 11V14" />
                    <path d="M10.5 12.5H13.5" />
                </svg>
            ),
            title: 'My Doctors',
            description: 'Keep contact info for all your healthcare providers easily accessible.'
        },
        {
            id: 'records',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" />
                    <path d="M14 2V8H20" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                </svg>
            ),
            title: 'My Medical Records',
            description: 'Store conditions, allergies, surgeries, and family health history securely.'
        },
        {
            id: 'insurance',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                    <path d="M9 12L11 14L15 10" />
                </svg>
            ),
            title: 'My Health Insurance',
            description: 'Access your insurance details and coverage information anytime.'
        }
    ];

    return (
        <section className="about-platform-section">
            <div className="about-platform-container">
                <div className="about-platform-header">
                    <div className="about-platform-tagline">
                        <span className="about-platform-tagline-line"></span>
                        <span className="about-platform-tagline-text">What We Offer</span>
                    </div>
                    <h2 className="about-platform-title">Everything You Need</h2>
                    <p className="about-platform-subtitle">
                        One secure place to manage all your health information.
                    </p>
                </div>

                <div className="about-platform-grid">
                    {features.map((feature) => (
                        <div key={feature.id} className="about-platform-card">
                            <div className="about-platform-card-icon">
                                {feature.icon}
                            </div>
                            <h3 className="about-platform-card-title">{feature.title}</h3>
                            <p className="about-platform-card-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutPlatform;
