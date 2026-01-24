/**
 * ServiceSelector Component
 *
 * Displays service selection tabs (Google, OpenAI, Anthropic, OpenRouter)
 * Reusable in Welcome and Settings screens
 */

import { SERVICES, DEFAULT_SERVICE, SELECTED_SERVICE_KEY, getServiceIds } from '../config/services.js';

let currentService = DEFAULT_SERVICE;
let onChangeCallback = null;

/**
 * Initialize the service selector
 * @param {HTMLElement} containerElement - Element to render tabs into
 * @param {Function} onChange - Callback when service changes
 */
export function init(containerElement, onChange) {
    onChangeCallback = onChange;
    render(containerElement);
    loadSavedService();
}

/**
 * Render the service tabs
 */
function render(containerElement) {
    containerElement.innerHTML = `
        <div class="service-selector">
            <p class="service-selector-label">AI Provider</p>
            <div class="service-tabs-pill">
                ${getServiceIds().map(id => `
                    <button
                        class="service-tab-pill ${id === currentService ? 'active' : ''}"
                        data-service="${id}"
                    >
                        ${SERVICES[id].name}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Add click listeners
    containerElement.querySelectorAll('.service-tab-pill').forEach(tab => {
        tab.addEventListener('click', () => selectService(tab.dataset.service));
    });
}

/**
 * Load saved service from storage
 */
async function loadSavedService() {
    return new Promise((resolve) => {
        chrome.storage.local.get([SELECTED_SERVICE_KEY], (result) => {
            if (result[SELECTED_SERVICE_KEY] && SERVICES[result[SELECTED_SERVICE_KEY]]) {
                selectService(result[SELECTED_SERVICE_KEY], false);
            }
            resolve();
        });
    });
}

/**
 * Select a service
 * @param {string} serviceId - Service to select
 * @param {boolean} save - Whether to save to storage (default: true)
 */
export function selectService(serviceId, save = true) {
    if (!SERVICES[serviceId]) return;

    currentService = serviceId;

    // Update UI
    document.querySelectorAll('.service-tab-pill').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.service === serviceId);
    });

    // Save to storage
    if (save) {
        chrome.storage.local.set({ [SELECTED_SERVICE_KEY]: serviceId });
    }

    // Notify listener
    if (onChangeCallback) {
        onChangeCallback(serviceId);
    }
}

/**
 * Get current selected service ID
 */
export function getCurrentService() {
    return currentService;
}
