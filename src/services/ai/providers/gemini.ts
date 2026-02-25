import { throwApiResponseError } from '../../../utils/helpers';

export const callGemini = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens?: number
): Promise<string> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
