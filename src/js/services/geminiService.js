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

    async suggestOrganization(bookmarks, existingFolders) {
        try {
            if (!this.apiKey) {
                throw new Error('API key não configurada');
            }

            // Constrói o prompt com os dados
            const bookmarksData = bookmarks.map(b => `- ${b.title}\n  URL: ${b.url}`).join('\n');
            const foldersData = existingFolders.map(f => `- ${f.title}`).join('\n');

            const promptText = `Você é um assistente especializado em organizar bookmarks em pastas.
Sua tarefa é APENAS retornar um JSON válido, sem nenhum texto adicional.

ENTRADA:
Bookmarks para organizar:
${bookmarksData}

Pastas existentes:
${foldersData}

REGRAS:
1. Use as pastas existentes quando apropriado
2. Sugira novas pastas apenas se necessário
3. Agrupe bookmarks relacionados
4. TODOS os bookmarks devem ser incluídos
5. Seja conciso nas descrições

FORMATO DE RESPOSTA OBRIGATÓRIO:
{
    "folders": [
        {
            "name": "Nome da Pasta",
            "isNew": true/false,
            "bookmarks": [
                {
                    "url": "url exata do bookmark",
                    "title": "título do bookmark"
                }
            ]
        }
    ]
}

IMPORTANTE:
- Responda APENAS com o JSON
- Não adicione texto antes ou depois
- Certifique-se que o JSON é válido
- Use as URLs exatas fornecidas
- Inclua TODOS os bookmarks fornecidos
- Mantenha a resposta mínima`;

            // Conta tokens do prompt
            const promptTokenCount = promptText.split(/\s+/).length;
            console.log('📝 Prompt enviada:', promptText);
            console.log('🔢 Tokens no prompt:', promptTokenCount);

            const prompt = {
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }]
            };

            // Faz a chamada à API
            const response = await this.callGeminiAPI(prompt);
            const responseText = response.candidates[0].content.parts[0].text;
            
            // Conta tokens da resposta
            const responseTokenCount = responseText.split(/\s+/).length;
            console.log('📤 Resposta completa:', responseText);
            console.log('🔢 Tokens na resposta:', responseTokenCount);

            // Remove qualquer texto que não seja JSON
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('❌ Resposta não contém JSON válido:', responseText);
                throw new Error('Resposta não contém JSON válido');
            }

            let result;
            try {
                const jsonText = jsonMatch[0];
                console.log('🔍 Tentando parsear JSON:', jsonText);
                result = JSON.parse(jsonText);
            } catch (error) {
                console.error('❌ Erro ao parsear JSON. Texto recebido:', jsonMatch[0]);
                throw new Error(`Erro ao parsear JSON: ${error.message}`);
            }

            // Validação rigorosa da estrutura
            if (!result || typeof result !== 'object') {
                throw new Error('Resposta não é um objeto válido');
            }

            if (!Array.isArray(result.folders)) {
                throw new Error('Propriedade folders não é um array');
            }

            if (result.folders.length === 0) {
                throw new Error('Nenhuma pasta sugerida');
            }

            // Validação de cada pasta e bookmark
            result.folders.forEach((folder, index) => {
                if (!folder.name || typeof folder.name !== 'string') {
                    throw new Error(`Pasta ${index} não tem nome válido`);
                }
                if (typeof folder.isNew !== 'boolean') {
                    folder.isNew = !existingFolders.some(f => f.title === folder.name);
                }
                if (!Array.isArray(folder.bookmarks)) {
                    throw new Error(`Pasta ${folder.name} não tem array de bookmarks válido`);
                }

                folder.bookmarks.forEach((bm, bmIndex) => {
                    if (!bm.url || !bm.title) {
                        throw new Error(`Bookmark ${bmIndex} em ${folder.name} não tem url ou título`);
                    }
                    if (!bookmarks.some(b => b.url === bm.url)) {
                        throw new Error(`URL não reconhecida em ${folder.name}: ${bm.url}`);
                    }
                });

                // Adiciona ícone padrão se não existir
                folder.icon = folder.icon || '📁';
            });

            // Verifica se todos os bookmarks foram incluídos
            const allUrls = new Set(bookmarks.map(b => b.url));
            const includedUrls = new Set();
            result.folders.forEach(folder => {
                folder.bookmarks.forEach(bm => includedUrls.add(bm.url));
            });

            const missingUrls = [...allUrls].filter(url => !includedUrls.has(url));
            if (missingUrls.length > 0) {
                console.log('⚠️ URLs não categorizadas:', missingUrls);
                const missingBookmarks = bookmarks.filter(b => missingUrls.includes(b.url));
                const othersFolder = {
                    name: "Outros",
                    isNew: !existingFolders.some(f => f.title === "Outros"),
                    icon: "📌",
                    bookmarks: missingBookmarks.map(b => ({
                        title: b.title,
                        url: b.url,
                        reason: "Bookmark não categorizado automaticamente"
                    }))
                };
                result.folders.push(othersFolder);
            }

            if (!result.summary || typeof result.summary !== 'string') {
                result.summary = 'Organização baseada no conteúdo dos bookmarks';
            }

            console.log('✅ Processamento concluído com sucesso:', result);
            return result;
        } catch (error) {
            console.error('❌ Erro ao sugerir organização:', error);
            throw error;
        }
    }

    // Método para configurar a API key
    setApiKey(key) {
        this.apiKey = key;
    }
}

export default new GeminiService(); 
