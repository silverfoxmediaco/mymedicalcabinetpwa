const OPENFDA_BASE = 'https://api.fda.gov/drug';

export const openFdaService = {
    async lookupByNDC(ndcCode) {
        const cleanedNDC = ndcCode.replace(/-/g, '');

        const formats = [
            ndcCode,
            cleanedNDC,
            this.formatNDC(cleanedNDC, '4-4-2'),
            this.formatNDC(cleanedNDC, '5-3-2'),
            this.formatNDC(cleanedNDC, '5-4-1'),
            this.formatNDC(cleanedNDC, '5-4-2')
        ];

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

        return null;
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
