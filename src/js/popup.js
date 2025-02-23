import geminiService from './services/geminiService.js';

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const bookmarksContainer = document.getElementById('bookmarks-container');
    const selectAllBtn = document.getElementById('select-all');
    const deselectAllBtn = document.getElementById('deselect-all');
    const organizeBtn = document.getElementById('organize-btn');
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
    let currentPrompt = {
        bookmarks: [],
        folders: [],
        text: ''
    };

    // Function to add logs
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

    // Load initial API key
    chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
            testApiBtn.style.display = 'block';
            geminiService.setApiKey(result.geminiApiKey);
        }
    });

    // Settings
    settingsBtn.addEventListener('click', () => {
        console.log('Settings button clicked');
        const isVisible = settingsSection.style.display === 'block';
        settingsSection.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            try {
                // Check if chrome.storage object is available
                if (!chrome || !chrome.storage || !chrome.storage.local) {
                    throw new Error('Chrome storage API is not available');
                }

                // Load API key
                chrome.storage.local.get(['geminiApiKey'], (result) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error loading API key:', chrome.runtime.lastError);
                        showStatus('Error loading API key: ' + chrome.runtime.lastError.message, 'error', true);
                        return;
                    }
                    console.log('Loaded API key:', result.geminiApiKey ? 'exists' : 'not found');
                    if (result.geminiApiKey) {
                        apiKeyInput.value = result.geminiApiKey;
                        // Configure API key in service
                        geminiService.setApiKey(result.geminiApiKey);
                    }
                });
            } catch (error) {
                console.error('Error loading API key:', error);
                showStatus('Error loading API key: ' + error.message, 'error', true);
            }
        }
    });

    saveApiKeyBtn.addEventListener('click', () => {
        console.log('Save API key button clicked');
        const apiKey = apiKeyInput.value.trim();
        console.log('API key length:', apiKey.length);
        
        if (!apiKey) {
            console.log('API key is empty');
            showStatus('Please enter a valid API key.', 'error', true);
            return;
        }

        // Basic validation of API key format
        if (!apiKey.match(/^AIza[0-9A-Za-z-_]{35}$/)) {
            console.log('Invalid API key format');
            showStatus('Invalid API key. Must start with "AIza" and be 39 characters long.', 'error', true);
            return;
        }

        console.log('Saving API key...');
        try {
            // Check if chrome.storage object is available
            if (!chrome || !chrome.storage || !chrome.storage.local) {
                throw new Error('Chrome storage API is not available');
            }

            // Save the API key
            chrome.storage.local.set(
                { geminiApiKey: apiKey },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error saving API key:', chrome.runtime.lastError);
                        showStatus('Error saving API key: ' + chrome.runtime.lastError.message, 'error', true);
                        return;
                    }
                    console.log('API key saved successfully');
                    showStatus('API key saved successfully!', 'success', true);
                    testApiBtn.style.display = 'block';
                    // Configure API key in service after saving
                    geminiService.setApiKey(apiKey);
                }
            );
        } catch (error) {
            console.error('Error saving API key:', error);
            showStatus('Error saving API key: ' + error.message, 'error', true);
        }
    });

    // Test API functionality
    testApiBtn.addEventListener('click', async () => {
        testResult.style.display = 'block';
        testResult.innerHTML = '<div class="status-message loading">Testing API connection and functionality...</div>';
        
        try {
            // Test with a realistic bookmark
            const response = await geminiService.suggestOrganization([{
                title: 'MDN Web Docs: Your Guide to Web Development',
                url: 'https://developer.mozilla.org',
                id: 'test'
            }], [], addLog);
            
            // Format the response for better readability
            const formattedResponse = {
                status: 'Success',
                suggestedFolders: response.folders.map(f => f.name),
                organizationSummary: response.summary || 'Organization suggestion received'
            };
            
            testResult.innerHTML = `
                <div class="test-result success">
                    <div>✅ API Connection: <strong>Successful</strong></div>
                    <div>✅ Authentication: <strong>Valid</strong></div>
                    <div>✅ Response: <strong>Valid JSON format</strong></div>
                    <div class="test-details">
                        <pre>${JSON.stringify(formattedResponse, null, 2)}</pre>
                    </div>
                </div>
            `;
        } catch (error) {
            testResult.innerHTML = `
                <div class="test-result error">
                    <div>❌ API Test Failed</div>
                    <div class="error-details">
                        <strong>Error Type:</strong> ${error.name}<br>
                        <strong>Message:</strong> ${error.message}<br>
                        <strong>Possible Solution:</strong> ${
                            error.message.includes('API key') ? 
                            'Please check if your API key is valid and properly configured.' :
                            'Please try again or check your internet connection.'
                        }
                    </div>
                </div>
            `;
        }
    });

    // Function to update pending bookmarks list
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
            removeBtn.title = 'Remove';
            removeBtn.onclick = () => {
                pendingBookmarks.delete(bookmark);
                updatePendingList();
                updateOrganizeButton();
                
                // Uncheck checkbox if it exists
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

    // Function to update prompt
    function updatePrompt() {
        const bookmarks = Array.from(pendingBookmarks);
        currentPrompt.bookmarks = bookmarks;
        
        // Update prompt text
        const bookmarksText = bookmarks.map(b => `- ${b.title}\n  URL: ${b.url}`).join('\n');
        const foldersText = currentPrompt.folders.map(f => `- ${f.title}`).join('\n');
        
        currentPrompt.text = `You are an AI assistant specialized in organizing bookmarks into folders.
Your task is to ONLY return a valid JSON, with no additional text.

INPUT:
Bookmarks to organize:
${bookmarksText}

Existing folders:
${foldersText}

RULES:
1. Use existing folders when appropriate
2. Suggest new folders only if necessary
3. Group related bookmarks
4. ALL bookmarks must be included in a folder
5. Keep categorization reasons short and objective

REQUIRED RESPONSE FORMAT:
{
    "folders": [
        {
            "name": "Folder Name",
            "isNew": true/false,
            "icon": "appropriate emoji",
            "bookmarks": [
                {
                    "title": "exact bookmark title",
                    "url": "exact bookmark url",
                    "reason": "short reason"
                }
            ]
        }
    ],
    "summary": "Brief organization explanation"
}`;

        addLog(`📝 Prompt updated: ${bookmarks.length} bookmarks`, 'info');
        addLog(`📊 Prompt size: ${currentPrompt.text.length} characters`, 'info');
        const tokenEstimate = currentPrompt.text.split(/\s+/).length;
        addLog(`🔤 Estimated tokens: ${tokenEstimate}`, 'info');
    }

    // Core Functions
    async function loadBookmarksTree() {
        try {
            bookmarksContainer.innerHTML = '';
            const tree = await chrome.bookmarks.getTree();
            bookmarksTree = tree;
            
            // Collect existing folders for prompt
            const existingFolders = [];
            function collectFolders(node) {
                if (!node.url && node.title) {
                    existingFolders.push({
                        id: node.id,
                        title: node.title
                    });
                }
                if (node.children) {
                    node.children.forEach(collectFolders);
                }
            }
            tree[0].children.forEach(collectFolders);
            currentPrompt.folders = existingFolders;
            addLog(`📂 Existing folders loaded: ${existingFolders.length}`, 'info');
            
            renderBookmarksTree(tree[0], bookmarksContainer);
            updateOrganizeButton();
            updatePendingList();
            updatePrompt();
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            showStatus('Error updating bookmarks list.', 'error');
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
                addLog(`➕ Bookmark added (folder): ${folderNode.title}`, 'info');
            } else {
                for (const item of pendingBookmarks) {
                    if (item.type === 'existing' && item.id === folderNode.id) {
                        pendingBookmarks.delete(item);
                        addLog(`➖ Bookmark removed (folder): ${folderNode.title}`, 'info');
                        break;
                    }
                }
            }
        }
        if (folderNode.children) {
            folderNode.children.forEach(child => toggleFolderBookmarks(child, checked));
        }
        updatePendingList();
        updatePrompt();
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
        label.textContent = `${node.title || 'Bookmarks'} `;
        
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
        label.textContent = `${bookmark.title || bookmark.url}`;

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
            addLog(`➕ Bookmark added: ${bookmark.title}`, 'info');
        } else {
            for (const item of pendingBookmarks) {
                if (item.type === 'existing' && item.id === bookmark.id) {
                    pendingBookmarks.delete(item);
                    addLog(`➖ Bookmark removed: ${bookmark.title}`, 'info');
                    break;
                }
            }
        }
        updateOrganizeButton();
        updatePendingList();
        updatePrompt();
    }

    async function findOrCreateUncategorizedFolder() {
        try {
            const bookmarks = await chrome.bookmarks.getTree();
            const searchFolder = (nodes) => {
                for (const node of nodes) {
                    if (node.title === "Uncategorized") return node;
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
                title: 'Uncategorized'
            });
        } catch (error) {
            console.error('Error finding/creating folder:', error);
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
                    console.error('Error moving/creating bookmark:', moveError);
                }
            }

            pendingBookmarks.clear();
            await loadBookmarksTree();
            
            return bookmarksArray.length;
        } catch (error) {
            console.error('Error organizing bookmarks:', error);
            throw error;
        }
    }

    function updateProgress(progress, current, total) {
        const progressIndicator = document.getElementById('progress-indicator');
        const progressText = document.getElementById('progress-text');
        const progressCount = document.getElementById('progress-count');
        
        progressIndicator.style.width = `${progress}%`;
        progressText.textContent = `Processing ${current} of ${total}`;
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
            console.error('Error selecting all:', error);
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
            ],
            executing: [
                logsSection,
                progressSection
            ],
            results: [
                logsSection,
                resultsSection
            ]
        };

        // Hide all elements first
        Object.values(elementsToManage).flat().forEach(element => {
            if (element) {
                element.style.display = 'none';
            }
        });

        // Always ensure settings is hidden when changing views
        if (settingsSection) {
            settingsSection.style.display = 'none';
        }

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

    async function processFolder(folder, parentId = '1') {
        try {
            // Find or create the current folder
            let targetFolder;
            
            // Helper function to find folder by name and parent
            async function findFolderByNameAndParent(name, parentId) {
                const bookmarks = await chrome.bookmarks.getSubTree(parentId);
                if (!bookmarks || !bookmarks[0] || !bookmarks[0].children) return null;
                
                return bookmarks[0].children.find(b => b.title === name && !b.url);
            }
            
            if (folder.isNew) {
                addLog(`Creating folder "${folder.name}" under parent ${parentId}...`, 'info');
                targetFolder = await chrome.bookmarks.create({
                    parentId: parentId,
                    title: folder.name
                });
                addLog(`✓ Folder created with ID: ${targetFolder.id}`, 'success');
            } else {
                addLog(`Looking for existing folder "${folder.name}" under parent ${parentId}...`, 'info');
                // First try to find the folder under the specified parent
                targetFolder = await findFolderByNameAndParent(folder.name, parentId);
                
                if (!targetFolder) {
                    // If not found under parent, search everywhere
                    const bookmarks = await chrome.bookmarks.search({ title: folder.name });
                    targetFolder = bookmarks.find(b => b.title === folder.name && !b.url);
                    
                    if (targetFolder) {
                        // If found elsewhere, move it to the correct parent
                        addLog(`Moving folder "${folder.name}" to correct parent...`, 'info');
                        targetFolder = await chrome.bookmarks.move(targetFolder.id, { parentId });
                    } else {
                        // If not found anywhere, create it
                        addLog(`⚠️ Folder "${folder.name}" not found, creating new...`, 'warning');
                        targetFolder = await chrome.bookmarks.create({
                            parentId: parentId,
                            title: folder.name
                        });
                    }
                }
                addLog(`✓ Folder "${folder.name}" ready with ID: ${targetFolder.id}`, 'success');
            }

            const folderId = targetFolder.id;

            // Move bookmarks to this folder
            if (folder.bookmarks && folder.bookmarks.length > 0) {
                addLog(`Moving ${folder.bookmarks.length} bookmarks to "${folder.name}"...`, 'info');
                for (const bookmark of folder.bookmarks) {
                    try {
                        const existingBookmark = Array.from(pendingBookmarks).find(bm => 
                            bm.url === bookmark.url && bm.title === bookmark.title
                        );
                        
                        if (!existingBookmark) {
                            addLog(`⚠️ Bookmark not found: ${bookmark.title}`, 'warning');
                            continue;
                        }

                        if (existingBookmark.type === 'new') {
                            await chrome.bookmarks.create({
                                parentId: folderId,
                                title: bookmark.title,
                                url: bookmark.url
                            });
                            addLog(`✓ Created: ${bookmark.title}`, 'success');
                        } else {
                            await chrome.bookmarks.move(existingBookmark.id, {
                                parentId: folderId
                            });
                            addLog(`✓ Moved: ${bookmark.title}`, 'success');
                        }
                    } catch (error) {
                        addLog(`❌ Error processing ${bookmark.title}: ${error.message}`, 'error');
                    }
                }
            }

            // Process subfolders recursively
            if (folder.subfolders && folder.subfolders.length > 0) {
                addLog(`Processing ${folder.subfolders.length} subfolders of "${folder.name}"...`, 'info');
                for (const subfolder of folder.subfolders) {
                    await processFolder(subfolder, folderId);
                }
            }

            return targetFolder;
        } catch (error) {
            addLog(`❌ Error processing folder ${folder.name}: ${error.message}`, 'error');
            throw error;
        }
    }

    organizeBtn.addEventListener('click', async () => {
        try {
            toggleExecutionUI('executing');
            logsContainer.innerHTML = '';
            
            const selectedBookmarks = Array.from(pendingBookmarks);
            if (selectedBookmarks.length === 0) {
                throw new Error('No bookmarks selected');
            }
            
            addLog(`🚀 Starting organization of ${selectedBookmarks.length} bookmarks`, 'info');
            addLog(`• ${selectedBookmarks.length} bookmarks to analyze`, 'info');
            addLog(`• ${currentPrompt.folders.length} existing folders`, 'info');

            // Show progress section
            progressSection.style.display = 'block';
            progressText.textContent = 'Sending for analysis...';
            progressIndicator.style.width = '50%';
            
            // Get suggestion from Gemini using prepared prompt
            let suggestion;
            try {
                suggestion = await geminiService.suggestOrganization(selectedBookmarks, currentPrompt.folders, addLog);
                
                addLog('✅ Response received from Gemini', 'success');
                
                if (!suggestion || typeof suggestion !== 'object') {
                    throw new Error('Invalid response from Gemini');
                }
                
                if (!suggestion.folders || !Array.isArray(suggestion.folders)) {
                    throw new Error('Invalid response format: folders not found or not an array');
                }
                
                addLog('✨ Organization suggestion received successfully', 'success');
                addLog(`📂 Total suggested folders: ${suggestion.folders.length}`, 'info');
            } catch (error) {
                addLog(`❌ Error processing Gemini response: ${error.message}`, 'error');
                if (suggestion) {
                    addLog('⚠️ Response content:', 'warning');
                    addLog(JSON.stringify(suggestion, null, 2), 'info');
                }
                throw error;
            }

            // After receiving suggestion, show only results
            toggleExecutionUI('results');

            // Show suggestion to user
            const resultsList = document.getElementById('results-list');
            resultsList.innerHTML = `
                <div class="suggestion-summary">
                    <h3>Organization Suggestion</h3>
                    <p>Bookmarks will be organized into the following folders:</p>
                </div>
                <div class="folders-preview">
                    ${renderFolderStructure(suggestion.folders)}
                </div>
                <div class="suggestion-actions">
                    <button id="apply-suggestion" class="primary-btn">Apply Organization</button>
                    <button id="cancel-suggestion" class="secondary-btn">Back</button>
                </div>
            `;

            function renderFolderStructure(folders) {
                return folders.map(folder => `
                    <div class="folder-group">
                        <h4>${folder.name} ${folder.isNew ? '<span class="new-badge">New</span>' : ''}</h4>
                        <ul>
                            ${folder.bookmarks.map(bm => `
                                <li>
                                    <div class="bookmark-title">${bm.title}</div>
                                </li>
                            `).join('')}
                            ${folder.subfolders && folder.subfolders.length > 0 ? `
                                <li class="subfolders">
                                    <div class="subfolder-list">
                                        ${renderFolderStructure(folder.subfolders)}
                                    </div>
                                </li>
                            ` : ''}
                        </ul>
                    </div>
                `).join('');
            }

            // Add click handlers for folder toggles
            const folderHeaders = resultsList.querySelectorAll('.folder-group h4');
            folderHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    // Toggle expanded class on the header
                    header.classList.toggle('expanded');
                    
                    // Toggle expanded class on the bookmarks list
                    const bookmarksList = header.nextElementSibling;
                    bookmarksList.classList.toggle('expanded');
                    
                    // Add expanded class to parent folder-group for proper spacing
                    const folderGroup = header.closest('.folder-group');
                    if (folderGroup) {
                        folderGroup.classList.toggle('expanded');
                    }
                    
                    // If expanding, scroll the folder into view with some padding
                    if (bookmarksList.classList.contains('expanded')) {
                        setTimeout(() => {
                            const foldersPreview = header.closest('.folders-preview');
                            if (foldersPreview) {
                                const headerRect = header.getBoundingClientRect();
                                const containerRect = foldersPreview.getBoundingClientRect();
                                
                                // Check if header is not fully visible
                                if (headerRect.top < containerRect.top || headerRect.bottom > containerRect.bottom) {
                                    header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    // Add some padding to the scroll
                                    foldersPreview.scrollTop -= 16;
                                }
                            }
                        }, 150); // Small delay to allow for expansion animation
                    }
                });
            });

            // Update button handlers
            document.getElementById('apply-suggestion').addEventListener('click', async () => {
                try {
                    toggleExecutionUI('executing');
                    progressSection.style.display = 'block';
                    progressText.textContent = 'Applying organization...';
                    addLog('Starting to apply changes...', 'info');
                    addLog('Structure to be created:', 'info');
                    
                    // Log the folder structure
                    function logFolderStructure(folders, depth = 0) {
                        folders.forEach(folder => {
                            const indent = '  '.repeat(depth);
                            const status = folder.isNew ? '[New]' : '[Existing]';
                            addLog(`${indent}• ${status} Folder "${folder.name}" with ${folder.bookmarks.length} bookmarks`, 'info');
                            if (folder.subfolders && folder.subfolders.length > 0) {
                                logFolderStructure(folder.subfolders, depth + 1);
                            }
                        });
                    }
                    logFolderStructure(suggestion.folders);
                    
                    // Process all root folders
                    for (const folder of suggestion.folders) {
                        await processFolder(folder);
                    }

                    // Update UI
                    toggleExecutionUI('results');
                    resultsList.innerHTML = `
                        <div class="success-message">
                            <p>✅ Organization completed successfully!</p>
                            <button id="view-bookmarks" class="primary-btn">View Bookmarks</button>
                        </div>
                    `;

                    document.getElementById('view-bookmarks').addEventListener('click', () => {
                        toggleExecutionUI('normal');
                        loadBookmarksTree();
                    });

                    addLog('Organization completed successfully!', 'success');
                } catch (error) {
                    addLog(`❌ Error during organization: ${error.message}`, 'error');
                    resultsList.innerHTML = `
                        <div class="error-message">
                            <p>❌ Error during organization: ${error.message}</p>
                            <button id="try-again" class="primary-btn">Try Again</button>
                        </div>
                    `;

                    document.getElementById('try-again').addEventListener('click', () => {
                        toggleExecutionUI('normal');
                        loadBookmarksTree();
                    });
                }
            });

            document.getElementById('cancel-suggestion').addEventListener('click', () => {
                toggleExecutionUI('normal');
            });

        } catch (error) {
            addLog(`❌ Error: ${error.message}`, 'error');
            toggleExecutionUI('normal');
        }
    });

    // Load initial bookmarks tree
    loadBookmarksTree();
});