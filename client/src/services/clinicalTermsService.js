// NLM Clinical Tables API for medical term autocomplete
// https://clinicaltables.nlm.nih.gov/
// Response format: [totalCount, codeArray, extraData, displayArray]

const NLM_API_BASE = 'https://clinicaltables.nlm.nih.gov/api';

export const clinicalTermsService = {
    // Search using ICD-10-CM (diagnoses) - more comprehensive
    async searchConditions(query) {
        if (!query || query.length < 2) return [];

        try {
            // sf=code,name searches both code and name fields
            const response = await fetch(
                `${NLM_API_BASE}/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(query)}&maxList=12`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch conditions');
            }

            const data = await response.json();

            // Response: [total, codes[], null, [[code, name], ...]]
            // data[3] contains arrays of [code, name]
            if (data && Array.isArray(data) && data[3] && Array.isArray(data[3])) {
                return data[3].map(item => {
                    // item is [code, name] array
                    if (Array.isArray(item) && item.length >= 2) {
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
    // Searches both conditions API (simple terms) and ICD-10 (detailed diagnoses)
    async searchSimple(query) {
        if (!query || query.length < 2) return [];

        try {
            // Search both APIs in parallel for better coverage
            const [conditionsRes, icd10Res] = await Promise.all([
                fetch(`${NLM_API_BASE}/conditions/v3/search?terms=${encodeURIComponent(query)}&maxList=6`),
                fetch(`${NLM_API_BASE}/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(query)}&maxList=6`)
            ]);

            const results = [];
            const seenNames = new Set();

            // Parse conditions API (simpler, common terms)
            if (conditionsRes.ok) {
                const data = await conditionsRes.json();
                if (data && Array.isArray(data) && data[3] && Array.isArray(data[3])) {
                    data[3].forEach(item => {
                        const name = Array.isArray(item) ? item[0] : item;
                        if (name && !seenNames.has(name.toLowerCase())) {
                            seenNames.add(name.toLowerCase());
                            results.push({ name, display: name });
                        }
                    });
                }
            }

            // Parse ICD-10 API (detailed diagnoses like "Intracerebral hemorrhage")
            if (icd10Res.ok) {
                const data = await icd10Res.json();
                if (data && Array.isArray(data) && data[3] && Array.isArray(data[3])) {
                    data[3].forEach(item => {
                        if (Array.isArray(item) && item.length >= 2) {
                            const name = item[1];
                            if (name && !seenNames.has(name.toLowerCase())) {
                                seenNames.add(name.toLowerCase());
                                results.push({ code: item[0], name, display: name });
                            }
                        }
                    });
                }
            }

            return results.slice(0, 12); // Limit to 12 total results

        } catch (error) {
            console.error('Error in simple search:', error);
            return [];
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
