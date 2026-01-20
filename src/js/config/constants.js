/**
 * Application constants and configuration values
 * Centralizes all magic numbers and configuration to avoid duplication
 */

// Chrome native folder identifiers
export const CHROME_NATIVE_FOLDERS = {
    BOOKMARKS_BAR: {
        id: '1',
        name: 'Bookmarks Bar'
    },
    OTHER_BOOKMARKS: {
        id: '2',
        name: 'Other Bookmarks'
    },
    MOBILE_BOOKMARKS: {
        id: '3',
        name: 'Mobile Bookmarks'
    }
};

// Array of native folder IDs for quick lookup
export const NATIVE_FOLDER_IDS = ['1', '2', '3'];

// Application limits
export const LIMITS = {
    MAX_FOLDER_DEPTH: 3,
    BOOKMARK_WARNING_THRESHOLD: 70,
    MAX_BOOKMARKS_PER_REQUEST: 100,
    STATUS_MESSAGE_TIMEOUT: 3000
};

// UI state constants
export const UI_STATES = {
    NORMAL: 'normal',
    EXECUTING: 'executing',
    RESULTS: 'results'
};

// Log types for the logging system
export const LOG_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning'
};

// Bookmark types
export const BOOKMARK_TYPES = {
    NEW: 'new',
    EXISTING: 'existing'
};

// API key validation pattern
export const API_KEY_PATTERN = /^AIza[0-9A-Za-z-_]{35}$/;

// Default categories for organization
export const DEFAULT_CATEGORIES = [
    'Technology',
    'News',
    'Entertainment',
    'Education',
    'Finance',
    'Health',
    'Sports',
    'Travel',
    'Shopping',
    'Social',
    'Development',
    'Productivity',
    'Others'
];
