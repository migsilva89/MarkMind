/**
 * URL utility functions
 * Centralizes URL manipulation and comparison logic
 */

/**
 * Cleans a URL by removing query parameters and hash
 * @param {string} url - The URL to clean
 * @returns {string} The cleaned URL
 */
export function cleanUrl(url) {
    try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch (e) {
        console.error('Error cleaning URL:', e);
        return url;
    }
}

/**
 * Normalizes a URL for comparison purposes
 * Removes trailing slashes and protocol prefix
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL
 */
export function normalizeUrlForComparison(url) {
    if (!url) return '';
    return url
        .replace(/\/+$/, '')
        .replace(/^https?:\/\/(www\.)?/, '');
}

/**
 * Compares two URLs for equality after normalization
 * @param {string} url1 - First URL
 * @param {string} url2 - Second URL
 * @returns {boolean} True if URLs are equivalent
 */
export function areUrlsEqual(url1, url2) {
    return cleanUrl(url1) === cleanUrl(url2);
}

/**
 * Extracts the domain from a URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} The domain
 */
export function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return url;
    }
}
