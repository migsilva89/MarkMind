/**
 * BookmarkTreeManager
 * Handles bookmark tree rendering and selection management
 */

import { BOOKMARK_TYPES } from '../config/constants.js';
import { countBookmarksInFolder } from '../utils/folderUtils.js';
import { createElement, createCheckbox, createLabel } from '../utils/domUtils.js';
import bookmarkService from '../services/bookmarkService.js';
import stateManager from './StateManager.js';

class BookmarkTreeManager {
    constructor() {
        this.container = null;
        this.onSelectionChange = null;
    }

    /**
     * Initializes the tree manager
     * @param {HTMLElement} container - Container element for the tree
     * @param {Function} onSelectionChange - Callback when selection changes
     */
    init(container, onSelectionChange = null) {
        this.container = container;
        this.onSelectionChange = onSelectionChange;
    }

    /**
     * Loads and renders the bookmark tree
     * @param {Function} logger - Logging function
     */
    async loadAndRender(logger = null) {
        if (!this.container) {
            console.error('BookmarkTreeManager: Container not initialized');
            return;
        }

        try {
            this.container.innerHTML = '';

            const tree = await bookmarkService.getBookmarkTree();
            stateManager.setBookmarksTree(tree);

            const folderCount = this.countFolders(tree[0]);
            if (logger) {
                logger(`Existing folders loaded: ${folderCount}`, 'info');
            }

            this.renderTree(tree[0], this.container);
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            throw error;
        }
    }

    /**
     * Counts folders in a tree
     * @param {Object} node - Tree node
     * @returns {number} Folder count
     */
    countFolders(node) {
        let count = 0;
        if (!node.url && node.id !== '0') count++;
        if (node.children) {
            node.children.forEach(child => {
                count += this.countFolders(child);
            });
        }
        return count;
    }

    /**
     * Renders the bookmark tree
     * @param {Object} node - Root node
     * @param {HTMLElement} container - Container element
     * @param {number} level - Nesting level
     */
    renderTree(node, container, level = 0) {
        if (!node.children) return;

        const nodeContainer = createElement('div', {
            style: { marginLeft: `${level * 20}px` }
        });
        container.appendChild(nodeContainer);

        if (node.id !== '0') {
            this.renderFolder(node, nodeContainer, level);
        } else {
            node.children.forEach(child => this.renderTree(child, container, 0));
        }
    }

    /**
     * Renders a folder node
     * @param {Object} node - Folder node
     * @param {HTMLElement} nodeContainer - Container element
     * @param {number} level - Nesting level
     */
    renderFolder(node, nodeContainer, level) {
        const folderDiv = createElement('div', {
            className: 'bookmark-item folder-item'
        });

        const checkbox = this.createFolderCheckbox(node);
        const toggleBtn = this.createFolderToggleButton();
        const label = this.createFolderLabel(node);
        const childrenContainer = this.createChildrenContainer();

        this.setupFolderEvents(checkbox, toggleBtn, label, childrenContainer, node);

        folderDiv.appendChild(checkbox);
        folderDiv.appendChild(toggleBtn);
        folderDiv.appendChild(label);
        nodeContainer.appendChild(folderDiv);
        nodeContainer.appendChild(childrenContainer);

        node.children.forEach(child => {
            if (child.url) {
                this.renderBookmark(child, childrenContainer);
            } else if (child.children) {
                this.renderTree(child, childrenContainer, 1);
            }
        });
    }

    /**
     * Creates a folder checkbox
     * @param {Object} node - Folder node
     * @returns {HTMLInputElement} Checkbox element
     */
    createFolderCheckbox(node) {
        return createCheckbox(`folder-${node.id}`, { folderId: node.id });
    }

    /**
     * Creates a folder toggle button
     * @returns {HTMLElement} Toggle button element
     */
    createFolderToggleButton() {
        return createElement('span', {
            className: 'folder-toggle',
            textContent: '›'
        });
    }

    /**
     * Creates a folder label
     * @param {Object} node - Folder node
     * @returns {HTMLElement} Label element
     */
    createFolderLabel(node) {
        const label = createLabel(`folder-${node.id}`, '', 'folder-name');
        label.textContent = `${node.title || 'Bookmarks'} `;

        const count = createElement('span', {
            className: 'bookmark-count',
            textContent: `(${countBookmarksInFolder(node)})`
        });
        label.appendChild(count);

        return label;
    }

    /**
     * Creates a children container
     * @returns {HTMLElement} Container element
     */
    createChildrenContainer() {
        return createElement('div', {
            className: 'folder-children',
            style: { display: 'none' }
        });
    }

    /**
     * Sets up folder event handlers
     * @param {HTMLInputElement} checkbox - Folder checkbox
     * @param {HTMLElement} toggleBtn - Toggle button
     * @param {HTMLElement} label - Folder label
     * @param {HTMLElement} childrenContainer - Children container
     * @param {Object} node - Folder node
     */
    setupFolderEvents(checkbox, toggleBtn, label, childrenContainer, node) {
        checkbox.addEventListener('change', async (e) => {
            const checked = e.target.checked;
            const childCheckboxes = childrenContainer.querySelectorAll('input[type="checkbox"]');
            childCheckboxes.forEach(cb => cb.checked = checked);

            const folder = await bookmarkService.getSubTree(node.id);
            if (folder[0]) {
                this.toggleFolderBookmarks(folder[0], checked);
            }

            if (this.onSelectionChange) {
                this.onSelectionChange();
            }
        });

        toggleBtn.addEventListener('click', () => {
            const isExpanded = childrenContainer.style.display === 'block';
            childrenContainer.style.display = isExpanded ? 'none' : 'block';
            toggleBtn.classList.toggle('expanded');
        });

        label.addEventListener('click', (e) => {
            if (e.target === label || e.target.classList.contains('folder-name')) {
                toggleBtn.click();
            }
        });
    }

    /**
     * Toggles all bookmarks in a folder
     * @param {Object} folderNode - Folder node
     * @param {boolean} checked - Whether to select or deselect
     */
    toggleFolderBookmarks(folderNode, checked) {
        if (folderNode.url) {
            const bookmark = {
                type: BOOKMARK_TYPES.EXISTING,
                id: folderNode.id,
                title: folderNode.title,
                url: folderNode.url
            };

            if (checked) {
                stateManager.addPendingBookmark(bookmark);
            } else {
                stateManager.removePendingBookmark(bookmark);
            }
        }

        if (folderNode.children) {
            folderNode.children.forEach(child => this.toggleFolderBookmarks(child, checked));
        }
    }

    /**
     * Renders a bookmark node
     * @param {Object} bookmark - Bookmark data
     * @param {HTMLElement} container - Container element
     */
    renderBookmark(bookmark, container) {
        const bookmarkDiv = createElement('div', {
            className: 'bookmark-item bookmark-link',
            style: { marginLeft: '20px' }
        });

        const checkbox = createCheckbox(`bookmark-${bookmark.id}`, { bookmarkId: bookmark.id });
        const label = createLabel(`bookmark-${bookmark.id}`, bookmark.title || bookmark.url, 'bookmark-name');

        checkbox.addEventListener('change', (e) => {
            this.handleBookmarkSelection(e, bookmark);
        });

        bookmarkDiv.appendChild(checkbox);
        bookmarkDiv.appendChild(label);
        container.appendChild(bookmarkDiv);
    }

    /**
     * Handles bookmark selection change
     * @param {Event} e - Change event
     * @param {Object} bookmark - Bookmark data
     */
    handleBookmarkSelection(e, bookmark) {
        const bookmarkObj = {
            type: BOOKMARK_TYPES.EXISTING,
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url
        };

        if (e.target.checked) {
            stateManager.addPendingBookmark(bookmarkObj);
        } else {
            stateManager.removePendingBookmark(bookmarkObj);
        }

        if (this.onSelectionChange) {
            this.onSelectionChange();
        }
    }

    /**
     * Selects all bookmarks
     */
    async selectAll() {
        stateManager.clearPendingBookmarks();

        const tree = await bookmarkService.getBookmarkTree();
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);

        tree[0].children.forEach(node => this.toggleFolderBookmarks(node, true));

        if (this.onSelectionChange) {
            this.onSelectionChange();
        }
    }

    /**
     * Deselects all bookmarks
     */
    deselectAll() {
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);

        stateManager.clearPendingBookmarks();

        if (this.onSelectionChange) {
            this.onSelectionChange();
        }
    }

    /**
     * Unchecks a specific bookmark
     * @param {string} bookmarkId - Bookmark ID
     */
    uncheckBookmark(bookmarkId) {
        const checkbox = this.container.querySelector(`input[data-bookmark-id="${bookmarkId}"]`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }
}

// Export singleton instance
const bookmarkTreeManager = new BookmarkTreeManager();
export default bookmarkTreeManager;
