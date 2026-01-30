import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { openFdaService } from '../../../services/openFdaService';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScanSuccess, onScanError, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastScannedCode, setLastScannedCode] = useState(null);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        startScanner();

        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        try {
            const html5QrCode = new Html5Qrcode('barcode-scanner-reader');
            html5QrCodeRef.current = html5QrCode;

            const config = {
                fps: 10,
                qrbox: { width: 280, height: 150 },
                aspectRatio: 1.777778,
                formatsToSupport: [
                    0,  // QR Code
                    4,  // Code 128
                    2,  // Code 39
                    7,  // UPC-A
                    8,  // UPC-E
                    13, // EAN-13
                    14  // EAN-8
                ]
            };

            await html5QrCode.start(
                { facingMode: 'environment' },
                config,
                onScanSuccessHandler,
                onScanFailureHandler
            );

            setIsScanning(true);
            setError(null);
        } catch (err) {
            console.error('Scanner start error:', err);
            setError('Unable to access camera. Please ensure camera permissions are granted.');
            if (onScanError) {
                onScanError(err);
            }
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
    };

    const onScanSuccessHandler = async (decodedText, decodedResult) => {
        setIsLoading(true);
        setError(null);
        setLastScannedCode(decodedText);

        try {
            await stopScanner();

            const ndcCode = extractNDC(decodedText);
            console.log('Scanned barcode:', decodedText);
            console.log('Extracted NDC:', ndcCode);

            const drugInfo = await openFdaService.lookupByNDC(ndcCode);

            if (drugInfo) {
                onScanSuccess({
                    ...drugInfo,
                    scannedData: {
                        ndcCode: ndcCode,
                        rawText: decodedText,
                        scannedAt: new Date()
                    }
                });
            } else {
                setError(`Medication not found for code: ${decodedText} (NDC: ${ndcCode})`);
                // Don't auto-restart - let user see error and choose to retry
            }
        } catch (err) {
            console.error('Lookup error:', err);
            setError(`Error looking up medication: ${err.message}`);
            // Don't auto-restart - let user see error and choose to retry
        } finally {
            setIsLoading(false);
        }
    };

    const onScanFailureHandler = (error) => {
        // Silent failure - scanner is just scanning
    };

    const extractNDC = (barcode) => {
        const cleaned = barcode.replace(/\D/g, '');

        // UPC-A starting with 3 contains NDC
        if (cleaned.length === 12 && cleaned.startsWith('3')) {
            return cleaned.slice(1, 11);
        }

        // Direct NDC codes (10 or 11 digits)
        if (cleaned.length === 10 || cleaned.length === 11) {
            return cleaned;
        }

        return cleaned;
    };

    const handleManualFallback = () => {
        stopScanner();
        onClose();
    };

    return (
        <div className="barcode-scanner-container">
            <div className="barcode-scanner-header">
                <h3 className="barcode-scanner-title">Scan Medication Barcode</h3>
                <button
                    type="button"
                    className="barcode-scanner-close"
                    onClick={handleManualFallback}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <div className="barcode-scanner-viewport">
                <div id="barcode-scanner-reader" ref={scannerRef}></div>

                {isLoading && (
                    <div className="barcode-scanner-loading">
                        <div className="barcode-scanner-spinner"></div>
                        <p>Looking up medication...</p>
                    </div>
                )}

                {!isScanning && !isLoading && !error && (
                    <div className="barcode-scanner-initializing">
                        <div className="barcode-scanner-spinner"></div>
                        <p>Initializing camera...</p>
                    </div>
                )}
            </div>

            {error && (
                <div className="barcode-scanner-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p>{error}</p>
                    <button
                        type="button"
                        className="barcode-scanner-retry-btn"
                        onClick={() => {
                            setError(null);
                            setLastScannedCode(null);
                            startScanner();
                        }}
                    >
                        Try Again
                    </button>
                </div>
            )}

            <div className="barcode-scanner-instructions">
                <p>Position the barcode within the frame</p>
                <p className="barcode-scanner-hint">Works with NDC barcodes on medication packaging</p>
            </div>

            <button
                type="button"
                className="barcode-scanner-manual-btn"
                onClick={handleManualFallback}
            >
                Enter medication manually instead
            </button>
        </div>
    );
};

export default BarcodeScanner;
