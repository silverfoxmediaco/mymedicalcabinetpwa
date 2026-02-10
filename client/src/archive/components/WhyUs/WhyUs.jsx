import React from 'react';
import './WhyUs.css';

const WhyUs = () => {
    const securityFeatures = [
        {
            id: 'encryption',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" />
                </svg>
            ),
            title: 'End-to-End Encryption',
            description: 'Your data is encrypted at rest and in transit, ensuring only you control access.'
        },
        {
            id: 'privacy',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" />
                </svg>
            ),
            title: 'Your Data, Your Control',
            description: 'We never sell your information. You decide who sees your health records.'
        },
        {
            id: 'sharing',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.59 13.51L15.42 17.49" />
                    <path d="M15.41 6.51L8.59 10.49" />
                </svg>
            ),
            title: 'Secure Sharing',
            description: 'Share records with doctors via secure QR codes or temporary access links.'
        }
    ];

    return (
        <section className="why-us-section">
            <div className="why-us-container">
                <div className="why-us-content">
                    <div className="why-us-text">
                        <div className="why-us-tagline">
                            <span className="why-us-tagline-line"></span>
                            <span className="why-us-tagline-text">Why MyMedicalCabinet</span>
                        </div>
                        <h2 className="why-us-title">
                            Your Health Information Deserves Better Protection
                        </h2>
                        <p className="why-us-description">
                            Medical records scattered across clinics, pharmacies, and hospitals
                            make it hard to stay organized. MyMedicalCabinet brings everything
                            together in one secure place you control.
                        </p>
                        <p className="why-us-description">
                            Whether you're managing your own health, caring for a loved one,
                            or coordinating with multiple doctors, we make it simple and safe.
                        </p>
                    </div>

                    <div className="why-us-features">
                        {securityFeatures.map((feature) => (
                            <div key={feature.id} className="why-us-feature">
                                <div className="why-us-feature-icon">
                                    {feature.icon}
                                </div>
                                <div className="why-us-feature-content">
                                    <h3 className="why-us-feature-title">{feature.title}</h3>
                                    <p className="why-us-feature-description">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhyUs;
