// Configurações da API Gemini
const config = {
    // A API key deve ser configurada pelo usuário
    GEMINI_API_KEY: '',
    
    // Endpoint da API atualizado para usar gemini-2.0-flash-exp
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    
    // Configurações do modelo
    MODEL_CONFIG: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192, // Aumentado para 8K tokens (limite máximo do flash-exp)
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