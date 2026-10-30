import { fetchWithTimeout, getLocalAiTimeoutMs, throwApiResponseError, TRUNCATED_RESPONSE_MESSAGE } from '../../../utils/helpers';
import { type ModelOption } from '../../../types/services';

// Ollama answers 403 to browser-extension origins unless OLLAMA_ORIGINS allows
// them (listing models still works, so setup looks fine until the first organize).
export const CUSTOM_FORBIDDEN_MESSAGE =
  'The endpoint refused the request (403). Ollama blocks browser extensions by default: restart it with OLLAMA_ORIGINS="chrome-extension://*". In LM Studio, turn on CORS in the server settings. For a remote endpoint, check your API key.';

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

// JSON mode makes local runners (Ollama, llama.cpp, vLLM) emit valid JSON: a 3B
// model broke the bulk JSON in 11 of 12 groups without it, 0 of 12 with it.
const buildChatBody = (
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number | undefined,
  useJsonMode: boolean
): string => JSON.stringify({
  model,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  ...(maxTokens !== undefined && { max_tokens: maxTokens }),
  ...(useJsonMode && { response_format: { type: 'json_object' } }),
});

export const callCustom = async (
  apiKey: string,
  baseUrl: string,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens?: number,
  bookmarkCount?: number,
  expectJson = false,
  cancelSignal?: AbortSignal
): Promise<string> => {
  const sendChatRequest = (useJsonMode: boolean): Promise<Response> => fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders(apiKey),
      },
      body: buildChatBody(model, systemPrompt, userPrompt, maxTokens, useJsonMode),
    },
    getLocalAiTimeoutMs(bookmarkCount),
    cancelSignal
  );

  let response = await sendChatRequest(expectJson);

  // Not every OpenAI-compatible server accepts json_object — fall back to plain text.
  if (expectJson && response.status === 400) {
    console.warn('Custom endpoint rejected JSON mode, retrying without it:', await response.text());
    response = await sendChatRequest(false);
  }

  if (response.status === 403) {
    console.error('Custom API error [403]:', await response.text());
    throw new Error(CUSTOM_FORBIDDEN_MESSAGE);
  }

  if (!response.ok) {
    await throwApiResponseError('Custom', response);
  }

  const data = await response.json();

  if (data?.choices?.[0]?.finish_reason === 'length') {
    throw new Error(TRUNCATED_RESPONSE_MESSAGE);
  }

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('No response from custom endpoint');
  }

  return text.trim();
};
