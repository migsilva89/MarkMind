/**
 * UIManager
 * Handles UI state transitions and element visibility
 */

import { UI_STATES, LIMITS } from '../config/constants.js';
import { showElement, hideElement } from '../utils/domUtils.js';
import stateManager from './StateManager.js';

class UIManager {
    constructor() {
        this.elements = {};
        this.initialized = false;
    }

    /**
     * Initializes the UI manager with DOM elements
     */
    init() {
        if (this.initialized) return;

        // Cache DOM elements
        this.elements = {
            // Main containers
            bookmarksContainer: document.getElementById('bookmarks-container'),
            pendingSection: document.getElementById('pending-bookmarks'),
            pendingList: document.getElementById('pending-list'),
            pendingCount: document.getElementById('pending-count'),

            // Header elements
            settingsBtn: document.getElementById('settings-btn'),
            addCurrentBtn: document.getElementById('add-current-btn'),
            addStatus: document.getElementById('add-status'),

            // Settings
            settingsSection: document.getElementById('settings-section'),
            settingsClose: document.getElementById('settings-close'),
            apiKeyInput: document.getElementById('api-key'),
            saveApiKeyBtn: document.getElementById('save-api-key'),
            removeApiKeyBtn: document.getElementById('remove-api-key'),
            testApiBtn: document.getElementById('test-api'),
            testResult: document.getElementById('test-result'),

            // API Key Warning
            apiKeyWarning: document.getElementById('api-key-warning'),
            configureApiKeyBtn: document.getElementById('configure-api-key'),

            // Controls
            selectAllBtn: document.getElementById('select-all'),
            deselectAllBtn: document.getElementById('deselect-all'),
            organizeBtn: document.getElementById('organize-btn'),

            // Progress
            progressSection: document.querySelector('.progress-section'),
            progressIndicator: document.getElementById('progress-indicator'),
            progressText: document.getElementById('progress-text'),
            progressCount: document.getElementById('progress-count'),

            // Results
            resultsSection: document.querySelector('.results-section'),
            resultsList: document.getElementById('results-list'),

            // Logs
            logsSection: document.querySelector('.logs-section'),
            logsContainer: document.getElementById('logs-container'),
            collapseBtn: document.getElementById('collapse-logs'),

            // Other
            header: document.querySelector('.header'),
            controls: document.querySelector('.controls'),
            container: document.querySelector('.container')
        };

        // Subscribe to state changes
        stateManager.subscribe('uiState', this.handleUIStateChange.bind(this));
        stateManager.subscribe('pendingBookmarks', this.updatePendingList.bind(this));
        stateManager.subscribe('isApiKeyValid', this.updateApiKeyUI.bind(this));

        this.initialized = true;
    }

    /**
     * Gets a cached DOM element
     * @param {string} name - Element name
     * @returns {HTMLElement|null} The element
     */
    getElement(name) {
        return this.elements[name] || null;
    }

    /**
     * Handles UI state transitions
     * @param {string} state - New UI state
     */
    handleUIStateChange(state) {
        const {
            bookmarksContainer,
            pendingSection,
            controls,
            header,
            logsSection,
            progressSection,
            resultsSection,
            settingsSection,
            container,
            collapseBtn,
            logsContainer,
            addStatus
        } = this.elements;

        // Element groups for each state
        const stateElements = {
            [UI_STATES.NORMAL]: [bookmarksContainer, pendingSection, controls, header],
            [UI_STATES.EXECUTING]: [logsSection, progressSection],
            [UI_STATES.RESULTS]: [logsSection, resultsSection]
        };

        // Hide all managed elements first
        Object.values(stateElements).flat().forEach(element => {
            hideElement(element);
        });

        // Always hide settings when changing views
        hideElement(settingsSection);

        // Hide bookmark limit warning in results state
        const warningElement = document.getElementById('bookmark-limit-warning');
        if (warningElement && state === UI_STATES.RESULTS) {
            hideElement(warningElement);
        }

        // Reset add status in normal state
        if (addStatus && state === UI_STATES.NORMAL) {
            hideElement(addStatus);
            addStatus.textContent = '';
            addStatus.className = 'status-message';
        }

        // Show elements for current state
        switch (state) {
            case UI_STATES.NORMAL:
                stateElements[UI_STATES.NORMAL].forEach(element => {
                    if (element) element.style.display = '';
                });
                break;

            case UI_STATES.EXECUTING:
                stateElements[UI_STATES.EXECUTING].forEach(element => {
                    showElement(element);
                });
                break;

            case UI_STATES.RESULTS:
                stateElements[UI_STATES.RESULTS].forEach(element => {
                    showElement(element);
                });
                // Auto-collapse logs
                if (collapseBtn && logsContainer) {
                    collapseBtn.classList.add('collapsed');
                    logsContainer.classList.add('collapsed');
                    const logsHeader = document.querySelector('.logs-header');
                    if (logsHeader) logsHeader.classList.add('collapsed');
                }
                break;
        }

        // Adjust container padding
        if (container) {
            container.style.padding = state === UI_STATES.NORMAL ? '24px' : '12px';
        }
    }

    /**
     * Updates the pending bookmarks list display
     */
    updatePendingList() {
        const { pendingSection, pendingList, pendingCount, organizeBtn } = this.elements;
        const bookmarks = stateManager.getPendingBookmarksArray();
        const count = bookmarks.length;

        if (pendingCount) {
            pendingCount.textContent = count;
        }

        if (pendingSection) {
            pendingSection.style.display = count > 0 ? 'block' : 'none';
        }

        // Show bookmark limit warning
        this.showBookmarkLimitWarning(count);

        // Update pending list content
        if (pendingList) {
            pendingList.innerHTML = '';
            bookmarks.forEach(bookmark => {
                const item = this.createPendingItem(bookmark);
                pendingList.appendChild(item);
            });
        }

        // Update organize button
        if (organizeBtn) {
            organizeBtn.disabled = count === 0 || !stateManager.isApiKeyValid();
        }
    }

    /**
     * Creates a pending bookmark item element
     * @param {Object} bookmark - Bookmark data
     * @returns {HTMLElement} The item element
     */
    createPendingItem(bookmark) {
        const item = document.createElement('div');
        item.className = 'pending-item';

        const title = document.createElement('span');
        title.className = 'title';
        title.title = bookmark.title;
        title.textContent = bookmark.title;

        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&#10005;';
        removeBtn.title = 'Remove';
        removeBtn.onclick = () => {
            stateManager.removePendingBookmark(bookmark);

            // Uncheck checkbox if it exists
            if (bookmark.type === 'existing') {
                const checkbox = document.querySelector(`input[data-bookmark-id="${bookmark.id}"]`);
                if (checkbox) checkbox.checked = false;
            }
        };

        item.appendChild(title);
        item.appendChild(removeBtn);
        return item;
    }

    /**
     * Shows/hides bookmark limit warning
     * @param {number} count - Number of selected bookmarks
     */
    showBookmarkLimitWarning(count) {
        let warningElement = document.getElementById('bookmark-limit-warning');

        if (!warningElement) {
            warningElement = document.createElement('div');
            warningElement.id = 'bookmark-limit-warning';
            warningElement.className = 'warning-message';

            const bookmarksContainer = this.elements.bookmarksContainer;
            if (bookmarksContainer && bookmarksContainer.parentNode) {
                bookmarksContainer.parentNode.insertBefore(warningElement, bookmarksContainer);
            }
        }

        if (count > LIMITS.BOOKMARK_WARNING_THRESHOLD) {
            warningElement.style.display = 'block';
            warningElement.innerHTML = `
                <div class="warning-icon">&#9888;</div>
                <div class="warning-text">
                    <strong>Large Selection Warning:</strong> You've selected ${count} bookmarks.
                    <p>Free API keys may have limitations with large requests. For best and precise results, consider organizing in smaller batches like 15 or 20 bookmarks at a time. Is up to you to decide if you want to proceed.</p>
                </div>
            `;
        } else {
            warningElement.style.display = 'none';
        }
    }

    /**
     * Updates UI based on API key validity
     * @param {boolean} hasApiKey - Whether API key is valid
     */
    updateApiKeyUI(hasApiKey) {
        const {
            apiKeyWarning,
            addCurrentBtn,
            organizeBtn,
            selectAllBtn,
            deselectAllBtn,
            testApiBtn,
            removeApiKeyBtn
        } = this.elements;

        // Show/hide API key warning
        if (apiKeyWarning) {
            apiKeyWarning.style.display = hasApiKey ? 'none' : 'block';
        }

        // Enable/disable buttons
        if (addCurrentBtn) addCurrentBtn.disabled = !hasApiKey;
        if (selectAllBtn) selectAllBtn.disabled = !hasApiKey;
        if (deselectAllBtn) deselectAllBtn.disabled = !hasApiKey;

        if (organizeBtn) {
            organizeBtn.disabled = !hasApiKey || stateManager.getPendingBookmarksCount() === 0;
        }

        // Show/hide API key related buttons
        if (testApiBtn) testApiBtn.style.display = hasApiKey ? 'block' : 'none';
        if (removeApiKeyBtn) removeApiKeyBtn.style.display = hasApiKey ? 'block' : 'none';
    }

    /**
     * Shows a status message
     * @param {string} message - Message text
     * @param {string} type - Message type (loading, success, error)
     * @param {boolean} isSettings - Whether to show in settings section
     */
    showStatus(message, type = 'loading', isSettings = false) {
        const statusElement = isSettings
            ? document.getElementById('settings-status')
            : this.elements.addStatus;

        if (!statusElement) return;

        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.style.display = 'block';

        if (isSettings) {
            statusElement.style.marginTop = '16px';
        }

        if (type !== 'loading') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, LIMITS.STATUS_MESSAGE_TIMEOUT);
        }
    }

    /**
     * Opens the settings panel
     */
    openSettings() {
        const { settingsSection } = this.elements;
        if (settingsSection) {
            settingsSection.style.display = 'block';
        }
    }

    /**
     * Closes the settings panel
     */
    closeSettings() {
        const { settingsSection } = this.elements;
        if (settingsSection) {
            settingsSection.style.display = 'none';
        }
    }

    /**
     * Resets progress indicators
     */
    resetProgress() {
        const { progressIndicator, progressText, progressCount } = this.elements;

        if (progressIndicator) progressIndicator.style.width = '0%';
        if (progressText) progressText.textContent = '';
        if (progressCount) progressCount.textContent = '0%';
    }

    /**
     * Updates progress indicators
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} text - Status text
     */
    updateProgress(progress, text) {
        const { progressIndicator, progressText, progressCount } = this.elements;

        if (progressIndicator) progressIndicator.style.width = `${progress}%`;
        if (progressText) progressText.textContent = text;
        if (progressCount) progressCount.textContent = `${Math.round(progress)}%`;
    }

    /**
     * Clears the logs container
     */
    clearLogs() {
        const { logsContainer } = this.elements;
        if (logsContainer) {
            logsContainer.innerHTML = '';
        }
    }

    /**
     * Transitions to a specific UI state
     * @param {string} state - Target UI state
     */
    transitionTo(state) {
        stateManager.setUIState(state);
    }
}

// Export singleton instance
const uiManager = new UIManager();
export default uiManager;
