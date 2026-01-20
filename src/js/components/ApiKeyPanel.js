/**
 * ApiKeyPanel - Base component for API key management
 * Used by both Welcome and Settings pages
 */

let container = null;
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
                <h2 class="settings-title"></h2>
                <button class="settings-close" id="panel-close">&times;</button>
            </header>

            <div class="settings-body">
                <div class="welcome-message"></div>

                <div class="form-group">
                    <label for="api-key-input">Gemini API Key</label>
                    <input
                        type="password"
                        id="api-key-input"
                        placeholder="Enter your API key"
                        autocomplete="off"
                    >
                    <p class="help-text">
                        Get your free API key at
                        <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a>
                    </p>
                </div>

                <div id="panel-status" class="settings-status"></div>

                <div class="settings-actions">
                    <button id="save-api-key" class="btn btn-primary">Save API Key</button>
                    <button id="test-api-key" class="btn btn-secondary" style="display: none;">Test Connection</button>
                    <button id="remove-api-key" class="btn btn-danger" style="display: none;">Remove Key</button>
                </div>
            </div>

            <footer class="settings-footer">
                <a href="https://github.com/migsilva89/MarkMind" target="_blank">GitHub</a>
                <span class="separator">•</span>
                <a href="#" id="privacy-link">Privacy</a>
            </footer>
        </div>
    `;
}

function setupEventListeners() {
    container.querySelector('#panel-close')?.addEventListener('click', close);

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

    updateUI();
    container.classList.add('active');
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
    const title = container.querySelector('.settings-title');
    const welcomeMsg = container.querySelector('.welcome-message');
    const closeBtn = container.querySelector('#panel-close');

    title.textContent = config.title;

    if (config.showWelcomeMessage) {
        welcomeMsg.innerHTML = `
            <p>AI-powered bookmark organization at your fingertips.</p>
            <p>To get started, please add your Gemini API key below.</p>
        `;
        welcomeMsg.style.display = 'block';
    } else {
        welcomeMsg.style.display = 'none';
    }

    closeBtn.style.display = config.canClose ? 'block' : 'none';
}

async function checkExistingKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['geminiApiKey'], (result) => {
            if (result.geminiApiKey) {
                showKeyExists();
            }
            resolve(!!result.geminiApiKey);
        });
    });
}

function showKeyExists() {
    const input = container.querySelector('#api-key-input');
    const saveBtn = container.querySelector('#save-api-key');
    const testBtn = container.querySelector('#test-api-key');
    const removeBtn = container.querySelector('#remove-api-key');

    input.value = '';
    input.placeholder = '••••••••••••••••';
    saveBtn.textContent = 'Update API Key';
    testBtn.style.display = 'inline-block';
    removeBtn.style.display = 'inline-block';
}

async function saveApiKey() {
    const input = container.querySelector('#api-key-input');
    const apiKey = input.value.trim();

    if (!apiKey) {
        showStatus('Please enter an API key', 'error');
        return;
    }

    if (!apiKey.startsWith('AI') || apiKey.length < 30) {
        showStatus('Invalid API key format', 'error');
        return;
    }

    showStatus('Saving...', 'loading');

    try {
        await chrome.storage.local.set({ geminiApiKey: apiKey });
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
    showStatus('Testing connection...', 'loading');

    try {
        const result = await chrome.storage.local.get(['geminiApiKey']);
        const apiKey = result.geminiApiKey;

        if (!apiKey) {
            showStatus('No API key found', 'error');
            return;
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
        await chrome.storage.local.remove(['geminiApiKey']);

        const input = container.querySelector('#api-key-input');
        const saveBtn = container.querySelector('#save-api-key');
        const testBtn = container.querySelector('#test-api-key');
        const removeBtn = container.querySelector('#remove-api-key');

        input.value = '';
        input.placeholder = 'Enter your API key';
        saveBtn.textContent = 'Save API Key';
        testBtn.style.display = 'none';
        removeBtn.style.display = 'none';

        showStatus('API key removed', 'success');
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
