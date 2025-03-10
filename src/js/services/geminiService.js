import config from '../config.js';

// Chrome native folder constants
const CHROME_NATIVE_FOLDERS = {
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

// Helper function to normalize folder names for comparison
const normalizeFolderName = (name) => {
    if (!name) return '';
    return name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{2700}-\u{27BF}]|[\u{1F680}-\u{1F6FF}]|[\u{24C2}-\u{1F251}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
        .trim()
        .toLowerCase();
};

// Helper function to identify Chrome native folders
const getNativeFolderId = (folderName) => {
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
};

class GeminiService {
    constructor() {
        this.apiKey = config.GEMINI_API_KEY;
        this.apiUrl = config.GEMINI_API_URL;
        this.categories = config.DEFAULT_CATEGORIES;
    }

    async categorizeBookmark(bookmark) {
        try {
            if (!this.apiKey) {
                throw new Error('API key not configured');
            }

            const prompt = this.buildPrompt(bookmark);
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

    buildPrompt(bookmark) {
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

    async callGeminiAPI(prompt) {
        const url = `${this.apiUrl}?key=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: prompt.contents,
                generationConfig: config.MODEL_CONFIG
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    }

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
     * - Keeps folders that have bookmarks
     * - Keeps folders that have non-empty subfolders
     * - Removes completely empty folders
     * 
     * @param {Object} folder The folder to clean
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
                    bookmarks: folder.bookmarks || [] // Ensure bookmarks array exists
                };
            }
        }

        // If no bookmarks and no clean subfolders, remove folder
        return null;
    }

    async suggestOrganization(bookmarks, existingFolders, logger, isSingleBookmark = false) {
        try {
            if (!this.apiKey) {
                throw new Error('API key not configured');
            }

            if (logger) {
                logger('🔄 Starting bookmark analysis...', 'info');
                logger(`📚 Processing ${bookmarks.length} bookmarks...`, 'info');
            }

            // Helper function to clean URLs
            const cleanUrl = (url) => {
                try {
                    const urlObj = new URL(url);
                    return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
                } catch (e) {
                    console.error('Error cleaning URL:', e);
                    return url;
                }
            };

            const bookmarksData = bookmarks.map(b => {
                const cleanedUrl = cleanUrl(b.url);
                const title = b.title || cleanedUrl; // Use URL as fallback if title is missing
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

            const promptText = `You are an AI assistant specialized in organizing bookmarks into folders.
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
8. Maximum folder depth is 3 levels
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

            const promptTokenCount = promptText.split(/\s+/).length;
            if (logger) {
                logger('🤔 Analyzing bookmark patterns...', 'info');
            }

            console.log(promptText);

            const prompt = {
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }]
            };

            if (logger) {
                logger('📡 Sending request to AI...', 'info');
            }

            const response = await this.callGeminiAPI(prompt);
            const responseText = response.candidates[0].content.parts[0].text;
            
            const responseTokenCount = responseText.split(/\s+/).length;
            if (logger) {
                logger('🔍 Processing AI response...', 'info');
            }

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('❌ Response does not contain valid JSON:', responseText);
                throw new Error('Response does not contain valid JSON');
            }

            let result;
            try {
                const jsonText = jsonMatch[0];
                console.log('🔍 Attempting to parse JSON:', jsonText);
                result = JSON.parse(jsonText);
            } catch (error) {
                console.error('❌ Error parsing JSON. Received text:', jsonMatch[0]);
                throw new Error(`JSON parsing error: ${error.message}`);
            }

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
                logger('✨ Validating folder structure...', 'info');
            }

            // Helper function to validate folder structure recursively
            function validateFolderStructure(folder, existingFolders, bookmarkIds, depth = 1) {
                if (!folder.name || typeof folder.name !== 'string') {
                    throw new Error(`Folder at depth ${depth} has no valid name`);
                }

                // Check if it's a native folder
                const nativeFolderId = getNativeFolderId(folder.name);
                if (nativeFolderId) {
                    folder.id = nativeFolderId;
                    folder.isNew = false;
                    // Use exact name from native folders
                    folder.name = Object.values(CHROME_NATIVE_FOLDERS).find(f => f.id === nativeFolderId).name;
                    
                    // Log that we're using a native folder
                    console.log(`Using native Chrome folder: ${folder.name} (ID: ${folder.id})`);
                } else {
                    // Check if folder exists by comparing normalized names
                    const normalizedFolderName = normalizeFolderName(folder.name);
                    
                    // First check if this might be a native folder with a slightly different name
                    for (const nativeFolder of Object.values(CHROME_NATIVE_FOLDERS)) {
                        const nativeName = normalizeFolderName(nativeFolder.name);
                        // If names are similar enough (e.g., "Other Bookmarks" vs "Other bookmarks")
                        if (normalizedFolderName.includes(nativeName) || nativeName.includes(normalizedFolderName)) {
                            folder.id = nativeFolder.id;
                            folder.isNew = false;
                            folder.name = nativeFolder.name;
                            console.log(`Matched to native Chrome folder: ${folder.name} (ID: ${folder.id})`);
                            break;
                        }
                    }
                    
                    // If not a native folder, check against existing folders
                    if (!folder.id) {
                        // Helper function to search recursively through folders
                        const findFolderRecursively = (folders, targetName) => {
                            for (const f of folders) {
                                if (normalizeFolderName(f.name) === targetName) {
                                    return f;
                                }
                                if (f.children && f.children.length > 0) {
                                    const found = findFolderRecursively(f.children, targetName);
                                    if (found) return found;
                                }
                            }
                            return null;
                        };

                        const existingFolder = findFolderRecursively(existingFolders, normalizedFolderName);

                        folder.isNew = !existingFolder;
                        if (!folder.isNew) {
                            // Use the exact name from existing folders
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
                    
                    // Ensure title is never null
                    if (bm.title === null) {
                        bm.title = "";
                    }
                    
                    // Mark bookmark as processed
                    bookmarkIds.add(bm.id);
                });

                // Validate subfolders if they exist
                if (folder.subfolders) {
                    if (!Array.isArray(folder.subfolders)) {
                        throw new Error(`Folder ${folder.name} has invalid subfolders property`);
                    }

                    if (depth >= 3 && folder.subfolders.length > 0) {
                        throw new Error(`Folder ${folder.name} exceeds maximum depth of 3`);
                    }

                    folder.subfolders.forEach(subfolder => {
                        validateFolderStructure(subfolder, existingFolders, bookmarkIds, depth + 1);
                    });
                } else {
                    folder.subfolders = []; // Ensure subfolders array always exists
                }
            }

            result.folders.forEach(folder => {
                validateFolderStructure(folder, existingFolders, new Set());
            });

            // Check for uncategorized bookmarks - skip this for single bookmark additions
            if (!isSingleBookmark) {
                const processedIds = new Set();
                const seenBookmarks = new Set(); // Track seen bookmarks to prevent duplicates
                
                const collectIds = (folder) => {
                    folder.bookmarks.forEach(bm => {
                        // Check for duplicates using ID for existing bookmarks, URL for new ones
                        const bookmarkKey = bm.id === 'new' ? `url:${cleanUrl(bm.url)}` : `id:${bm.id}`;
                        if (seenBookmarks.has(bookmarkKey)) {
                            // Remove duplicate from this folder
                            folder.bookmarks = folder.bookmarks.filter(b => {
                                const currentKey = b.id === 'new' ? `url:${cleanUrl(b.url)}` : `id:${b.id}`;
                                return currentKey !== bookmarkKey;
                            });
                            if (logger) {
                                logger(`⚠️ Removed duplicate bookmark: ${bm.title}`, 'warning');
                            }
                        } else {
                            seenBookmarks.add(bookmarkKey);
                            processedIds.add(bookmarkKey);
                        }
                    });
                    folder.subfolders.forEach(subfolder => collectIds(subfolder));
                };
                
                // Process folders and remove any empty ones
                const removeEmptyFolders = (folders) => {
                    return folders.filter(folder => {
                        // First process subfolders recursively
                        if (folder.subfolders && folder.subfolders.length > 0) {
                            folder.subfolders = removeEmptyFolders(folder.subfolders);
                        }
                        
                        // Check if this folder has bookmarks or non-empty subfolders
                        const hasBookmarks = folder.bookmarks && folder.bookmarks.length > 0;
                        const hasNonEmptySubfolders = folder.subfolders && folder.subfolders.length > 0;
                        
                        return hasBookmarks || hasNonEmptySubfolders;
                    });
                };

                // Remove empty folders before processing
                result.folders = removeEmptyFolders(result.folders);

                // Process folders and check for duplicates
                result.folders = result.folders.filter(folder => {
                    collectIds(folder);
                    return folder.bookmarks.length > 0 || (folder.subfolders && folder.subfolders.some(sf => 
                        sf.bookmarks.length > 0 || (sf.subfolders && sf.subfolders.length > 0)
                    ));
                });

                // Find bookmarks that weren't included
                const missingBookmarks = bookmarks.filter(b => {
                    const bookmarkKey = b.type === 'new' ? `url:${cleanUrl(b.url)}` : `id:${b.id}`;
                    
                    // Check if this bookmark is already processed
                    if (processedIds.has(bookmarkKey)) {
                        return false;
                    }
                    
                    // Double-check by searching through all folders manually
                    // This is a fallback in case the processedIds tracking missed something
                    const isIncluded = result.folders.some(folder => {
                        // Check in main folder
                        if (folder.bookmarks.some(bm => {
                            if (b.type === 'new') {
                                return cleanUrl(bm.url) === cleanUrl(b.url);
                            } else {
                                return bm.id === b.id;
                            }
                        })) {
                            return true;
                        }
                        
                        // Check in subfolders
                        return folder.subfolders?.some(subfolder => 
                            subfolder.bookmarks.some(bm => {
                                if (b.type === 'new') {
                                    return cleanUrl(bm.url) === cleanUrl(b.url);
                                } else {
                                    return bm.id === b.id;
                                }
                            })
                        );
                    });
                    
                    return !isIncluded;
                });
                
                if (missingBookmarks.length > 0) {
                    if (logger) {
                        logger(`⚠️ Found ${missingBookmarks.length} uncategorized bookmarks`, 'warning');
                    }
                    
                    // Find or reference the native Other Bookmarks folder
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

                    // Add missing bookmarks to Other Bookmarks
                    othersFolder.bookmarks.push(...missingBookmarks.map(b => ({
                        title: b.title,
                        url: b.url,
                        id: b.id || 'new'
                    })));
                    
                    if (logger) {
                        logger(`✓ Added ${missingBookmarks.length} bookmarks to "${CHROME_NATIVE_FOLDERS.OTHER_BOOKMARKS.name}" folder`, 'success');
                        missingBookmarks.forEach(b => {
                            logger(`  - ${b.title}`, 'info');
                        });
                    }
                }
            }

            if (!result.summary || typeof result.summary !== 'string') {
                result.summary = 'Organization based on bookmark content';
            }

            if (logger) {
                logger('✅ Organization analysis completed', 'success');
            }

            // Add additional validation after parsing response
            const validateNoDuplicates = (folders) => {
                const seen = new Set();
                const findDuplicates = (folder) => {
                    folder.bookmarks.forEach((bm, index) => {
                        const key = `${bm.url}|${bm.id}`;
                        if (seen.has(key)) {
                            // Remove duplicate
                            folder.bookmarks.splice(index, 1);
                            if (logger) {
                                logger(`🔄 Removed duplicate bookmark: ${bm.title}`, 'warning');
                            }
                        } else {
                            seen.add(key);
                        }
                    });
                    folder.subfolders?.forEach(findDuplicates);
                };
                
                folders.forEach(findDuplicates);
                
                // Remove empty folders after duplicate removal
                return folders.filter(folder => {
                    const hasBookmarks = folder.bookmarks.length > 0;
                    const hasSubfolders = folder.subfolders?.some(sf => 
                        sf.bookmarks.length > 0 || sf.subfolders?.length > 0
                    );
                    return hasBookmarks || hasSubfolders;
                });
            };

            // Apply validation after parsing response
            if (result.folders) {
                result.folders = validateNoDuplicates(result.folders);
                
                // Merge folders with the same name and ID
                const mergedFolders = [];
                const folderMap = new Map();
                
                // First pass: group folders by ID
                result.folders.forEach(folder => {
                    const key = folder.id || folder.name;
                    if (!folderMap.has(key)) {
                        folderMap.set(key, folder);
                    } else {
                        // Merge this folder with the existing one
                        const existingFolder = folderMap.get(key);
                        
                        if (logger) {
                            logger(`🔄 Merging duplicate folder: ${folder.name}`, 'info');
                        }
                        
                        // Merge bookmarks
                        existingFolder.bookmarks = [
                            ...existingFolder.bookmarks,
                            ...folder.bookmarks
                        ];
                        
                        // Merge subfolders
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
                
                // Convert map back to array
                result.folders = Array.from(folderMap.values());
                
                if (logger && result.folders.length < folderMap.size) {
                    logger(`✅ Merged ${result.folders.length - folderMap.size} duplicate folders`, 'success');
                }
                
                // Recursively merge duplicate subfolders within each folder
                const mergeSubfolders = (folder) => {
                    if (!folder.subfolders || folder.subfolders.length === 0) {
                        return folder;
                    }
                    
                    // Group subfolders by name
                    const subfoldersMap = new Map();
                    folder.subfolders.forEach(subfolder => {
                        const key = subfolder.id || subfolder.name;
                        if (!subfoldersMap.has(key)) {
                            subfoldersMap.set(key, subfolder);
                        } else {
                            // Merge this subfolder with the existing one
                            const existingSubfolder = subfoldersMap.get(key);
                            
                            if (logger) {
                                logger(`🔄 Merging duplicate subfolder: ${subfolder.name} in ${folder.name}`, 'info');
                            }
                            
                            // Merge bookmarks
                            existingSubfolder.bookmarks = [
                                ...existingSubfolder.bookmarks,
                                ...subfolder.bookmarks
                            ];
                            
                            // Merge nested subfolders
                            if (subfolder.subfolders && subfolder.subfolders.length > 0) {
                                if (!existingSubfolder.subfolders) {
                                    existingSubfolder.subfolders = [];
                                }
                                existingSubfolder.subfolders = [
                                    ...existingSubfolder.subfolders,
                                    ...subfolder.subfolders
                                ];
                            }
                        }
                    });
                    
                    // Update folder's subfolders
                    folder.subfolders = Array.from(subfoldersMap.values());
                    
                    // Recursively merge subfolders of subfolders
                    folder.subfolders.forEach(mergeSubfolders);
                    
                    return folder;
                };
                
                // Apply subfolder merging to all top-level folders
                result.folders.forEach(mergeSubfolders);
                
                // Clean empty folders before returning
                result.folders = result.folders
                    .map(folder => this.cleanEmptyFolders(folder))
                    .filter(folder => folder !== null);
            }

            console.log('✅ Processing completed successfully:', result);
            return result;
        } catch (error) {
            console.error('❌ Error suggesting organization:', error);
            if (logger) {
                logger(`❌ Error: ${error.message}`, 'error');
            }
            throw error;
        }
    }

    setApiKey(key) {
        this.apiKey = key;
    }
}

export default new GeminiService(); 
