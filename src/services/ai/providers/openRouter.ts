import { extractApiErrorMessage } from '../../../utils/helpers';

export const callOpenRouter = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 100
): Promise<string> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`OpenRouter API error [${response.status}]:`, errorBody);
    const errorMessage = extractApiErrorMessage(errorBody);
    throw new Error(errorMessage || `OpenRouter error: ${response.status}`);
  }

  const data = await response.json();

  if (data?.choices?.[0]?.finish_reason === 'length') {
    throw new Error('OpenRouter response was truncated — the model ran out of output tokens. Please try again.');
  }

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('No response from OpenRouter');
  }

  return text.trim();
};
