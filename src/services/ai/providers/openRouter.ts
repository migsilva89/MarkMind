import { throwApiResponseError } from '../../../utils/helpers';
import { type ModelOption } from '../../../types/services';

const OPENROUTER_TEXT_PREFIXES = [
  'openai/', 'anthropic/', 'google/', 'deepseek/', 'meta-llama/',
  'mistralai/', 'moonshotai/', 'cohere/', 'qwen/',
];

export const fetchOpenRouterModels = async (apiKey: string): Promise<ModelOption[]> => {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    await throwApiResponseError('OpenRouter', response);
  }

  const data = await response.json();

  if (!Array.isArray(data?.data)) {
    throw new Error('Unexpected response from OpenRouter models endpoint');
  }

  return data.data
    .filter((model: Record<string, unknown>) => {
      const modelId = model.id as string;
      return OPENROUTER_TEXT_PREFIXES.some((prefix) => modelId.startsWith(prefix));
    })
    .map((model: Record<string, unknown>) => ({
      id: model.id as string,
      name: (model.name as string) || (model.id as string),
    }))
    .sort((modelA: ModelOption, modelB: ModelOption) => modelA.name.localeCompare(modelB.name));
};

export const callOpenRouter = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens = 100
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
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    await throwApiResponseError('OpenRouter', response);
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
