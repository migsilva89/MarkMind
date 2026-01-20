/**
 * Storage Service
 * Wrapper for Chrome Storage API with error handling
 */

/**
 * Gets data from local storage
 * @param {string|string[]|null} keys - Keys to retrieve (null for all)
 * @returns {Promise<Object>} The stored data
 */
export async function get(keys) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(result);
            }
        });
    });
}

/**
 * Sets data in local storage
 * @param {Object} items - Key-value pairs to store
 * @returns {Promise<void>}
 */
export async function set(items) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

/**
 * Removes data from local storage
 * @param {string|string[]} keys - Keys to remove
 * @returns {Promise<void>}
 */
export async function remove(keys) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

/**
 * Clears all data from local storage
 * @returns {Promise<void>}
 */
export async function clear() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

// API Key specific functions

const API_KEY_STORAGE_KEY = 'geminiApiKey';

/**
 * Gets the stored API key
 * @returns {Promise<string|null>} The API key or null
 */
export async function getApiKey() {
    const result = await get([API_KEY_STORAGE_KEY]);
    return result[API_KEY_STORAGE_KEY] || null;
}

/**
 * Saves the API key
 * @param {string} apiKey - The API key to save
 * @returns {Promise<void>}
 */
export async function saveApiKey(apiKey) {
    return set({ [API_KEY_STORAGE_KEY]: apiKey });
}

/**
 * Removes the stored API key
 * @returns {Promise<void>}
 */
export async function removeApiKey() {
    return remove([API_KEY_STORAGE_KEY]);
}

/**
 * Checks if an API key is stored
 * @returns {Promise<boolean>} True if API key exists
 */
export async function hasApiKey() {
    const apiKey = await getApiKey();
    return apiKey !== null && apiKey.trim() !== '';
}

// Export all functions as a service object
export default {
    get,
    set,
    remove,
    clear,
    getApiKey,
    saveApiKey,
    removeApiKey,
    hasApiKey
};
