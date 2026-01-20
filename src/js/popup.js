/**
 * MarkMind v2 - Entry Point
 *
 * This is a clean slate for v2 development.
 * v1 code is archived at: ../v1/js/popup.js
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log('MarkMind v2 initialized');

    // Cache DOM elements
    const elements = {
        settingsBtn: document.getElementById('settings-btn'),
    };

    // Setup event listeners
    setupEventListeners(elements);
}

function setupEventListeners(elements) {
    elements.settingsBtn?.addEventListener('click', () => {
        console.log('Settings clicked');
        // TODO: Implement settings panel
    });
}
