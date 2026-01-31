import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const FamilyHealthHistory = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">Know Your Risk</span>
                    <h1>Does Heart Disease Run in Your Family?</h1>
                    <p className="landing-hero-subtitle">
                        Your family health history is one of the strongest predictors of your own health risks.
                        But do you actually know what conditions run in your family - and have you told your doctor?
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Document Your History
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">The Questions You Can't Answer</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">👴</div>
                            <h3>"What did grandpa die from?"</h3>
                            <p>You remember he had heart problems, but was it a heart attack? Heart failure? Did he have diabetes too? The details matter for your risk assessment.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🧬</div>
                            <h3>"Does cancer run in our family?"</h3>
                            <p>Your aunt had breast cancer, but what about your grandmother's sisters? Family health history goes back generations, and that information saves lives.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🤐</div>
                            <h3>"We don't talk about that"</h3>
                            <p>Mental health, addiction, certain cancers - some families don't discuss these openly. But your doctor needs to know for proper screening.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📋</div>
                            <h3>"The doctor form asks, but I don't know"</h3>
                            <p>Every new patient form asks about family history. You check "unknown" for most boxes because you've never documented this information.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "My doctor found my breast cancer early because I told her about my aunt and
                        grandmother. She ordered a mammogram at 38 instead of waiting until 40. That
                        early detection probably saved my life. I wish I'd known more about my family history sooner."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>Maria C.</strong> — Breast cancer survivor, age 42
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Document Your Family's Health Legacy</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">👨‍👩‍👧‍👦</div>
                            <h3>Multi-Generation Tracking</h3>
                            <p>Document health conditions for parents, grandparents, siblings, aunts, uncles, and cousins. Build a complete picture.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">⚠️</div>
                            <h3>Risk Awareness</h3>
                            <p>Understanding patterns in your family helps you and your doctor know what screenings and preventive care you might need.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">📤</div>
                            <h3>Share with Doctors</h3>
                            <p>Give your doctor a clear family health history instead of trying to remember details during a 15-minute appointment.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">What to Track</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Heart Disease & Stroke</h4>
                                <p>Heart attacks, heart failure, high blood pressure, stroke, high cholesterol - note who had what and at what age.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Cancer History</h4>
                                <p>Types of cancer, age at diagnosis, and outcomes. Hereditary patterns can qualify you for earlier screening.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Diabetes</h4>
                                <p>Type 1 or Type 2, age of onset, complications. Strong family history increases your risk significantly.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Mental Health</h4>
                                <p>Depression, anxiety, bipolar disorder, schizophrenia. These conditions have genetic components worth documenting.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Autoimmune Conditions</h4>
                                <p>Rheumatoid arthritis, lupus, thyroid disease, multiple sclerosis. Autoimmune conditions often cluster in families.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>30%</h3>
                        <p>of cancer risk is hereditary</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>2x</h3>
                        <p>heart disease risk with family history</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>96%</h3>
                        <p>of people say family history is important</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>30%</h3>
                        <p>have actually collected their history</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Start the Conversation</h2>
                    <p>Talk to your family. Document what you learn. It could save your life - or theirs.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">Build your family health tree one relative at a time.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default FamilyHealthHistory;
