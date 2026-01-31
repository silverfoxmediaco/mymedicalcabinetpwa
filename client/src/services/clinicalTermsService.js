// NLM Clinical Tables API for medical term autocomplete
// https://clinicaltables.nlm.nih.gov/

const NLM_API_BASE = 'https://clinicaltables.nlm.nih.gov/api';

export const clinicalTermsService = {
    // Search for conditions/diagnoses using ICD-10-CM
    async searchConditions(query) {
        if (!query || query.length < 2) return [];

        try {
            const response = await fetch(
                `${NLM_API_BASE}/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(query)}&maxList=15`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch conditions');
            }

            const data = await response.json();

            // NLM returns [total, codes, null, display_strings]
            // data[3] contains the display strings as arrays [code, name]
            if (data && data[3] && Array.isArray(data[3])) {
                return data[3].map(item => ({
                    code: item[0],
                    name: item[1],
                    display: item[1] // Use just the name for display
                }));
            }

            return [];
        } catch (error) {
            console.error('Error searching conditions:', error);
            return [];
        }
    },

    // Search for health events/reasons (combines conditions and procedures)
    async searchHealthEvents(query) {
        if (!query || query.length < 2) return [];

        try {
            // Search ICD-10-CM for diagnoses/conditions
            const conditionsPromise = fetch(
                `${NLM_API_BASE}/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(query)}&maxList=10`
            );

            // Search CPT for procedures (clinical procedures)
            const proceduresPromise = fetch(
                `${NLM_API_BASE}/hcpcs/v3/search?sf=code,display&terms=${encodeURIComponent(query)}&maxList=5`
            );

            const [conditionsRes, proceduresRes] = await Promise.all([
                conditionsPromise,
                proceduresPromise
            ]);

            const results = [];

            // Parse conditions
            if (conditionsRes.ok) {
                const conditionsData = await conditionsRes.json();
                if (conditionsData && conditionsData[3] && Array.isArray(conditionsData[3])) {
                    conditionsData[3].forEach(item => {
                        results.push({
                            code: item[0],
                            name: item[1],
                            type: 'condition'
                        });
                    });
                }
            }

            // Parse procedures
            if (proceduresRes.ok) {
                const proceduresData = await proceduresRes.json();
                if (proceduresData && proceduresData[3] && Array.isArray(proceduresData[3])) {
                    proceduresData[3].forEach(item => {
                        results.push({
                            code: item[0],
                            name: item[1],
                            type: 'procedure'
                        });
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('Error searching health events:', error);
            return [];
        }
    },

    // Simple condition search (just names, no codes)
    async searchSimple(query) {
        if (!query || query.length < 2) return [];

        try {
            const response = await fetch(
                `${NLM_API_BASE}/conditions/v3/search?terms=${encodeURIComponent(query)}&maxList=12`
            );

            if (!response.ok) {
                // Fallback to ICD-10 if conditions endpoint fails
                return this.searchConditions(query);
            }

            const data = await response.json();

            // data[1] contains the condition names
            if (data && data[1] && Array.isArray(data[1])) {
                return data[1].map(name => ({
                    name: name,
                    display: name
                }));
            }

            return [];
        } catch (error) {
            console.error('Error in simple search:', error);
            // Fallback to ICD-10
            return this.searchConditions(query);
        }
    }
};

export default clinicalTermsService;
