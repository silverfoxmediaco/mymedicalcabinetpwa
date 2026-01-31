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
    },

    // Search for surgical procedures using CPT/HCPCS codes
    async searchProcedures(query) {
        if (!query || query.length < 2) return [];

        try {
            // Search HCPCS (includes CPT codes for procedures)
            const response = await fetch(
                `${NLM_API_BASE}/hcpcs/v3/search?sf=code,display&terms=${encodeURIComponent(query)}&maxList=12`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch procedures');
            }

            const data = await response.json();
            const results = [];
            const seenNames = new Set();

            // Response: [total, codes[], null, [[code, display], ...]]
            if (data && Array.isArray(data) && data[3] && Array.isArray(data[3])) {
                data[3].forEach(item => {
                    if (Array.isArray(item) && item.length >= 2) {
                        const name = item[1];
                        const code = item[0];
                        if (name && !seenNames.has(name.toLowerCase())) {
                            seenNames.add(name.toLowerCase());
                            results.push({ code, name, display: name });
                        }
                    }
                });
            }

            // Also add common surgical procedures if query matches
            const commonProcedures = [
                'Appendectomy', 'Cholecystectomy', 'Hernia Repair', 'Hysterectomy',
                'Knee Replacement', 'Hip Replacement', 'Coronary Bypass', 'Cesarean Section',
                'Cataract Surgery', 'Tonsillectomy', 'Colonoscopy', 'Endoscopy',
                'Lumpectomy', 'Mastectomy', 'Prostatectomy', 'Spinal Fusion',
                'ACL Reconstruction', 'Rotator Cuff Repair', 'Carpal Tunnel Release',
                'Gallbladder Removal', 'Thyroidectomy', 'Bariatric Surgery'
            ];

            const queryLower = query.toLowerCase();
            commonProcedures.forEach(proc => {
                if (proc.toLowerCase().includes(queryLower) && !seenNames.has(proc.toLowerCase())) {
                    seenNames.add(proc.toLowerCase());
                    results.unshift({ name: proc, display: proc }); // Add to front
                }
            });

            return results.slice(0, 12);

        } catch (error) {
            console.error('Error searching procedures:', error);

            // Fallback to common procedures only
            const commonProcedures = [
                'Appendectomy', 'Cholecystectomy', 'Hernia Repair', 'Hysterectomy',
                'Knee Replacement', 'Hip Replacement', 'Coronary Bypass', 'Cesarean Section',
                'Cataract Surgery', 'Tonsillectomy', 'Colonoscopy', 'Endoscopy'
            ];

            const queryLower = query.toLowerCase();
            return commonProcedures
                .filter(proc => proc.toLowerCase().includes(queryLower))
                .map(name => ({ name, display: name }))
                .slice(0, 12);
        }
    }
};

export default clinicalTermsService;
