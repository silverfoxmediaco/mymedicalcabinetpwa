/**
 * Insurance Card Parser
 * Extracts structured data from OCR text of insurance cards
 * All processing happens client-side - no data transmitted
 */

// Common insurance provider names for matching
const INSURANCE_PROVIDERS = [
    { name: 'Wellmark Blue Cross Blue Shield', patterns: ['wellmark', 'wellmarkblue'] },
    { name: 'Aetna', patterns: ['aetna'] },
    { name: 'Anthem Blue Cross Blue Shield', patterns: ['anthem'] },
    { name: 'Blue Cross Blue Shield', patterns: ['blue cross', 'blue shield', 'bcbs', 'bluecross', 'blueshield'] },
    { name: 'Cigna', patterns: ['cigna'] },
    { name: 'United Healthcare', patterns: ['united healthcare', 'unitedhealthcare', 'uhc', 'optum'] },
    { name: 'Humana', patterns: ['humana'] },
    { name: 'Kaiser Permanente', patterns: ['kaiser', 'permanente'] },
    { name: 'Molina Healthcare', patterns: ['molina'] },
    { name: 'Centene', patterns: ['centene', 'wellcare', 'ambetter'] },
    { name: 'CVS Health / Aetna', patterns: ['cvs health'] },
    { name: 'Health Care Service Corporation', patterns: ['hcsc'] },
    { name: 'Highmark Blue Cross Blue Shield', patterns: ['highmark'] },
    { name: 'Florida Blue', patterns: ['guidewell', 'florida blue'] },
    { name: 'Independence Blue Cross', patterns: ['independence'] },
    { name: 'Oscar Health', patterns: ['oscar health'] },
    { name: 'Clover Health', patterns: ['clover health'] },
    { name: 'Bright Health', patterns: ['bright health'] },
    { name: 'Devoted Health', patterns: ['devoted health'] },
    { name: 'Medicare', patterns: ['medicare', 'cms'] },
    { name: 'Medicaid', patterns: ['medicaid'] },
    { name: 'Tricare', patterns: ['tricare'] },
    { name: 'Premera Blue Cross', patterns: ['premera'] },
    { name: 'Regence Blue Cross Blue Shield', patterns: ['regence'] },
    { name: 'CareFirst Blue Cross Blue Shield', patterns: ['carefirst'] },
    { name: 'Excellus Blue Cross Blue Shield', patterns: ['excellus'] },
    { name: 'Horizon Blue Cross Blue Shield', patterns: ['horizon'] }
];

const insuranceCardParser = {
    /**
     * Parse OCR text and extract insurance card fields
     * @param {string} ocrText - Raw text from OCR
     * @returns {object} - Extracted fields
     */
    parse(ocrText) {
        // Clean up OCR text - normalize spaces and remove extra whitespace
        const cleanedText = ocrText
            .replace(/\s+/g, ' ')
            .replace(/[|]/g, '')
            .trim();

        const text = cleanedText.toLowerCase();
        const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 1);
        const originalText = lines.join('\n');

        // Debug: log the OCR text to help with pattern matching
        console.log('OCR Text:', originalText);

        return {
            provider: this.extractProvider(text, lines),
            memberId: this.extractMemberId(originalText),
            groupNumber: this.extractGroupNumber(originalText),
            planName: this.extractPlanName(originalText),
            subscriberName: this.extractSubscriberName(originalText),
            phoneNumbers: this.extractPhoneNumbers(ocrText),
            rxBin: this.extractRxBin(originalText),
            rxPcn: this.extractRxPcn(originalText),
            rxGroup: this.extractRxGroup(originalText)
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

        // If no known provider found, return first non-trivial line
        for (const line of lines) {
            if (line.length > 5 && !line.match(/^\d+$/)) {
                return { name: line, confidence: 'low' };
            }
        }

        return { name: '', confidence: 'none' };
    },

    /**
     * Extract Member ID - looks for labeled IDs and long alphanumeric strings
     */
    extractMemberId(text) {
        // Patterns for labeled member IDs
        const labeledPatterns = [
            /member\s*(?:id|#|no\.?|number)?[:\s]+([A-Z0-9][A-Z0-9\-]{5,})/i,
            /subscriber\s*(?:id|#|no\.?|number)?[:\s]+([A-Z0-9][A-Z0-9\-]{5,})/i,
            /id\s*(?:#|no\.?|number)?[:\s]+([A-Z0-9][A-Z0-9\-]{7,})/i,
            /identification[:\s]+([A-Z0-9][A-Z0-9\-]{5,})/i,
            /policy\s*(?:#|no\.?)?[:\s]+([A-Z0-9][A-Z0-9\-]{5,})/i,
            /member[:\s]+([A-Z0-9][A-Z0-9\-]{7,})/i
        ];

        for (const pattern of labeledPatterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[1].length >= 6) {
                const id = match[1].toUpperCase().trim();
                // Validate it looks like an ID (has numbers)
                if (/\d/.test(id)) {
                    return id;
                }
            }
        }

        // Look for standalone long alphanumeric strings (common ID formats)
        const standalonePatterns = [
            /\b([A-Z]{3,4}[0-9]{9,12})\b/i,   // SHIW021823342 format (3-4 letters + 9-12 numbers)
            /\b([A-Z]{2,3}[0-9]{8,12})\b/i,   // ABC123456789
            /\b([A-Z][0-9]{8,11})\b/i,         // A12345678
            /\b([0-9]{3}[A-Z][0-9]{5,8})\b/i,  // 123A45678
            /\b([A-Z0-9]{3}[\-\s]?[A-Z0-9]{3}[\-\s]?[A-Z0-9]{3,})\b/i // XXX-XXX-XXX format
        ];

        for (const pattern of standalonePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const id = match[1].toUpperCase().replace(/\s/g, '');
                if (id.length >= 9 && /\d/.test(id)) {
                    return id;
                }
            }
        }

        return '';
    },

    /**
     * Extract Group Number
     */
    extractGroupNumber(text) {
        const patterns = [
            /group\s*no\.?[:\s]+(\d{4,})/i,                              // "Group No. 78921"
            /group\s*(?:#|no\.?|number)?[:\s]+([A-Z0-9][A-Z0-9\-]{3,})/i,
            /grp\s*(?:#|no\.?)?[:\s]+([A-Z0-9][A-Z0-9\-]{3,})/i,
            /employer\s*(?:group|#|no\.?)?[:\s]+([A-Z0-9][A-Z0-9\-]{3,})/i,
            /group[:\s]+([0-9]{4,})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[1].length >= 4) {
                return match[1].toUpperCase().trim();
            }
        }

        return '';
    },

    /**
     * Extract Plan Name
     */
    extractPlanName(text) {
        // Look for common plan type keywords first
        const planTypePatterns = [
            /\b(PPO|HMO|EPO|POS|HDHP)\b/i,                                // Standalone plan types
            /((?:gold|silver|bronze|platinum)\s*(?:plan)?\s*\d*)/i,
            /((?:hmo|ppo|epo|pos|hdhp)\s*(?:plan)?[\s\w]{0,20})/i,
            /plan\s*(?:name|code)?[:\s]+([A-Za-z0-9\s\-\/]{3,30})/i,      // Plan Code: 640/140
            /coverage[:\s]+([A-Za-z0-9\s\-]{4,30})/i
        ];

        for (const pattern of planTypePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const plan = match[1].trim();
                // Validate it's not just common words
                if (plan.length >= 3 && !/^(the|and|for|plan|code)$/i.test(plan)) {
                    return plan;
                }
            }
        }

        return '';
    },

    /**
     * Extract Subscriber Name - look for name patterns
     */
    extractSubscriberName(text) {
        const patterns = [
            /(?:subscriber|member|patient|name)[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
            /(?:subscriber|member|patient|name)[:\s]+([A-Z][A-Z\s]{3,30})/,
            /([A-Z][a-z]+\s+[A-Z]\.\s*[A-Z][a-z]+)/ // First M. Last format
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim();
                // Validate it looks like a name
                if (name.length >= 5 && name.includes(' ') && !/\d/.test(name)) {
                    // Skip if it's common label text
                    if (!/^(blue cross|member id|group|subscriber|insurance)/i.test(name)) {
                        return name;
                    }
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
     * Extract RxBin (pharmacy benefit) - always 6 digits
     */
    extractRxBin(text) {
        const patterns = [
            /rxbin[:\s]+(\d{6})/i,           // RXBIN 004336
            /rx\s*bin[:\s#]+(\d{6})/i,
            /bin[:\s]+(\d{6})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return '';
    },

    /**
     * Extract RxPCN (pharmacy benefit)
     */
    extractRxPcn(text) {
        const patterns = [
            /rxpcn[:\s]+([A-Z0-9]{2,})/i,    // RXPCN ADV
            /rx\s*pcn[:\s#]+([A-Z0-9]{2,})/i,
            /pcn[:\s#]+([A-Z0-9]{2,})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].toUpperCase();
            }
        }
        return '';
    },

    /**
     * Extract RxGroup (pharmacy benefit)
     */
    extractRxGroup(text) {
        const patterns = [
            /rxgrp[:\s]+([A-Z0-9]{3,})/i,    // RXGRP RX1021
            /rx\s*grp[:\s#]+([A-Z0-9]{3,})/i,
            /rx\s*(?:group|grp)[:\s#]+([A-Z0-9]{3,})/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].toUpperCase();
            }
        }
        return '';
    }
};

export default insuranceCardParser;
