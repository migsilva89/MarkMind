/**
 * Folder utility functions
 * Centralizes folder manipulation and hierarchy logic
 */

import { CHROME_NATIVE_FOLDERS, NATIVE_FOLDER_IDS } from '../config/constants.js';

/**
 * Normalizes a folder name for comparison
 * Removes emojis and extra whitespace, converts to lowercase
 * @param {string} name - The folder name to normalize
 * @returns {string} The normalized name
 */
export function normalizeFolderName(name) {
    if (!name) return '';
    return name
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{2700}-\u{27BF}]|[\u{1F680}-\u{1F6FF}]|[\u{24C2}-\u{1F251}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
        .trim()
        .toLowerCase();
}

/**
 * Checks if a folder ID is a Chrome native folder
 * @param {string} folderId - The folder ID to check
 * @returns {boolean} True if it's a native folder
 */
export function isNativeFolder(folderId) {
    return NATIVE_FOLDER_IDS.includes(folderId);
}

/**
 * Gets the native folder ID from a folder name
 * @param {string} folderName - The folder name to check
 * @returns {string|null} The native folder ID or null
 */
export function getNativeFolderId(folderName) {
    if (!folderName) return null;

    const normalizedName = normalizeFolderName(folderName);

    // Direct ID check for common variations
    if (/^(bookmarks\s*bar|favorites\s*bar)$/.test(normalizedName)) {
        return CHROME_NATIVE_FOLDERS.BOOKMARKS_BAR.id;
    }

    if (/^(other\s*bookmarks|unsorted\s*bookmarks)$/.test(normalizedName)) {
        return CHROME_NATIVE_FOLDERS.OTHER_BOOKMARKS.id;
    }

    if (/^(mobile\s*bookmarks)$/.test(normalizedName)) {
        return CHROME_NATIVE_FOLDERS.MOBILE_BOOKMARKS.id;
    }

    // Fallback to exact match
    for (const nativeFolder of Object.values(CHROME_NATIVE_FOLDERS)) {
        if (normalizeFolderName(nativeFolder.name) === normalizedName) {
            return nativeFolder.id;
        }
    }

    return null;
}

/**
 * Gets the native folder info by ID
 * @param {string} folderId - The folder ID
 * @returns {Object|null} The native folder info or null
 */
export function getNativeFolderById(folderId) {
    return Object.values(CHROME_NATIVE_FOLDERS).find(f => f.id === folderId) || null;
}

/**
 * Counts bookmarks recursively in a folder structure
 * @param {Object} node - The folder node
 * @returns {number} Total bookmark count
 */
export function countBookmarksInFolder(node) {
    let count = 0;
    function traverse(n) {
        if (n.url) count++;
        if (n.children) n.children.forEach(traverse);
    }
    traverse(node);
    return count;
}

/**
 * Builds a JSON hierarchy from folder structure
 * @param {Array} folders - The folders array
 * @returns {string} JSON string representation
 */
export function buildFolderHierarchyJSON(folders) {
    const rootFolders = folders.filter(f =>
        !f.parentId || f.parentId === '0' || f.parentId === '1' || f.parentId === '2'
    );

    function formatFolder(folder) {
        return {
            name: folder.title,
            id: folder.id,
            children: folder.children ? folder.children.map(child => formatFolder(child)) : []
        };
    }

    return JSON.stringify(rootFolders.map(folder => formatFolder(folder)), null, 2);
}

/**
 * Collects all folders from a bookmark tree
 * @param {Object} node - The bookmark tree node
 * @param {string} parentId - Parent folder ID
 * @returns {Object|null} Folder object or null if it's a bookmark
 */
export function collectFoldersFromTree(node, parentId = null) {
    if (node.url) return null;

    const folder = {
        id: node.id,
        title: node.title,
        children: [],
        parentId: parentId
    };

    if (node.children) {
        node.children.forEach(child => {
            if (!child.url) {
                const childFolder = collectFoldersFromTree(child, node.id);
                if (childFolder) {
                    folder.children.push(childFolder);
                }
            }
        });
    }

    return folder;
}

/**
 * Finds a folder recursively by name
 * @param {Array} folders - Array of folders to search
 * @param {string} targetName - Normalized target name
 * @returns {Object|null} Found folder or null
 */
export function findFolderByName(folders, targetName) {
    const normalizedTarget = normalizeFolderName(targetName);

    for (const folder of folders) {
        if (normalizeFolderName(folder.name || folder.title) === normalizedTarget) {
            return folder;
        }
        if (folder.children && folder.children.length > 0) {
            const found = findFolderByName(folder.children, targetName);
            if (found) return found;
        }
    }

    return null;
}
