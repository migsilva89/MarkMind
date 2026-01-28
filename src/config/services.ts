/**
 * AI Service Configurations
 *
 * Each service has:
 * - id, name, label: Display info for UI
 * - storageKey: Chrome storage key for the API key
 * - validateKey: Function to check key format before saving
 * - testConfig: Configuration for testing API connection (data-driven approach)
 */

export interface ServiceTestConfig {
  getEndpoint: (apiKey: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
  getBody: () => Record<string, unknown>;
  validateResponse: (data: unknown) => boolean;
}

export interface ServiceConfig {
  id: string;
  name: string;
  label: string;
  storageKey: string;
  placeholder: string;
  helpLink: string;
  helpLinkText: string;
  validateKey: (key: string) => boolean;
  testConfig: ServiceTestConfig;
}

/**
 * Type-safe helper to check if data has an array property with items
 */
const hasArrayWithItems = (data: unknown, propertyName: string): boolean => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj[propertyName]) && obj[propertyName].length > 0;
};

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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        model: 'claude-3-haiku-20240307',
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
