// Gemini API Configuration
const config = {
    // API key must be set by user
    GEMINI_API_KEY: '',
    
    // API endpoint updated to use gemini-2.0-flash-exp
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    
    // Model settings
    MODEL_CONFIG: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192, // Increased to 8K tokens (flash-exp max limit)
    },
    
    // Default categories for organization
    DEFAULT_CATEGORIES: [
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
    ]
};

export default config; 