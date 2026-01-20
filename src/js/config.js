/**
 * Legacy Configuration File
 * This file is kept for backward compatibility.
 * New code should import from config/api.js and config/constants.js directly.
 *
 * @deprecated Use imports from config/api.js and config/constants.js instead
 */

import { GEMINI_API_URL, MODEL_CONFIG } from './config/api.js';
import { DEFAULT_CATEGORIES } from './config/constants.js';

const config = {
    GEMINI_API_KEY: '',
    GEMINI_API_URL,
    MODEL_CONFIG,
    DEFAULT_CATEGORIES
};

export default config;
