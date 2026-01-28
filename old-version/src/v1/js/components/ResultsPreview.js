/**
 * ResultsPreview Component
 * Handles rendering organization results and previews
 */

import { createElement, createButton } from '../utils/domUtils.js';

class ResultsPreview {
    constructor() {
        this.container = null;
        this.section = null;
        this.initialized = false;
    }

    /**
     * Initializes the results preview
     * @param {HTMLElement} container - Results list container
     * @param {HTMLElement} section - Results section element
     */
    init(container, section) {
        this.container = container;
        this.section = section;
        this.initialized = true;
    }

    /**
     * Shows the results section
     */
    show() {
        if (this.section) {
            this.section.style.display = 'block';
        }
    }

    /**
     * Hides the results section
     */
    hide() {
        if (this.section) {
            this.section.style.display = 'none';
        }
    }

    /**
     * Clears the results container
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Renders a folder structure preview
     * @param {Array} folders - Folders array from AI suggestion
     * @returns {string} HTML string
     */
    renderFolderStructure(folders) {
        return folders.map(folder => `
            <div class="folder-group">
                <h4>${folder.name} ${folder.isNew ? '<span class="new-badge">New</span>' : ''}</h4>
                <ul>
                    ${folder.bookmarks.map(bm => `
                        <li>
                            <div class="bookmark-title">${bm.title}</div>
                        </li>
                    `).join('')}
                    ${folder.subfolders && folder.subfolders.length > 0 ? `
                        <li class="subfolders">
                            <div class="subfolder-list">
                                ${this.renderFolderStructure(folder.subfolders)}
                            </div>
                        </li>
                    ` : ''}
                </ul>
            </div>
        `).join('');
    }

    /**
     * Shows the organization suggestion preview
     * @param {Object} suggestion - AI suggestion object
     * @param {Object} callbacks - Callback functions
     * @param {Function} callbacks.onApply - Called when user applies suggestion
     * @param {Function} callbacks.onCancel - Called when user cancels
     */
    showSuggestion(suggestion, callbacks) {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="suggestion-summary">
                <h3>Organization Suggestion</h3>
                <p>Bookmarks will be organized into the following folders:</p>
            </div>
            <div class="folders-preview">
                ${this.renderFolderStructure(suggestion.folders)}
            </div>
            <div class="suggestion-actions">
                <button id="apply-suggestion" class="primary-btn">Apply Suggestion</button>
                <button id="cancel-suggestion" class="secondary-btn">Back</button>
            </div>
        `;

        this.setupFolderToggles();
        this.setupActionButtons(callbacks);
    }

    /**
     * Shows the single bookmark suggestion (existing bookmark)
     * @param {Object} suggestion - AI suggestion
     * @param {Object} bookmark - Existing bookmark info
     * @param {Object} callbacks - Callback functions
     */
    showExistingBookmarkSuggestion(suggestion, bookmark, callbacks) {
        if (!this.container) return;

        const targetFolder = suggestion.folders[0].name;

        // Check if already in suggested folder
        if (bookmark.parentTitle === targetFolder) {
            this.container.innerHTML = `
                <div class="suggestion-summary">
                    <h3>Bookmark Already Organized</h3>
                    <p>This page is already bookmarked in the "${targetFolder}" folder.</p>
                </div>
                <div class="suggestion-actions">
                    <button id="view-bookmarks" class="primary-btn">View Bookmarks</button>
                </div>
            `;

            document.getElementById('view-bookmarks').addEventListener('click', callbacks.onViewBookmarks);
            return;
        }

        this.container.innerHTML = `
            <div class="suggestion-summary">
                <h3>Bookmark Already Exists</h3>
                <p>This page is already bookmarked in the "${bookmark.parentTitle}" folder.</p>
                <p>Would you like to:</p>
            </div>
            <div class="folders-preview">
                ${this.renderFolderStructure(suggestion.folders)}
            </div>
            <div class="suggestion-actions">
                <button id="move-bookmark" class="primary-btn">Move to "${targetFolder}"</button>
                <button id="duplicate-bookmark" class="secondary-btn">Keep Both</button>
                <button id="cancel-suggestion" class="secondary-btn">Cancel</button>
            </div>
        `;

        this.setupFolderToggles();

        document.getElementById('move-bookmark').addEventListener('click', callbacks.onMove);
        document.getElementById('duplicate-bookmark').addEventListener('click', callbacks.onDuplicate);
        document.getElementById('cancel-suggestion').addEventListener('click', callbacks.onCancel);
    }

    /**
     * Shows the new bookmark suggestion
     * @param {Object} suggestion - AI suggestion
     * @param {Object} callbacks - Callback functions
     */
    showNewBookmarkSuggestion(suggestion, callbacks) {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="suggestion-summary">
                <h3>Add Page to Bookmarks</h3>
                <p>The page will be bookmarked in the following location:</p>
            </div>
            <div class="folders-preview">
                ${this.renderFolderStructure(suggestion.folders)}
            </div>
            <div class="suggestion-actions">
                <button id="apply-suggestion" class="primary-btn">Add Bookmark</button>
                <button id="cancel-suggestion" class="secondary-btn">Cancel</button>
            </div>
        `;

        this.setupFolderToggles();
        this.setupActionButtons(callbacks);
    }

    /**
     * Shows a success message
     * @param {string} message - Success message
     * @param {Function} onViewBookmarks - Callback for view bookmarks button
     */
    showSuccess(message, onViewBookmarks) {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="success-message">
                <p>${message}</p>
                <button id="view-bookmarks" class="primary-btn">View Bookmarks</button>
            </div>
        `;

        document.getElementById('view-bookmarks').addEventListener('click', onViewBookmarks);
    }

    /**
     * Shows an error message
     * @param {string} message - Error message
     * @param {Object} options - Error options
     * @param {string} options.guidance - Guidance text
     * @param {Array} options.suggestions - List of suggestions
     * @param {Function} options.onRetry - Retry callback
     */
    showError(message, options = {}) {
        if (!this.container) return;

        const { guidance = '', suggestions = [], onRetry } = options;

        this.container.innerHTML = `
            <div class="error-message">
                <h3>Organization Error</h3>
                <p>${message}</p>
                ${guidance ? `
                    <div class="error-guidance">
                        <p><strong>Possible cause:</strong> ${guidance}</p>
                        ${suggestions.length > 0 ? `
                            <p><strong>Suggestions:</strong></p>
                            <ul>
                                ${suggestions.map(s => `<li>${s}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                ` : ''}
                <div class="error-actions">
                    <button id="try-again" class="primary-btn">Try Again</button>
                </div>
            </div>
        `;

        if (onRetry) {
            document.getElementById('try-again').addEventListener('click', onRetry);
        }
    }

    /**
     * Sets up folder toggle functionality
     */
    setupFolderToggles() {
        const folderHeaders = this.container.querySelectorAll('.folder-group h4');

        folderHeaders.forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('expanded');

                const bookmarksList = header.nextElementSibling;
                if (bookmarksList) {
                    bookmarksList.classList.toggle('expanded');
                }

                const folderGroup = header.closest('.folder-group');
                if (folderGroup) {
                    folderGroup.classList.toggle('expanded');
                }

                // Scroll into view if expanding
                if (bookmarksList && bookmarksList.classList.contains('expanded')) {
                    setTimeout(() => {
                        const foldersPreview = header.closest('.folders-preview');
                        if (foldersPreview) {
                            const headerRect = header.getBoundingClientRect();
                            const containerRect = foldersPreview.getBoundingClientRect();

                            if (headerRect.top < containerRect.top || headerRect.bottom > containerRect.bottom) {
                                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                foldersPreview.scrollTop -= 16;
                            }
                        }
                    }, 150);
                }
            });
        });
    }

    /**
     * Sets up action button event handlers
     * @param {Object} callbacks - Callback functions
     */
    setupActionButtons(callbacks) {
        const applyBtn = document.getElementById('apply-suggestion');
        const cancelBtn = document.getElementById('cancel-suggestion');

        if (applyBtn && callbacks.onApply) {
            applyBtn.addEventListener('click', callbacks.onApply);
        }

        if (cancelBtn && callbacks.onCancel) {
            cancelBtn.addEventListener('click', callbacks.onCancel);
        }
    }

    /**
     * Gets error guidance based on error type
     * @param {Error} error - The error object
     * @param {number} bookmarkCount - Number of bookmarks being processed
     * @returns {Object} Guidance object with type, message, and suggestions
     */
    static getErrorGuidance(error, bookmarkCount = 0) {
        const message = error.message || '';
        let type = 'unknown';
        let guidance = 'An unexpected error occurred during the AI analysis.';
        const suggestions = [
            'Check your internet connection',
            'Verify your API key is valid and has sufficient quota',
            'Try again in a few minutes'
        ];

        if (message.includes('quota') || message.includes('rate limit') || message.includes('exceeded')) {
            type = 'quota';
            guidance = 'You have exceeded your API quota or rate limit. Try again later or use a different API key.';
        } else if (message.includes('Invalid response') || message.includes('JSON') || message.includes('parse')) {
            type = 'format';
            guidance = 'The AI returned an invalid response format. This can happen with very large requests.';
        } else if (message.includes('timeout') || message.includes('timed out')) {
            type = 'timeout';
            guidance = 'The request timed out. This usually happens with very large bookmark sets.';
        } else if (message.includes('network') || message.includes('connection')) {
            type = 'network';
            guidance = 'There was a network error. Please check your internet connection and try again.';
        }

        if (bookmarkCount > 80) {
            suggestions.unshift('Try organizing fewer bookmarks at once (under 90 is recommended) for free API keys.');
        }

        return { type, guidance, suggestions };
    }
}

// Export singleton instance
const resultsPreview = new ResultsPreview();
export default resultsPreview;
