import { SERVICES } from '../../config/services';
import { type ModelOption } from '../../types/services';
import {
  callGemini, callOpenAI, callAnthropic, callOpenRouter, callCustom,
  fetchGeminiModels, fetchOpenAIModels, fetchAnthropicModels, fetchOpenRouterModels, fetchCustomModels,
} from './providers';

const getCustomBaseUrl = async (): Promise<string> => {
  const result = await chrome.storage.local.get(['customBaseUrl']);
  const baseUrl = result.customBaseUrl;
  if (!baseUrl) throw new Error('No base URL configured. Please set a base URL in Settings.');
  return baseUrl;
};

export const fetchModelsForProvider = async (
  serviceId: string,
  apiKey: string,
  customBaseUrl?: string
): Promise<ModelOption[]> => {
  switch (serviceId) {
    case 'google':
      return fetchGeminiModels(apiKey);
    case 'openai':
      return fetchOpenAIModels(apiKey);
    case 'anthropic':
      return fetchAnthropicModels(apiKey);
    case 'openrouter':
      return fetchOpenRouterModels(apiKey);
    case 'custom':
      return fetchCustomModels(apiKey, customBaseUrl || await getCustomBaseUrl());
    default:
      throw new Error(`Unsupported service: ${serviceId}`);
  }
};

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
  model: string,
  maxTokens?: number
): Promise<string> => {
  switch (serviceId) {
    case 'google':
      return callGemini(apiKey, systemPrompt, userPrompt, model, maxTokens);
    case 'openai':
      return callOpenAI(apiKey, systemPrompt, userPrompt, model, maxTokens);
    case 'anthropic':
      return callAnthropic(apiKey, systemPrompt, userPrompt, model, maxTokens);
    case 'openrouter':
      return callOpenRouter(apiKey, systemPrompt, userPrompt, model, maxTokens);
    case 'custom':
      return callCustom(apiKey, await getCustomBaseUrl(), systemPrompt, userPrompt, model, maxTokens);
    default:
      throw new Error(`Unsupported service: ${serviceId}`);
  }
};
