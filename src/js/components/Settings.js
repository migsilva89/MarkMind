/**
 * Settings Component
 * User settings and API key management
 * Uses ApiKeyPanel with settings configuration
 */

import * as ApiKeyPanel from './ApiKeyPanel.js';

export function init() {
    ApiKeyPanel.init();
}

export function open(options = {}) {
    ApiKeyPanel.open({
        title: 'Settings',
        showWelcomeMessage: false,
        canClose: true,
        onClose: options.onClose,
    });
}

export function close() {
    ApiKeyPanel.close();
}
