/**
 * Welcome Component
 * First-time user onboarding screen
 * Uses ApiKeyPanel with welcome configuration
 */

import * as ApiKeyPanel from './ApiKeyPanel.js';

export function init() {
    ApiKeyPanel.init();
}

export function open(options = {}) {
    ApiKeyPanel.open({
        title: 'Welcome to MarkMind',
        showWelcomeMessage: true,
        canClose: false,
        onClose: options.onClose,
    });
}

export function close() {
    ApiKeyPanel.close();
}
