import geminiService from './services/geminiService.js';

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const bookmarksContainer = document.getElementById('bookmarks-container');
    const selectAllBtn = document.getElementById('select-all');
    const deselectAllBtn = document.getElementById('deselect-all');
    const organizeBtn = document.getElementById('organize-btn');
    const closeResultsBtn = document.getElementById('close-results');
    const addCurrentBtn = document.getElementById('add-current-btn');
    const addStatus = document.getElementById('add-status');
    const pendingSection = document.getElementById('pending-bookmarks');
    const pendingList = document.getElementById('pending-list');
    const pendingCount = document.getElementById('pending-count');
    
    // Settings Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsSection = document.getElementById('settings-section');
    const apiKeyInput = document.getElementById('api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const testApiBtn = document.getElementById('test-api');
    const testResult = document.getElementById('test-result');
    
    // UI Sections
    const progressSection = document.querySelector('.progress-section');
    const progressIndicator = document.getElementById('progress-indicator');
    const progressText = document.getElementById('progress-text');
    const progressCount = document.getElementById('progress-count');
    const resultsSection = document.querySelector('.results-section');
    const logsSection = document.querySelector('.logs-section');
    const logsContainer = document.getElementById('logs-container');
    
    // Application State
    let bookmarksTree = [];
    let pendingBookmarks = new Set();

    // Função para adicionar logs
    function addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
        logsContainer.appendChild(logEntry);
        logsContainer.scrollTop = logsContainer.scrollHeight;
        
        if (logsSection.style.display === 'none') {
            logsSection.style.display = 'block';
        }
    }

    // Carrega a API key inicial
    chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
            testApiBtn.style.display = 'block';
            geminiService.setApiKey(result.geminiApiKey);
        }
    });

    // Configurações
    settingsBtn.addEventListener('click', () => {
        console.log('Settings button clicked');
        const isVisible = settingsSection.style.display === 'block';
        settingsSection.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            try {
                // Verifica se o objeto chrome.storage está disponível
                if (!chrome || !chrome.storage || !chrome.storage.local) {
                    throw new Error('Chrome storage API não está disponível');
                }

                // Carrega a API key
                chrome.storage.local.get(['geminiApiKey'], (result) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error loading API key:', chrome.runtime.lastError);
                        showStatus('Erro ao carregar API key: ' + chrome.runtime.lastError.message, 'error', true);
                        return;
                    }
                    console.log('Loaded API key:', result.geminiApiKey ? 'exists' : 'not found');
                    if (result.geminiApiKey) {
                        apiKeyInput.value = result.geminiApiKey;
                        testApiBtn.style.display = 'block';
                        // Configura a API key no serviço
                        geminiService.setApiKey(result.geminiApiKey);
                    }
                });
            } catch (error) {
                console.error('Error loading API key:', error);
                showStatus('Erro ao carregar API key: ' + error.message, 'error', true);
            }
        }
    });

    saveApiKeyBtn.addEventListener('click', () => {
        console.log('Save API key button clicked');
        const apiKey = apiKeyInput.value.trim();
        console.log('API key length:', apiKey.length);
        
        if (!apiKey) {
            console.log('API key is empty');
            showStatus('Por favor, insira uma API key válida.', 'error', true);
            return;
        }

        // Validação básica do formato da API key
        if (!apiKey.match(/^AIza[0-9A-Za-z-_]{35}$/)) {
            console.log('Invalid API key format');
            showStatus('API key inválida. Deve começar com "AIza" e ter 39 caracteres.', 'error', true);
            return;
        }

        console.log('Saving API key...');
        try {
            // Verifica se o objeto chrome.storage está disponível
            if (!chrome || !chrome.storage || !chrome.storage.local) {
                throw new Error('Chrome storage API não está disponível');
            }

            // Salva a API key
            chrome.storage.local.set(
                { geminiApiKey: apiKey },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error saving API key:', chrome.runtime.lastError);
                        showStatus('Erro ao salvar API key: ' + chrome.runtime.lastError.message, 'error', true);
                        return;
                    }
                    console.log('API key saved successfully');
                    showStatus('API key salva com sucesso!', 'success', true);
                    testApiBtn.style.display = 'block';
                    // Configura a API key no serviço após salvar
                    geminiService.setApiKey(apiKey);
                }
            );
        } catch (error) {
            console.error('Error saving API key:', error);
            showStatus('Erro ao salvar API key: ' + error.message, 'error', true);
        }
    });

    // Teste da API
    testApiBtn.addEventListener('click', async () => {
        testResult.style.display = 'block';
        testResult.innerHTML = 'Testando API...';
        
        try {
            const testBookmark = {
                title: 'GitHub - microsoft/TypeScript: TypeScript is a superset of JavaScript that compiles to clean JavaScript output.',
                url: 'https://github.com/microsoft/TypeScript'
            };

            const response = await testGeminiAPI(testBookmark);
            
            testResult.innerHTML = `
                <div>✅ API funcionando corretamente!</div>
                <pre>${JSON.stringify(response, null, 2)}</pre>
            `;
        } catch (error) {
            testResult.innerHTML = `
                <div>❌ Erro ao testar API:</div>
                <pre>${error.message}</pre>
            `;
        }
    });

    async function testGeminiAPI(bookmark) {
        const apiKey = apiKeyInput.value.trim();
        console.log('Testing API with key length:', apiKey.length);
        
        if (!apiKey) {
            throw new Error('API key não configurada');
        }

        // Validação básica do formato da API key
        if (!apiKey.match(/^AIza[0-9A-Za-z-_]{35}$/)) {
            throw new Error('Formato da API key inválido. Deve começar com "AIza" e ter 39 caracteres.');
        }

        const prompt = {
            contents: [{
                parts: [{
                    text: `Analise o título e URL do bookmark e sugira a melhor categoria.
                    
                    Título: ${bookmark.title}
                    URL: ${bookmark.url}
                    
                    Categorias disponíveis:
                    Tecnologia, Notícias, Entretenimento, Educação, Finanças, Saúde, Esportes, Viagens, Compras, Social, Desenvolvimento, Produtividade, Outros
                    
                    Responda em formato JSON com:
                    - category: a categoria mais apropriada da lista
                    - confidence: número de 0 a 1 indicando confiança
                    - explanation: breve explicação da escolha`
                }]
            }]
        };

        console.log('Sending request to Gemini API...');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: prompt.contents,
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });

            console.log('API Response status:', response.status);
            const responseText = await response.text();
            console.log('API Response text:', responseText);

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status} - ${responseText}`);
            }

            const data = JSON.parse(responseText);
            const text = data.candidates[0].content.parts[0].text;
            
            // Tenta encontrar e parsear o JSON na resposta
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Resposta não contém JSON válido');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Error in API call:', error);
            throw error;
        }
    }

    // Função para atualizar a lista de bookmarks pendentes
    function updatePendingList() {
        const bookmarks = Array.from(pendingBookmarks);
        pendingCount.textContent = bookmarks.length;
        pendingSection.style.display = bookmarks.length > 0 ? 'block' : 'none';
        
        pendingList.innerHTML = '';
        bookmarks.forEach(bookmark => {
            const item = document.createElement('div');
            item.className = 'pending-item';
            
            const title = document.createElement('span');
            title.className = 'title';
            title.title = bookmark.title;
            title.textContent = bookmark.title;
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '✕';
            removeBtn.title = 'Remover';
            removeBtn.onclick = () => {
                pendingBookmarks.delete(bookmark);
                updatePendingList();
                updateOrganizeButton();
                
                // Desmarcar checkbox se existir
                if (bookmark.type === 'existing') {
                    const checkbox = document.querySelector(`input[data-bookmark-id="${bookmark.id}"]`);
                    if (checkbox) checkbox.checked = false;
                }
            };
            
            item.appendChild(title);
            item.appendChild(removeBtn);
            pendingList.appendChild(item);
        });
    }

    // Core Functions
    async function loadBookmarksTree() {
        try {
            bookmarksContainer.innerHTML = '';
            const tree = await chrome.bookmarks.getTree();
            bookmarksTree = tree;
            renderBookmarksTree(tree[0], bookmarksContainer);
            updateOrganizeButton();
            updatePendingList();
        } catch (error) {
            console.error('Erro ao carregar bookmarks:', error);
            showStatus('Erro ao atualizar a lista de bookmarks.', 'error');
        }
    }

    function toggleFolderBookmarks(folderNode, checked) {
        if (folderNode.url) {
            if (checked) {
                pendingBookmarks.add({
                    type: 'existing',
                    id: folderNode.id,
                    title: folderNode.title,
                    url: folderNode.url
                });
            } else {
                for (const item of pendingBookmarks) {
                    if (item.type === 'existing' && item.id === folderNode.id) {
                        pendingBookmarks.delete(item);
                        break;
                    }
                }
            }
        }
        if (folderNode.children) {
            folderNode.children.forEach(child => toggleFolderBookmarks(child, checked));
        }
        updatePendingList();
    }

    function renderBookmarksTree(node, container, level = 0) {
        if (!node.children) return;

        const nodeContainer = document.createElement('div');
        nodeContainer.style.marginLeft = `${level * 20}px`;
        container.appendChild(nodeContainer);

        if (node.id !== '0') {
            renderFolder(node, nodeContainer, level);
        } else {
            node.children.forEach(child => renderBookmarksTree(child, container, 0));
        }
    }

    function renderFolder(node, nodeContainer, level) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'bookmark-item folder-item';

        const checkbox = createFolderCheckbox(node);
        const toggleBtn = createFolderToggleButton();
        const label = createFolderLabel(node);
        const childrenContainer = createChildrenContainer();

        setupFolderEvents(checkbox, toggleBtn, label, childrenContainer, node);

        folderDiv.appendChild(checkbox);
        folderDiv.appendChild(toggleBtn);
        folderDiv.appendChild(label);
        nodeContainer.appendChild(folderDiv);
        nodeContainer.appendChild(childrenContainer);

        node.children.forEach(child => {
            if (child.url) {
                renderBookmark(child, childrenContainer);
            } else if (child.children) {
                renderBookmarksTree(child, childrenContainer, 1);
            }
        });
    }

    function createFolderCheckbox(node) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `folder-${node.id}`;
        checkbox.dataset.folderId = node.id;
        return checkbox;
    }

    function createFolderToggleButton() {
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'folder-toggle';
        toggleBtn.textContent = '›';
        return toggleBtn;
    }

    function createFolderLabel(node) {
        const label = document.createElement('label');
        label.htmlFor = `folder-${node.id}`;
        label.className = 'folder-name';
        label.textContent = `📁 ${node.title || 'Bookmarks'} `;
        
        const count = document.createElement('span');
        count.className = 'bookmark-count';
        count.textContent = `(${countBookmarksInFolder(node)})`;
        label.appendChild(count);
        
        return label;
    }

    function createChildrenContainer() {
        const container = document.createElement('div');
        container.className = 'folder-children';
        container.style.display = 'none';
        return container;
    }

    function setupFolderEvents(checkbox, toggleBtn, label, childrenContainer, node) {
        checkbox.addEventListener('change', async (e) => {
            const checked = e.target.checked;
            const childCheckboxes = childrenContainer.querySelectorAll('input[type="checkbox"]');
            childCheckboxes.forEach(cb => cb.checked = checked);
            
            const folder = await chrome.bookmarks.getSubTree(node.id);
            if (folder[0]) {
                toggleFolderBookmarks(folder[0], checked);
            }
            
            updateOrganizeButton();
        });

        toggleBtn.addEventListener('click', () => {
            const isExpanded = childrenContainer.style.display === 'block';
            childrenContainer.style.display = isExpanded ? 'none' : 'block';
            toggleBtn.classList.toggle('expanded');
        });

        label.addEventListener('click', (e) => {
            if (e.target === label) {
                toggleBtn.click();
            }
        });
    }

    function renderBookmark(bookmark, container) {
        const bookmarkDiv = document.createElement('div');
        bookmarkDiv.className = 'bookmark-item bookmark-link';
        bookmarkDiv.style.marginLeft = '20px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `bookmark-${bookmark.id}`;
        checkbox.dataset.bookmarkId = bookmark.id;

        const label = document.createElement('label');
        label.htmlFor = `bookmark-${bookmark.id}`;
        label.className = 'bookmark-name';
        label.textContent = `🔖 ${bookmark.title || bookmark.url}`;

        checkbox.addEventListener('change', (e) => {
            handleBookmarkSelection(e, bookmark);
        });

        bookmarkDiv.appendChild(checkbox);
        bookmarkDiv.appendChild(label);
        container.appendChild(bookmarkDiv);
    }

    function countBookmarksInFolder(node) {
        let count = 0;
        function traverse(n) {
            if (n.url) count++;
            if (n.children) n.children.forEach(traverse);
        }
        traverse(node);
        return count;
    }

    function updateOrganizeButton() {
        organizeBtn.disabled = pendingBookmarks.size === 0;
    }

    function handleBookmarkSelection(e, bookmark) {
        if (e.target.checked) {
            pendingBookmarks.add({
                type: 'existing',
                id: bookmark.id,
                title: bookmark.title,
                url: bookmark.url
            });
        } else {
            for (const item of pendingBookmarks) {
                if (item.type === 'existing' && item.id === bookmark.id) {
                    pendingBookmarks.delete(item);
                    break;
                }
            }
        }
        updateOrganizeButton();
        updatePendingList();
    }

    async function findOrCreateUncategorizedFolder() {
        try {
            const bookmarks = await chrome.bookmarks.getTree();
            const searchFolder = (nodes) => {
                for (const node of nodes) {
                    if (node.title === "Não Categorizado") return node;
                    if (node.children) {
                        const found = searchFolder(node.children);
                        if (found) return found;
                    }
                }
                return null;
            };

            const uncategorizedFolder = searchFolder(bookmarks[0].children);
            if (uncategorizedFolder) return uncategorizedFolder;

            return await chrome.bookmarks.create({
                parentId: '1',
                title: 'Não Categorizado'
            });
        } catch (error) {
            console.error('Erro ao buscar/criar pasta:', error);
            throw error;
        }
    }

    async function organizeBookmarks() {
        const progressIndicator = document.getElementById('progress-indicator');
        const progressText = document.getElementById('progress-text');
        const progressCount = document.getElementById('progress-count');

        try {
            const uncategorizedFolder = await findOrCreateUncategorizedFolder();
            const bookmarksArray = Array.from(pendingBookmarks);
            
            for (let i = 0; i < bookmarksArray.length; i++) {
                const bookmark = bookmarksArray[i];
                const progress = ((i + 1) / bookmarksArray.length) * 100;
                
                updateProgress(progress, i + 1, bookmarksArray.length);

                try {
                    if (bookmark.type === 'new') {
                        await chrome.bookmarks.create({
                            parentId: uncategorizedFolder.id,
                            title: bookmark.title,
                            url: bookmark.url
                        });
                    } else {
                        await chrome.bookmarks.move(bookmark.id, {
                            parentId: uncategorizedFolder.id
                        });
                    }
                } catch (moveError) {
                    console.error('Erro ao mover/criar bookmark:', moveError);
                }
            }

            pendingBookmarks.clear();
            await loadBookmarksTree();
            
            return bookmarksArray.length;
        } catch (error) {
            console.error('Erro ao organizar bookmarks:', error);
            throw error;
        }
    }

    function updateProgress(progress, current, total) {
        const progressIndicator = document.getElementById('progress-indicator');
        const progressText = document.getElementById('progress-text');
        const progressCount = document.getElementById('progress-count');
        
        progressIndicator.style.width = `${progress}%`;
        progressText.textContent = `Processando ${current} de ${total}`;
        progressCount.textContent = `${Math.round(progress)}%`;
    }

    function showStatus(message, type = 'loading', isSettings = false) {
        console.log('Showing status:', message, type, isSettings ? 'in settings' : 'in main');
        const statusElement = isSettings ? 
            document.getElementById('settings-status') : 
            document.getElementById('add-status');

        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.style.display = 'block';
        
        if (type !== 'loading') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }

    // Event Listeners
    selectAllBtn.addEventListener('click', async () => {
        try {
            pendingBookmarks.clear();
            const tree = await chrome.bookmarks.getTree();
            const checkboxes = bookmarksContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = true);
            tree[0].children.forEach(node => toggleFolderBookmarks(node, true));
            updateOrganizeButton();
        } catch (error) {
            console.error('Erro ao selecionar todos:', error);
        }
    });

    deselectAllBtn.addEventListener('click', () => {
        const checkboxes = bookmarksContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        pendingBookmarks.clear();
        updateOrganizeButton();
    });

    function toggleExecutionUI(state) {
        // Elements to manage
        const elementsToManage = {
            normal: [
                bookmarksContainer,
                pendingSection,
                document.querySelector('.controls'),
                document.querySelector('.header'),
                settingsSection
            ],
            executing: [
                logsSection,
                progressSection
            ],
            results: [
                resultsSection
            ]
        };

        // Hide all elements first
        Object.values(elementsToManage).flat().forEach(element => {
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show elements based on state
        switch (state) {
            case 'normal':
                elementsToManage.normal.forEach(element => {
                    if (element) {
                        element.style.display = '';
                    }
                });
                break;
            case 'executing':
                elementsToManage.executing.forEach(element => {
                    if (element) {
                        element.style.display = 'block';
                    }
                });
                break;
            case 'results':
                elementsToManage.results.forEach(element => {
                    if (element) {
                        element.style.display = 'block';
                    }
                });
                break;
        }

        // Adjust container padding
        const container = document.querySelector('.container');
        if (container) {
            container.style.padding = state === 'normal' ? '24px' : '12px';
        }
    }

    organizeBtn.addEventListener('click', async () => {
        try {
            // Toggle UI to execution mode
            toggleExecutionUI('executing');
            
            // Limpa logs anteriores
            logsContainer.innerHTML = '';
            
            // Coleta os bookmarks selecionados
            const selectedBookmarks = Array.from(pendingBookmarks);
            if (selectedBookmarks.length === 0) {
                throw new Error('Nenhum bookmark selecionado');
            }
            
            addLog(`Iniciando organização de ${selectedBookmarks.length} bookmarks`);

            // Coleta as pastas existentes
            addLog('Coletando pastas existentes...');
            const bookmarks = await chrome.bookmarks.getTree();
            const existingFolders = [];
            
            function collectFolders(node) {
                if (!node.url && node.title) { // É uma pasta
                    existingFolders.push({
                        id: node.id,
                        title: node.title
                    });
                }
                if (node.children) {
                    node.children.forEach(collectFolders);
                }
            }
            
            bookmarks[0].children.forEach(collectFolders);
            addLog(`Encontradas ${existingFolders.length} pastas existentes`);

            // Mostra seção de progresso
            progressSection.style.display = 'block';
            progressText.textContent = 'Analisando bookmarks...';
            progressIndicator.style.width = '50%';
            
            addLog('Enviando bookmarks para análise do Gemini...');

            // Obtém sugestão do Gemini
            const suggestion = await geminiService.suggestOrganization(selectedBookmarks, existingFolders);
            addLog('Sugestão de organização recebida com sucesso', 'success');

            // After receiving suggestion, show only results
            toggleExecutionUI('results');

            // Mostra a sugestão para o usuário
            const resultsList = document.getElementById('results-list');
            resultsList.innerHTML = `
                <div class="suggestion-summary">
                    <h3>Sugestão de Organização</h3>
                    <p>${suggestion.summary}</p>
                </div>
                <div class="folders-preview">
                    ${suggestion.folders.map(folder => `
                        <div class="folder-group">
                            <h4>${folder.icon} ${folder.name} ${folder.isNew ? '<span class="new-badge">Nova</span>' : ''}</h4>
                            <ul>
                                ${folder.bookmarks.map(bm => `
                                    <li>
                                        <div class="bookmark-title">${bm.title}</div>
                                        <div class="bookmark-reason">${bm.reason}</div>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
                <div class="suggestion-actions">
                    <button id="apply-suggestion" class="primary-btn">Aplicar Organização</button>
                    <button id="cancel-suggestion" class="secondary-btn">Voltar</button>
                </div>
            `;

            // Update button handlers
            document.getElementById('apply-suggestion').addEventListener('click', async () => {
                try {
                    toggleExecutionUI('executing');
                    progressSection.style.display = 'block';
                    progressText.textContent = 'Aplicando organização...';
                    addLog('Iniciando aplicação das alterações...');
                    
                    // Aplica a organização sugerida
                    for (const folder of suggestion.folders) {
                        // Encontra ou cria a pasta
                        let targetFolder;
                        if (folder.isNew) {
                            addLog(`Criando nova pasta: ${folder.name}`);
                            targetFolder = await chrome.bookmarks.create({
                                parentId: '1', // Barra de favoritos
                                title: `${folder.icon} ${folder.name}`
                            });
                        } else {
                            addLog(`Usando pasta existente: ${folder.name}`);
                            targetFolder = existingFolders.find(f => f.title === folder.name);
                        }

                        // Move os bookmarks para a pasta
                        for (const bm of folder.bookmarks) {
                            const bookmark = selectedBookmarks.find(b => b.url === bm.url);
                            if (bookmark) {
                                if (bookmark.type === 'new') {
                                    addLog(`Criando novo bookmark: ${bookmark.title}`);
                                    await chrome.bookmarks.create({
                                        parentId: targetFolder.id,
                                        title: bookmark.title,
                                        url: bookmark.url
                                    });
                                } else {
                                    addLog(`Movendo bookmark: ${bookmark.title}`);
                                    await chrome.bookmarks.move(bookmark.id, {
                                        parentId: targetFolder.id
                                    });
                                }
                            }
                        }
                    }

                    // Limpa a seleção e atualiza a UI
                    pendingBookmarks.clear();
                    await loadBookmarksTree();
                    addLog('Organização concluída com sucesso!', 'success');
                    
                    // After success
                    toggleExecutionUI('results');
                    resultsSection.innerHTML = `
                        <div class="success-message">
                            <p>✅ Organização aplicada com sucesso!</p>
                            <button id="close-results" class="secondary-btn">Voltar</button>
                        </div>
                    `;
                    
                    // Add event listener for the close button
                    document.getElementById('close-results').addEventListener('click', () => {
                        toggleExecutionUI('normal');
                        loadBookmarksTree();
                    });
                } catch (error) {
                    console.error('Erro ao aplicar organização:', error);
                    addLog(`Erro ao aplicar organização: ${error.message}`, 'error');
                    
                    toggleExecutionUI('results');
                    resultsSection.innerHTML = `
                        <div class="error-message">
                            <p>❌ Erro ao aplicar organização: ${error.message}</p>
                            <button id="close-results" class="secondary-btn">Voltar</button>
                        </div>
                    `;
                    
                    // Add event listener for the close button
                    document.getElementById('close-results').addEventListener('click', () => {
                        toggleExecutionUI('normal');
                    });
                }
            });

            document.getElementById('cancel-suggestion').addEventListener('click', () => {
                toggleExecutionUI('normal');
            });

        } catch (error) {
            console.error('Erro ao organizar bookmarks:', error);
            addLog(`Erro: ${error.message}`, 'error');
            
            toggleExecutionUI('results');
            resultsSection.innerHTML = `
                <div class="error-message">
                    <p>❌ Erro: ${error.message}</p>
                    <button id="close-results" class="secondary-btn">Voltar</button>
                </div>
            `;
            
            // Add event listener for the close button
            document.getElementById('close-results').addEventListener('click', () => {
                toggleExecutionUI('normal');
            });
        }
    });

    addCurrentBtn.addEventListener('click', async () => {
        try {
            const tabs = await chrome.tabs.query({
                active: true,
                lastFocusedWindow: true
            });
            
            if (!tabs?.length) {
                throw new Error('Nenhuma aba encontrada');
            }

            const tab = tabs[0];
            if (!tab?.url) {
                throw new Error('URL não encontrada na aba');
            }

            const url = new URL(tab.url);
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('Protocolo inválido');
            }

            pendingBookmarks.add({
                type: 'new',
                title: tab.title || tab.url,
                url: tab.url
            });

            showStatus('Página adicionada à lista de organização!', 'success');
            updateOrganizeButton();
            updatePendingList();

        } catch (error) {
            console.error('Erro ao acessar aba:', error);
            showStatus('Erro ao processar página. Tente novamente.', 'error');
        }
    });

    // Initialize
    loadBookmarksTree();
}); 