const OPENFDA_BASE = 'https://api.fda.gov/drug';

export const openFdaService = {
    async lookupByNDC(ndcCode) {
        const cleanedNDC = ndcCode.replace(/-/g, '');

        // Generate all possible NDC formats from the barcode
        const formats = this.generateNDCFormats(cleanedNDC);

        // Try product_ndc search first
        for (const ndc of formats) {
            try {
                const response = await fetch(
                    `${OPENFDA_BASE}/ndc.json?search=product_ndc:"${ndc}"&limit=1`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.results && data.results.length > 0) {
                        return this.parseFdaResult(data.results[0]);
                    }
                }
            } catch (error) {
                continue;
            }
        }

        // Try package_ndc search as fallback (includes full barcode NDC)
        for (const ndc of formats) {
            try {
                const response = await fetch(
                    `${OPENFDA_BASE}/ndc.json?search=packaging.package_ndc:"${ndc}"&limit=1`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.results && data.results.length > 0) {
                        return this.parseFdaResult(data.results[0]);
                    }
                }
            } catch (error) {
                continue;
            }
        }

        return null;
    },

    generateNDCFormats(ndc) {
        const formats = new Set();
        const digits = ndc.replace(/\D/g, '');

        // Add original
        formats.add(ndc);
        formats.add(digits);

        // Standard 10-digit formats with dashes
        if (digits.length >= 10) {
            // 5-4-1 format
            formats.add(`${digits.slice(0,5)}-${digits.slice(5,9)}-${digits.slice(9,10)}`);
            // 5-3-2 format
            formats.add(`${digits.slice(0,5)}-${digits.slice(5,8)}-${digits.slice(8,10)}`);
            // 4-4-2 format
            formats.add(`${digits.slice(0,4)}-${digits.slice(4,8)}-${digits.slice(8,10)}`);
            // 5-4-2 format (11 digits)
            formats.add(`${digits.slice(0,5)}-${digits.slice(5,9)}-${digits.slice(9,11)}`);

            // Product NDC only (without package code) - these are common in FDA
            // 5-4 format
            formats.add(`${digits.slice(0,5)}-${digits.slice(5,9)}`);
            // 5-3 format
            formats.add(`${digits.slice(0,5)}-${digits.slice(5,8)}`);
            // 4-4 format
            formats.add(`${digits.slice(0,4)}-${digits.slice(4,8)}`);
        }

        // Try removing leading zero if present (NDC-10 vs NDC-11 conversion)
        if (digits.length === 11 && digits.startsWith('0')) {
            const tenDigit = digits.slice(1);
            formats.add(tenDigit);
            formats.add(`${tenDigit.slice(0,5)}-${tenDigit.slice(5,9)}-${tenDigit.slice(9,10)}`);
            formats.add(`${tenDigit.slice(0,5)}-${tenDigit.slice(5,8)}-${tenDigit.slice(8,10)}`);
            formats.add(`${tenDigit.slice(0,5)}-${tenDigit.slice(5,9)}`);
            formats.add(`${tenDigit.slice(0,5)}-${tenDigit.slice(5,8)}`);
        }

        return Array.from(formats);
    },

    formatNDC(ndc, format) {
        const digits = ndc.replace(/\D/g, '');
        const parts = format.split('-').map(Number);
        let result = [];
        let pos = 0;

        for (const len of parts) {
            result.push(digits.slice(pos, pos + len));
            pos += len;
        }

        return result.join('-');
    },

    async lookupByUPC(upcCode) {
        let ndcCode = upcCode;

        if (upcCode.length === 12 && upcCode.startsWith('3')) {
            ndcCode = upcCode.slice(1, 11);
        }

        return this.lookupByNDC(ndcCode);
    },

    parseFdaResult(result) {
        return {
            name: result.brand_name || result.generic_name || 'Unknown',
            genericName: result.generic_name || '',
            manufacturer: result.labeler_name || '',
            dosageForm: result.dosage_form || '',
            route: result.route ? result.route[0] : '',
            activeIngredients: result.active_ingredients || [],
            ndcCode: result.product_ndc || '',
            packaging: result.packaging || [],
            strength: this.extractStrength(result)
        };
    },

    extractStrength(result) {
        if (result.active_ingredients && result.active_ingredients.length > 0) {
            const ingredient = result.active_ingredients[0];
            return `${ingredient.strength || ''}`;
        }
        return '';
    },

    async getIndications(drugName) {
        if (!drugName) return '';
        try {
            const response = await fetch(
                `${OPENFDA_BASE}/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"+openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`
            );

            if (!response.ok) return '';

            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const label = data.results[0];
                // indications_and_usage is an array of strings
                let indications = label.indications_and_usage?.[0] || label.purpose?.[0] || '';
                if (!indications) return '';
                // Strip section headers like "1 INDICATIONS AND USAGE", "INDICATIONS AND USAGE", numbered prefixes
                indications = indications
                    .replace(/^\d+(\.\d+)?\s*/g, '')
                    .replace(/^INDICATIONS?\s*(AND\s*USAGE)?\s*/i, '')
                    .trim();
                // Return full indications text (textarea will handle display)
                return indications;
            }
            return '';
        } catch (error) {
            console.error('OpenFDA indications lookup error:', error);
            return '';
        }
    },

    async searchByName(drugName) {
        try {
            const response = await fetch(
                `${OPENFDA_BASE}/ndc.json?search=brand_name:"${encodeURIComponent(drugName)}"&limit=10`
            );

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            if (data.results) {
                return data.results.map(r => this.parseFdaResult(r));
            }

            return [];
        } catch (error) {
            console.error('OpenFDA search error:', error);
            return [];
        }
    }
};

export default openFdaService;
