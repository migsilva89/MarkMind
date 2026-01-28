/**
 * Bookmark Service
 * Wrapper for Chrome Bookmarks API with error handling
 */

import { isNativeFolder } from '../utils/folderUtils.js';

/**
 * Gets the complete bookmark tree
 * @returns {Promise<Array>} The bookmark tree
 */
export async function getBookmarkTree() {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.getTree((tree) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(tree);
            }
        });
    });
}

/**
 * Gets a subtree starting from a specific folder
 * @param {string} folderId - The folder ID
 * @returns {Promise<Array>} The subtree
 */
export async function getSubTree(folderId) {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.getSubTree(folderId, (subtree) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(subtree);
            }
        });
    });
}

/**
 * Gets a specific bookmark by ID
 * @param {string} bookmarkId - The bookmark ID
 * @returns {Promise<Array>} The bookmark(s)
 */
export async function getBookmark(bookmarkId) {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.get(bookmarkId, (bookmarks) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(bookmarks);
            }
        });
    });
}

/**
 * Searches bookmarks by query
 * @param {string|Object} query - Search query (string for title/URL, object for specific fields)
 * @returns {Promise<Array>} Matching bookmarks
 */
export async function searchBookmarks(query) {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.search(query, (results) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(results);
            }
        });
    });
}

/**
 * Creates a new bookmark or folder
 * @param {Object} bookmark - Bookmark data
 * @param {string} bookmark.parentId - Parent folder ID
 * @param {string} bookmark.title - Bookmark title
 * @param {string} [bookmark.url] - Bookmark URL (omit for folders)
 * @param {number} [bookmark.index] - Position in parent
 * @returns {Promise<Object>} The created bookmark
 */
export async function createBookmark(bookmark) {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.create(bookmark, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * Creates a folder
 * @param {string} parentId - Parent folder ID
 * @param {string} title - Folder title
 * @returns {Promise<Object>} The created folder
 */
export async function createFolder(parentId, title) {
    return createBookmark({ parentId, title });
}

/**
 * Moves a bookmark to a new location
 * @param {string} bookmarkId - The bookmark ID
 * @param {Object} destination - Destination info
 * @param {string} destination.parentId - New parent folder ID
 * @param {number} [destination.index] - Position in new parent
 * @returns {Promise<Object>} The moved bookmark
 */
export async function moveBookmark(bookmarkId, destination) {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.move(bookmarkId, destination, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * Updates a bookmark's title and/or URL
 * @param {string} bookmarkId - The bookmark ID
 * @param {Object} changes - Changes to apply
 * @param {string} [changes.title] - New title
 * @param {string} [changes.url] - New URL
 * @returns {Promise<Object>} The updated bookmark
 */
export async function updateBookmark(bookmarkId, changes) {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.update(bookmarkId, changes, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * Removes a bookmark or empty folder
 * @param {string} bookmarkId - The bookmark ID
 * @returns {Promise<void>}
 */
export async function removeBookmark(bookmarkId) {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.remove(bookmarkId, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

/**
 * Removes a folder and all its contents
 * @param {string} folderId - The folder ID
 * @returns {Promise<void>}
 */
export async function removeTree(folderId) {
    return new Promise((resolve, reject) => {
        chrome.bookmarks.removeTree(folderId, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

/**
 * Finds or creates a folder by name under a parent
 * @param {string} parentId - Parent folder ID
 * @param {string} folderName - Folder name to find/create
 * @param {boolean} createIfMissing - Whether to create if not found
 * @returns {Promise<Object|null>} The folder or null
 */
export async function findOrCreateFolder(parentId, folderName, createIfMissing = true) {
    try {
        const subtree = await getSubTree(parentId);
        if (!subtree || !subtree[0] || !subtree[0].children) {
            if (createIfMissing) {
                return await createFolder(parentId, folderName);
            }
            return null;
        }

        const existingFolder = subtree[0].children.find(
            child => child.title === folderName && !child.url
        );

        if (existingFolder) {
            return existingFolder;
        }

        if (createIfMissing) {
            return await createFolder(parentId, folderName);
        }

        return null;
    } catch (error) {
        console.error('Error in findOrCreateFolder:', error);
        throw error;
    }
}

/**
 * Checks if a URL is already bookmarked
 * @param {string} url - The URL to check
 * @returns {Promise<Object|null>} The existing bookmark or null
 */
export async function findBookmarkByUrl(url) {
    const results = await searchBookmarks({ url });
    return results.length > 0 ? results[0] : null;
}

/**
 * Gets all children of a folder
 * @param {string} folderId - The folder ID
 * @returns {Promise<Array>} Array of children
 */
export async function getFolderChildren(folderId) {
    const subtree = await getSubTree(folderId);
    return subtree && subtree[0] ? subtree[0].children || [] : [];
}

/**
 * Finds the "Uncategorized" folder or creates it
 * @returns {Promise<Object>} The Uncategorized folder
 */
export async function findOrCreateUncategorizedFolder() {
    const tree = await getBookmarkTree();

    const searchFolder = (nodes) => {
        for (const node of nodes) {
            if (node.title === 'Uncategorized') return node;
            if (node.children) {
                const found = searchFolder(node.children);
                if (found) return found;
            }
        }
        return null;
    };

    const uncategorizedFolder = searchFolder(tree[0].children);
    if (uncategorizedFolder) return uncategorizedFolder;

    // Create in Bookmarks Bar (id: '1')
    return await createFolder('1', 'Uncategorized');
}

// Export all functions as a service object for convenience
export default {
    getBookmarkTree,
    getSubTree,
    getBookmark,
    searchBookmarks,
    createBookmark,
    createFolder,
    moveBookmark,
    updateBookmark,
    removeBookmark,
    removeTree,
    findOrCreateFolder,
    findBookmarkByUrl,
    getFolderChildren,
    findOrCreateUncategorizedFolder
};
