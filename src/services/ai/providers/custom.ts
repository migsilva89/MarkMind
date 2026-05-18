import { fetchWithTimeout, getAiTimeoutMs, throwApiResponseError } from '../../../utils/helpers';
import { type ModelOption } from '../../../types/services';

const buildAuthHeaders = (apiKey: string): Record<string, string> => {
  const trimmed = apiKey.trim();
  return trimmed ? { Authorization: `Bearer ${trimmed}` } : {};
};

export const fetchCustomModels = async (apiKey: string, baseUrl: string): Promise<ModelOption[]> => {
  const response = await fetchWithTimeout(`${baseUrl}/models`, {
    headers: buildAuthHeaders(apiKey),
  });

  if (!response.ok) {
    await throwApiResponseError('Custom', response);
  }

  const data = await response.json();

  if (!Array.isArray(data?.data)) {
    throw new Error('Unexpected response from models endpoint. Expected OpenAI-compatible format.');
  }

  return data.data
    .filter((model: Record<string, unknown>): model is { id: string; name?: unknown } =>
      typeof model?.id === 'string' && model.id.length > 0
    )
    .map((model: { id: string; name?: unknown }) => ({
      id: model.id,
      name: typeof model.name === 'string' && model.name.length > 0 ? model.name : model.id,
    }))
    .sort((modelA: ModelOption, modelB: ModelOption) => modelA.name.localeCompare(modelB.name));
};

export const callCustom = async (
  apiKey: string,
  baseUrl: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens?: number,
  bookmarkCount?: number
): Promise<string> => {
  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(apiKey),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        ...(maxTokens !== undefined && { max_tokens: maxTokens }),
      }),
    },
    getAiTimeoutMs(bookmarkCount)
  );

  if (!response.ok) {
    await throwApiResponseError('Custom', response);
  }

  const data = await response.json();

  if (data?.choices?.[0]?.finish_reason === 'length') {
    throw new Error('Response was truncated — the model ran out of output tokens. Please try again.');
  }

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('No response from custom endpoint');
  }

  return text.trim();
};
