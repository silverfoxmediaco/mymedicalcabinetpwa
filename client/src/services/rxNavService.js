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

        return {
            rxcui: props.RXCUI || '',
            name: props.RxNorm_Name || '',
            synonym: props.RxNorm_Synonym || '',
            tty: props.TTY || '',
            dosageForm: props.DOSE_FORM || ''
        };
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
