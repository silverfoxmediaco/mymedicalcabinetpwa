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

const MEDICAL_BILL_SYSTEM_PROMPT = `You are a medical billing expert helping patients identify errors and overcharges on their hospital and medical bills. Approximately 80% of hospital bills contain errors.

Analyze this medical bill and provide your response in the following JSON format:

{
  "summary": "A 2-3 sentence plain-language overview of this bill.",
  "medicareDataUsed": true,
  "medicareSource": "CMS Medicare Physician & Other Practitioners or null if not used",
  "lineItems": [
    {
      "description": "Service or item description",
      "cptCode": "CPT code if visible",
      "quantity": 1,
      "amountBilled": 0.00,
      "fairPriceEstimate": 0.00,
      "medicareRate": null,
      "avgSubmittedCharge": null,
      "dataSource": "CMS Medicare Data or AI Estimate",
      "flaggedAsError": false,
      "errorReason": "Reason if flagged"
    }
  ],
  "errorsFound": [
    {
      "type": "duplicate_charge|upcoding|unbundling|incorrect_quantity|wrong_code|balance_billing|phantom_charge|overpricing|missing_adjustment|other",
      "description": "Clear explanation of the error",
      "lineItemIndex": 0,
      "estimatedOvercharge": 0.00
    }
  ],
  "totals": {
    "amountBilled": 0.00,
    "insurancePaid": 0.00,
    "adjustments": 0.00,
    "patientBalance": 0.00,
    "fairPriceTotal": 0.00,
    "estimatedSavings": 0.00,
    "recommendedPatientOffer": 0.00
  },
  "disputeLetterText": "If errors were found, provide a professional dispute letter the patient can send to the billing department. Include specific line items, CPT codes, and reasons for dispute. If no errors found, set to null.",
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

Common billing errors to check for:
- Duplicate charges: The EXACT same service billed more than once with the same amount. IMPORTANT: Multiple line items in the same service category (e.g., two "Pharmacy/Medications/IV Solutions" charges) with DIFFERENT amounts are almost certainly distinct items (different medications, different IV bags, different solutions). These are NOT duplicates. Only flag as duplicate when the description AND amount are identical or nearly identical.
- Upcoding: Charged for a more expensive CPT/procedure code than what was actually performed. This requires evidence that a less expensive code should have been used. Do NOT label high prices as upcoding — that is overpricing, not upcoding.
- Overpricing: A charge that is significantly above fair market rates for the care setting. Use this type when a charge is simply too high but the correct service was performed.
- Missing adjustment: Insurance contractual adjustments/discounts are $0 or missing when they should exist. If a patient has insurance (especially in-network or PPO), the bill should show contractual adjustments reducing the charges before calculating the patient balance. A $0 adjustment column is a major red flag.
- Unbundling: Procedures that should be billed together under a single code charged separately at higher combined rates
- Incorrect quantities: Wrong number of items or days
- Phantom charges: Services never received
- Balance billing: Billing for amounts beyond what insurance has agreed to pay (illegal for in-network providers in most states)
- Wrong codes: Incorrect CPT/HCPCS codes
- Operating room time errors: Rounded up excessively

Important guidelines:
- CARE SETTING MATTERS: Always consider where the service was provided when estimating fair prices. Hospital inpatient and ICU charges are significantly higher than outpatient or freestanding facility rates. An ICU CT scan costs more than one at an outpatient imaging center. Use hospital-based inpatient rates for hospital/ICU stays, not outpatient benchmarks. Typical hospital-based markups are 2-4x Medicare rates, while outpatient/freestanding facilities are 1.5-2.5x.
- INSURANCE AWARENESS: Read the bill carefully for insurance payment information. Extract the total amount the insurance paid, any adjustments/discounts applied, and the remaining patient balance. Calculate recommendedPatientOffer as the fair patient responsibility AFTER accounting for insurance payments — not the total fair price. Formula: recommendedPatientOffer = max(0, fairPriceTotal - insurancePaid - adjustments). This is what the patient should actually offer to pay.
- MISSING ADJUSTMENTS: If the bill shows insurance on file but the Adjustments/Discounts column is $0.00, this is a significant issue. Most insured patients should see contractual adjustments that reduce the billed charges. Flag this as a "missing_adjustment" error and recommend the patient contact their insurance company.
- When CMS Medicare reference data is provided in the user message, use those actual rates as your primary benchmark for fairPriceEstimate. Set medicareRate to the Medicare allowed amount and dataSource to "CMS Medicare Data" for those line items.
- When no CMS data is available for a line item, estimate fair pricing from your knowledge of typical rates FOR THE SPECIFIC CARE SETTING shown on the bill, and set dataSource to "AI Estimate" and medicareRate to null.
- Set medicareDataUsed to true if any line item used CMS data, false otherwise.
- Set medicareSource to "CMS Medicare Physician & Other Practitioners" if CMS data was used, null otherwise.
- Flag any billed amount exceeding 3x the Medicare rate for hospital/inpatient settings, or 2x for outpatient settings, as potential overpricing.
- Be specific about which line items have issues
- Generate a ready-to-send dispute letter if errors are found
- Always respond with valid JSON only, no additional text`;

/**
 * Analyze a medical bill using Claude API (vision)
 * @param {string} base64Data - Base64 encoded document data
 * @param {string} mimeType - MIME type of the document
 * @param {string} filename - Original filename for context
 * @returns {Promise<Object>} Structured bill analysis object
 */
const analyzeMedicalBill = async (base64Data, mimeType, filename, medicareData = null) => {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const client = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
    });

    try {
        const mediaType = mimeType || 'image/jpeg';

        // Build Medicare reference block for the prompt
        let medicareBlock = '';
        if (medicareData && Object.keys(medicareData).length > 0) {
            const { formatMedicareDataForPrompt } = require('./cmsMedicareService');
            const formatted = formatMedicareDataForPrompt(medicareData);
            if (formatted) {
                medicareBlock = `\n\n${formatted}`;
            }
        }
        if (!medicareBlock) {
            medicareBlock = '\n\nNo CMS Medicare data available for these procedure codes. Use your knowledge of typical Medicare and commercial insurance rates to estimate fair pricing. Set dataSource to "AI Estimate" for all line items.';
        }

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
                    text: `Please analyze this medical bill (${filename || 'document'}) for billing errors, overcharges, and provide a detailed breakdown following the JSON format specified.${medicareBlock}`
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
                    text: `Please analyze this medical bill image (${filename || 'document'}) for billing errors, overcharges, and provide a detailed breakdown following the JSON format specified.${medicareBlock}`
                }
            ];
        }

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 4096,
            system: MEDICAL_BILL_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ]
        });

        const responseText = message.content[0].text;

        let analysis;
        try {
            analysis = JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Failed to parse Claude bill response as JSON, attempting extraction');

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                analysis = {
                    summary: responseText,
                    lineItems: [],
                    errorsFound: [],
                    totals: {},
                    disputeLetterText: null,
                    recommendations: []
                };
            }
        }

        return {
            summary: analysis.summary || 'Unable to generate summary.',
            medicareDataUsed: analysis.medicareDataUsed || false,
            medicareSource: analysis.medicareSource || null,
            lineItems: analysis.lineItems || [],
            errorsFound: analysis.errorsFound || [],
            totals: analysis.totals || {},
            disputeLetterText: analysis.disputeLetterText || null,
            recommendations: analysis.recommendations || []
        };
    } catch (error) {
        console.error('Claude API error (medical bill):', error.message);

        if (error.status === 401) {
            throw new Error('Invalid API key. Please check your Anthropic API configuration.');
        } else if (error.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.status === 400) {
            throw new Error('Unable to process this document. The file may be corrupted or in an unsupported format.');
        }

        throw new Error(`Failed to analyze medical bill: ${error.message}`);
    }
};

/**
 * Analyze a medical bill using extracted text (for large PDFs)
 * @param {string} documentText - Extracted text from the document
 * @param {string} filename - Original filename for context
 * @param {Object|null} medicareData - CMS Medicare rate data keyed by HCPCS code
 * @returns {Promise<Object>} Structured bill analysis object
 */
const analyzeMedicalBillText = async (documentText, filename, medicareData = null) => {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const client = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
    });

    try {
        const maxChars = 150000;
        const truncatedText = documentText.length > maxChars
            ? documentText.substring(0, maxChars) + '\n\n[Document truncated due to length...]'
            : documentText;

        // Build Medicare reference block for the prompt
        let medicareBlock = '';
        if (medicareData && Object.keys(medicareData).length > 0) {
            const { formatMedicareDataForPrompt } = require('./cmsMedicareService');
            const formatted = formatMedicareDataForPrompt(medicareData);
            if (formatted) {
                medicareBlock = `\n\n${formatted}`;
            }
        }
        if (!medicareBlock) {
            medicareBlock = '\n\nNo CMS Medicare data available for these procedure codes. Use your knowledge of typical Medicare and commercial insurance rates to estimate fair pricing. Set dataSource to "AI Estimate" for all line items.';
        }

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 4096,
            system: MEDICAL_BILL_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Please analyze the following medical bill text (${filename || 'document'}) for billing errors, overcharges, and provide a detailed breakdown following the JSON format specified.${medicareBlock}\n\n--- BILL TEXT ---\n${truncatedText}`
                }
            ]
        });

        const responseText = message.content[0].text;

        let analysis;
        try {
            analysis = JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Failed to parse Claude bill response as JSON, attempting extraction');

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                analysis = {
                    summary: responseText,
                    lineItems: [],
                    errorsFound: [],
                    totals: {},
                    disputeLetterText: null,
                    recommendations: []
                };
            }
        }

        return {
            summary: analysis.summary || 'Unable to generate summary.',
            medicareDataUsed: analysis.medicareDataUsed || false,
            medicareSource: analysis.medicareSource || null,
            lineItems: analysis.lineItems || [],
            errorsFound: analysis.errorsFound || [],
            totals: analysis.totals || {},
            disputeLetterText: analysis.disputeLetterText || null,
            recommendations: analysis.recommendations || []
        };
    } catch (error) {
        console.error('Claude API error (bill text):', error.message);

        if (error.status === 401) {
            throw new Error('Invalid API key. Please check your Anthropic API configuration.');
        } else if (error.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        }

        throw new Error(`Failed to analyze medical bill: ${error.message}`);
    }
};

const BILL_EXTRACTION_SYSTEM_PROMPT = `You are a medical bill data extraction assistant. Extract structured billing data from the provided medical bill image or PDF.

Return your response as valid JSON only with this exact structure:

{
  "biller": {
    "name": "Provider/hospital/clinic name",
    "address": "Full billing address",
    "phone": "Phone number",
    "website": "Website URL if visible",
    "paymentPortalUrl": "Online payment URL if visible"
  },
  "account": {
    "guarantorName": "Guarantor name as printed on the bill",
    "guarantorId": "Guarantor ID / Account number",
    "myChartCode": "MyChart activation code if visible"
  },
  "dateOfService": "YYYY-MM-DD or null if not found",
  "dateReceived": null,
  "statementDate": "YYYY-MM-DD or null if not found",
  "dueDate": "YYYY-MM-DD or null if not found",
  "totals": {
    "amountBilled": 0.00,
    "insurancePaid": 0.00,
    "insuranceAdjusted": 0.00,
    "patientResponsibility": 0.00
  },
  "notes": "Any additional context extracted from the bill"
}

Important guidelines:
- Extract every field you can find; use empty string "" for text fields not found, null for dates not found, 0 for amounts not found
- For dates, always use YYYY-MM-DD format
- For dollar amounts, return numeric values only (no $ signs)
- If the bill shows "Amount Due" or "Patient Balance" or "Total Payment Due", map it to patientResponsibility
- If there are multiple service dates, use the earliest one
- Look for "Guarantor Name", "Guarantor ID", "Account #", "MyChart Code" or similar fields
- "Statement Date" is the date the bill was printed/issued, separate from service date and due date
- Always respond with valid JSON only, no additional text`;

/**
 * Extract structured bill data from a medical bill image/PDF
 * @param {string} base64Data - Base64 encoded document data
 * @param {string} mimeType - MIME type of the document
 * @param {string} filename - Original filename for context
 * @returns {Promise<Object>} Extracted bill form fields
 */
const extractBillData = async (base64Data, mimeType, filename) => {
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
                    text: `Extract all billing data from this medical bill (${filename || 'document'}) following the JSON format specified.`
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
                    text: `Extract all billing data from this medical bill image (${filename || 'document'}) following the JSON format specified.`
                }
            ];
        }

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 2048,
            system: BILL_EXTRACTION_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ]
        });

        const responseText = message.content[0].text;

        let extracted;
        try {
            extracted = JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Failed to parse Claude bill extraction as JSON, attempting extraction');

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extracted = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not extract bill data from this document');
            }
        }

        return {
            biller: {
                name: extracted.biller?.name || '',
                address: extracted.biller?.address || '',
                phone: extracted.biller?.phone || '',
                website: extracted.biller?.website || '',
                paymentPortalUrl: extracted.biller?.paymentPortalUrl || ''
            },
            account: {
                guarantorName: extracted.account?.guarantorName || '',
                guarantorId: extracted.account?.guarantorId || '',
                myChartCode: extracted.account?.myChartCode || ''
            },
            dateOfService: extracted.dateOfService || null,
            dateReceived: extracted.dateReceived || null,
            statementDate: extracted.statementDate || null,
            dueDate: extracted.dueDate || null,
            totals: {
                amountBilled: Number(extracted.totals?.amountBilled) || 0,
                insurancePaid: Number(extracted.totals?.insurancePaid) || 0,
                insuranceAdjusted: Number(extracted.totals?.insuranceAdjusted) || 0,
                patientResponsibility: Number(extracted.totals?.patientResponsibility) || 0
            },
            notes: extracted.notes || ''
        };
    } catch (error) {
        console.error('Claude API error (bill extraction):', error.message);

        if (error.status === 401) {
            throw new Error('Invalid API key. Please check your Anthropic API configuration.');
        } else if (error.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.status === 400) {
            throw new Error('Unable to process this document. The file may be corrupted or in an unsupported format.');
        }

        throw new Error(`Failed to extract bill data: ${error.message}`);
    }
};

/**
 * Extract structured bill data from multiple medical bill images/PDFs in one API call
 * @param {Array<{base64Data: string, mimeType: string, filename: string}>} documents
 * @returns {Promise<Object>} Extracted bill form fields
 */
const extractBillDataMulti = async (documents) => {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    if (!documents || documents.length === 0) {
        throw new Error('No documents provided');
    }

    // Single document — use existing function
    if (documents.length === 1) {
        return extractBillData(documents[0].base64Data, documents[0].mimeType, documents[0].filename);
    }

    const client = new Anthropic({
        apiKey: ANTHROPIC_API_KEY
    });

    try {
        const content = [];

        documents.forEach((doc, index) => {
            const mediaType = doc.mimeType || 'image/jpeg';

            if (mediaType === 'application/pdf') {
                content.push({
                    type: 'document',
                    source: {
                        type: 'base64',
                        media_type: 'application/pdf',
                        data: doc.base64Data
                    }
                });
            } else {
                content.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: mediaType,
                        data: doc.base64Data
                    }
                });
            }

            content.push({
                type: 'text',
                text: `Page ${index + 1} of ${documents.length}: ${doc.filename || 'document'}`
            });
        });

        content.push({
            type: 'text',
            text: `These are ${documents.length} pages of the same medical bill. Extract all billing data from ALL pages combined, following the JSON format specified. Merge information from all pages into a single result.`
        });

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 2048,
            system: BILL_EXTRACTION_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ]
        });

        const responseText = message.content[0].text;

        let extracted;
        try {
            extracted = JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Failed to parse Claude multi-bill extraction as JSON, attempting extraction');
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extracted = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not extract bill data from these documents');
            }
        }

        return {
            biller: {
                name: extracted.biller?.name || '',
                address: extracted.biller?.address || '',
                phone: extracted.biller?.phone || '',
                website: extracted.biller?.website || '',
                paymentPortalUrl: extracted.biller?.paymentPortalUrl || ''
            },
            account: {
                guarantorName: extracted.account?.guarantorName || '',
                guarantorId: extracted.account?.guarantorId || '',
                myChartCode: extracted.account?.myChartCode || ''
            },
            dateOfService: extracted.dateOfService || null,
            dateReceived: extracted.dateReceived || null,
            statementDate: extracted.statementDate || null,
            dueDate: extracted.dueDate || null,
            totals: {
                amountBilled: Number(extracted.totals?.amountBilled) || 0,
                insurancePaid: Number(extracted.totals?.insurancePaid) || 0,
                insuranceAdjusted: Number(extracted.totals?.insuranceAdjusted) || 0,
                patientResponsibility: Number(extracted.totals?.patientResponsibility) || 0
            },
            notes: extracted.notes || ''
        };
    } catch (error) {
        console.error('Claude API error (multi-bill extraction):', error.message);

        if (error.status === 401) {
            throw new Error('Invalid API key. Please check your Anthropic API configuration.');
        } else if (error.status === 429) {
            throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.status === 400) {
            throw new Error('Unable to process these documents. Files may be corrupted or in an unsupported format.');
        }

        throw new Error(`Failed to extract bill data: ${error.message}`);
    }
};

/**
 * Lightweight Claude call to extract CPT/HCPCS codes and state from a bill (vision)
 * @param {string} base64Data - Base64 encoded document data
 * @param {string} mimeType - MIME type of the document
 * @returns {Promise<{codes: string[], state: string|null}>}
 */
const extractCptCodesFromBill = async (base64Data, mimeType) => {
    if (!ANTHROPIC_API_KEY) return { codes: [], state: null };

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    try {
        const mediaType = mimeType || 'image/jpeg';

        let docContent;
        if (mediaType === 'application/pdf') {
            docContent = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } };
        } else {
            docContent = { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } };
        }

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 512,
            messages: [{
                role: 'user',
                content: [
                    docContent,
                    {
                        type: 'text',
                        text: 'List only the CPT/HCPCS procedure codes visible on this medical bill, and the patient\'s state (2-letter abbreviation) if visible. Respond with JSON only: {"codes": ["99213", "71046"], "state": "TX"}'
                    }
                ]
            }]
        });

        const responseText = message.content[0].text;
        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { codes: [], state: null };
        }

        return {
            codes: Array.isArray(parsed.codes) ? parsed.codes.map(c => String(c).trim()).filter(Boolean) : [],
            state: parsed.state && typeof parsed.state === 'string' && parsed.state.length === 2 ? parsed.state.toUpperCase() : null
        };
    } catch (error) {
        console.warn('CPT code pre-extraction failed:', error.message);
        return { codes: [], state: null };
    }
};

/**
 * Lightweight Claude call to extract CPT/HCPCS codes and state from bill text
 * @param {string} documentText - Extracted text from the bill
 * @returns {Promise<{codes: string[], state: string|null}>}
 */
const extractCptCodesFromBillText = async (documentText) => {
    if (!ANTHROPIC_API_KEY) return { codes: [], state: null };

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    try {
        const maxChars = 20000;
        const truncated = documentText.length > maxChars
            ? documentText.substring(0, maxChars)
            : documentText;

        const message = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 512,
            messages: [{
                role: 'user',
                content: `List only the CPT/HCPCS procedure codes visible in this medical bill text, and the patient's state (2-letter abbreviation) if visible. Respond with JSON only: {"codes": ["99213", "71046"], "state": "TX"}\n\n--- BILL TEXT ---\n${truncated}`
            }]
        });

        const responseText = message.content[0].text;
        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { codes: [], state: null };
        }

        return {
            codes: Array.isArray(parsed.codes) ? parsed.codes.map(c => String(c).trim()).filter(Boolean) : [],
            state: parsed.state && typeof parsed.state === 'string' && parsed.state.length === 2 ? parsed.state.toUpperCase() : null
        };
    } catch (error) {
        console.warn('CPT code text pre-extraction failed:', error.message);
        return { codes: [], state: null };
    }
};

module.exports = { analyzeDocument, analyzeInsuranceDocument, analyzeDocumentText, analyzeInsuranceDocumentText, analyzeMedicalBill, analyzeMedicalBillText, extractBillData, extractBillDataMulti, extractCptCodesFromBill, extractCptCodesFromBillText };
