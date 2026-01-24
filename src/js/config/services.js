/**
 * AI Service Configurations
 *
 * Each service has:
 * - id: unique identifier
 * - name: display name for UI
 * - label: form label for API key input
 * - storageKey: chrome.storage key for this service's API key
 * - placeholder: input placeholder text
 * - helpLink: URL to get API key
 * - helpLinkText: display text for help link
 * - validateKey: function to validate key format
 *
 * CHANGELOG:
 * - 20 JANUARY: Created with Google, OpenAI, Anthropic services
 * - 24 JANUARY: Added OpenRouter service (API aggregator)
 */

export const SERVICES = {
    // 20 JANUARY: Original services
    google: {
        id: 'google',
        name: 'Google',
        label: 'Gemini API Key',
        storageKey: 'geminiApiKey',
        placeholder: 'Enter your Gemini API key',
        helpLink: 'https://aistudio.google.com/apikey',
        helpLinkText: 'Google AI Studio',
        validateKey: (key) => key.startsWith('AI') && key.length >= 30,
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        label: 'OpenAI API Key',
        storageKey: 'openaiApiKey',
        placeholder: 'Enter your OpenAI API key',
        helpLink: 'https://platform.openai.com/api-keys',
        helpLinkText: 'OpenAI Platform',
        validateKey: (key) => key.startsWith('sk-') && key.length >= 30,
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        label: 'Anthropic API Key',
        storageKey: 'anthropicApiKey',
        placeholder: 'Enter your Anthropic API key',
        helpLink: 'https://console.anthropic.com/settings/keys',
        helpLinkText: 'Anthropic Console',
        validateKey: (key) => key.startsWith('sk-ant-') && key.length >= 30,
    },
    // ============================================
    // 24 JANUARY: Added OpenRouter
    // - API aggregator that provides access to multiple AI models
    // - Uses OpenAI-compatible API format
    // - Keys start with 'sk-or-'
    // ============================================
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        label: 'OpenRouter API Key',
        storageKey: 'openrouterApiKey',
        placeholder: 'Enter your OpenRouter API key',
        helpLink: 'https://openrouter.ai/keys',
        helpLinkText: 'OpenRouter Dashboard',
        validateKey: (key) => key.startsWith('sk-or-') && key.length >= 30,
        baseUrl: 'https://openrouter.ai/api/v1',
    },
};

// Default service
export const DEFAULT_SERVICE = 'google';

// Storage key for selected service
export const SELECTED_SERVICE_KEY = 'selectedService';

/**
 * Get service config by ID
 */
export function getService(serviceId) {
    return SERVICES[serviceId] || SERVICES[DEFAULT_SERVICE];
}

/**
 * Get all service IDs
 */
export function getServiceIds() {
    return Object.keys(SERVICES);
}
