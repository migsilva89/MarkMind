import { throwApiResponseError } from '../../../utils/helpers';

export const callAnthropic = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string
): Promise<string> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    await throwApiResponseError('Anthropic', response);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;

  if (!text) {
    throw new Error('No response from Anthropic');
  }

  return text.trim();
};
