import { extractApiErrorMessage } from '../../../utils/helpers';

export const callGemini = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Gemini API error [${response.status}]:`, errorBody);
    const errorMessage = extractApiErrorMessage(errorBody);
    throw new Error(errorMessage || `Gemini error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  return text.trim();
};
