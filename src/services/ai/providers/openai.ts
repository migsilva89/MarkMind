import { throwApiResponseError } from '../../../utils/helpers';

export const callOpenAI = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens = 100
): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    await throwApiResponseError('OpenAI', response);
  }

  const data = await response.json();

  if (data?.choices?.[0]?.finish_reason === 'length') {
    throw new Error('OpenAI response was truncated — the model ran out of output tokens. Please try again.');
  }

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('No response from OpenAI');
  }

  return text.trim();
};
