const Anthropic = require('@anthropic-ai/sdk');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const MEDICAL_SYSTEM_PROMPT = `You are a medical document interpreter helping patients understand their health records.

Analyze this medical document and provide your response in the following JSON format:

{
  "summary": "A 2-3 sentence plain-language overview of what this document shows.",
  "keyFindings": [
    "Bullet point 1 of the most important information",
    "Bullet point 2 highlighting any abnormal values or concerns",
    "Additional important findings..."
  ],
  "termsExplained": [
    {
      "term": "Medical term",
      "definition": "Simple explanation of what this means"
    }
  ],
  "questionsForDoctor": [
    "Relevant question 1 the patient might want to ask their healthcare provider",
    "Relevant question 2",
    "Relevant question 3"
  ]
}

Important guidelines:
- Use simple, non-technical language that anyone can understand
- Be factual and avoid alarming language
- Do NOT diagnose or recommend treatment
- Encourage follow-up with healthcare provider for any concerns
- If you cannot read or understand the document, explain that in the summary
- Always respond with valid JSON only, no additional text`;

/**
 * Analyze a medical document using Claude API
 * @param {string} base64Data - Base64 encoded document data
 * @param {string} mimeType - MIME type of the document
 * @param {string} filename - Original filename for context
 * @returns {Promise<Object>} Structured explanation object
 */
const analyzeDocument = async (base64Data, mimeType, filename) => {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const client = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
    });

    try {
        const mediaType = mimeType || 'image/jpeg';

        let content;

        if (mediaType === 'application/pdf') {
            content = [
                {
                    type: 'document',
                    source: {
                        type: 'base64',
                        media_type: 'application/pdf',
                        data: base64Data
                    }
                },
                {
                    type: 'text',
                    text: `Please analyze this medical document (${filename || 'document'}) and provide a plain-language explanation following the JSON format specified.`
                }
            ];
        } else {
            content = [
                {
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: mediaType,
                        data: base64Data
                    }
                },
                {
                    type: 'text',
                    text: `Please analyze this medical document image (${filename || 'document'}) and provide a plain-language explanation following the JSON format specified.`
                }
            ];
        }

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 2048,
            system: MEDICAL_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ]
        });

        const responseText = message.content[0].text;

        let explanation;
        try {
            explanation = JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Failed to parse Claude response as JSON, attempting extraction');

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                explanation = JSON.parse(jsonMatch[0]);
            } else {
                explanation = {
                    summary: responseText,
                    keyFindings: [],
                    termsExplained: [],
                    questionsForDoctor: []
                };
            }
        }

        return {
            summary: explanation.summary || 'Unable to generate summary.',
            keyFindings: explanation.keyFindings || [],
            termsExplained: explanation.termsExplained || [],
            questionsForDoctor: explanation.questionsForDoctor || []
        };
    } catch (error) {
        console.error('Claude API error:', error.message);

        if (error.status === 401) {
            throw new Error('Invalid API key. Please check your Anthropic API configuration.');
        } else if (error.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.status === 400) {
            throw new Error('Unable to process this document. The file may be corrupted or in an unsupported format.');
        }

        throw new Error(`Failed to analyze document: ${error.message}`);
    }
};

const INSURANCE_SYSTEM_PROMPT = `You are an insurance document interpreter helping patients understand their health insurance policies, benefits, and coverage.

Analyze this insurance document and provide your response in the following JSON format:

{
  "summary": "A 2-3 sentence plain-language overview of what this insurance document covers.",
  "coverageHighlights": [
    "Key benefit or coverage area 1",
    "Key benefit or coverage area 2",
    "Additional important coverage details..."
  ],
  "costs": {
    "deductible": "Amount or description of the deductible, or 'Not specified' if not found",
    "copays": "Copay amounts for different visit types, or 'Not specified' if not found",
    "coinsurance": "Coinsurance percentage, or 'Not specified' if not found",
    "outOfPocketMax": "Out-of-pocket maximum amount, or 'Not specified' if not found",
    "premiums": "Premium amount if listed, or 'Not specified' if not found"
  },
  "exclusions": [
    "Service or condition not covered 1",
    "Service or condition not covered 2"
  ],
  "termsExplained": [
    {
      "term": "Insurance term",
      "definition": "Simple explanation of what this means"
    }
  ],
  "questionsForInsurer": [
    "Question 1 the patient might want to ask their insurance company",
    "Question 2",
    "Question 3"
  ]
}

Important guidelines:
- Use simple, non-technical language that anyone can understand
- Focus on what IS and IS NOT covered
- Highlight dollar amounts, percentages, and limits clearly
- Explain insurance jargon in plain language
- If you cannot read or understand the document, explain that in the summary
- Always respond with valid JSON only, no additional text`;

/**
 * Analyze an insurance document using Claude API
 * @param {string} base64Data - Base64 encoded document data
 * @param {string} mimeType - MIME type of the document
 * @param {string} filename - Original filename for context
 * @returns {Promise<Object>} Structured insurance explanation object
 */
const analyzeInsuranceDocument = async (base64Data, mimeType, filename) => {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const client = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
    });

    try {
        const mediaType = mimeType || 'image/jpeg';

        let content;

        if (mediaType === 'application/pdf') {
            content = [
                {
                    type: 'document',
                    source: {
                        type: 'base64',
                        media_type: 'application/pdf',
                        data: base64Data
                    }
                },
                {
                    type: 'text',
                    text: `Please analyze this insurance document (${filename || 'document'}) and provide a plain-language explanation of the coverage, costs, exclusions, and key terms following the JSON format specified.`
                }
            ];
        } else {
            content = [
                {
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: mediaType,
                        data: base64Data
                    }
                },
                {
                    type: 'text',
                    text: `Please analyze this insurance document image (${filename || 'document'}) and provide a plain-language explanation of the coverage, costs, exclusions, and key terms following the JSON format specified.`
                }
            ];
        }

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 2048,
            system: INSURANCE_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ]
        });

        const responseText = message.content[0].text;

        let explanation;
        try {
            explanation = JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Failed to parse Claude insurance response as JSON, attempting extraction');

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                explanation = JSON.parse(jsonMatch[0]);
            } else {
                explanation = {
                    summary: responseText,
                    coverageHighlights: [],
                    costs: {},
                    exclusions: [],
                    termsExplained: [],
                    questionsForInsurer: []
                };
            }
        }

        return {
            summary: explanation.summary || 'Unable to generate summary.',
            coverageHighlights: explanation.coverageHighlights || [],
            costs: explanation.costs || {},
            exclusions: explanation.exclusions || [],
            termsExplained: explanation.termsExplained || [],
            questionsForInsurer: explanation.questionsForInsurer || []
        };
    } catch (error) {
        console.error('Claude API error (insurance):', error.message);

        if (error.status === 401) {
            throw new Error('Invalid API key. Please check your Anthropic API configuration.');
        } else if (error.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.status === 400) {
            throw new Error('Unable to process this document. The file may be corrupted or in an unsupported format.');
        }

        throw new Error(`Failed to analyze document: ${error.message}`);
    }
};

/**
 * Analyze a medical document using extracted text (for large PDFs)
 * @param {string} documentText - Extracted text from the document
 * @param {string} filename - Original filename for context
 * @returns {Promise<Object>} Structured explanation object
 */
const analyzeDocumentText = async (documentText, filename) => {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const client = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
    });

    try {
        // Truncate text if extremely long (Claude has token limits)
        const maxChars = 150000;
        const truncatedText = documentText.length > maxChars
            ? documentText.substring(0, maxChars) + '\n\n[Document truncated due to length...]'
            : documentText;

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 2048,
            system: MEDICAL_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Please analyze the following medical document text (${filename || 'document'}) and provide a plain-language explanation following the JSON format specified.\n\n--- DOCUMENT TEXT ---\n${truncatedText}`
                }
            ]
        });

        const responseText = message.content[0].text;

        let explanation;
        try {
            explanation = JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Failed to parse Claude response as JSON, attempting extraction');

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                explanation = JSON.parse(jsonMatch[0]);
            } else {
                explanation = {
                    summary: responseText,
                    keyFindings: [],
                    termsExplained: [],
                    questionsForDoctor: []
                };
            }
        }

        return {
            summary: explanation.summary || 'Unable to generate summary.',
            keyFindings: explanation.keyFindings || [],
            termsExplained: explanation.termsExplained || [],
            questionsForDoctor: explanation.questionsForDoctor || []
        };
    } catch (error) {
        console.error('Claude API error (text analysis):', error.message);

        if (error.status === 401) {
            throw new Error('Invalid API key. Please check your Anthropic API configuration.');
        } else if (error.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        }

        throw new Error(`Failed to analyze document: ${error.message}`);
    }
};

/**
 * Analyze an insurance document using extracted text (for large PDFs)
 * @param {string} documentText - Extracted text from the document
 * @param {string} filename - Original filename for context
 * @returns {Promise<Object>} Structured insurance explanation object
 */
const analyzeInsuranceDocumentText = async (documentText, filename) => {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const client = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
    });

    try {
        // Truncate text if extremely long (Claude has token limits)
        const maxChars = 150000;
        const truncatedText = documentText.length > maxChars
            ? documentText.substring(0, maxChars) + '\n\n[Document truncated due to length...]'
            : documentText;

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 2048,
            system: INSURANCE_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Please analyze the following insurance document text (${filename || 'document'}) and provide a plain-language explanation of the coverage, costs, exclusions, and key terms following the JSON format specified.\n\n--- DOCUMENT TEXT ---\n${truncatedText}`
                }
            ]
        });

        const responseText = message.content[0].text;

        let explanation;
        try {
            explanation = JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Failed to parse Claude insurance response as JSON, attempting extraction');

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                explanation = JSON.parse(jsonMatch[0]);
            } else {
                explanation = {
                    summary: responseText,
                    coverageHighlights: [],
                    costs: {},
                    exclusions: [],
                    termsExplained: [],
                    questionsForInsurer: []
                };
            }
        }

        return {
            summary: explanation.summary || 'Unable to generate summary.',
            coverageHighlights: explanation.coverageHighlights || [],
            costs: explanation.costs || {},
            exclusions: explanation.exclusions || [],
            termsExplained: explanation.termsExplained || [],
            questionsForInsurer: explanation.questionsForInsurer || []
        };
    } catch (error) {
        console.error('Claude API error (insurance text):', error.message);

        if (error.status === 401) {
            throw new Error('Invalid API key. Please check your Anthropic API configuration.');
        } else if (error.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        }

        throw new Error(`Failed to analyze document: ${error.message}`);
    }
};

module.exports = { analyzeDocument, analyzeInsuranceDocument, analyzeDocumentText, analyzeInsuranceDocumentText };
