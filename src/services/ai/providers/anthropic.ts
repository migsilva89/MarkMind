import { fetchWithTimeout, throwApiResponseError } from '../../../utils/helpers';
import { type ModelOption } from '../../../types/services';

export const fetchAnthropicModels = async (apiKey: string): Promise<ModelOption[]> => {
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/models?limit=100', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
  });

  if (!response.ok) {
    await throwApiResponseError('Anthropic', response);
  }

  const data = await response.json();

  if (!Array.isArray(data?.data)) {
    throw new Error('Unexpected response from Anthropic models endpoint');
  }

  return data.data
    .map((model: Record<string, unknown>) => ({
      id: model.id as string,
      name: (model.display_name as string) || (model.id as string),
      ...(typeof model.max_tokens === 'number' && {
        maxOutputTokens: model.max_tokens as number,
      }),
    }))
    .sort((modelA: ModelOption, modelB: ModelOption) => modelA.name.localeCompare(modelB.name));
};

export const callAnthropic = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens?: number
): Promise<string> => {
  const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens ?? 4096,
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
