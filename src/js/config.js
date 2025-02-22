// Configurações da API Gemini
const config = {
    // A API key deve ser configurada pelo usuário
    GEMINI_API_KEY: '',
    
    // Endpoint da API
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    
    // Configurações do modelo
    MODEL_CONFIG: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
    },
    
    // Categorias padrão para organização
    DEFAULT_CATEGORIES: [
        'Tecnologia',
        'Notícias',
        'Entretenimento',
        'Educação',
        'Finanças',
        'Saúde',
        'Esportes',
        'Viagens',
        'Compras',
        'Social',
        'Desenvolvimento',
        'Produtividade',
        'Outros'
    ]
};

export default config; 