import { fetchWithTimeout, throwApiResponseError } from '../../../utils/helpers';
import { type ModelOption } from '../../../types/services';

export const fetchCustomModels = async (apiKey: string, baseUrl: string): Promise<ModelOption[]> => {
  const response = await fetchWithTimeout(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    await throwApiResponseError('Custom', response);
  }

  const data = await response.json();

  if (!Array.isArray(data?.data)) {
    throw new Error('Unexpected response from models endpoint. Expected OpenAI-compatible format.');
  }

  return data.data
    .map((model: Record<string, unknown>) => ({
      id: model.id as string,
      name: (model.name as string) || (model.id as string),
    }))
    .sort((modelA: ModelOption, modelB: ModelOption) => modelA.name.localeCompare(modelB.name));
};

export const callCustom = async (
  apiKey: string,
  baseUrl: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens?: number
): Promise<string> => {
  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
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
