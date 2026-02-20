import { throwApiResponseError } from '../../../utils/helpers';

export const callOpenRouter = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string
): Promise<string> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    await throwApiResponseError('OpenRouter', response);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('No response from OpenRouter');
  }

  return text.trim();
};
