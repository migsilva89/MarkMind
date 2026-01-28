/**
 * AI Service Configurations
 *
 * Each service has:
 * - id, name, label: Display info for UI
 * - storageKey: Chrome storage key for the API key
 * - validateKey: Function to check key format before saving
 * - testConfig: Configuration for testing API connection (data-driven approach)
 */

export const SERVICES = {
    google: {
        id: 'google',
        name: 'Google',
        label: 'Gemini API Key',
        storageKey: 'geminiApiKey',
        placeholder: 'Enter your Gemini API key',
        helpLink: 'https://aistudio.google.com/apikey',
        helpLinkText: 'Google AI Studio',
        // Google keys start with 'AI'
        validateKey: (key) => key.startsWith('AI') && key.length >= 30,
        // testConfig enables data-driven API testing (no if/else chains needed)
        testConfig: {
            getEndpoint: (key) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
            getHeaders: () => ({ 'Content-Type': 'application/json' }),
            getBody: () => ({ contents: [{ parts: [{ text: 'Hi' }] }] }),
            validateResponse: (data) => data.candidates?.length > 0
        }
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        label: 'OpenAI API Key',
        storageKey: 'openaiApiKey',
        placeholder: 'Enter your OpenAI API key',
        helpLink: 'https://platform.openai.com/api-keys',
        helpLinkText: 'OpenAI Platform',
        // OpenAI keys start with 'sk-'
        validateKey: (key) => key.startsWith('sk-') && key.length >= 30,
        testConfig: {
            getEndpoint: () => 'https://api.openai.com/v1/chat/completions',
            getHeaders: (key) => ({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            }),
            getBody: () => ({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            }),
            validateResponse: (data) => data.choices?.length > 0
        }
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        label: 'Anthropic API Key',
        storageKey: 'anthropicApiKey',
        placeholder: 'Enter your Anthropic API key',
        helpLink: 'https://console.anthropic.com/settings/keys',
        helpLinkText: 'Anthropic Console',
        // Anthropic keys start with 'sk-ant-'
        validateKey: (key) => key.startsWith('sk-ant-') && key.length >= 30,
        testConfig: {
            getEndpoint: () => 'https://api.anthropic.com/v1/messages',
            getHeaders: (key) => ({
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                // Required header for browser/extension access
                'anthropic-dangerous-direct-browser-access': 'true'
            }),
            getBody: () => ({
                model: 'claude-3-haiku-20240307',
                max_tokens: 5,
                messages: [{ role: 'user', content: 'Hi' }]
            }),
            validateResponse: (data) => data.content?.length > 0
        }
    },
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        label: 'OpenRouter API Key',
        storageKey: 'openrouterApiKey',
        placeholder: 'Enter your OpenRouter API key',
        helpLink: 'https://openrouter.ai/keys',
        helpLinkText: 'OpenRouter Dashboard',
        // OpenRouter keys start with 'sk-or-'
        validateKey: (key) => key.startsWith('sk-or-') && key.length >= 30,
        // OpenRouter uses OpenAI-compatible API format
        testConfig: {
            getEndpoint: () => 'https://openrouter.ai/api/v1/chat/completions',
            getHeaders: (key) => ({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            }),
            getBody: () => ({
                model: 'openai/gpt-4o-mini',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            }),
            validateResponse: (data) => data.choices?.length > 0
        }
    }
};

export const DEFAULT_SERVICE = 'google';
export const SELECTED_SERVICE_KEY = 'selectedService';

// Get service config by ID (falls back to default if not found)
export function getService(serviceId) {
    return SERVICES[serviceId] || SERVICES[DEFAULT_SERVICE];
}

// Get list of all available service IDs
export function getServiceIds() {
    return Object.keys(SERVICES);
}
