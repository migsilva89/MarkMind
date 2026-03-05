import { throwApiResponseError } from '../../../utils/helpers';
import { type ModelOption } from '../../../types/services';

const GEMINI_MODEL_PREFIX = 'models/gemini-';

export const fetchGeminiModels = async (apiKey: string): Promise<ModelOption[]> => {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1/models',
    { headers: { 'x-goog-api-key': apiKey } }
  );

  if (!response.ok) {
    await throwApiResponseError('Gemini', response);
  }

  const data = await response.json();

  if (!Array.isArray(data?.models)) {
    throw new Error('Unexpected response from Gemini models endpoint');
  }

  return data.models
    .filter((model: Record<string, unknown>) => {
      const name = model.name as string;
      const methods = model.supportedGenerationMethods as string[] | undefined;
      return name.startsWith(GEMINI_MODEL_PREFIX) && methods?.includes('generateContent');
    })
    .map((model: Record<string, unknown>) => ({
      id: (model.name as string).replace('models/', ''),
      name: model.displayName as string,
    }));
};

export const callGemini = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens?: number
): Promise<string> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      ...(maxTokens !== undefined && {
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    }),
  });

  if (!response.ok) {
    await throwApiResponseError('Gemini', response);
  }

  const data = await response.json();
  const finishReason = data?.candidates?.[0]?.finishReason;

  if (finishReason === 'MAX_TOKENS') {
    throw new Error('Gemini response was truncated — the model ran out of output tokens. Please try again.');
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  return text.trim();
};
