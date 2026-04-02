import { fetchWithTimeout, throwApiResponseError } from '../../../utils/helpers';
import { type ModelOption } from '../../../types/services';

const OPENAI_CHAT_PREFIXES = ['gpt-', 'o1', 'o3', 'o4', 'chatgpt-'];

export const fetchOpenAIModels = async (apiKey: string): Promise<ModelOption[]> => {
  const response = await fetchWithTimeout('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    await throwApiResponseError('OpenAI', response);
  }

  const data = await response.json();

  if (!Array.isArray(data?.data)) {
    throw new Error('Unexpected response from OpenAI models endpoint');
  }

  return data.data
    .filter((model: Record<string, unknown>) => {
      const modelId = model.id as string;
      return OPENAI_CHAT_PREFIXES.some((prefix) => modelId.startsWith(prefix));
    })
    .map((model: Record<string, unknown>) => ({
      id: model.id as string,
      name: model.id as string,
    }))
    .sort((modelA: ModelOption, modelB: ModelOption) => modelA.id.localeCompare(modelB.id));
};

export const callOpenAI = async (
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens?: number
): Promise<string> => {
  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
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
      ...(maxTokens !== undefined && { max_tokens: maxTokens }),
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
