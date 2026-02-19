import { SERVICES } from '../../config/services';
import { callGemini, callOpenAI, callAnthropic, callOpenRouter } from './providers';

export const getApiKey = async (serviceId: string): Promise<string> => {
  const service = SERVICES[serviceId];
  if (!service) {
    throw new Error(`Unknown service: ${serviceId}`);
  }

  const storageResult = await chrome.storage.local.get([service.storageKey]);
  const apiKey = storageResult[service.storageKey];

  if (!apiKey) {
    throw new Error(`No API key found for ${service.name}`);
  }

  return apiKey;
};

export const callProvider = async (
  serviceId: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens?: number
): Promise<string> => {
  switch (serviceId) {
    case 'google':
      return callGemini(apiKey, systemPrompt, userPrompt, maxTokens);
    case 'openai':
      return callOpenAI(apiKey, systemPrompt, userPrompt, maxTokens);
    case 'anthropic':
      return callAnthropic(apiKey, systemPrompt, userPrompt, maxTokens);
    case 'openrouter':
      return callOpenRouter(apiKey, systemPrompt, userPrompt, maxTokens);
    default:
      throw new Error(`Unsupported service: ${serviceId}`);
  }
};
