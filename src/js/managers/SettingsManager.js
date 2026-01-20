/**
 * SettingsManager
 * Handles API key configuration and settings functionality
 */

import { API_KEY_PATTERN } from '../config/constants.js';
import storageService from '../services/storageService.js';
import geminiService from '../services/geminiService.js';
import stateManager from './StateManager.js';
import uiManager from './UIManager.js';
import logPanel from '../components/LogPanel.js';

class SettingsManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initializes the settings manager
     */
    async init() {
        if (this.initialized) return;

        // Check initial API key status
        await this.checkApiKey();

        this.initialized = true;
    }

    /**
     * Checks and validates the stored API key
     * @returns {Promise<boolean>} Whether API key is valid
     */
    async checkApiKey() {
        try {
            const apiKey = await storageService.getApiKey();
            const hasValidKey = apiKey && apiKey.trim() !== '';

            stateManager.setApiKeyValid(hasValidKey);

            if (hasValidKey) {
                geminiService.setApiKey(apiKey);

                // Update input field if it exists
                const apiKeyInput = uiManager.getElement('apiKeyInput');
                if (apiKeyInput) {
                    apiKeyInput.value = apiKey;
                }
            }

            return hasValidKey;
        } catch (error) {
            console.error('Error checking API key:', error);
            stateManager.setApiKeyValid(false);
            return false;
        }
    }

    /**
     * Validates API key format
     * @param {string} apiKey - API key to validate
     * @returns {Object} Validation result with isValid and message
     */
    validateApiKeyFormat(apiKey) {
        if (!apiKey || apiKey.trim() === '') {
            return {
                isValid: false,
                message: 'Please enter a valid API key.'
            };
        }

        if (!API_KEY_PATTERN.test(apiKey)) {
            return {
                isValid: false,
                message: 'Invalid API key format. Must start with "AIza" and be 39 characters long.'
            };
        }

        return { isValid: true, message: '' };
    }

    /**
     * Saves the API key
     * @param {string} apiKey - API key to save
     * @returns {Promise<Object>} Result with success status and message
     */
    async saveApiKey(apiKey) {
        const validation = this.validateApiKeyFormat(apiKey);
        if (!validation.isValid) {
            return { success: false, message: validation.message };
        }

        try {
            await storageService.saveApiKey(apiKey);
            geminiService.setApiKey(apiKey);
            stateManager.setApiKeyValid(true);

            return { success: true, message: 'API key saved successfully!' };
        } catch (error) {
            return { success: false, message: `Error saving API key: ${error.message}` };
        }
    }

    /**
     * Removes the stored API key
     * @returns {Promise<Object>} Result with success status and message
     */
    async removeApiKey() {
        try {
            await storageService.removeApiKey();
            geminiService.setApiKey('');
            stateManager.setApiKeyValid(false);

            // Clear input field
            const apiKeyInput = uiManager.getElement('apiKeyInput');
            if (apiKeyInput) {
                apiKeyInput.value = '';
            }

            return { success: true, message: 'API key removed successfully' };
        } catch (error) {
            return { success: false, message: `Error removing API key: ${error.message}` };
        }
    }

    /**
     * Tests the API key by making a sample request
     * @returns {Promise<Object>} Test result
     */
    async testApiKey() {
        try {
            // Test with a sample bookmark
            const response = await geminiService.suggestOrganization([{
                title: 'MDN Web Docs: Your Guide to Web Development',
                url: 'https://developer.mozilla.org',
                id: 'test'
            }], [], logPanel.createLogger());

            return {
                success: true,
                response: {
                    status: 'Success',
                    suggestedFolders: response.folders.map(f => f.name),
                    organizationSummary: response.summary || 'Organization suggestion received'
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    name: error.name,
                    message: error.message,
                    suggestion: error.message.includes('API key')
                        ? 'Please check if your API key is valid and properly configured.'
                        : 'Please try again or check your internet connection.'
                }
            };
        }
    }

    /**
     * Opens the settings panel
     */
    openSettings() {
        uiManager.openSettings();

        const apiKeyInput = uiManager.getElement('apiKeyInput');
        if (apiKeyInput) {
            apiKeyInput.focus();
        }
    }

    /**
     * Closes the settings panel
     */
    closeSettings() {
        uiManager.closeSettings();
    }

    /**
     * Gets the current API key (masked for display)
     * @returns {Promise<string>} Masked API key
     */
    async getMaskedApiKey() {
        const apiKey = await storageService.getApiKey();
        if (!apiKey) return '';

        // Show first 8 and last 4 characters
        if (apiKey.length > 12) {
            return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
        }

        return apiKey;
    }
}

// Export singleton instance
const settingsManager = new SettingsManager();
export default settingsManager;
