/**
 * OrganizationManager
 * Handles the bookmark organization workflow
 */

import { UI_STATES, BOOKMARK_TYPES, CHROME_NATIVE_FOLDERS } from '../config/constants.js';
import { cleanUrl } from '../utils/urlUtils.js';
import { isNativeFolder } from '../utils/folderUtils.js';
import bookmarkService from '../services/bookmarkService.js';
import geminiService from '../services/geminiService.js';
import stateManager from './StateManager.js';
import uiManager from './UIManager.js';
import bookmarkTreeManager from './BookmarkTreeManager.js';
import logPanel from '../components/LogPanel.js';
import progressBar from '../components/ProgressBar.js';
import resultsPreview from '../components/ResultsPreview.js';

class OrganizationManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initializes the organization manager
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;
    }

    /**
     * Starts the bulk organization workflow
     */
    async organizeBulk() {
        const selectedBookmarks = stateManager.getPendingBookmarksArray();

        if (selectedBookmarks.length === 0) {
            uiManager.showStatus('No bookmarks selected', 'error');
            return;
        }

        try {
            // Switch to execution UI
            stateManager.setUIState(UI_STATES.EXECUTING);
            stateManager.setProcessing(true);
            logPanel.clear();

            // Start progress simulation
            const progress = progressBar.startSimulation();

            // Show process explanation
            logPanel.showProcessExplanation();

            // Get existing folders
            const existingFolders = stateManager.getExistingFolders();

            logPanel.info(`Starting organization of ${selectedBookmarks.length} bookmarks`);
            logPanel.info('Current Statistics:', `
                <ul>
                    <li>Bookmarks to organize: ${selectedBookmarks.length}</li>
                    <li>Existing folders: ${existingFolders.length}</li>
                    <li>Maximum folder depth: 3 levels</li>
                </ul>
            `);

            logPanel.info('Phase 1: Analyzing bookmark patterns...');
            await this.delay(1000);

            logPanel.info('Phase 2: Generating organization suggestions...');

            // Get suggestion from Gemini
            const suggestion = await geminiService.suggestOrganization(
                selectedBookmarks,
                existingFolders,
                logPanel.createLogger(),
                false
            );

            progress.complete();

            // Validate suggestion
            if (!suggestion || !suggestion.folders || suggestion.folders.length === 0) {
                throw new Error('AI response is missing folder structure');
            }

            logPanel.success('AI Analysis Complete');
            logPanel.info('Organization Summary:', `
                <ul>
                    <li>Bookmarks organized: ${this.countTotalBookmarks(suggestion.folders)}</li>
                    <li>New folders to create: ${suggestion.folders.filter(f => f.isNew).length}</li>
                    <li>Existing folders to use: ${suggestion.folders.filter(f => !f.isNew).length}</li>
                    <li>Total folders in structure: ${suggestion.folders.length}</li>
                </ul>
            `);

            // Store suggestion and show results
            stateManager.setCurrentSuggestion(suggestion);
            stateManager.setUIState(UI_STATES.RESULTS);

            // Show suggestion preview
            resultsPreview.showSuggestion(suggestion, {
                onApply: () => this.applySuggestion(suggestion),
                onCancel: () => this.cancelOrganization()
            });

        } catch (error) {
            logPanel.error(`Error during AI analysis: ${error.message}`);
            stateManager.setProcessing(false);
            stateManager.setUIState(UI_STATES.RESULTS);

            const { guidance, suggestions } = resultsPreview.constructor.getErrorGuidance(
                error,
                selectedBookmarks.length
            );

            resultsPreview.showError(error.message, {
                guidance,
                suggestions,
                onRetry: () => this.cancelOrganization()
            });
        }
    }

    /**
     * Adds the current page as a bookmark
     */
    async addCurrentPage() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('No active tab found');
            }

            uiManager.showStatus('Analyzing page...', 'loading');

            // Check if URL is already bookmarked
            const existingBookmarks = await bookmarkService.searchBookmarks({ url: tab.url });
            let bookmarkObj;

            if (existingBookmarks && existingBookmarks.length > 0) {
                const existingBookmark = existingBookmarks[0];

                // Get parent folder info
                let parentFolder = null;
                try {
                    const parentNode = await bookmarkService.getBookmark(existingBookmark.parentId);
                    if (parentNode && parentNode.length > 0) {
                        parentFolder = parentNode[0];
                    }
                } catch (error) {
                    console.error('Error getting parent folder:', error);
                }

                logPanel.info(`Found existing bookmark: "${existingBookmark.title}" (ID: ${existingBookmark.id})`);
                if (parentFolder) {
                    logPanel.info(`Currently in folder: "${parentFolder.title}"`);
                }

                bookmarkObj = {
                    type: BOOKMARK_TYPES.EXISTING,
                    id: existingBookmark.id,
                    title: existingBookmark.title,
                    url: existingBookmark.url,
                    parentId: existingBookmark.parentId,
                    parentTitle: parentFolder ? parentFolder.title : 'Unknown Folder'
                };
            } else {
                bookmarkObj = {
                    type: BOOKMARK_TYPES.NEW,
                    id: 'temp-' + Date.now(),
                    title: tab.title,
                    url: tab.url
                };
                logPanel.info(`Creating new bookmark for: "${tab.title}"`);
            }

            // Switch to execution view
            stateManager.setUIState(UI_STATES.EXECUTING);
            stateManager.setProcessing(true);
            logPanel.clear();

            logPanel.info('Analyzing current page...');
            logPanel.info(`Page Title: ${tab.title}`);
            logPanel.info(`URL: ${tab.url}`);

            // Set pending bookmark
            stateManager.clearPendingBookmarks();
            stateManager.addPendingBookmark(bookmarkObj);

            // Get existing folders
            const existingFolders = stateManager.getExistingFolders();

            // Start progress simulation
            const progress = progressBar.startSimulation();

            logPanel.info('Requesting AI analysis...');

            // Get suggestion
            const suggestion = await geminiService.suggestOrganization(
                [bookmarkObj],
                existingFolders,
                logPanel.createLogger(),
                true
            );

            progress.complete();

            if (!suggestion || !suggestion.folders || suggestion.folders.length === 0) {
                throw new Error('Invalid suggestion received');
            }

            // Store and show results
            stateManager.setCurrentSuggestion(suggestion);
            stateManager.setUIState(UI_STATES.RESULTS);

            // Show appropriate preview based on bookmark type
            if (bookmarkObj.type === BOOKMARK_TYPES.EXISTING) {
                resultsPreview.showExistingBookmarkSuggestion(suggestion, bookmarkObj, {
                    onMove: () => this.applyMoveBookmark(suggestion, bookmarkObj),
                    onDuplicate: () => this.applyDuplicateBookmark(suggestion, bookmarkObj),
                    onCancel: () => this.cancelOrganization(),
                    onViewBookmarks: () => this.finishAndReload()
                });
            } else {
                resultsPreview.showNewBookmarkSuggestion(suggestion, {
                    onApply: () => this.applySingleBookmarkSuggestion(suggestion),
                    onCancel: () => this.cancelOrganization()
                });
            }

        } catch (error) {
            console.error('Error adding current page:', error);
            logPanel.error(`Error: ${error.message}`);
            stateManager.setProcessing(false);
            stateManager.setUIState(UI_STATES.NORMAL);
            uiManager.showStatus(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Applies the bulk organization suggestion
     * @param {Object} suggestion - The AI suggestion
     */
    async applySuggestion(suggestion) {
        try {
            stateManager.setUIState(UI_STATES.EXECUTING);
            progressBar.show();
            progressBar.update(0, 'Applying organization...');

            logPanel.info('Starting to apply changes...');
            this.logFolderStructure(suggestion.folders);

            // Process all folders
            for (const folder of suggestion.folders) {
                await this.processFolder(folder, '1', false);
            }

            // Clear selection
            stateManager.clearPendingBookmarks();

            // Show success
            stateManager.setUIState(UI_STATES.RESULTS);
            resultsPreview.showSuccess('Organization completed successfully!', () => this.finishAndReload());

            logPanel.success('Organization completed successfully!');
        } catch (error) {
            logPanel.error(`Error during organization: ${error.message}`);
            resultsPreview.showError(error.message, {
                onRetry: () => this.finishAndReload()
            });
        } finally {
            stateManager.setProcessing(false);
        }
    }

    /**
     * Applies single bookmark suggestion
     * @param {Object} suggestion - The AI suggestion
     */
    async applySingleBookmarkSuggestion(suggestion) {
        try {
            stateManager.setUIState(UI_STATES.EXECUTING);
            progressBar.update(0, 'Adding bookmark...');

            logPanel.info('Creating bookmark...');

            for (const folder of suggestion.folders) {
                await this.processFolder(folder, '1', true);
            }

            stateManager.setUIState(UI_STATES.RESULTS);
            resultsPreview.showSuccess('Bookmark added successfully!', () => this.finishAndReload());

            logPanel.success('Bookmark added successfully!');
        } catch (error) {
            logPanel.error(`Error adding bookmark: ${error.message}`);
            resultsPreview.showError(error.message, {
                onRetry: () => this.cancelOrganization()
            });
        } finally {
            stateManager.setProcessing(false);
        }
    }

    /**
     * Moves an existing bookmark to suggested folder
     * @param {Object} suggestion - The AI suggestion
     * @param {Object} bookmark - The existing bookmark
     */
    async applyMoveBookmark(suggestion, bookmark) {
        try {
            stateManager.setUIState(UI_STATES.EXECUTING);
            progressBar.update(0, 'Moving bookmark...');

            const targetFolder = suggestion.folders[0].name;
            logPanel.info(`Moving bookmark from "${bookmark.parentTitle}" to "${targetFolder}"...`);

            for (const folder of suggestion.folders) {
                await this.processFolder(folder, '1', true);
            }

            stateManager.setUIState(UI_STATES.RESULTS);
            resultsPreview.showSuccess('Bookmark moved successfully!', () => this.finishAndReload());

            logPanel.success('Bookmark moved successfully!');
        } catch (error) {
            logPanel.error(`Error moving bookmark: ${error.message}`);
            resultsPreview.showError(error.message, {
                onRetry: () => this.cancelOrganization()
            });
        } finally {
            stateManager.setProcessing(false);
        }
    }

    /**
     * Creates a duplicate bookmark in suggested folder
     * @param {Object} suggestion - The AI suggestion
     * @param {Object} bookmark - The existing bookmark
     */
    async applyDuplicateBookmark(suggestion, bookmark) {
        try {
            stateManager.setUIState(UI_STATES.EXECUTING);
            progressBar.update(0, 'Creating duplicate bookmark...');

            const targetFolder = suggestion.folders[0].name;
            logPanel.info(`Creating duplicate bookmark in "${targetFolder}"...`);

            // Change type to 'new' to force creation
            bookmark.type = BOOKMARK_TYPES.NEW;
            stateManager.clearPendingBookmarks();
            stateManager.addPendingBookmark(bookmark);

            for (const folder of suggestion.folders) {
                await this.processFolder(folder, '1', true);
            }

            stateManager.setUIState(UI_STATES.RESULTS);
            resultsPreview.showSuccess('Duplicate bookmark created successfully!', () => this.finishAndReload());

            logPanel.success('Duplicate bookmark created successfully!');
        } catch (error) {
            logPanel.error(`Error duplicating bookmark: ${error.message}`);
            resultsPreview.showError(error.message, {
                onRetry: () => this.cancelOrganization()
            });
        } finally {
            stateManager.setProcessing(false);
        }
    }

    /**
     * Processes a folder from the suggestion
     * @param {Object} folder - Folder data
     * @param {string} parentId - Parent folder ID
     * @param {boolean} isSingleBookmark - Whether this is a single bookmark operation
     */
    async processFolder(folder, parentId = '1', isSingleBookmark = false) {
        try {
            let targetFolder;

            // Check for native Chrome folder
            const isNative = folder.id === '1' || folder.id === '2' || folder.id === '3';

            if (isNative) {
                logPanel.info(`Using native Chrome folder "${folder.name}" (ID: ${folder.id})...`);
                const nativeFolder = await bookmarkService.getSubTree(folder.id);
                if (nativeFolder && nativeFolder[0]) {
                    targetFolder = nativeFolder[0];
                    logPanel.success(`Native folder "${folder.name}" found with ID: ${targetFolder.id}`);
                } else {
                    throw new Error(`Native folder with ID ${folder.id} not found`);
                }
            } else {
                if (folder.isNew) {
                    logPanel.info(`Creating folder "${folder.name}" under parent ${parentId}...`);
                    targetFolder = await bookmarkService.createFolder(parentId, folder.name);
                    logPanel.success(`Folder created with ID: ${targetFolder.id}`);
                } else {
                    logPanel.info(`Looking for existing folder "${folder.name}" under parent ${parentId}...`);
                    targetFolder = await bookmarkService.findOrCreateFolder(parentId, folder.name, true);
                    logPanel.success(`Folder "${folder.name}" ready with ID: ${targetFolder.id}`);
                }
            }

            const folderId = targetFolder.id;

            // Process subfolders first
            if (folder.subfolders && folder.subfolders.length > 0) {
                logPanel.info(`Processing ${folder.subfolders.length} subfolders of "${folder.name}"...`);
                for (const subfolder of folder.subfolders) {
                    await this.processFolder(subfolder, folderId, isSingleBookmark);
                }
            }

            // Move bookmarks to this folder
            if (folder.bookmarks && folder.bookmarks.length > 0) {
                await this.processBookmarks(folder, folderId, isSingleBookmark);
            }

            return targetFolder;
        } catch (error) {
            logPanel.error(`Error processing folder ${folder.name}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Processes bookmarks within a folder
     * @param {Object} folder - Folder with bookmarks
     * @param {string} folderId - Target folder ID
     * @param {boolean} isSingleBookmark - Whether single bookmark operation
     */
    async processBookmarks(folder, folderId, isSingleBookmark) {
        const pendingBookmarks = stateManager.getPendingBookmarksArray();

        if (isSingleBookmark) {
            // Process single bookmark
            const bookmark = folder.bookmarks[0];
            const existingBookmark = pendingBookmarks[0];

            if (existingBookmark.type === BOOKMARK_TYPES.NEW) {
                const created = await bookmarkService.createBookmark({
                    parentId: folderId,
                    title: bookmark.title,
                    url: bookmark.url
                });
                logPanel.success(`Created: ${bookmark.title} in "${folder.name}"`);
                logPanel.info(`URL: ${bookmark.url}`);
                logPanel.info(`ID: ${created.id}`);
            } else {
                await bookmarkService.moveBookmark(existingBookmark.id, { parentId: folderId });
                logPanel.success(`Moved: ${bookmark.title} to "${folder.name}"`);
                logPanel.info(`From: ${existingBookmark.url}`);
                logPanel.info(`ID: ${existingBookmark.id}`);
            }
        } else {
            // Process multiple bookmarks
            logPanel.info(`Moving ${folder.bookmarks.length} bookmarks to "${folder.name}"...`);

            for (const bookmark of folder.bookmarks) {
                try {
                    const cleanedSuggestedUrl = cleanUrl(bookmark.url);
                    const existingBookmark = pendingBookmarks.find(bm => {
                        const cleanedExistingUrl = cleanUrl(bm.url);
                        return cleanedExistingUrl === cleanedSuggestedUrl && bm.title === bookmark.title;
                    });

                    if (!existingBookmark) {
                        logPanel.warning(`Bookmark not found: ${bookmark.title} (${bookmark.url})`);
                        continue;
                    }

                    if (existingBookmark.type === BOOKMARK_TYPES.NEW) {
                        const created = await bookmarkService.createBookmark({
                            parentId: folderId,
                            title: bookmark.title,
                            url: bookmark.url
                        });
                        logPanel.success(`Created: ${bookmark.title} in "${folder.name}"`);
                        logPanel.info(`URL: ${bookmark.url}`);
                        logPanel.info(`ID: ${created.id}`);
                    } else {
                        await bookmarkService.moveBookmark(existingBookmark.id, { parentId: folderId });
                        logPanel.success(`Moved: ${bookmark.title} to "${folder.name}"`);
                        logPanel.info(`From: ${existingBookmark.url}`);
                        logPanel.info(`ID: ${existingBookmark.id}`);
                    }
                } catch (error) {
                    logPanel.error(`Error processing ${bookmark.title}: ${error.message}`);
                    logPanel.error(`URL: ${bookmark.url}`);
                }
            }
        }
    }

    /**
     * Cancels the current organization and returns to normal state
     */
    cancelOrganization() {
        stateManager.setProcessing(false);
        stateManager.setCurrentSuggestion(null);
        stateManager.setUIState(UI_STATES.NORMAL);
    }

    /**
     * Finishes operation and reloads bookmark tree
     */
    async finishAndReload() {
        stateManager.setProcessing(false);
        stateManager.clearPendingBookmarks();
        stateManager.setCurrentSuggestion(null);
        stateManager.setUIState(UI_STATES.NORMAL);

        // Reload bookmark tree
        await bookmarkTreeManager.loadAndRender(logPanel.createLogger());

        // Hide warning
        const warningElement = document.getElementById('bookmark-limit-warning');
        if (warningElement) {
            warningElement.style.display = 'none';
        }
    }

    /**
     * Logs folder structure for debugging
     * @param {Array} folders - Folders array
     * @param {number} depth - Current depth
     */
    logFolderStructure(folders, depth = 0) {
        folders.forEach(folder => {
            const indent = '  '.repeat(depth);
            const status = folder.isNew ? '[New]' : '[Existing]';
            logPanel.info(`${indent}${status} Folder "${folder.name}" with ${folder.bookmarks.length} bookmarks`);

            if (folder.subfolders && folder.subfolders.length > 0) {
                this.logFolderStructure(folder.subfolders, depth + 1);
            }
        });
    }

    /**
     * Counts total bookmarks in folder structure
     * @param {Array} folders - Folders array
     * @returns {number} Total count
     */
    countTotalBookmarks(folders) {
        return folders.reduce((total, folder) => {
            const bookmarksInFolder = folder.bookmarks.length;
            const bookmarksInSubfolders = folder.subfolders
                ? this.countTotalBookmarks(folder.subfolders)
                : 0;
            return total + bookmarksInFolder + bookmarksInSubfolders;
        }, 0);
    }

    /**
     * Helper for delays
     * @param {number} ms - Milliseconds
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
const organizationManager = new OrganizationManager();
export default organizationManager;
