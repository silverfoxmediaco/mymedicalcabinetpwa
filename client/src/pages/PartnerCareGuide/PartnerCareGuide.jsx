import React, { useState, useRef, useCallback } from 'react';
import './PartnerCareGuide.css';

const API_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

const formatCurrency = (num) => {
    return '$' + Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
};

const PartnerCareGuide = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [error, setError] = useState(null);

    // Guest info for sending offer
    const [guestFirstName, setGuestFirstName] = useState('');
    const [guestLastName, setGuestLastName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [billerName, setBillerName] = useState('');
    const [billerEmail, setBillerEmail] = useState('');
    const [offerAmount, setOfferAmount] = useState('');
    const [patientMessage, setPatientMessage] = useState('');
    const [sendingOffer, setSendingOffer] = useState(false);
    const [offerSent, setOfferSent] = useState(false);

    const fileInputRef = useRef(null);
    const resultsRef = useRef(null);
    const uploadRef = useRef(null);

    const handleFileSelect = useCallback((file) => {
        if (!file) return;
        setSelectedFile(file);
        setAnalysisResults(null);
        setError(null);
        setOfferSent(false);
    }, []);

    const handleFileInputChange = (e) => {
        if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setAnalysisResults(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setAnalyzing(true);
        setError(null);

        const maxRetries = 2;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const formData = new FormData();
                formData.append('file', selectedFile);

                if (attempt > 0) {
                    setError(null);
                }

                const resp = await fetch(`${API_URL}/medical-bills/scan/guest`, {
                    method: 'POST',
                    body: formData
                });

                if (!resp.ok) {
                    const errData = await resp.json().catch(() => ({}));
                    const msg = errData.message || '';
                    // Retry on overloaded errors
                    if ((resp.status === 500 || resp.status === 529) && msg.includes('overloaded') && attempt < maxRetries) {
                        setError('Our AI is busy — retrying automatically...');
                        await new Promise(r => setTimeout(r, 3000));
                        continue;
                    }
                    throw new Error(msg || 'Analysis failed');
                }

                const data = await resp.json();
                const extracted = data.extracted || {};
                setAnalysisResults(extracted);
                setError(null);

                // Pre-populate offer form fields from AI results
                const ai = extracted.aiAnalysis || {};
                const aiT = ai.totals || {};
                const recOffer = aiT.recommendedPatientOffer || (aiT.amountBilled > 0 && aiT.estimatedSavings > 0 ? aiT.amountBilled - aiT.estimatedSavings : 0);
                if (recOffer > 0) setOfferAmount(recOffer.toFixed(2));
                // Pre-populate biller name if available from AI extraction
                if (extracted.billerName) setBillerName(extracted.billerName);

                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
                break;
            } catch (err) {
                console.error('Analysis error:', err);
                if (attempt === maxRetries) {
                    const msg = (err.message || '').toLowerCase();
                    if (msg.includes('overloaded') || msg.includes('529')) {
                        setError('Our AI service is temporarily busy. Please wait a moment and try again.');
                    } else {
                        setError(err.message || 'Unable to analyze your bill. Please try again.');
                    }
                }
            }
        }
        setAnalyzing(false);
    };

    const handleSendOffer = async () => {
        if (!guestFirstName || !guestLastName || !guestEmail) {
            setError('Please enter your name and email.');
            return;
        }
        if (!billerName || !billerEmail) {
            setError('Please enter the biller name and email.');
            return;
        }
        if (!offerAmount || Number(offerAmount) <= 0) {
            setError('Please enter a valid offer amount.');
            return;
        }
        setSendingOffer(true);
        setError(null);

        try {
            const resp = await fetch(`${API_URL}/settlement-offers/guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestFirstName,
                    guestLastName,
                    guestEmail,
                    billerName,
                    billerEmail,
                    offerAmount: Number(offerAmount),
                    originalBillAmount: billed,
                    patientMessage,
                    partnerRef: 'careguide'
                })
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to send offer');
            }

            setOfferSent(true);
        } catch (err) {
            console.error('Send offer error:', err);
            setError(err.message || 'Unable to send offer. Please try again.');
        } finally {
            setSendingOffer(false);
        }
    };

    // Extract numbers from results
    const aiAnalysis = analysisResults?.aiAnalysis || {};
    const aiTotals = aiAnalysis.totals || {};
    const billed = aiTotals.amountBilled || 0;
    const fair = aiTotals.fairPriceTotal || 0;
    const savings = aiTotals.estimatedSavings || aiAnalysis.estimatedSavings || 0;
    const offer = aiTotals.recommendedPatientOffer || (billed > 0 && savings > 0 ? billed - savings : 0);

    return (
        <div className="pcg-page">
            {/* Header */}
            <div className="pcg-header">
                <div className="pcg-header-inner">
                    <img
                        src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/careguide/CareGuide-whitelightgreen.avif"
                        alt="CareGuide Advocates"
                        className="pcg-header-logo-cg"
                    />
                    <span className="pcg-header-x">+</span>
                    <img
                        src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/mymedicalcabinet600 (1).png"
                        alt="MyMedicalCabinet"
                        className="pcg-header-logo-mmc"
                    />
                </div>
            </div>

            {/* Hero */}
            <section className="pcg-hero">
                <div className="pcg-container">
                    <div className="pcg-hero-badge">Referred by CareGuide Advocates</div>
                    <h1 className="pcg-hero-title">
                        Your medical bill may be<br />
                        <span className="pcg-hero-accent">lower than you think.</span>
                    </h1>
                    <p className="pcg-hero-subtitle">
                        Upload your bill and our AI will analyze it for errors, compare prices against Medicare fair rates, and tell you exactly how much you could save — in seconds.
                    </p>
                    <button
                        className="pcg-hero-cta"
                        onClick={() => uploadRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Analyze My Bill — Free
                    </button>
                    <p className="pcg-hero-trust">No signup required. No credit card. Just upload your bill.</p>
                </div>
            </section>

            {/* How It Works */}
            <section className="pcg-how">
                <div className="pcg-container">
                    <h2 className="pcg-section-title">How It Works</h2>
                    <p className="pcg-section-subtitle">Three simple steps to a lower medical bill.</p>
                    <div className="pcg-steps">
                        <div className="pcg-step">
                            <div className="pcg-step-number">1</div>
                            <div className="pcg-step-title">Upload Your Bill</div>
                            <div className="pcg-step-desc">Take a photo or upload a PDF of your medical bill. No account needed.</div>
                        </div>
                        <div className="pcg-step">
                            <div className="pcg-step-number">2</div>
                            <div className="pcg-step-title">AI Analyzes It</div>
                            <div className="pcg-step-desc">Our AI checks every charge against Medicare fair prices and catches billing errors automatically.</div>
                        </div>
                        <div className="pcg-step">
                            <div className="pcg-step-number">3</div>
                            <div className="pcg-step-title">Save Money</div>
                            <div className="pcg-step-desc">See exactly how much you could save. If you like the results, we'll negotiate with your biller for you.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upload Section */}
            <section className="pcg-upload" ref={uploadRef}>
                <div className="pcg-container">
                    <div className="pcg-upload-card">
                        <h2 className="pcg-upload-title">Upload Your Medical Bill</h2>
                        <p className="pcg-upload-subtitle">PDF, photo, or screenshot — we'll handle the rest.</p>

                        {!selectedFile && (
                            <div
                                className="pcg-dropzone"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <div className="pcg-dropzone-icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                </div>
                                <div className="pcg-dropzone-text">Tap to upload or drag and drop</div>
                                <div className="pcg-dropzone-hint">PDF, JPG, PNG up to 10MB</div>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            className="pcg-upload-input"
                            accept=".pdf,.jpg,.jpeg,.png,.heic"
                            onChange={handleFileInputChange}
                        />

                        {selectedFile && (
                            <div className="pcg-file-preview">
                                <span className="pcg-file-icon">&#128196;</span>
                                <div className="pcg-file-info">
                                    <div className="pcg-file-name">{selectedFile.name}</div>
                                    <div className="pcg-file-size">{formatFileSize(selectedFile.size)}</div>
                                </div>
                                <button className="pcg-file-remove" type="button" onClick={handleRemoveFile}>&times;</button>
                            </div>
                        )}

                        {error && <div className="pcg-error">{error}</div>}

                        <button
                            className="pcg-upload-btn"
                            disabled={!selectedFile || analyzing}
                            onClick={handleAnalyze}
                        >
                            {analyzing ? 'Analyzing your bill...' : 'Analyze My Bill'}
                        </button>

                        <p className="pcg-upload-note">
                            Your bill is analyzed securely using AI. We never share your information.
                            <br />By uploading, you agree to our <a href="/privacy" className="pcg-footer-link">Privacy Policy</a>.
                        </p>
                    </div>

                    {/* AI Results */}
                    {analysisResults && !offerSent && (
                        <div className="pcg-results" ref={resultsRef}>
                            <div className="pcg-results-header">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <div className="pcg-results-title">AI Analysis Complete</div>
                            </div>

                            {/* Summary */}
                            {aiAnalysis.summary && (
                                <div className="pcg-results-summary">{aiAnalysis.summary}</div>
                            )}

                            {/* Errors */}
                            {aiAnalysis.errorsFound && aiAnalysis.errorsFound.length > 0 && (
                                <div className="pcg-results-errors">
                                    <div className="pcg-results-errors-title">
                                        Billing Issues Found ({aiAnalysis.errorsFound.length})
                                    </div>
                                    {aiAnalysis.errorsFound.map((err, i) => (
                                        <div key={i} className="pcg-results-error-item">
                                            {err.description || err.error || String(err)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Numbers */}
                            <div className="pcg-results-numbers">
                                <div className="pcg-results-num-row">
                                    <div className="pcg-results-num">
                                        <span className="pcg-results-num-label">Amount Billed</span>
                                        <span className="pcg-results-num-value">{billed > 0 ? formatCurrency(billed) : '—'}</span>
                                    </div>
                                    <div className="pcg-results-num">
                                        <span className="pcg-results-num-label">Fair Price Estimate</span>
                                        <span className="pcg-results-num-value pcg-results-num-green">{fair > 0 ? formatCurrency(fair) : '—'}</span>
                                    </div>
                                    <div className="pcg-results-num">
                                        <span className="pcg-results-num-label">Estimated Savings</span>
                                        <span className="pcg-results-num-value pcg-results-num-green">{savings > 0 ? formatCurrency(savings) : '$0.00'}</span>
                                    </div>
                                    <div className="pcg-results-num">
                                        <span className="pcg-results-num-label">Recommended Offer</span>
                                        <span className="pcg-results-num-value pcg-results-num-blue">{offer > 0 ? formatCurrency(offer) : '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Paytient */}
                            {offer > 0 && (
                                <div className="pcg-results-paytient">
                                    <img
                                        src="https://cdn.prod.website-files.com/631eddfd322acf4bde169f3f/696d988005eb2b30d0b965e2_Paytient%20Dark.svg"
                                        alt="Paytient"
                                        className="pcg-results-paytient-logo"
                                    />
                                    <div>
                                        <div className="pcg-results-paytient-text">
                                            Pay with your Paytient card — <strong>0% interest</strong>, up to 12 months.
                                        </div>
                                        <div className="pcg-results-paytient-monthly">
                                            3 mo — ${(offer / 3).toFixed(2)}/mo | 6 mo — ${(offer / 6).toFixed(2)}/mo | 12 mo — ${(offer / 12).toFixed(2)}/mo
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Send Offer Form */}
                            <div className="pcg-results-cta-section">
                                <h3 className="pcg-form-section-title">Send Settlement Offer</h3>
                                <p className="pcg-results-cta-text">Fill in the details below and we'll send a secure negotiation offer to your biller.</p>

                                {error && <div className="pcg-error">{error}</div>}

                                <div className="pcg-results-form">
                                    <div className="pcg-form-divider">Your Information</div>
                                    <div className="pcg-results-form-row">
                                        <input
                                            type="text"
                                            className="pcg-results-input"
                                            placeholder="First Name *"
                                            value={guestFirstName}
                                            onChange={(e) => setGuestFirstName(e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="pcg-results-input"
                                            placeholder="Last Name *"
                                            value={guestLastName}
                                            onChange={(e) => setGuestLastName(e.target.value)}
                                        />
                                    </div>
                                    <input
                                        type="email"
                                        className="pcg-results-input"
                                        placeholder="Your Email Address *"
                                        value={guestEmail}
                                        onChange={(e) => setGuestEmail(e.target.value)}
                                    />

                                    <div className="pcg-form-divider">Biller Information</div>
                                    <input
                                        type="text"
                                        className="pcg-results-input"
                                        placeholder="Biller / Hospital Name *"
                                        value={billerName}
                                        onChange={(e) => setBillerName(e.target.value)}
                                    />
                                    <input
                                        type="email"
                                        className="pcg-results-input"
                                        placeholder="Biller Email Address *"
                                        value={billerEmail}
                                        onChange={(e) => setBillerEmail(e.target.value)}
                                    />

                                    <div className="pcg-form-divider">Offer Details</div>
                                    <div className="pcg-offer-amount-group">
                                        <label className="pcg-offer-amount-label">
                                            Offer Amount
                                            {offer > 0 && <span className="pcg-offer-amount-hint">AI recommended: {formatCurrency(offer)}</span>}
                                        </label>
                                        <div className="pcg-offer-amount-input-wrap">
                                            <span className="pcg-offer-amount-prefix">$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                className="pcg-results-input pcg-offer-amount-input"
                                                placeholder="0.00"
                                                value={offerAmount}
                                                onChange={(e) => setOfferAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        className="pcg-results-textarea"
                                        placeholder="Message to biller (optional)"
                                        rows={3}
                                        value={patientMessage}
                                        onChange={(e) => setPatientMessage(e.target.value)}
                                    />

                                    <button
                                        className="pcg-results-submit"
                                        onClick={handleSendOffer}
                                        disabled={sendingOffer}
                                    >
                                        {sendingOffer ? 'Sending Offer...' : 'Send Offer to Biller'}
                                    </button>
                                    <p className="pcg-upload-note">
                                        The biller will receive a secure email with your offer and a verification code to respond.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Offer Sent Confirmation */}
                    {offerSent && (
                        <div className="pcg-results" ref={resultsRef}>
                            <div className="pcg-offer-sent">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <h3 className="pcg-offer-sent-title">Offer Sent!</h3>
                                <p className="pcg-offer-sent-desc">
                                    Your settlement offer of {offer > 0 ? formatCurrency(offer) : 'the recommended amount'} has been sent to the biller. We'll notify you at <strong>{guestEmail}</strong> when they respond.
                                </p>
                                <div className="pcg-offer-sent-membership">
                                    <h4 className="pcg-offer-sent-membership-title">You now have a free MyMedicalCabinet membership!</h4>
                                    <p className="pcg-offer-sent-membership-desc">
                                        Create a password to access your full account — manage medical records, medications, appointments, insurance, and more.
                                    </p>
                                    <a href={`/login?signup=true&email=${encodeURIComponent(guestEmail)}&firstName=${encodeURIComponent(guestFirstName)}&lastName=${encodeURIComponent(guestLastName)}&ref=careguide`} className="pcg-offer-sent-cta">
                                        Create My Free Account
                                    </a>
                                    <p className="pcg-offer-sent-skip">No thanks, I'll do this later.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Trust */}
            <section className="pcg-trust">
                <div className="pcg-container">
                    <div className="pcg-trust-grid">
                        <div className="pcg-trust-item">
                            <div className="pcg-trust-icon">&#128274;</div>
                            <div className="pcg-trust-text">Bank-Level Security</div>
                            <div className="pcg-trust-sub">256-bit encryption</div>
                        </div>
                        <div className="pcg-trust-item">
                            <div className="pcg-trust-icon">&#129302;</div>
                            <div className="pcg-trust-text">AI-Powered Analysis</div>
                            <div className="pcg-trust-sub">CMS Medicare rate comparison</div>
                        </div>
                        <div className="pcg-trust-item">
                            <div className="pcg-trust-icon">&#128176;</div>
                            <div className="pcg-trust-text">No Upfront Cost</div>
                            <div className="pcg-trust-sub">Only pay when you save</div>
                        </div>
                        <div className="pcg-trust-item">
                            <div className="pcg-trust-icon">&#127973;</div>
                            <div className="pcg-trust-text">493+ Health Systems</div>
                            <div className="pcg-trust-sub">Epic MyChart integrated</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="pcg-footer">
                <div className="pcg-container">
                    <div className="pcg-footer-logos">
                        <img src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/careguide/CareGuide-whitelightgreen.avif" alt="CareGuide" className="pcg-footer-logo pcg-footer-logo-cg" />
                        <span className="pcg-footer-x">+</span>
                        <img src="https://mymedicalcabinet.s3.us-east-2.amazonaws.com/logos/mymedicalcabinet600 (1).png" alt="MyMedicalCabinet" className="pcg-footer-logo" />
                    </div>
                    <p className="pcg-footer-text">
                        Powered by <a href="https://mymedicalcabinet.com" className="pcg-footer-link">MyMedicalCabinet</a> in partnership with <a href="https://www.cgasaves.com" className="pcg-footer-link" target="_blank" rel="noopener noreferrer">CareGuide Advocates</a>.
                        <br />
                        <a href="/privacy" className="pcg-footer-link">Privacy Policy</a> &bull; <a href="/terms" className="pcg-footer-link">Terms of Service</a>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PartnerCareGuide;
