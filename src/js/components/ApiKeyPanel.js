/**
 * ApiKeyPanel - Base component for API key management
 * Used by both Welcome and Settings pages
 */

import * as ServiceSelector from './ServiceSelector.js';
import { getService } from '../config/services.js';

let container = null;
let currentService = null;
let config = {
    title: '',
    showWelcomeMessage: false,
    canClose: true,
    onClose: null,
};

export function init() {
    container = document.getElementById('api-key-panel');
    if (!container) {
        createPanel();
    }
    setupEventListeners();
}

function createPanel() {
    container = document.createElement('div');
    container.id = 'api-key-panel';
    container.className = 'settings-panel';
    container.innerHTML = getTemplate();
    document.querySelector('.container').appendChild(container);
}

function getTemplate() {
    return `
        <div class="settings-overlay"></div>
        <div class="settings-content">
            <header class="settings-header">
                <!-- Welcome header (with logo + github) -->
                <div class="header-welcome" id="header-welcome">
                    <div class="header-left">
                        <img src="assets/icons/icon48.png" alt="MarkMind" class="header-logo">
                        <h2 class="settings-title"></h2>
                    </div>
                    <div class="header-actions">
                        <a href="https://github.com/Max-Mendes91/MarkMind" target="_blank" rel="noopener noreferrer" class="github-star-btn">
                            <svg class="github-icon" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <svg class="star-icon" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span>Star</span>
                        </a>
                    </div>
                </div>
                <!-- Settings header (with back arrow + close) -->
                <div class="header-settings" id="header-settings" style="display: none;">
                    <div class="header-left">
                        <button class="icon-btn" id="panel-back" title="Back">
                            <svg class="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <h2 class="settings-title-text">Settings</h2>
                    </div>
                    <button class="icon-btn" id="panel-close" title="Close">
                        <svg class="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </header>

            <div class="settings-body">
                <div class="welcome-message"></div>

                <div id="service-selector-container"></div>

                <!-- API Key Card -->
                <div class="api-key-card">
                    <div class="api-key-card-header">
                        <div class="api-key-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                            </svg>
                        </div>
                        <div class="api-key-titles">
                            <h3 class="api-key-title" id="api-key-label">Gemini API Key</h3>
                            <p class="api-key-subtitle">Required for AI features</p>
                        </div>
                    </div>
                    <input
                        type="password"
                        id="api-key-input"
                        placeholder="Enter your API key..."
                        autocomplete="off"
                    >
                    <div class="api-key-actions">
                        <button id="save-api-key" class="btn btn-primary btn-save">Save</button>
                        <button id="test-api-key" class="btn btn-outline" style="display: none;">Test API</button>
                    </div>
                    <p class="api-key-help">
                        Get your API key at <a href="#" target="_blank" id="api-key-help-link">Google AI Studio</a>
                    </p>
                </div>

                <div id="panel-status" class="settings-status"></div>

                <!-- Privacy & Security -->
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon-wrap">
                            <svg class="info-card-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                        </div>
                        <div class="info-card-titles">
                            <h3 class="info-card-title">Privacy & Security</h3>
                            <p class="info-card-subtitle">Your data stays local</p>
                        </div>
                    </div>
                    <p class="info-card-text">
                        Your API key is stored locally in Chrome and never sent to our servers.
                        Bookmark data is only processed through your selected AI provider.
                    </p>
                    <a href="#" class="info-card-link" id="privacy-policy-link">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        Read Privacy Policy
                    </a>
                </div>

                <!-- Danger Zone (only visible when key exists) -->
                <div class="danger-zone" id="danger-zone" style="display: none;">
                    <h3 class="danger-zone-title">Danger Zone</h3>
                    <button id="remove-api-key" class="btn btn-danger-outline">Remove API Key</button>
                </div>
            </div>

            <footer class="settings-footer">
                <span class="footer-version">MarkMind v2.0.0</span>
                <a href="https://github.com/Max-Mendes91/MarkMind/issues" target="_blank" class="footer-bug-link">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    Report a Bug
                </a>
            </footer>
        </div>
    `;
}

function setupEventListeners() {
    container.querySelector('#panel-close')?.addEventListener('click', close);
    container.querySelector('#panel-back')?.addEventListener('click', close);

    container.querySelector('.settings-overlay')?.addEventListener('click', () => {
        if (config.canClose) close();
    });

    container.querySelector('#save-api-key')?.addEventListener('click', saveApiKey);
    container.querySelector('#test-api-key')?.addEventListener('click', testApiKey);
    container.querySelector('#remove-api-key')?.addEventListener('click', removeApiKey);

    container.querySelector('#api-key-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });
}

export function open(options = {}) {
    config = {
        title: options.title || 'Settings',
        showWelcomeMessage: options.showWelcomeMessage || false,
        canClose: options.canClose !== false,
        onClose: options.onClose || null,
    };

    // Initialize service selector
    const selectorContainer = container.querySelector('#service-selector-container');
    ServiceSelector.init(selectorContainer, onServiceChange);

    updateUI();
    container.classList.add('active');

    // Set initial service and check for existing key
    currentService = getService(ServiceSelector.getCurrentService());
    updateFormForService();
    checkExistingKey();
}

export function close() {
    if (!config.canClose) return;

    container.classList.remove('active');
    clearStatus();

    if (config.onClose) {
        config.onClose();
    }
}

function updateUI() {
    const welcomeHeader = container.querySelector('#header-welcome');
    const settingsHeader = container.querySelector('#header-settings');
    const welcomeTitle = container.querySelector('.settings-title');
    const welcomeMsg = container.querySelector('.welcome-message');

    if (config.showWelcomeMessage) {
        // Welcome mode: show logo header
        welcomeHeader.style.display = 'flex';
        settingsHeader.style.display = 'none';
        welcomeTitle.textContent = config.title;
        welcomeMsg.innerHTML = `
            <p class="welcome-headline">You mark. We mind.</p>
            <p class="welcome-subtext">Connect your AI to begin.</p>
        `;
        welcomeMsg.style.display = 'block';
    } else {
        // Settings mode: show back/close header
        welcomeHeader.style.display = 'none';
        settingsHeader.style.display = 'flex';
        welcomeMsg.style.display = 'none';
    }
}

function onServiceChange(serviceId) {
    currentService = getService(serviceId);
    updateFormForService();
    checkExistingKey();
    clearStatus();
}

function updateFormForService() {
    const label = container.querySelector('#api-key-label');
    const input = container.querySelector('#api-key-input');
    const helpLink = container.querySelector('#api-key-help-link');

    label.textContent = currentService.label;
    input.placeholder = currentService.placeholder;
    helpLink.href = currentService.helpLink;
    helpLink.textContent = currentService.helpLinkText;
}

async function checkExistingKey() {
    const storageKey = currentService.storageKey;
    return new Promise((resolve) => {
        chrome.storage.local.get([storageKey], (result) => {
            if (result[storageKey]) {
                showKeyExists();
            } else {
                resetKeyForm();
            }
            resolve(!!result[storageKey]);
        });
    });
}

function resetKeyForm() {
    const input = container.querySelector('#api-key-input');
    const saveBtn = container.querySelector('#save-api-key');
    const testBtn = container.querySelector('#test-api-key');
    const dangerZone = container.querySelector('#danger-zone');

    input.value = '';
    input.placeholder = currentService.placeholder;
    saveBtn.textContent = 'Save API Key';
    testBtn.style.display = 'none';
    dangerZone.style.display = 'none';
}

function showKeyExists() {
    const input = container.querySelector('#api-key-input');
    const saveBtn = container.querySelector('#save-api-key');
    const testBtn = container.querySelector('#test-api-key');
    const dangerZone = container.querySelector('#danger-zone');

    input.value = '';
    input.placeholder = '••••••••••••••••';
    saveBtn.textContent = 'Update API Key';
    testBtn.style.display = 'inline-block';
    dangerZone.style.display = 'block';
}

async function saveApiKey() {
    const input = container.querySelector('#api-key-input');
    const apiKey = input.value.trim();

    if (!apiKey) {
        showStatus('Please enter an API key', 'error');
        return;
    }

    if (!currentService.validateKey(apiKey)) {
        showStatus('Invalid API key format', 'error');
        return;
    }

    showStatus('Saving...', 'loading');

    try {
        await chrome.storage.local.set({ [currentService.storageKey]: apiKey });
        showStatus('API key saved successfully', 'success');
        showKeyExists();

        // Allow closing after save if it was blocked
        if (!config.canClose) {
            config.canClose = true;
            updateUI();

            setTimeout(() => {
                close();
            }, 1500);
        }
    } catch (error) {
        showStatus('Failed to save API key', 'error');
    }
}

async function testApiKey() {
    // Only Google/Gemini supports direct API testing from browser
    if (currentService.id !== 'google') {
        showStatus('Test not available for this service', 'error');
        return;
    }

    showStatus('Testing connection...', 'loading');

    try {
        const result = await chrome.storage.local.get([currentService.storageKey]);
        const apiKey = result[currentService.storageKey];

        if (!apiKey) {
            showStatus('No API key found', 'error');
            return;
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hello' }] }]
                })
            }
        );

        if (response.ok) {
            showStatus('Connection successful!', 'success');
        } else {
            const error = await response.json();
            showStatus(`Error: ${error.error?.message || 'Invalid API key'}`, 'error');
        }
    } catch (error) {
        showStatus('Connection failed', 'error');
    }
}

async function removeApiKey() {
    if (!confirm('Are you sure you want to remove your API key?')) return;

    try {
        await chrome.storage.local.remove([currentService.storageKey]);
        showStatus('API key removed', 'success');

        // Redirect to welcome screen after brief delay
        setTimeout(() => {
            container.classList.remove('active');
            clearStatus();

            // Reopen in welcome mode
            open({
                title: 'Welcome',
                showWelcomeMessage: true,
                canClose: false,
            });
        }, 1000);
    } catch (error) {
        showStatus('Failed to remove API key', 'error');
    }
}

function showStatus(message, type) {
    const status = container.querySelector('#panel-status');
    status.textContent = message;
    status.className = `settings-status ${type}`;
    status.style.display = 'block';
}

function clearStatus() {
    const status = container.querySelector('#panel-status');
    status.style.display = 'none';
    status.className = 'settings-status';
}
