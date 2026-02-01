import Tesseract from 'tesseract.js';

/**
 * OCR Service using Tesseract.js
 * Runs entirely client-side - no data leaves the device
 */
const ocrService = {
    /**
     * Extract text from an image
     * @param {string|File|Blob} image - Image source (data URL, File, or Blob)
     * @param {function} onProgress - Optional progress callback
     * @returns {Promise<string>} - Extracted text
     */
    async extractText(image, onProgress = null) {
        try {
            const result = await Tesseract.recognize(
                image,
                'eng',
                {
                    logger: onProgress ? (m) => {
                        if (m.status === 'recognizing text') {
                            onProgress(Math.round(m.progress * 100));
                        }
                    } : undefined
                }
            );

            return result.data.text;
        } catch (error) {
            console.error('OCR extraction failed:', error);
            throw new Error('Failed to extract text from image');
        }
    },

    /**
     * Extract text with confidence scores
     * @param {string|File|Blob} image - Image source
     * @returns {Promise<{text: string, confidence: number, words: Array}>}
     */
    async extractTextWithConfidence(image, onProgress = null) {
        try {
            const result = await Tesseract.recognize(
                image,
                'eng',
                {
                    logger: onProgress ? (m) => {
                        if (m.status === 'recognizing text') {
                            onProgress(Math.round(m.progress * 100));
                        }
                    } : undefined
                }
            );

            return {
                text: result.data.text,
                confidence: result.data.confidence,
                words: result.data.words || []
            };
        } catch (error) {
            console.error('OCR extraction failed:', error);
            throw new Error('Failed to extract text from image');
        }
    }
};

export default ocrService;
