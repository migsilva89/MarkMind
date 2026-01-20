/**
 * Gemini Service
 * Handles AI-powered bookmark organization using Google's Gemini API
 */

import { GEMINI_API_URL, MODEL_CONFIG } from '../config/api.js';
import { CHROME_NATIVE_FOLDERS, DEFAULT_CATEGORIES, LIMITS } from '../config/constants.js';
import { cleanUrl } from '../utils/urlUtils.js';
import { normalizeFolderName, getNativeFolderId } from '../utils/folderUtils.js';

class GeminiService {
    constructor() {
        this.apiKey = '';
        this.apiUrl = GEMINI_API_URL;
        this.categories = DEFAULT_CATEGORIES;
    }

    /**
     * Sets the API key
     * @param {string} key - The API key
     */
    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * Categorizes a single bookmark
     * @param {Object} bookmark - Bookmark to categorize
     * @returns {Promise<Object>} Categorization result
     */
    async categorizeBookmark(bookmark) {
        try {
            if (!this.apiKey) {
                throw new Error('API key not configured');
            }

            const prompt = this.buildCategorizePrompt(bookmark);
            const response = await this.callGeminiAPI(prompt);

            return this.parseResponse(response);
        } catch (error) {
            console.error('Error categorizing bookmark:', error);
            return {
                category: 'Others',
                confidence: 0,
                explanation: error.message
            };
        }
    }

    /**
     * Builds a prompt for single bookmark categorization
     * @param {Object} bookmark - Bookmark data
     * @returns {Object} Prompt object
     */
    buildCategorizePrompt(bookmark) {
        return {
            contents: [{
                parts: [{
                    text: `Analyze the bookmark title and URL and suggest the best category.

                    Title: ${bookmark.title}
                    URL: ${bookmark.url}

                    Available categories:
                    ${this.categories.join(', ')}

                    Respond in JSON format with:
                    - category: most appropriate category from the list
                    - confidence: number from 0 to 1 indicating confidence
                    - explanation: brief explanation for the choice

                    Example response:
                    {
                        "category": "Technology",
                        "confidence": 0.95,
                        "explanation": "Website about software development"
                    }`
                }]
            }]
        };
    }

    /**
     * Calls the Gemini API
     * @param {Object} prompt - Prompt object
     * @returns {Promise<Object>} API response
     */
    async callGeminiAPI(prompt) {
        const url = `${this.apiUrl}?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: prompt.contents,
                generationConfig: MODEL_CONFIG
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Parses the API response for categorization
     * @param {Object} response - API response
     * @returns {Object} Parsed result
     */
    parseResponse(response) {
        try {
            const text = response.candidates[0].content.parts[0].text;

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Response does not contain valid JSON');
            }

            const result = JSON.parse(jsonMatch[0]);

            if (!this.categories.includes(result.category)) {
                result.category = 'Others';
                result.confidence = 0.5;
                result.explanation += ' (Category adjusted to Others)';
            }

            return result;
        } catch (error) {
            console.error('Error processing response:', error);
            return {
                category: 'Others',
                confidence: 0,
                explanation: 'Error processing API response'
            };
        }
    }

    /**
     * Recursively removes empty folders from the AI response
     * @param {Object} folder - The folder to clean
     * @returns {Object|null} The cleaned folder or null if empty
     */
    cleanEmptyFolders(folder) {
        // Base case: if folder has bookmarks, keep it
        if (folder.bookmarks && folder.bookmarks.length > 0) {
            return folder;
        }

        // Recursively clean subfolders
        if (folder.subfolders && folder.subfolders.length > 0) {
            const cleanedSubfolders = folder.subfolders
                .map(subfolder => this.cleanEmptyFolders(subfolder))
                .filter(subfolder => subfolder !== null);

            // If we have clean subfolders, keep this folder
            if (cleanedSubfolders.length > 0) {
                return {
                    ...folder,
                    subfolders: cleanedSubfolders,
                    bookmarks: folder.bookmarks || []
                };
            }
        }

        // If no bookmarks and no clean subfolders, remove folder
        return null;
    }

    /**
     * Suggests organization for bookmarks
     * @param {Array} bookmarks - Bookmarks to organize
     * @param {Array} existingFolders - Existing folder structure
     * @param {Function} logger - Logging function
     * @param {boolean} isSingleBookmark - Whether this is a single bookmark operation
     * @returns {Promise<Object>} Organization suggestion
     */
    async suggestOrganization(bookmarks, existingFolders, logger, isSingleBookmark = false) {
        try {
            if (!this.apiKey) {
                throw new Error('API key not configured');
            }

            if (logger) {
                logger('Starting bookmark analysis...', 'info');
                logger(`Processing ${bookmarks.length} bookmarks...`, 'info');
            }

            // Build bookmarks data string
            const bookmarksData = bookmarks.map(b => {
                const cleanedUrl = cleanUrl(b.url);
                const title = b.title || cleanedUrl;
                return `- ${title}\n  URL: ${cleanedUrl}\n  ID: ${b.id || 'new'}`;
            }).join('\n');

            // Format folders data with hierarchy
            let foldersData = 'Existing folder structure (with hierarchy):\n';
            const formatFolderHierarchy = (folder, depth = 0) => {
                const indent = '  '.repeat(depth);
                let result = `${indent}- ${folder.name} (ID: ${folder.id})\n`;
                if (folder.children && folder.children.length > 0) {
                    folder.children.forEach(child => {
                        result += formatFolderHierarchy(child, depth + 1);
                    });
                }
                return result;
            };

            // Filter to only include Bookmarks Bar and Other Bookmarks
            const rootFolders = existingFolders.filter(folder =>
                folder.id === CHROME_NATIVE_FOLDERS.BOOKMARKS_BAR.id ||
                folder.id === CHROME_NATIVE_FOLDERS.OTHER_BOOKMARKS.id
            );
            foldersData += rootFolders.map(folder => formatFolderHierarchy(folder)).join('');

            const promptText = this.buildOrganizationPrompt(bookmarksData, foldersData);

            if (logger) {
                logger('Analyzing bookmark patterns...', 'info');
            }

            const prompt = {
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }]
            };

            if (logger) {
                logger('Sending request to AI...', 'info');
            }

            const response = await this.callGeminiAPI(prompt);
            const responseText = response.candidates[0].content.parts[0].text;

            if (logger) {
                logger('Processing AI response...', 'info');
            }

            // Parse JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('Response does not contain valid JSON:', responseText);
                throw new Error('Response does not contain valid JSON');
            }

            let result;
            try {
                result = JSON.parse(jsonMatch[0]);
            } catch (error) {
                console.error('Error parsing JSON:', jsonMatch[0]);
                throw new Error(`JSON parsing error: ${error.message}`);
            }

            // Validate result
            if (!result || typeof result !== 'object') {
                throw new Error('Response is not a valid object');
            }

            if (!Array.isArray(result.folders)) {
                throw new Error('Folders property is not an array');
            }

            if (result.folders.length === 0) {
                throw new Error('No folders suggested');
            }

            if (logger) {
                logger('Validating folder structure...', 'info');
            }

            // Validate folder structure
            result.folders.forEach(folder => {
                this.validateFolderStructure(folder, existingFolders, new Set());
            });

            // Handle uncategorized bookmarks (skip for single bookmark)
            if (!isSingleBookmark) {
                result = this.handleUncategorizedBookmarks(result, bookmarks, logger);
            }

            // Set default summary
            if (!result.summary || typeof result.summary !== 'string') {
                result.summary = 'Organization based on bookmark content';
            }

            if (logger) {
                logger('Organization analysis completed', 'success');
            }

            // Validate and remove duplicates
            if (result.folders) {
                result.folders = this.validateNoDuplicates(result.folders, logger);
                result.folders = this.mergeDuplicateFolders(result.folders, logger);

                // Clean empty folders
                result.folders = result.folders
                    .map(folder => this.cleanEmptyFolders(folder))
                    .filter(folder => folder !== null);
            }

            return result;
        } catch (error) {
            console.error('Error suggesting organization:', error);
            if (logger) {
                logger(`Error: ${error.message}`, 'error');
            }
            throw error;
        }
    }

    /**
     * Builds the organization prompt
     * @param {string} bookmarksData - Formatted bookmarks data
     * @param {string} foldersData - Formatted folders data
     * @returns {string} The prompt text
     */
    buildOrganizationPrompt(bookmarksData, foldersData) {
        return `You are an AI assistant specialized in organizing bookmarks into folders.
Your task is to ONLY return a valid JSON, with no additional text.

INPUT:
Bookmarks to organize:
${bookmarksData}

${foldersData}

CRITICAL RULES:
1. EACH BOOKMARK MUST BE PLACED IN EXACTLY ONE FOLDER - NO EXCEPTIONS
2. DO NOT PLACE THE SAME BOOKMARK IN MULTIPLE FOLDERS
3. If multiple categories fit, choose the SINGLE most appropriate one. Only use 'Other Bookmarks' if the bookmark truly doesn't fit ANY existing category or subcategory. When in doubt, prefer creating a new relevant subfolder within an existing category over using 'Other Bookmarks'.
4. Use existing folders when appropriate, respecting their hierarchy
5. Suggest new folders only if necessary
6. Group related bookmarks
7. Keep categorization reasons short and objective
8. Maximum folder depth is ${LIMITS.MAX_FOLDER_DEPTH} levels
9. Create subfolders for related topics WITHIN existing main folders first
10. Group similar services together
11. ONLY INCLUDE FOLDERS THAT WILL CONTAIN BOOKMARKS
12. DO NOT INCLUDE EMPTY FOLDERS IN THE RESPONSE
13. RESPECT EXISTING FOLDER HIERARCHIES (e.g., if "Fashion" is a child of "Shopping", use that structure)

REQUIRED RESPONSE FORMAT:
{
    "folders": [
        {
            "name": "Folder Name",
            "isNew": true/false,
            "bookmarks": [
                {
                    "url": "exact bookmark url",
                    "title": "bookmark title",
                    "id": "bookmark id from input"
                }
            ],
            "subfolders": []
        }
    ]
}

CRITICAL RULES FOR OTHER BOOKMARKS:
BEFORE ADD TO OTHER BOOKMARKS, you MUST:
   - Try to fit the bookmark in existing folders
   - Try to fit the bookmark in existing subfolders
   - Try to create a new subfolder in an existing category
   - Try to create a new main folder
   - Only if all above fail, then use Other Bookmarks

IMPORTANT VALIDATION RULES:
- Each URL must appear in EXACTLY ONE folder
- Each bookmark ID must appear EXACTLY ONCE
- If unsure about category, use the most general one
- DO NOT duplicate bookmarks across folders
- DO NOT include empty folders
- ONLY return folders that will contain bookmarks`;
    }

    /**
     * Validates folder structure recursively
     * @param {Object} folder - Folder to validate
     * @param {Array} existingFolders - Existing folders
     * @param {Set} bookmarkIds - Set of processed bookmark IDs
     * @param {number} depth - Current depth
     */
    validateFolderStructure(folder, existingFolders, bookmarkIds, depth = 1) {
        if (!folder.name || typeof folder.name !== 'string') {
            throw new Error(`Folder at depth ${depth} has no valid name`);
        }

        // Check if it's a native folder
        const nativeFolderId = getNativeFolderId(folder.name);
        if (nativeFolderId) {
            folder.id = nativeFolderId;
            folder.isNew = false;
            folder.name = Object.values(CHROME_NATIVE_FOLDERS).find(f => f.id === nativeFolderId).name;
        } else {
            // Check if folder exists
            const normalizedFolderName = normalizeFolderName(folder.name);

            // Check for native folder with slightly different name
            for (const nativeFolder of Object.values(CHROME_NATIVE_FOLDERS)) {
                const nativeName = normalizeFolderName(nativeFolder.name);
                if (normalizedFolderName.includes(nativeName) || nativeName.includes(normalizedFolderName)) {
                    folder.id = nativeFolder.id;
                    folder.isNew = false;
                    folder.name = nativeFolder.name;
                    break;
                }
            }

            // If not a native folder, check against existing folders
            if (!folder.id) {
                const existingFolder = this.findFolderRecursively(existingFolders, normalizedFolderName);
                folder.isNew = !existingFolder;
                if (!folder.isNew && existingFolder) {
                    folder.name = existingFolder.name;
                    folder.id = existingFolder.id;
                }
            }
        }

        // Validate bookmarks array
        if (!Array.isArray(folder.bookmarks)) {
            throw new Error(`Folder ${folder.name} has no valid bookmarks array`);
        }

        // Validate each bookmark
        folder.bookmarks.forEach((bm, bmIndex) => {
            if (!bm.url || !bm.id) {
                throw new Error(`Bookmark ${bmIndex} in ${folder.name} missing required fields`);
            }
            if (bm.title === null) {
                bm.title = "";
            }
            bookmarkIds.add(bm.id);
        });

        // Validate subfolders
        if (folder.subfolders) {
            if (!Array.isArray(folder.subfolders)) {
                throw new Error(`Folder ${folder.name} has invalid subfolders property`);
            }

            if (depth >= LIMITS.MAX_FOLDER_DEPTH && folder.subfolders.length > 0) {
                throw new Error(`Folder ${folder.name} exceeds maximum depth of ${LIMITS.MAX_FOLDER_DEPTH}`);
            }

            folder.subfolders.forEach(subfolder => {
                this.validateFolderStructure(subfolder, existingFolders, bookmarkIds, depth + 1);
            });
        } else {
            folder.subfolders = [];
        }
    }

    /**
     * Finds a folder recursively by normalized name
     * @param {Array} folders - Folders to search
     * @param {string} targetName - Normalized target name
     * @returns {Object|null} Found folder or null
     */
    findFolderRecursively(folders, targetName) {
        for (const f of folders) {
            if (normalizeFolderName(f.name) === targetName) {
                return f;
            }
            if (f.children && f.children.length > 0) {
                const found = this.findFolderRecursively(f.children, targetName);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Handles uncategorized bookmarks
     * @param {Object} result - Organization result
     * @param {Array} bookmarks - Original bookmarks
     * @param {Function} logger - Logger function
     * @returns {Object} Updated result
     */
    handleUncategorizedBookmarks(result, bookmarks, logger) {
        const processedIds = new Set();
        const seenBookmarks = new Set();

        // Collect IDs from folders
        const collectIds = (folder) => {
            folder.bookmarks.forEach(bm => {
                const bookmarkKey = bm.id === 'new' ? `url:${cleanUrl(bm.url)}` : `id:${bm.id}`;
                if (seenBookmarks.has(bookmarkKey)) {
                    folder.bookmarks = folder.bookmarks.filter(b => {
                        const currentKey = b.id === 'new' ? `url:${cleanUrl(b.url)}` : `id:${b.id}`;
                        return currentKey !== bookmarkKey;
                    });
                    if (logger) {
                        logger(`Removed duplicate bookmark: ${bm.title}`, 'warning');
                    }
                } else {
                    seenBookmarks.add(bookmarkKey);
                    processedIds.add(bookmarkKey);
                }
            });
            folder.subfolders.forEach(subfolder => collectIds(subfolder));
        };

        // Remove empty folders
        const removeEmptyFolders = (folders) => {
            return folders.filter(folder => {
                if (folder.subfolders && folder.subfolders.length > 0) {
                    folder.subfolders = removeEmptyFolders(folder.subfolders);
                }
                const hasBookmarks = folder.bookmarks && folder.bookmarks.length > 0;
                const hasNonEmptySubfolders = folder.subfolders && folder.subfolders.length > 0;
                return hasBookmarks || hasNonEmptySubfolders;
            });
        };

        result.folders = removeEmptyFolders(result.folders);

        // Process folders and check for duplicates
        result.folders = result.folders.filter(folder => {
            collectIds(folder);
            return folder.bookmarks.length > 0 || (folder.subfolders && folder.subfolders.some(sf =>
                sf.bookmarks.length > 0 || (sf.subfolders && sf.subfolders.length > 0)
            ));
        });

        // Find missing bookmarks
        const missingBookmarks = bookmarks.filter(b => {
            const bookmarkKey = b.type === 'new' ? `url:${cleanUrl(b.url)}` : `id:${b.id}`;

            if (processedIds.has(bookmarkKey)) {
                return false;
            }

            // Double-check by searching folders
            return !result.folders.some(folder => {
                if (folder.bookmarks.some(bm => {
                    if (b.type === 'new') {
                        return cleanUrl(bm.url) === cleanUrl(b.url);
                    }
                    return bm.id === b.id;
                })) {
                    return true;
                }

                return folder.subfolders?.some(subfolder =>
                    subfolder.bookmarks.some(bm => {
                        if (b.type === 'new') {
                            return cleanUrl(bm.url) === cleanUrl(b.url);
                        }
                        return bm.id === b.id;
                    })
                );
            });
        });

        if (missingBookmarks.length > 0) {
            if (logger) {
                logger(`Found ${missingBookmarks.length} uncategorized bookmarks`, 'warning');
            }

            let othersFolder = result.folders.find(f => f.id === CHROME_NATIVE_FOLDERS.OTHER_BOOKMARKS.id);

            if (!othersFolder) {
                othersFolder = {
                    name: CHROME_NATIVE_FOLDERS.OTHER_BOOKMARKS.name,
                    id: CHROME_NATIVE_FOLDERS.OTHER_BOOKMARKS.id,
                    isNew: false,
                    bookmarks: [],
                    subfolders: []
                };
                result.folders.push(othersFolder);
            }

            othersFolder.bookmarks.push(...missingBookmarks.map(b => ({
                title: b.title,
                url: b.url,
                id: b.id || 'new'
            })));

            if (logger) {
                logger(`Added ${missingBookmarks.length} bookmarks to "${CHROME_NATIVE_FOLDERS.OTHER_BOOKMARKS.name}" folder`, 'success');
                missingBookmarks.forEach(b => {
                    logger(`  - ${b.title}`, 'info');
                });
            }
        }

        return result;
    }

    /**
     * Validates and removes duplicate bookmarks
     * @param {Array} folders - Folders to validate
     * @param {Function} logger - Logger function
     * @returns {Array} Validated folders
     */
    validateNoDuplicates(folders, logger) {
        const seen = new Set();
        const findDuplicates = (folder) => {
            folder.bookmarks.forEach((bm, index) => {
                const key = `${bm.url}|${bm.id}`;
                if (seen.has(key)) {
                    folder.bookmarks.splice(index, 1);
                    if (logger) {
                        logger(`Removed duplicate bookmark: ${bm.title}`, 'warning');
                    }
                } else {
                    seen.add(key);
                }
            });
            folder.subfolders?.forEach(findDuplicates);
        };

        folders.forEach(findDuplicates);

        return folders.filter(folder => {
            const hasBookmarks = folder.bookmarks.length > 0;
            const hasSubfolders = folder.subfolders?.some(sf =>
                sf.bookmarks.length > 0 || sf.subfolders?.length > 0
            );
            return hasBookmarks || hasSubfolders;
        });
    }

    /**
     * Merges duplicate folders
     * @param {Array} folders - Folders to merge
     * @param {Function} logger - Logger function
     * @returns {Array} Merged folders
     */
    mergeDuplicateFolders(folders, logger) {
        const folderMap = new Map();

        folders.forEach(folder => {
            const key = folder.id || folder.name;
            if (!folderMap.has(key)) {
                folderMap.set(key, folder);
            } else {
                const existingFolder = folderMap.get(key);

                if (logger) {
                    logger(`Merging duplicate folder: ${folder.name}`, 'info');
                }

                existingFolder.bookmarks = [
                    ...existingFolder.bookmarks,
                    ...folder.bookmarks
                ];

                if (folder.subfolders && folder.subfolders.length > 0) {
                    if (!existingFolder.subfolders) {
                        existingFolder.subfolders = [];
                    }
                    existingFolder.subfolders = [
                        ...existingFolder.subfolders,
                        ...folder.subfolders
                    ];
                }
            }
        });

        const mergedFolders = Array.from(folderMap.values());

        // Recursively merge subfolders
        mergedFolders.forEach(folder => {
            if (folder.subfolders && folder.subfolders.length > 0) {
                folder.subfolders = this.mergeDuplicateFolders(folder.subfolders, logger);
            }
        });

        return mergedFolders;
    }
}

// Export singleton instance
const geminiService = new GeminiService();
export default geminiService;
