// NLM Clinical Tables API for medical term autocomplete
// https://clinicaltables.nlm.nih.gov/
// Response format: [totalCount, codeArray, extraData, displayArray]

const NLM_API_BASE = 'https://clinicaltables.nlm.nih.gov/api';

export const clinicalTermsService = {
    // Search using ICD-10-CM (diagnoses)
    async searchConditions(query) {
        if (!query || query.length < 2) return [];

        try {
            // df=code,name returns display fields in the response
            const response = await fetch(
                `${NLM_API_BASE}/icd10cm/v3/search?terms=${encodeURIComponent(query)}&maxList=12&df=code,name`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch conditions');
            }

            const data = await response.json();

            // Response: [total, codes[], null, [[code, name], ...]]
            // data[3] contains arrays of [code, name]
            if (data && Array.isArray(data) && data[3] && Array.isArray(data[3])) {
                return data[3].map(item => {
                    // item could be [code, name] array
                    if (Array.isArray(item)) {
                        return {
                            code: item[0],
                            name: item[1],
                            display: item[1]
                        };
                    }
                    return null;
                }).filter(Boolean);
            }

            return [];
        } catch (error) {
            console.error('Error searching conditions:', error);
            return [];
        }
    },

    // Simple search - primary method used by EventSearch
    async searchSimple(query) {
        if (!query || query.length < 2) return [];

        try {
            // Try the conditions endpoint first
            const response = await fetch(
                `${NLM_API_BASE}/conditions/v3/search?terms=${encodeURIComponent(query)}&maxList=12`
            );

            if (response.ok) {
                const data = await response.json();

                // Response format: [total, [ids...], null, [[name], [name], ...]]
                // data[0] = total count
                // data[1] = array of IDs (NOT names!)
                // data[3] = array of arrays, each containing the condition name
                if (data && Array.isArray(data) && data[3] && Array.isArray(data[3])) {
                    return data[3].map(item => {
                        // Each item is an array like ["Chest pain"]
                        const name = Array.isArray(item) ? item[0] : item;
                        return {
                            name: name,
                            display: name
                        };
                    }).filter(item => item.name);
                }
            }

            // Fallback to ICD-10-CM if conditions endpoint doesn't work
            return this.searchConditions(query);

        } catch (error) {
            console.error('Error in simple search:', error);
            // Fallback to ICD-10
            return this.searchConditions(query);
        }
    },

    // Search combining conditions and procedures
    async searchHealthEvents(query) {
        if (!query || query.length < 2) return [];

        try {
            const results = await this.searchSimple(query);
            return results;
        } catch (error) {
            console.error('Error searching health events:', error);
            return [];
        }
    }
};

export default clinicalTermsService;
