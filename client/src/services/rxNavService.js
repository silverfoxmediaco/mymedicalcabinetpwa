const RXNAV_BASE = 'https://rxnav.nlm.nih.gov/REST';

export const rxNavService = {
    async autocomplete(term) {
        if (!term || term.length < 2) {
            return [];
        }

        try {
            const response = await fetch(
                `${RXNAV_BASE}/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=10`
            );

            if (!response.ok) {
                return [];
            }

            const data = await response.json();

            if (data.approximateGroup && data.approximateGroup.candidate) {
                const candidates = data.approximateGroup.candidate;
                return candidates.map(c => ({
                    rxcui: c.rxcui,
                    name: c.name,
                    score: c.score
                }));
            }

            return [];
        } catch (error) {
            console.error('RxNav autocomplete error:', error);
            return [];
        }
    },

    async getDrugInfo(rxcui) {
        try {
            const response = await fetch(
                `${RXNAV_BASE}/rxcui/${rxcui}/allProperties.json?prop=all`
            );

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return this.parseProperties(data);
        } catch (error) {
            console.error('RxNav drug info error:', error);
            return null;
        }
    },

    parseProperties(data) {
        const props = {};

        if (data.propConceptGroup && data.propConceptGroup.propConcept) {
            for (const prop of data.propConceptGroup.propConcept) {
                props[prop.propName] = prop.propValue;
            }
        }

        const fullName = props.RxNorm_Name || '';
        const parsed = this.parseStrengthFromName(fullName);

        return {
            rxcui: props.RXCUI || '',
            name: parsed.baseName || fullName,
            fullName: fullName,
            synonym: props.RxNorm_Synonym || '',
            tty: props.TTY || '',
            dosageForm: parsed.dosageForm || props.DOSE_FORM || '',
            strength: parsed.strength || '',
            unit: parsed.unit || 'mg'
        };
    },

    parseStrengthFromName(name) {
        // Parse drug name like "Alprazolam 0.5 MG Oral Tablet" or "Lisinopril 10 MG Tablet"
        const result = {
            baseName: name,
            strength: '',
            unit: 'mg',
            dosageForm: ''
        };

        if (!name) return result;

        // Match patterns like "0.5 MG", "10 MG", "100 MCG", "500 MG/5ML"
        const strengthMatch = name.match(/(\d+\.?\d*)\s*(MG|MCG|G|ML|UNIT|%)/i);
        if (strengthMatch) {
            result.strength = strengthMatch[1];
            result.unit = strengthMatch[2].toLowerCase();
        }

        // Extract base drug name (everything before the number)
        const baseMatch = name.match(/^([A-Za-z\s\-]+?)(?:\s+\d)/);
        if (baseMatch) {
            result.baseName = baseMatch[1].trim();
        }

        // Extract dosage form (Tablet, Capsule, etc.)
        const formMatch = name.match(/(Oral\s+)?(Tablet|Capsule|Solution|Suspension|Injection|Cream|Ointment|Gel|Patch|Spray|Inhaler|Drops)/i);
        if (formMatch) {
            result.dosageForm = formMatch[0];
        }

        return result;
    },

    async getSpelling(term) {
        try {
            const response = await fetch(
                `${RXNAV_BASE}/spellingsuggestions.json?name=${encodeURIComponent(term)}`
            );

            if (!response.ok) {
                return [];
            }

            const data = await response.json();

            if (data.suggestionGroup && data.suggestionGroup.suggestionList) {
                return data.suggestionGroup.suggestionList.suggestion || [];
            }

            return [];
        } catch (error) {
            console.error('RxNav spelling error:', error);
            return [];
        }
    },

    async getRxcuiByName(drugName) {
        try {
            const response = await fetch(
                `${RXNAV_BASE}/rxcui.json?name=${encodeURIComponent(drugName)}`
            );

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            if (data.idGroup && data.idGroup.rxnormId) {
                return data.idGroup.rxnormId[0];
            }

            return null;
        } catch (error) {
            console.error('RxNav rxcui lookup error:', error);
            return null;
        }
    }
};

export default rxNavService;
