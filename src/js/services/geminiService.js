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
                throw new Error('API key não configurada');
            }

            const prompt = this.buildPrompt(bookmark);
            const response = await this.callGeminiAPI(prompt);
            
            return this.parseResponse(response);
        } catch (error) {
            console.error('Erro ao categorizar bookmark:', error);
            return {
                category: 'Outros',
                confidence: 0,
                explanation: error.message
            };
        }
    }

    buildPrompt(bookmark) {
        return {
            contents: [{
                parts: [{
                    text: `Analise o título e URL do bookmark e sugira a melhor categoria.
                    
                    Título: ${bookmark.title}
                    URL: ${bookmark.url}
                    
                    Categorias disponíveis:
                    ${this.categories.join(', ')}
                    
                    Responda em formato JSON com:
                    - category: a categoria mais apropriada da lista
                    - confidence: número de 0 a 1 indicando confiança
                    - explanation: breve explicação da escolha
                    
                    Exemplo de resposta:
                    {
                        "category": "Tecnologia",
                        "confidence": 0.95,
                        "explanation": "Site sobre desenvolvimento de software"
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
            throw new Error(`Erro na API: ${response.status}`);
        }

        return await response.json();
    }

    parseResponse(response) {
        try {
            // Extrai o texto da resposta
            const text = response.candidates[0].content.parts[0].text;
            
            // Tenta encontrar e parsear o JSON na resposta
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Resposta não contém JSON válido');
            }

            const result = JSON.parse(jsonMatch[0]);

            // Valida se a categoria existe
            if (!this.categories.includes(result.category)) {
                result.category = 'Outros';
                result.confidence = 0.5;
                result.explanation += ' (Categoria ajustada para Outros)';
            }

            return result;
        } catch (error) {
            console.error('Erro ao processar resposta:', error);
            return {
                category: 'Outros',
                confidence: 0,
                explanation: 'Erro ao processar resposta da API'
            };
        }
    }

    // Método para configurar a API key
    setApiKey(key) {
        this.apiKey = key;
    }
}

export default new GeminiService(); 