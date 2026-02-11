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
    validateKey: (key: string) => key.startsWith('AI') && key.length >= 30,
    testConfig: {
      getEndpoint: (apiKey: string) =>
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
    validateKey: (key: string) => key.startsWith('sk-') && key.length >= 30,
    testConfig: {
      getEndpoint: () => 'https://api.openai.com/v1/chat/completions',
      getHeaders: (apiKey: string) => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      }),
      getBody: () => ({
        model: 'gpt-4o-mini',
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
    validateKey: (key: string) => key.startsWith('sk-ant-') && key.length >= 30,
    testConfig: {
      getEndpoint: () => 'https://api.anthropic.com/v1/messages',
      getHeaders: (apiKey: string) => ({
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      }),
      getBody: () => ({
        model: 'claude-haiku-4-5-20251001',
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
    validateKey: (key: string) => key.startsWith('sk-or-') && key.length >= 30,
    testConfig: {
      getEndpoint: () => 'https://openrouter.ai/api/v1/chat/completions',
      getHeaders: (apiKey: string) => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      }),
      getBody: () => ({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
      validateResponse: (data: unknown) => hasArrayWithItems(data, 'choices'),
    },
  },
};

export const DEFAULT_SERVICE_ID = 'google';
export const SELECTED_SERVICE_STORAGE_KEY = 'selectedService';

export const getService = (serviceId: string): ServiceConfig => {
  return SERVICES[serviceId] || SERVICES[DEFAULT_SERVICE_ID];
};

export const getServiceIds = (): string[] => {
  return Object.keys(SERVICES);
};
