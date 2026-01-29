const RXNAV_BASE = 'https://rxnav.nlm.nih.gov/REST';

export const interactionService = {
    async checkInteractions(rxcuiList) {
        if (!rxcuiList || rxcuiList.length < 2) {
            return { hasInteractions: false, interactions: [] };
        }

        try {
            const rxcuiString = rxcuiList.join('+');
            const response = await fetch(
                `${RXNAV_BASE}/interaction/list.json?rxcuis=${rxcuiString}`
            );

            if (!response.ok) {
                return { hasInteractions: false, interactions: [] };
            }

            const data = await response.json();
            return this.parseInteractions(data);
        } catch (error) {
            console.error('Interaction check error:', error);
            return { hasInteractions: false, interactions: [] };
        }
    },

    parseInteractions(data) {
        const interactions = [];

        if (data.fullInteractionTypeGroup) {
            for (const group of data.fullInteractionTypeGroup) {
                if (group.fullInteractionType) {
                    for (const interaction of group.fullInteractionType) {
                        if (interaction.interactionPair) {
                            for (const pair of interaction.interactionPair) {
                                interactions.push({
                                    severity: pair.severity || 'N/A',
                                    description: pair.description || '',
                                    drugs: pair.interactionConcept?.map(c => ({
                                        name: c.minConceptItem?.name || '',
                                        rxcui: c.minConceptItem?.rxcui || ''
                                    })) || []
                                });
                            }
                        }
                    }
                }
            }
        }

        return {
            hasInteractions: interactions.length > 0,
            interactions: interactions
        };
    },

    async checkSingleDrugInteractions(rxcui) {
        try {
            const response = await fetch(
                `${RXNAV_BASE}/interaction/interaction.json?rxcui=${rxcui}`
            );

            if (!response.ok) {
                return { hasInteractions: false, interactions: [] };
            }

            const data = await response.json();
            return this.parseInteractions(data);
        } catch (error) {
            console.error('Single drug interaction check error:', error);
            return { hasInteractions: false, interactions: [] };
        }
    },

    getSeverityLevel(severity) {
        const levels = {
            'high': 3,
            'moderate': 2,
            'low': 1,
            'n/a': 0
        };

        return levels[severity?.toLowerCase()] || 0;
    },

    getSeverityColor(severity) {
        const colors = {
            'high': '#dc3545',
            'moderate': '#ffc107',
            'low': '#17a2b8',
            'n/a': '#6c757d'
        };

        return colors[severity?.toLowerCase()] || '#6c757d';
    }
};

export default interactionService;
