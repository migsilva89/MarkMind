/**
 * StateManager
 * Centralized state management for the application
 * Implements a simple observable pattern for state changes
 */

import { UI_STATES } from '../config/constants.js';
import { buildFolderHierarchyJSON, collectFoldersFromTree } from '../utils/folderUtils.js';

class StateManager {
    constructor() {
        // Initialize state
        this._state = {
            // Bookmark data
            bookmarksTree: [],
            existingFolders: [],
            existingFoldersHierarchy: '',

            // Selection state
            pendingBookmarks: new Set(),

            // UI state
            uiState: UI_STATES.NORMAL,
            isApiKeyValid: false,

            // Current operation state
            currentSuggestion: null,
            isProcessing: false
        };

        // Listeners for state changes
        this._listeners = new Map();

        // Bind methods
        this.getState = this.getState.bind(this);
        this.setState = this.setState.bind(this);
        this.subscribe = this.subscribe.bind(this);
    }

    /**
     * Gets the current state or a specific property
     * @param {string} [key] - Optional key to get specific property
     * @returns {*} The state or property value
     */
    getState(key) {
        if (key) {
            return this._state[key];
        }
        return { ...this._state };
    }

    /**
     * Updates the state and notifies listeners
     * @param {string|Object} keyOrUpdates - Key to update or object with updates
     * @param {*} [value] - Value if key is string
     */
    setState(keyOrUpdates, value) {
        const updates = typeof keyOrUpdates === 'string'
            ? { [keyOrUpdates]: value }
            : keyOrUpdates;

        const changedKeys = [];

        Object.entries(updates).forEach(([key, newValue]) => {
            if (this._state[key] !== newValue) {
                this._state[key] = newValue;
                changedKeys.push(key);
            }
        });

        // Notify listeners of changes
        changedKeys.forEach(key => {
            this._notifyListeners(key, this._state[key]);
        });

        // Always notify 'any' listeners
        if (changedKeys.length > 0) {
            this._notifyListeners('*', this._state);
        }
    }

    /**
     * Subscribes to state changes
     * @param {string} key - State key to watch ('*' for any change)
     * @param {Function} listener - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, listener) {
        if (!this._listeners.has(key)) {
            this._listeners.set(key, new Set());
        }

        this._listeners.get(key).add(listener);

        // Return unsubscribe function
        return () => {
            this._listeners.get(key).delete(listener);
        };
    }

    /**
     * Notifies listeners of state changes
     * @private
     */
    _notifyListeners(key, value) {
        const listeners = this._listeners.get(key);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(value, key);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        }
    }

    // ============ Bookmark State Methods ============

    /**
     * Updates the bookmarks tree
     * @param {Array} tree - The bookmark tree from Chrome API
     */
    setBookmarksTree(tree) {
        this.setState('bookmarksTree', tree);

        // Also update existing folders
        if (tree && tree[0] && tree[0].children) {
            const folders = [];
            const folderMap = new Map();

            tree[0].children.forEach(node => {
                const folder = collectFoldersFromTree(node);
                if (folder && node.id !== '0') {
                    folders.push(folder);
                    folderMap.set(node.id, folder);
                }
            });

            this.setState({
                existingFolders: folders,
                existingFoldersHierarchy: buildFolderHierarchyJSON(folders)
            });
        }
    }

    /**
     * Gets the existing folders hierarchy as JSON
     * @returns {string} JSON string
     */
    getExistingFoldersHierarchy() {
        return this._state.existingFoldersHierarchy;
    }

    /**
     * Gets the parsed existing folders
     * @returns {Array} Folders array
     */
    getExistingFolders() {
        try {
            return JSON.parse(this._state.existingFoldersHierarchy || '[]');
        } catch {
            return [];
        }
    }

    // ============ Selection State Methods ============

    /**
     * Adds a bookmark to pending selection
     * @param {Object} bookmark - Bookmark to add
     */
    addPendingBookmark(bookmark) {
        const pending = new Set(this._state.pendingBookmarks);
        pending.add(bookmark);
        this.setState('pendingBookmarks', pending);
    }

    /**
     * Removes a bookmark from pending selection
     * @param {Object} bookmark - Bookmark to remove
     */
    removePendingBookmark(bookmark) {
        const pending = new Set(this._state.pendingBookmarks);

        // Find and remove by id
        for (const item of pending) {
            if (item.id === bookmark.id) {
                pending.delete(item);
                break;
            }
        }

        this.setState('pendingBookmarks', pending);
    }

    /**
     * Clears all pending bookmarks
     */
    clearPendingBookmarks() {
        this.setState('pendingBookmarks', new Set());
    }

    /**
     * Gets pending bookmarks as array
     * @returns {Array} Array of pending bookmarks
     */
    getPendingBookmarksArray() {
        return Array.from(this._state.pendingBookmarks);
    }

    /**
     * Gets the count of pending bookmarks
     * @returns {number} Count
     */
    getPendingBookmarksCount() {
        return this._state.pendingBookmarks.size;
    }

    /**
     * Checks if a bookmark is pending by ID
     * @param {string} bookmarkId - Bookmark ID
     * @returns {boolean} True if pending
     */
    isBookmarkPending(bookmarkId) {
        for (const item of this._state.pendingBookmarks) {
            if (item.id === bookmarkId) {
                return true;
            }
        }
        return false;
    }

    // ============ UI State Methods ============

    /**
     * Sets the current UI state
     * @param {string} state - UI state from UI_STATES
     */
    setUIState(state) {
        if (Object.values(UI_STATES).includes(state)) {
            this.setState('uiState', state);
        } else {
            console.warn('Invalid UI state:', state);
        }
    }

    /**
     * Gets the current UI state
     * @returns {string} Current UI state
     */
    getUIState() {
        return this._state.uiState;
    }

    /**
     * Sets the API key validity
     * @param {boolean} isValid - Whether API key is valid
     */
    setApiKeyValid(isValid) {
        this.setState('isApiKeyValid', isValid);
    }

    /**
     * Checks if API key is valid
     * @returns {boolean} True if valid
     */
    isApiKeyValid() {
        return this._state.isApiKeyValid;
    }

    // ============ Operation State Methods ============

    /**
     * Sets the current suggestion from AI
     * @param {Object|null} suggestion - The suggestion object
     */
    setCurrentSuggestion(suggestion) {
        this.setState('currentSuggestion', suggestion);
    }

    /**
     * Gets the current suggestion
     * @returns {Object|null} The current suggestion
     */
    getCurrentSuggestion() {
        return this._state.currentSuggestion;
    }

    /**
     * Sets the processing state
     * @param {boolean} isProcessing - Whether processing
     */
    setProcessing(isProcessing) {
        this.setState('isProcessing', isProcessing);
    }

    /**
     * Checks if currently processing
     * @returns {boolean} True if processing
     */
    isProcessing() {
        return this._state.isProcessing;
    }

    // ============ Reset Methods ============

    /**
     * Resets to initial state
     */
    reset() {
        this.setState({
            pendingBookmarks: new Set(),
            uiState: UI_STATES.NORMAL,
            currentSuggestion: null,
            isProcessing: false
        });
    }

    /**
     * Resets selection state only
     */
    resetSelection() {
        this.setState({
            pendingBookmarks: new Set(),
            currentSuggestion: null
        });
    }
}

// Export singleton instance
const stateManager = new StateManager();
export default stateManager;
