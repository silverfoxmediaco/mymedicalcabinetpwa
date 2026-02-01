import React, { useState, useRef, useCallback } from 'react';
import ocrService from '../../../services/ocrService';
import insuranceCardParser from '../../../services/insuranceCardParser';
import './InsuranceCardScanner.css';

const InsuranceCardScanner = ({ onScanComplete, onClose }) => {
    const [mode, setMode] = useState('front'); // 'front', 'back', 'processing', 'review'
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [progress, setProgress] = useState(0);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState(null);

    // Use refs to persist state across camera app opening/closing
    const currentSideRef = useRef('front');
    const frontImageRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleCapture = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File captured:', file.name, file.type, file.size);

        const reader = new FileReader();

        reader.onload = (event) => {
            const imageData = event.target.result;
            console.log('FileReader loaded, current side:', currentSideRef.current);

            if (currentSideRef.current === 'front') {
                // Store front image in both state and ref
                setFrontImage(imageData);
                frontImageRef.current = imageData;
                currentSideRef.current = 'back';
                setMode('back');

                // Reset file input for next capture
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                // Back side captured
                setBackImage(imageData);
                // Use ref for front image in case state was lost
                const front = frontImageRef.current || frontImage;
                processImages(front, imageData);
            }
        };

        reader.onerror = (err) => {
            console.error('FileReader error:', err);
            setError('Failed to read the photo. Please try again.');
        };

        reader.readAsDataURL(file);
    }, [frontImage]);

    const skipBackSide = useCallback(() => {
        const front = frontImageRef.current || frontImage;
        if (front) {
            processImages(front, null);
        } else {
            setError('No front image captured. Please start over.');
            resetScan();
        }
    }, [frontImage]);

    const processImages = async (front, back) => {
        if (!front) {
            setError('No card image to process.');
            return;
        }

        setMode('processing');
        setProgress(0);
        setError(null);

        try {
            // Process front of card
            setProgress(10);
            const frontText = await ocrService.extractText(front, (p) => setProgress(10 + p * 0.4));

            // Process back of card
            setProgress(50);
            const backText = back
                ? await ocrService.extractText(back, (p) => setProgress(50 + p * 0.4))
                : '';

            setProgress(90);

            // Combine text and parse
            const combinedText = `${frontText}\n${backText}`;
            const parsed = insuranceCardParser.parse(combinedText);

            setProgress(100);
            setExtractedData(parsed);
            setMode('review');

        } catch (err) {
            console.error('OCR processing error:', err);
            setError('Failed to read card text. Please try again or enter manually.');
            setMode('front');
        }
    };

    const handleConfirm = () => {
        if (extractedData) {
            onScanComplete({
                provider: {
                    name: extractedData.provider?.name || '',
                    phone: extractedData.phoneNumbers?.[0] || ''
                },
                memberId: extractedData.memberId || '',
                groupNumber: extractedData.groupNumber || '',
                plan: { name: extractedData.planName || '' },
                subscriberName: extractedData.subscriberName || ''
            });
        }
        handleClose();
    };

    const handleClose = () => {
        // Clear sensitive data from memory
        setFrontImage(null);
        setBackImage(null);
        frontImageRef.current = null;
        setExtractedData(null);
        onClose();
    };

    const resetScan = () => {
        setFrontImage(null);
        setBackImage(null);
        frontImageRef.current = null;
        currentSideRef.current = 'front';
        setExtractedData(null);
        setError(null);
        setMode('front');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Keep mode and refs in sync
    const currentSide = mode === 'front' || mode === 'back' ? mode : 'front';
    if (currentSide !== currentSideRef.current && (currentSide === 'front' || currentSide === 'back')) {
        currentSideRef.current = currentSide;
    }

    return (
        <div className="insurance-card-scanner-overlay">
            <div className="insurance-card-scanner-modal" onClick={(e) => e.stopPropagation()}>
                <div className="insurance-card-scanner-header">
                    <h3>Scan Insurance Card</h3>
                    <button
                        type="button"
                        className="insurance-card-scanner-close"
                        onClick={handleClose}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="insurance-card-scanner-content">
                    {(mode === 'front' || mode === 'back') && (
                        <div className="insurance-card-scanner-capture">
                            <div className="scan-instruction">
                                <div className="scan-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="4" width="18" height="14" rx="2" />
                                        <line x1="7" y1="9" x2="17" y2="9" />
                                        <line x1="7" y1="13" x2="13" y2="13" />
                                    </svg>
                                </div>

                                <div className="scan-step-indicator">
                                    <span className={`scan-step ${mode === 'front' ? 'active' : 'completed'}`}>
                                        {mode === 'back' ? '✓' : '1'}
                                    </span>
                                    <span className="scan-step-line"></span>
                                    <span className={`scan-step ${mode === 'back' ? 'active' : ''}`}>2</span>
                                </div>

                                <h4>
                                    {mode === 'front' ? 'Front of Card' : 'Back of Card'}
                                </h4>
                                <p>
                                    {mode === 'front'
                                        ? 'Take a photo of the front of your insurance card'
                                        : 'Now take a photo of the back of your card'
                                    }
                                </p>
                                <p className="scan-privacy">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                    Photos are processed on your device only
                                </p>
                            </div>

                            {error && (
                                <div className="scan-error">{error}</div>
                            )}

                            {/* Preview of captured front image when capturing back */}
                            {mode === 'back' && (frontImage || frontImageRef.current) && (
                                <div className="captured-preview">
                                    <img src={frontImage || frontImageRef.current} alt="Front of card" />
                                    <span className="preview-label">Front captured</span>
                                </div>
                            )}

                            <div className="scan-actions">
                                {/* Use label to trigger file input - more reliable on mobile */}
                                <label className="scan-capture-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                        <circle cx="12" cy="13" r="4"/>
                                    </svg>
                                    {mode === 'front' ? 'Take Photo of Front' : 'Take Photo of Back'}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleCapture}
                                        style={{ display: 'none' }}
                                    />
                                </label>

                                {mode === 'back' && (
                                    <button
                                        type="button"
                                        className="scan-skip-btn"
                                        onClick={skipBackSide}
                                    >
                                        Skip - I only have the front
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {mode === 'processing' && (
                        <div className="insurance-card-scanner-processing">
                            <div className="processing-spinner"></div>
                            <p>Reading your card...</p>
                            <div className="processing-progress">
                                <div
                                    className="processing-progress-bar"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="processing-percent">{progress}%</p>
                        </div>
                    )}

                    {mode === 'review' && extractedData && (
                        <div className="insurance-card-scanner-review">
                            <p className="review-instruction">
                                Review the extracted information and make any corrections:
                            </p>

                            <div className="review-fields">
                                <div className="review-field">
                                    <label>Insurance Provider</label>
                                    <input
                                        type="text"
                                        value={extractedData.provider?.name || ''}
                                        onChange={(e) => setExtractedData(prev => ({
                                            ...prev,
                                            provider: { ...prev.provider, name: e.target.value }
                                        }))}
                                        placeholder="Not detected"
                                    />
                                    {extractedData.provider?.confidence === 'low' && (
                                        <span className="confidence-warning">Please verify</span>
                                    )}
                                </div>

                                <div className="review-field">
                                    <label>Member ID</label>
                                    <input
                                        type="text"
                                        value={extractedData.memberId || ''}
                                        onChange={(e) => setExtractedData(prev => ({
                                            ...prev,
                                            memberId: e.target.value
                                        }))}
                                        placeholder="Not detected"
                                    />
                                </div>

                                <div className="review-field">
                                    <label>Group Number</label>
                                    <input
                                        type="text"
                                        value={extractedData.groupNumber || ''}
                                        onChange={(e) => setExtractedData(prev => ({
                                            ...prev,
                                            groupNumber: e.target.value
                                        }))}
                                        placeholder="Not detected"
                                    />
                                </div>

                                <div className="review-field">
                                    <label>Plan Name</label>
                                    <input
                                        type="text"
                                        value={extractedData.planName || ''}
                                        onChange={(e) => setExtractedData(prev => ({
                                            ...prev,
                                            planName: e.target.value
                                        }))}
                                        placeholder="Not detected"
                                    />
                                </div>

                                <div className="review-field">
                                    <label>Subscriber Name</label>
                                    <input
                                        type="text"
                                        value={extractedData.subscriberName || ''}
                                        onChange={(e) => setExtractedData(prev => ({
                                            ...prev,
                                            subscriberName: e.target.value
                                        }))}
                                        placeholder="Not detected"
                                    />
                                </div>

                                {extractedData.phoneNumbers?.length > 0 && (
                                    <div className="review-field">
                                        <label>Provider Phone</label>
                                        <input
                                            type="text"
                                            value={extractedData.phoneNumbers[0] || ''}
                                            onChange={(e) => setExtractedData(prev => ({
                                                ...prev,
                                                phoneNumbers: [e.target.value, ...prev.phoneNumbers.slice(1)]
                                            }))}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="review-actions">
                                <button
                                    type="button"
                                    className="review-btn secondary"
                                    onClick={resetScan}
                                >
                                    Scan Again
                                </button>
                                <button
                                    type="button"
                                    className="review-btn primary"
                                    onClick={handleConfirm}
                                >
                                    Use This Information
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InsuranceCardScanner;
