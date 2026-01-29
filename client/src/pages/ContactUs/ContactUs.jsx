import React, { useState } from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './ContactUs.css';

const ContactUs = ({ onSignupClick }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        // Simulate form submission - replace with actual API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSubmitStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header onSignupClick={onSignupClick} />
            <main className="contact-us-page">
                <section className="contact-us-hero">
                    <div className="contact-us-hero-container">
                        <div className="contact-us-tagline">
                            <span className="contact-us-tagline-line"></span>
                            <span className="contact-us-tagline-text">Contact Us</span>
                        </div>
                        <h1 className="contact-us-hero-title">
                            We're Here to <span className="contact-us-hero-accent">Help</span>
                        </h1>
                        <p className="contact-us-hero-subtitle">
                            Have a question or need assistance? Reach out and we'll get back to you as soon as possible.
                        </p>
                    </div>
                </section>

                <section className="contact-us-content">
                    <div className="contact-us-container">
                        <div className="contact-us-grid">
                            <div className="contact-us-form-section">
                                <h2 className="contact-us-section-title">Send Us a Message</h2>

                                {submitStatus === 'success' && (
                                    <div className="contact-us-alert contact-us-alert-success">
                                        Thank you for your message! We'll get back to you soon.
                                    </div>
                                )}

                                {submitStatus === 'error' && (
                                    <div className="contact-us-alert contact-us-alert-error">
                                        Something went wrong. Please try again.
                                    </div>
                                )}

                                <form className="contact-us-form" onSubmit={handleSubmit}>
                                    <div className="contact-us-form-group">
                                        <label className="contact-us-label" htmlFor="name">Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            className="contact-us-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="contact-us-form-group">
                                        <label className="contact-us-label" htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            className="contact-us-input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="contact-us-form-group">
                                        <label className="contact-us-label" htmlFor="subject">Subject</label>
                                        <select
                                            id="subject"
                                            name="subject"
                                            className="contact-us-input contact-us-select"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select a subject</option>
                                            <option value="general">General Inquiry</option>
                                            <option value="support">Technical Support</option>
                                            <option value="billing">Billing Question</option>
                                            <option value="feedback">Feedback</option>
                                            <option value="partnership">Partnership</option>
                                        </select>
                                    </div>

                                    <div className="contact-us-form-group">
                                        <label className="contact-us-label" htmlFor="message">Message</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            className="contact-us-input contact-us-textarea"
                                            rows="5"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="contact-us-submit-btn"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Message'}
                                    </button>
                                </form>
                            </div>

                            <div className="contact-us-info-section">
                                <h2 className="contact-us-section-title">Get in Touch</h2>

                                <div className="contact-us-info-card">
                                    <div className="contact-us-info-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                            <polyline points="22,6 12,13 2,6"/>
                                        </svg>
                                    </div>
                                    <div className="contact-us-info-content">
                                        <h3 className="contact-us-info-title">Email</h3>
                                        <a href="mailto:support@mymedicalcabinet.com" className="contact-us-info-link">
                                            support@mymedicalcabinet.com
                                        </a>
                                    </div>
                                </div>

                                <div className="contact-us-info-card">
                                    <div className="contact-us-info-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="M12 6v6l4 2"/>
                                        </svg>
                                    </div>
                                    <div className="contact-us-info-content">
                                        <h3 className="contact-us-info-title">Response Time</h3>
                                        <p className="contact-us-info-text">
                                            We typically respond within 24-48 hours
                                        </p>
                                    </div>
                                </div>

                                <div className="contact-us-info-card">
                                    <div className="contact-us-info-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                        </svg>
                                    </div>
                                    <div className="contact-us-info-content">
                                        <h3 className="contact-us-info-title">FAQ</h3>
                                        <p className="contact-us-info-text">
                                            Check our FAQ for quick answers to common questions
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default ContactUs;
