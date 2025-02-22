import config from '../config.js';

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

    async suggestOrganization(bookmarks, existingFolders, logger) {
        try {
            if (!this.apiKey) {
                throw new Error('API key not configured');
            }

            if (logger) {
                logger('🔄 Starting bookmark analysis...', 'info');
                logger(`📚 Processing ${bookmarks.length} bookmarks...`, 'info');
            }

            const bookmarksData = bookmarks.map(b => `- ${b.title}\n  URL: ${b.url}`).join('\n');
            const foldersData = existingFolders.map(f => `- ${f.title}`).join('\n');

            const promptText = `You are an AI assistant specialized in organizing bookmarks into folders.
Your task is to ONLY return a valid JSON, with no additional text.

INPUT:
Bookmarks to organize:
${bookmarksData}

Existing folders:
${foldersData}

RULES:
1. Use existing folders when appropriate
2. Suggest new folders only if necessary
3. Group related bookmarks
4. ALL bookmarks must be included
5. Be concise in descriptions
6. DO NOT use emoji in folder names

REQUIRED RESPONSE FORMAT:
{
    "folders": [
        {
            "name": "Folder Name (no emoji)",
            "isNew": true/false,
            "bookmarks": [
                {
                    "url": "exact bookmark url",
                    "title": "bookmark title"
                }
            ]
        }
    ]
}

IMPORTANT:
- Respond ONLY with JSON
- No text before or after
- Ensure JSON is valid
- Use exact URLs provided
- Include ALL provided bookmarks
- Keep response minimal
- For existing folders, use EXACT names from the input list
- DO NOT use emoji in folder names`;

            const promptTokenCount = promptText.split(/\s+/).length;
            if (logger) {
                logger(`📊 Estimated prompt tokens: ${promptTokenCount}`, 'info');
                logger('🤔 Analyzing bookmark patterns...', 'info');
            }

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
                logger(`📊 Estimated response tokens: ${responseTokenCount}`, 'info');
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

            // Helper function to normalize folder names for comparison
            const normalizeFolderName = (name) => {
                // Remove emoji and trim
                return name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{2700}-\u{27BF}]|[\u{1F680}-\u{1F6FF}]|[\u{24C2}-\u{1F251}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
            };

            result.folders.forEach((folder, index) => {
                if (!folder.name || typeof folder.name !== 'string') {
                    throw new Error(`Folder ${index} has no valid name`);
                }

                // Check if folder exists by comparing normalized names
                const normalizedFolderName = normalizeFolderName(folder.name);
                const existingFolder = existingFolders.find(f => 
                    normalizeFolderName(f.title) === normalizedFolderName
                );

                folder.isNew = !existingFolder;
                if (!folder.isNew) {
                    // Use the exact name from existing folders
                    folder.name = existingFolder.title;
                }

                if (!Array.isArray(folder.bookmarks)) {
                    throw new Error(`Folder ${folder.name} has no valid bookmarks array`);
                }

                folder.bookmarks.forEach((bm, bmIndex) => {
                    if (!bm.url || !bm.title) {
                        throw new Error(`Bookmark ${bmIndex} in ${folder.name} missing url or title`);
                    }
                    if (!bookmarks.some(b => b.url === bm.url)) {
                        throw new Error(`Unrecognized URL in ${folder.name}: ${bm.url}`);
                    }
                });
            });

            if (logger) {
                logger('🔍 Checking for uncategorized bookmarks...', 'info');
            }

            const allUrls = new Set(bookmarks.map(b => b.url));
            const includedUrls = new Set();
            result.folders.forEach(folder => {
                folder.bookmarks.forEach(bm => includedUrls.add(bm.url));
            });

            const missingUrls = [...allUrls].filter(url => !includedUrls.has(url));
            if (missingUrls.length > 0) {
                console.log('⚠️ Uncategorized URLs:', missingUrls);
                const missingBookmarks = bookmarks.filter(b => missingUrls.includes(b.url));
                const othersFolder = {
                    name: "Others",
                    isNew: !existingFolders.some(f => f.title === "Others"),
                    bookmarks: missingBookmarks.map(b => ({
                        title: b.title,
                        url: b.url
                    }))
                };
                result.folders.push(othersFolder);
            }

            if (!result.summary || typeof result.summary !== 'string') {
                result.summary = 'Organization based on bookmark content';
            }

            if (logger) {
                logger('✅ Organization analysis completed', 'success');
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
