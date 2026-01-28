/**
 * MarkMind - AI-Powered Bookmark Organizer
 * Main Entry Point
 *
 * This file serves as the application entry point, initializing all modules
 * and setting up event handlers. The actual logic is delegated to specialized
 * managers and components.
 */

// ============ Imports ============
import stateManager from './managers/StateManager.js';
import uiManager from './managers/UIManager.js';
import bookmarkTreeManager from './managers/BookmarkTreeManager.js';
import settingsManager from './managers/SettingsManager.js';
import organizationManager from './managers/OrganizationManager.js';
import logPanel from './components/LogPanel.js';
import progressBar from './components/ProgressBar.js';
import resultsPreview from './components/ResultsPreview.js';

// ============ Application Initialization ============
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeApplication();
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});

/**
 * Initializes all application modules and sets up event handlers
 */
async function initializeApplication() {
    // Initialize UI Manager first (caches DOM elements)
    uiManager.init();

    // Initialize components
    initializeComponents();

    // Initialize managers
    await initializeManagers();

    // Setup event handlers
    setupEventHandlers();

    // Load initial data
    await loadInitialData();

    // Add report bug button
    addReportBugButton();
}

/**
 * Initializes UI components with their DOM elements
 */
function initializeComponents() {
    // Initialize LogPanel
    logPanel.init(
        document.getElementById('logs-container'),
        document.querySelector('.logs-section'),
        document.getElementById('collapse-logs')
    );

    // Initialize ProgressBar
    progressBar.init(
        document.getElementById('progress-indicator'),
        document.getElementById('progress-text'),
        document.getElementById('progress-count'),
        document.querySelector('.progress-section')
    );

    // Initialize ResultsPreview
    resultsPreview.init(
        document.getElementById('results-list'),
        document.querySelector('.results-section')
    );

    // Initialize BookmarkTreeManager
    bookmarkTreeManager.init(
        document.getElementById('bookmarks-container'),
        handleSelectionChange
    );
}

/**
 * Initializes application managers
 */
async function initializeManagers() {
    // Initialize settings and check API key
    await settingsManager.init();

    // Initialize organization manager
    organizationManager.init();
}

/**
 * Sets up all event handlers
 */
function setupEventHandlers() {
    const elements = {
        // Settings
        settingsBtn: document.getElementById('settings-btn'),
        settingsClose: document.getElementById('settings-close'),
        saveApiKeyBtn: document.getElementById('save-api-key'),
        removeApiKeyBtn: document.getElementById('remove-api-key'),
        testApiBtn: document.getElementById('test-api'),
        configureApiKeyBtn: document.getElementById('configure-api-key'),

        // Controls
        selectAllBtn: document.getElementById('select-all'),
        deselectAllBtn: document.getElementById('deselect-all'),
        organizeBtn: document.getElementById('organize-btn'),
        addCurrentBtn: document.getElementById('add-current-btn')
    };

    // Settings handlers
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => {
            settingsManager.openSettings();
        });
    }

    if (elements.settingsClose) {
        elements.settingsClose.addEventListener('click', () => {
            settingsManager.closeSettings();
            showMainSections();
        });
    }

    if (elements.configureApiKeyBtn) {
        elements.configureApiKeyBtn.addEventListener('click', () => {
            settingsManager.openSettings();
        });
    }

    if (elements.saveApiKeyBtn) {
        elements.saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
    }

    if (elements.removeApiKeyBtn) {
        elements.removeApiKeyBtn.addEventListener('click', handleRemoveApiKey);
    }

    if (elements.testApiBtn) {
        elements.testApiBtn.addEventListener('click', handleTestApiKey);
    }

    // Control handlers
    if (elements.selectAllBtn) {
        elements.selectAllBtn.addEventListener('click', () => {
            bookmarkTreeManager.selectAll();
        });
    }

    if (elements.deselectAllBtn) {
        elements.deselectAllBtn.addEventListener('click', () => {
            bookmarkTreeManager.deselectAll();
            hidePendingSection();
        });
    }

    if (elements.organizeBtn) {
        elements.organizeBtn.addEventListener('click', () => {
            organizationManager.organizeBulk();
        });
    }

    if (elements.addCurrentBtn) {
        elements.addCurrentBtn.addEventListener('click', () => {
            organizationManager.addCurrentPage();
        });
    }
}

/**
 * Loads initial data
 */
async function loadInitialData() {
    await bookmarkTreeManager.loadAndRender(logPanel.createLogger());
}

// ============ Event Handlers ============

/**
 * Handles selection changes in the bookmark tree
 */
function handleSelectionChange() {
    const organizeBtn = document.getElementById('organize-btn');
    if (organizeBtn) {
        organizeBtn.disabled = stateManager.getPendingBookmarksCount() === 0 || !stateManager.isApiKeyValid();
    }
}

/**
 * Handles saving API key
 */
async function handleSaveApiKey() {
    const apiKeyInput = document.getElementById('api-key');
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';

    const result = await settingsManager.saveApiKey(apiKey);
    uiManager.showStatus(result.message, result.success ? 'success' : 'error', true);

    if (result.success) {
        // Add styling classes
        const saveBtn = document.getElementById('save-api-key');
        const testBtn = document.getElementById('test-api');
        if (saveBtn) saveBtn.classList.add('primary-btn');
        if (testBtn) testBtn.classList.add('primary-btn');
    }
}

/**
 * Handles removing API key
 */
async function handleRemoveApiKey() {
    if (!confirm('Are you sure you want to remove your API key? This will disable the AI organization feature.')) {
        return;
    }

    const result = await settingsManager.removeApiKey();
    uiManager.showStatus(result.message, result.success ? 'success' : 'error', true);
}

/**
 * Handles testing API key
 */
async function handleTestApiKey() {
    const testResult = document.getElementById('test-result');
    if (!testResult) return;

    testResult.style.display = 'block';
    testResult.innerHTML = '<div class="status-message loading">Testing API connection and functionality...</div>';

    const result = await settingsManager.testApiKey();

    if (result.success) {
        testResult.innerHTML = `
            <div class="test-result success">
                <div>&#10003; API Connection: <strong>Successful</strong></div>
                <div>&#10003; Authentication: <strong>Valid</strong></div>
                <div>&#10003; Response: <strong>Valid JSON format</strong></div>
                <div class="test-details">
                    <pre>${JSON.stringify(result.response, null, 2)}</pre>
                </div>
            </div>
        `;
    } else {
        testResult.innerHTML = `
            <div class="test-result error">
                <div>&#10007; API Test Failed</div>
                <div class="error-details">
                    <strong>Error Type:</strong> ${result.error.name}<br>
                    <strong>Message:</strong> ${result.error.message}<br>
                    <strong>Possible Solution:</strong> ${result.error.suggestion}
                </div>
            </div>
        `;
    }
}

// ============ Helper Functions ============

/**
 * Shows main UI sections after closing settings
 */
function showMainSections() {
    const sections = ['.header', '.controls', '#bookmarks-container'];
    sections.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = '';
        }
    });
}

/**
 * Hides the pending bookmarks section
 */
function hidePendingSection() {
    const pendingSection = document.getElementById('pending-bookmarks');
    if (pendingSection) {
        pendingSection.style.display = 'none';
    }
}

/**
 * Adds the report bug button to settings
 */
function addReportBugButton() {
    const settingsSection = document.getElementById('settings-section');
    if (!settingsSection) return;

    // Check if button already exists
    if (settingsSection.querySelector('.report-bug-btn')) return;

    const reportBugBtn = document.createElement('button');
    reportBugBtn.innerHTML = '&#x1F41B; Report a Bug';
    reportBugBtn.className = 'secondary-btn report-bug-btn';
    reportBugBtn.addEventListener('click', () => {
        window.open('https://github.com/migsilva89/MarkMind/issues/new', '_blank');
    });
    settingsSection.appendChild(reportBugBtn);
}
