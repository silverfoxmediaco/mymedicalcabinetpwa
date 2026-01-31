import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../LandingPage.css';

const MedicationErrors = ({ onSignupClick }) => {
    return (
        <div className="landing-page">
            <Header onSignupClick={onSignupClick} />

            <section className="landing-hero">
                <div className="landing-hero-container">
                    <span className="landing-hero-badge">Protect Yourself</span>
                    <h1>Medication Errors Happen More Than You Think</h1>
                    <p className="landing-hero-subtitle">
                        Wrong medication, wrong dose, dangerous interactions - medical mistakes are the third
                        leading cause of death in America. Being informed and organized is your best defense.
                    </p>
                    <Link to="/" className="landing-hero-cta" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Protect Your Health
                    </Link>
                </div>
            </section>

            <section className="landing-pain-points">
                <div className="landing-container">
                    <h2 className="landing-section-title">When Things Go Wrong</h2>
                    <div className="landing-pain-grid">
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">💊</div>
                            <h3>"The pharmacy gave me the wrong pills"</h3>
                            <p>You picked up your prescription and the pills look different. Is it a generic? A mistake? You can't tell because you don't have a record of what it should look like.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">📝</div>
                            <h3>"The doctor prescribed something I'm allergic to"</h3>
                            <p>You told them about your penicillin allergy, but somehow you're holding a prescription for amoxicillin. Same drug family, same dangerous reaction.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">⚠️</div>
                            <h3>"No one told me about the interaction"</h3>
                            <p>Your cardiologist prescribed one thing, your psychiatrist another. Neither knew about the other prescription. Together, they caused a serious reaction.</p>
                        </div>
                        <div className="landing-pain-card">
                            <div className="landing-pain-icon">🔢</div>
                            <h3>"The dosage was wrong"</h3>
                            <p>The prescription said 100mg but you were supposed to get 10mg. A decimal point error. You only caught it because something felt very wrong.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-story">
                <div className="landing-story-content">
                    <blockquote className="landing-story-quote">
                        "My father was prescribed a blood thinner while he was already on aspirin.
                        He started bleeding internally and ended up in the ICU for a week. The ER doctor
                        said if he'd had a list of his current medications, this could have been prevented."
                    </blockquote>
                    <p className="landing-story-attribution">
                        <strong>Angela R.</strong> — Daughter of medication error victim, age 45
                    </p>
                </div>
            </section>

            <section className="landing-solution">
                <div className="landing-container">
                    <h2 className="landing-section-title">Your Safety Net</h2>
                    <div className="landing-solution-grid">
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">⚠️</div>
                            <h3>Interaction Checker</h3>
                            <p>Every time you add a medication, we check it against everything else you're taking. Dangerous combinations trigger immediate alerts.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">🚨</div>
                            <h3>Allergy Alerts</h3>
                            <p>Your allergy list travels with you. When a new prescription is in the same drug family as an allergy, you'll know before you take it.</p>
                        </div>
                        <div className="landing-solution-card">
                            <div className="landing-solution-icon">✓</div>
                            <h3>Verification Tool</h3>
                            <p>Compare what the pharmacy gave you against what was prescribed. Scan the bottle to confirm you have the right medication.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features">
                <div className="landing-container">
                    <h2 className="landing-section-title">Be Your Own Advocate</h2>
                    <div className="landing-features-list">
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Complete Medication List</h4>
                                <p>Know exactly what you're taking, including dosages and frequencies. Show every provider, every time.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Detailed Allergy Records</h4>
                                <p>Document allergies with reaction types and severity. Include drug families, not just specific medications.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Multi-Provider Visibility</h4>
                                <p>When specialists don't communicate, you can. Show each doctor what the others have prescribed.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Barcode Scanning</h4>
                                <p>Scan prescription bottles to verify you received the correct medication. Catch errors before you take the wrong pill.</p>
                            </div>
                        </div>
                        <div className="landing-feature-item">
                            <div className="landing-feature-check">✓</div>
                            <div>
                                <h4>Medication History</h4>
                                <p>Track what you've taken in the past, including why medications were stopped. Avoid re-prescribing drugs that didn't work or caused problems.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-stats">
                <div className="landing-stats-grid">
                    <div className="landing-stat-item">
                        <h3>7,000</h3>
                        <p>deaths yearly from medication errors</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>1.5M</h3>
                        <p>people harmed by medication errors annually</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>$3.5B</h3>
                        <p>annual cost of medication errors</p>
                    </div>
                    <div className="landing-stat-item">
                        <h3>50%</h3>
                        <p>of errors are preventable with better info</p>
                    </div>
                </div>
            </section>

            <section className="landing-cta">
                <div className="landing-cta-container">
                    <h2>Don't Become a Statistic</h2>
                    <p>Being organized and informed is your best protection against medication errors.</p>
                    <Link to="/" className="landing-cta-btn" onClick={(e) => { e.preventDefault(); onSignupClick?.(); }}>
                        Create Free Account
                    </Link>
                    <p className="landing-cta-note">Your safety starts with knowing what you're taking.</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default MedicationErrors;
