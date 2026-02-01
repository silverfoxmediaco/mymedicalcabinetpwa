/**
 * Insurance Card Parser
 * Extracts structured data from OCR text of insurance cards
 * All processing happens client-side - no data transmitted
 */

// Common insurance provider names for matching
const INSURANCE_PROVIDERS = [
    { name: 'Aetna', patterns: ['aetna'] },
    { name: 'Anthem', patterns: ['anthem'] },
    { name: 'Blue Cross Blue Shield', patterns: ['blue cross', 'blue shield', 'bcbs', 'bluecross', 'blueshield'] },
    { name: 'Cigna', patterns: ['cigna'] },
    { name: 'United Healthcare', patterns: ['united', 'unitedhealthcare', 'uhc', 'optum'] },
    { name: 'Humana', patterns: ['humana'] },
    { name: 'Kaiser Permanente', patterns: ['kaiser', 'permanente'] },
    { name: 'Molina Healthcare', patterns: ['molina'] },
    { name: 'Centene', patterns: ['centene', 'wellcare', 'ambetter'] },
    { name: 'CVS Health / Aetna', patterns: ['cvs health'] },
    { name: 'Health Care Service Corporation', patterns: ['hcsc'] },
    { name: 'Highmark', patterns: ['highmark'] },
    { name: 'GuideWell / Florida Blue', patterns: ['guidewell', 'florida blue'] },
    { name: 'Independence Health Group', patterns: ['independence'] },
    { name: 'HCSC', patterns: ['hcsc'] },
    { name: 'Oscar Health', patterns: ['oscar'] },
    { name: 'Clover Health', patterns: ['clover'] },
    { name: 'Bright Health', patterns: ['bright health'] },
    { name: 'Devoted Health', patterns: ['devoted'] },
    { name: 'Medicare', patterns: ['medicare', 'cms'] },
    { name: 'Medicaid', patterns: ['medicaid'] },
    { name: 'Tricare', patterns: ['tricare'] }
];

const insuranceCardParser = {
    /**
     * Parse OCR text and extract insurance card fields
     * @param {string} ocrText - Raw text from OCR
     * @returns {object} - Extracted fields
     */
    parse(ocrText) {
        const text = ocrText.toLowerCase();
        const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l);

        return {
            provider: this.extractProvider(text, lines),
            memberId: this.extractMemberId(text, lines),
            groupNumber: this.extractGroupNumber(text, lines),
            planName: this.extractPlanName(text, lines),
            subscriberName: this.extractSubscriberName(text, lines),
            phoneNumbers: this.extractPhoneNumbers(ocrText),
            rxBin: this.extractRxBin(text, lines),
            rxPcn: this.extractRxPcn(text, lines),
            rxGroup: this.extractRxGroup(text, lines)
        };
    },

    /**
     * Extract insurance provider name
     */
    extractProvider(text, lines) {
        for (const provider of INSURANCE_PROVIDERS) {
            for (const pattern of provider.patterns) {
                if (text.includes(pattern)) {
                    return { name: provider.name, confidence: 'high' };
                }
            }
        }

        // If no known provider found, return first line as potential provider
        if (lines.length > 0) {
            return { name: lines[0], confidence: 'low' };
        }

        return { name: '', confidence: 'none' };
    },

    /**
     * Extract Member ID
     */
    extractMemberId(text, lines) {
        // Common patterns for member ID
        const patterns = [
            /member\s*(?:id|#|number)?[:\s]*([a-z0-9\-]+)/i,
            /subscriber\s*(?:id|#|number)?[:\s]*([a-z0-9\-]+)/i,
            /id[:\s#]*([a-z0-9\-]{6,})/i,
            /identification[:\s#]*([a-z0-9\-]+)/i,
            /policy[:\s#]*([a-z0-9\-]+)/i
        ];

        const originalText = lines.join('\n');

        for (const pattern of patterns) {
            const match = originalText.match(pattern);
            if (match && match[1]) {
                return match[1].toUpperCase().trim();
            }
        }

        // Look for standalone alphanumeric strings that look like IDs (9+ chars)
        const idPattern = /\b([a-z]{2,3}[0-9]{6,})\b/i;
        const match = originalText.match(idPattern);
        if (match) {
            return match[1].toUpperCase();
        }

        return '';
    },

    /**
     * Extract Group Number
     */
    extractGroupNumber(text, lines) {
        const patterns = [
            /group\s*(?:#|number|no)?[:\s]*([a-z0-9\-]+)/i,
            /grp[:\s#]*([a-z0-9\-]+)/i,
            /employer\s*(?:group|#)?[:\s]*([a-z0-9\-]+)/i
        ];

        const originalText = lines.join('\n');

        for (const pattern of patterns) {
            const match = originalText.match(pattern);
            if (match && match[1]) {
                // Don't return if it matches the member ID pattern
                const result = match[1].toUpperCase().trim();
                if (result.length >= 3) {
                    return result;
                }
            }
        }

        return '';
    },

    /**
     * Extract Plan Name
     */
    extractPlanName(text, lines) {
        const patterns = [
            /plan[:\s]*([a-z0-9\s\-]+?)(?:\n|$)/i,
            /coverage[:\s]*([a-z0-9\s\-]+?)(?:\n|$)/i,
            /((?:gold|silver|bronze|platinum)\s*\d*)/i,
            /((?:hmo|ppo|epo|pos|hdhp)\s*[\w\s]*)/i
        ];

        const originalText = lines.join('\n');

        for (const pattern of patterns) {
            const match = originalText.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return '';
    },

    /**
     * Extract Subscriber Name
     */
    extractSubscriberName(text, lines) {
        const patterns = [
            /(?:subscriber|member|name)[:\s]*([a-z\s\-']+?)(?:\n|$)/i,
            /patient[:\s]*([a-z\s\-']+?)(?:\n|$)/i
        ];

        const originalText = lines.join('\n');

        for (const pattern of patterns) {
            const match = originalText.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim();
                // Filter out common false positives
                if (name.length > 3 && !name.match(/^(id|number|group|plan)/i)) {
                    return name;
                }
            }
        }

        return '';
    },

    /**
     * Extract Phone Numbers
     */
    extractPhoneNumbers(text) {
        const phonePattern = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
        const phones = [];
        let match;

        while ((match = phonePattern.exec(text)) !== null) {
            const phone = `(${match[1]}) ${match[2]}-${match[3]}`;
            if (!phones.includes(phone)) {
                phones.push(phone);
            }
        }

        return phones;
    },

    /**
     * Extract RxBin (pharmacy benefit)
     */
    extractRxBin(text, lines) {
        const pattern = /(?:rx\s*)?bin[:\s#]*(\d{6})/i;
        const originalText = lines.join('\n');
        const match = originalText.match(pattern);
        return match ? match[1] : '';
    },

    /**
     * Extract RxPCN (pharmacy benefit)
     */
    extractRxPcn(text, lines) {
        const pattern = /pcn[:\s#]*([a-z0-9]+)/i;
        const originalText = lines.join('\n');
        const match = originalText.match(pattern);
        return match ? match[1].toUpperCase() : '';
    },

    /**
     * Extract RxGroup (pharmacy benefit)
     */
    extractRxGroup(text, lines) {
        const pattern = /rx\s*(?:group|grp)[:\s#]*([a-z0-9]+)/i;
        const originalText = lines.join('\n');
        const match = originalText.match(pattern);
        return match ? match[1].toUpperCase() : '';
    }
};

export default insuranceCardParser;
