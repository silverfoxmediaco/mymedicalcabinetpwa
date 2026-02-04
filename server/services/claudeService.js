import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';

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
 * @param {string} mimeType - MIME type of the document (image/jpeg, image/png, application/pdf)
 * @param {string} filename - Original filename for context
 * @returns {Promise<Object>} Structured explanation object
 */
const analyzeDocument = async (base64Data, mimeType, filename) => {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
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
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: `Please analyze this medical document (${filename || 'document'}) and provide a plain-language explanation following the JSON format specified.`,
        },
      ];
    } else {
      content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: `Please analyze this medical document image (${filename || 'document'}) and provide a plain-language explanation following the JSON format specified.`,
        },
      ];
    }

    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: MEDICAL_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: content,
        },
      ],
    });

    const responseText = message.content[0].text;

    let explanation;
    try {
      explanation = JSON.parse(responseText);
    } catch (parseError) {
      logger.warn('Failed to parse Claude response as JSON, attempting extraction', {
        error: parseError.message,
      });

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        explanation = JSON.parse(jsonMatch[0]);
      } else {
        explanation = {
          summary: responseText,
          keyFindings: [],
          termsExplained: [],
          questionsForDoctor: [],
        };
      }
    }

    const defaultExplanation = {
      summary: explanation.summary || 'Unable to generate summary.',
      keyFindings: explanation.keyFindings || [],
      termsExplained: explanation.termsExplained || [],
      questionsForDoctor: explanation.questionsForDoctor || [],
    };

    logger.info('Document analyzed successfully', { filename, model: CLAUDE_MODEL });

    return defaultExplanation;
  } catch (error) {
    logger.error('Claude API error', {
      error: error.message,
      filename,
      statusCode: error.status,
    });

    if (error.status === 401) {
      throw new Error('Invalid API key. Please check your Claude API configuration.');
    } else if (error.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.');
    } else if (error.status === 400) {
      throw new Error('Unable to process this document. The file may be corrupted or in an unsupported format.');
    }

    throw new Error(`Failed to analyze document: ${error.message}`);
  }
};

export { analyzeDocument };
export default { analyzeDocument };
