import { throwApiResponseError } from '../../../utils/helpers';

export const callAnthropic = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens = 100
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
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    await throwApiResponseError('Anthropic', response);
  }

  const data = await response.json();

  if (data?.stop_reason === 'max_tokens') {
    throw new Error('Anthropic response was truncated — the model ran out of output tokens. Please try again.');
  }

  const text = data?.content?.[0]?.text;

  if (!text) {
    throw new Error('No response from Anthropic');
  }

  return text.trim();
};
