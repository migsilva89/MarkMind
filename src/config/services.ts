import { type ServiceConfig, type ServiceTestConfig } from '../types/services';
import { hasArrayWithItems } from '../utils/helpers';

export type { ServiceConfig, ServiceTestConfig };

export const SERVICES: Record<string, ServiceConfig> = {
  google: {
    id: 'google',
    name: 'Google',
    label: 'Gemini API Key',
    storageKey: 'geminiApiKey',
    placeholder: 'Enter your Gemini API key',
    helpLink: 'https://aistudio.google.com/apikey',
    helpLinkText: 'Google AI Studio',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', isDefault: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', isDefault: false },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', isDefault: false },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', isDefault: false },
    ],
    freeTierNote: 'Free tier has rate limits. Some models (e.g. Pro) may require a paid plan or have very low daily quotas.',
    validateKey: (key: string) => key.startsWith('AI') && key.length >= 30,
    testConfig: {
      getEndpoint: (apiKey: string, model?: string) =>
        `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`,
      getHeaders: () => ({ 'Content-Type': 'application/json' }),
      getBody: () => ({ contents: [{ parts: [{ text: 'Hi' }] }] }),
      validateResponse: (data: unknown) => hasArrayWithItems(data, 'candidates'),
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    label: 'OpenAI API Key',
    storageKey: 'openaiApiKey',
    placeholder: 'Enter your OpenAI API key',
    helpLink: 'https://platform.openai.com/api-keys',
    helpLinkText: 'OpenAI Platform',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', isDefault: true },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', isDefault: false },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', isDefault: false },
      { id: 'gpt-4.1', name: 'GPT-4.1', isDefault: false },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', isDefault: false },
      { id: 'gpt-5', name: 'GPT-5', isDefault: false },
      { id: 'gpt-5.2', name: 'GPT-5.2', isDefault: false },
    ],
    validateKey: (key: string) => key.startsWith('sk-') && key.length >= 30,
    testConfig: {
      getEndpoint: () => 'https://api.openai.com/v1/chat/completions',
      getHeaders: (apiKey: string) => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      }),
      getBody: (model: string) => ({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
      validateResponse: (data: unknown) => hasArrayWithItems(data, 'choices'),
    },
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    label: 'Anthropic API Key',
    storageKey: 'anthropicApiKey',
    placeholder: 'Enter your Anthropic API key',
    helpLink: 'https://console.anthropic.com/settings/keys',
    helpLinkText: 'Anthropic Console',
    models: [
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', isDefault: true },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', isDefault: false },
      { id: 'claude-sonnet-4-5-20250514', name: 'Claude Sonnet 4.5', isDefault: false },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', isDefault: false },
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', isDefault: false },
    ],
    validateKey: (key: string) => key.startsWith('sk-ant-') && key.length >= 30,
    testConfig: {
      getEndpoint: () => 'https://api.anthropic.com/v1/messages',
      getHeaders: (apiKey: string) => ({
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      }),
      getBody: (model: string) => ({
        model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
      validateResponse: (data: unknown) => hasArrayWithItems(data, 'content'),
    },
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    label: 'OpenRouter API Key',
    storageKey: 'openrouterApiKey',
    placeholder: 'Enter your OpenRouter API key',
    helpLink: 'https://openrouter.ai/keys',
    helpLinkText: 'OpenRouter Dashboard',
    models: [
      { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', isDefault: true },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', isDefault: false },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', isDefault: false },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', isDefault: false },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', isDefault: false },
      { id: 'moonshotai/kimi-k2', name: 'Kimi K2', isDefault: false },
      { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', isDefault: false },
      { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', isDefault: false },
      { id: 'openai/gpt-5.2', name: 'GPT-5.2', isDefault: false },
      { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', isDefault: false },
    ],
    validateKey: (key: string) => key.startsWith('sk-or-') && key.length >= 30,
    testConfig: {
      getEndpoint: () => 'https://openrouter.ai/api/v1/chat/completions',
      getHeaders: (apiKey: string) => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      }),
      getBody: (model: string) => ({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
      validateResponse: (data: unknown) => hasArrayWithItems(data, 'choices'),
    },
  },
};

export const DEFAULT_SERVICE_ID = 'google';
export const SELECTED_SERVICE_STORAGE_KEY = 'selectedService';
export const SELECTED_MODEL_STORAGE_KEY = 'selectedModel';

export const getService = (serviceId: string): ServiceConfig => {
  return SERVICES[serviceId] || SERVICES[DEFAULT_SERVICE_ID];
};

export const getServiceIds = (): string[] => {
  return Object.keys(SERVICES);
};

export const getDefaultModel = (serviceId: string): string => {
  const service = SERVICES[serviceId] || SERVICES[DEFAULT_SERVICE_ID];
  const defaultModel = service.models.find(model => model.isDefault);
  return defaultModel ? defaultModel.id : service.models[0].id;
};
