import React, { useState, useRef, useCallback } from 'react';
import ocrService from '../../../services/ocrService';
import insuranceCardParser from '../../../services/insuranceCardParser';
import './InsuranceCardScanner.css';

const InsuranceCardScanner = ({ onScanComplete, onClose }) => {
    const [mode, setMode] = useState('select'); // 'select', 'camera', 'processing', 'review'
    const [cardSide, setCardSide] = useState('front'); // 'front' or 'back'
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [progress, setProgress] = useState(0);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setMode('camera');
        } catch (err) {
            console.error('Camera access error:', err);
            setError('Unable to access camera. Please check permissions or use file upload.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const captureImage = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);

        if (cardSide === 'front') {
            setFrontImage(imageData);
            setCardSide('back');
            // Prompt for back of card
        } else {
            setBackImage(imageData);
            stopCamera();
            processImages(frontImage, imageData);
        }
    }, [cardSide, frontImage, stopCamera]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            if (cardSide === 'front') {
                setFrontImage(imageData);
                setCardSide('back');
                // Reset file input for next selection
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                setBackImage(imageData);
                processImages(frontImage, imageData);
            }
        };
        reader.readAsDataURL(file);
    };

    const processImages = async (front, back) => {
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

            // Clear images from memory for security
            // (we've extracted what we need)
        } catch (err) {
            console.error('OCR processing error:', err);
            setError('Failed to process card images. Please try again or enter manually.');
            setMode('select');
        }
    };

    const skipBackSide = () => {
        stopCamera();
        processImages(frontImage, null);
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
        stopCamera();
        // Clear sensitive data from memory
        setFrontImage(null);
        setBackImage(null);
        setExtractedData(null);
        onClose();
    };

    const resetScan = () => {
        setFrontImage(null);
        setBackImage(null);
        setCardSide('front');
        setExtractedData(null);
        setError(null);
        setMode('select');
    };

    return (
        <div className="insurance-card-scanner-overlay">
            <div className="insurance-card-scanner-modal">
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
                    {mode === 'select' && (
                        <div className="insurance-card-scanner-select">
                            <div className="scan-instruction">
                                <div className="scan-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="4" width="18" height="14" rx="2" />
                                        <line x1="7" y1="9" x2="17" y2="9" />
                                        <line x1="7" y1="13" x2="13" y2="13" />
                                    </svg>
                                </div>
                                <p>Capture the front and back of your insurance card</p>
                                <p className="scan-privacy">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                    Images are processed on your device only
                                </p>
                            </div>

                            {error && (
                                <div className="scan-error">{error}</div>
                            )}

                            <div className="scan-options">
                                <button
                                    type="button"
                                    className="scan-option-btn primary"
                                    onClick={startCamera}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                        <circle cx="12" cy="13" r="4"/>
                                    </svg>
                                    Use Camera
                                </button>

                                <button
                                    type="button"
                                    className="scan-option-btn secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    Upload Photo
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'camera' && (
                        <div className="insurance-card-scanner-camera">
                            <div className="camera-side-indicator">
                                {cardSide === 'front' ? 'Front of Card' : 'Back of Card'}
                            </div>

                            <div className="camera-viewport">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                <div className="camera-guide">
                                    <div className="guide-corner top-left"></div>
                                    <div className="guide-corner top-right"></div>
                                    <div className="guide-corner bottom-left"></div>
                                    <div className="guide-corner bottom-right"></div>
                                </div>
                            </div>

                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            <div className="camera-controls">
                                <button
                                    type="button"
                                    className="camera-capture-btn"
                                    onClick={captureImage}
                                >
                                    <span className="capture-ring"></span>
                                </button>
                            </div>

                            {cardSide === 'back' && (
                                <button
                                    type="button"
                                    className="skip-back-btn"
                                    onClick={skipBackSide}
                                >
                                    Skip back of card
                                </button>
                            )}
                        </div>
                    )}

                    {mode === 'processing' && (
                        <div className="insurance-card-scanner-processing">
                            <div className="processing-spinner"></div>
                            <p>Processing your card...</p>
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
