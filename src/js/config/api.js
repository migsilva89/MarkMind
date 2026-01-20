/**
 * API configuration for Gemini service
 * Centralizes all API-related configuration
 */

// Gemini API endpoint
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Model configuration settings
export const MODEL_CONFIG = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192
};

// Combined config object for backward compatibility
const config = {
    GEMINI_API_KEY: '',
    GEMINI_API_URL,
    MODEL_CONFIG
};

export default config;
