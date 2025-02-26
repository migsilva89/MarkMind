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
    const settingsCloseBtn = document.getElementById('settings-close');
    const apiKeyInput = document.getElementById('api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const removeApiKeyBtn = document.getElementById('remove-api-key');
    const testApiBtn = document.getElementById('test-api');
    const testResult = document.getElementById('test-result');
    
    // API Key Warning Elements
    const apiKeyWarning = document.getElementById('api-key-warning');
    const configureApiKeyBtn = document.getElementById('configure-api-key');
    
    // UI Sections
    const progressSection = document.querySelector('.progress-section');
    const progressIndicator = document.getElementById('progress-indicator');
    const progressText = document.getElementById('progress-text');
    const progressCount = document.getElementById('progress-count');
    const resultsSection = document.querySelector('.results-section');
    const logsSection = document.querySelector('.logs-section');
    const logsContainer = document.getElementById('logs-container');
    
    // Logs collapse functionality
    const collapseBtn = document.getElementById('collapse-logs');
    
    // Application State
    let bookmarksTree = [];
    let pendingBookmarks = new Set();

    // Function to add logs
    function addLog(message, type = 'info', details = null) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        let logContent = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
        
        if (details) {
            logContent += `<div class="log-details">${details}</div>`;
        }
        
        logEntry.innerHTML = logContent;
        logsContainer.appendChild(logEntry);
        
        // Only auto-scroll if logs are not collapsed
        if (!logsContainer.classList.contains('collapsed')) {
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
        
        if (logsSection.style.display === 'none') {
            logsSection.style.display = 'block';
            // Ensure logs are expanded when first shown
            collapseBtn.classList.remove('collapsed');
            logsContainer.classList.remove('collapsed');
        }
    }

    // Function to show process explanation
    function showProcessExplanation() {
        const explanation = `
            <div class="process-explanation">
                <h4>How MarkMind Organizes Your Bookmarks</h4>
                <ol>
                    <li>Analyzes bookmark titles and URLs</li>
                    <li>Groups similar content together</li>
                    <li>Uses existing folders when appropriate</li>
                    <li>Creates new folders only when needed</li>
                    <li>Maintains a clean hierarchy (max 3 levels)</li>
                </ol>
                <p class="ai-disclosure">Uses Google's Gemini AI for intelligent categorization</p>
            </div>
        `;
        
        addLog('ℹ️ Organization Process:', 'info', explanation);
    }

    // Function to check API key and update UI
    function checkApiKeyAndUpdateUI() {
        chrome.storage.local.get(['geminiApiKey'], (result) => {
            const hasApiKey = result.geminiApiKey && result.geminiApiKey.trim() !== '';
            
            // Show/hide API key warning
            apiKeyWarning.style.display = hasApiKey ? 'none' : 'block';
            
            // Enable/disable buttons
            addCurrentBtn.disabled = !hasApiKey;
            organizeBtn.disabled = !hasApiKey || pendingBookmarks.size === 0;
            selectAllBtn.disabled = !hasApiKey;
            deselectAllBtn.disabled = !hasApiKey;
            
            // Update API key related elements
            if (hasApiKey) {
                apiKeyInput.value = result.geminiApiKey;
                testApiBtn.style.display = 'block';
                removeApiKeyBtn.style.display = 'block';
                geminiService.setApiKey(result.geminiApiKey);
            } else {
                apiKeyInput.value = '';
                testApiBtn.style.display = 'none';
                removeApiKeyBtn.style.display = 'none';
            }
        });
    }

    // Configure API Key button click handler
    configureApiKeyBtn.addEventListener('click', () => {
        settingsSection.style.display = 'block';
        apiKeyInput.focus();
    });

    // Save API key
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter a valid API key.', 'error', true);
            return;
        }

        // Basic validation of API key format
        if (!apiKey.match(/^AIza[0-9A-Za-z-_]{35}$/)) {
            showStatus('Invalid API key format. Must start with "AIza" and be 39 characters long.', 'error', true);
            return;
        }

        chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
            if (chrome.runtime.lastError) {
                showStatus('Error saving API key: ' + chrome.runtime.lastError.message, 'error', true);
                return;
            }
            
            // Add classes to style the buttons
            saveApiKeyBtn.classList.add('primary-btn');
            testApiBtn.classList.add('primary-btn');
            
            showStatus('API key saved successfully!', 'success', true);
            checkApiKeyAndUpdateUI();
        });
    });

    // Add Report Bug button to settings
    const reportBugBtn = document.createElement('button');
    reportBugBtn.innerHTML = '🐛 Report a Bug';
    reportBugBtn.className = 'secondary-btn report-bug-btn';
    reportBugBtn.addEventListener('click', () => {
        window.open('https://github.com/migsilva89/MarkMind/issues/new', '_blank');
    });
    settingsSection.appendChild(reportBugBtn);

    // Remove API key
    removeApiKeyBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to remove your API key? This will disable the AI organization feature.')) {
            chrome.storage.local.remove(['geminiApiKey'], () => {
                if (chrome.runtime.lastError) {
                    showStatus('Error removing API key: ' + chrome.runtime.lastError.message, 'error', true);
                    return;
                }
                checkApiKeyAndUpdateUI();
                showStatus('API key removed successfully', 'success', true);
            });
        }
    });

    // Initial check for API key
    checkApiKeyAndUpdateUI();

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

    // Function to show bookmark limit warning
    function showBookmarkLimitWarning(count) {
        const warningThreshold = 90;
        const warningElement = document.getElementById('bookmark-limit-warning') || createBookmarkLimitWarning();
        
        if (count > warningThreshold) {
            warningElement.style.display = 'block';
            warningElement.innerHTML = `
                <div class="warning-icon">⚠️</div>
                <div class="warning-text">
                    <strong>Large Selection Warning:</strong> You've selected ${count} bookmarks.
                    <p>Free API keys may have limitations with large requests. For best results, consider organizing in smaller batches (under ${warningThreshold}). Is up to you to decide if you want to proceed.</p>
                </div>
            `;
        } else {
            warningElement.style.display = 'none';
        }
    }

    // Helper function to create the warning element if it doesn't exist
    function createBookmarkLimitWarning() {
        const warningElement = document.createElement('div');
        warningElement.id = 'bookmark-limit-warning';
        warningElement.className = 'warning-message';
        
        // Insert between the buttons and the bookmarks container
        const bookmarksContainer = document.getElementById('bookmarks-container');
        bookmarksContainer.parentNode.insertBefore(warningElement, bookmarksContainer);
        
        return warningElement;
    }

    // Function to update pending bookmarks list
    function updatePendingList() {
        const bookmarks = Array.from(pendingBookmarks);
        pendingCount.textContent = bookmarks.length;
        pendingSection.style.display = bookmarks.length > 0 ? 'block' : 'none';
        
        // Show or hide bookmark limit warning
        showBookmarkLimitWarning(bookmarks.length);
        
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

    // Core Functions
    async function loadBookmarksTree() {
        try {
            bookmarksContainer.innerHTML = '';
            const tree = await chrome.bookmarks.getTree();
            bookmarksTree = tree;
            
            // Collect existing folders with hierarchy
            const existingFolders = [];
            const folderMap = new Map();
            
            function collectFolders(node, parentId = null) {
                if (!node.url) {
                    const folder = {
                        id: node.id,
                        title: node.title,
                        children: [],
                        parentId: parentId
                    };
                    
                    folderMap.set(node.id, folder);
                    
                    if (node.children) {
                        node.children.forEach(child => {
                            if (!child.url) {
                                const childFolder = collectFolders(child, node.id);
                                if (childFolder) {
                                    folder.children.push(childFolder);
                                }
                            }
                        });
                    }
                    
                    if (node.id !== '0') { // Don't add root node
                        existingFolders.push(folder);
                    }
                    return folder;
                }
                return null;
            }
            
            // First pass: collect all folders
            tree[0].children.forEach(node => collectFolders(node));
            
            // Function to build folder hierarchy string
            function buildFolderHierarchyJSON(folders) {
                const rootFolders = folders.filter(f => !f.parentId || f.parentId === '0' || f.parentId === '1' || f.parentId === '2');
                
                function formatFolder(folder) {
                    return {
                        name: folder.title,
                        id: folder.id,
                        children: folder.children.map(child => formatFolder(child))
                    };
                }
                
                return JSON.stringify(rootFolders.map(folder => formatFolder(folder)), null, 2);
            }
            
            // Store the hierarchical structure for use in API calls
            window.existingFoldersHierarchy = buildFolderHierarchyJSON(existingFolders);
            
            addLog(`📂 Existing folders loaded: ${existingFolders.length}`, 'info');
            
            renderBookmarksTree(tree[0], bookmarksContainer);
            updateOrganizeButton();
            updatePendingList();
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
        
        // Add margin-top to settings status
        if (isSettings) {
            statusElement.style.marginTop = '16px';
        }
        
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
        // Clear all checkboxes
        const checkboxes = bookmarksContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        
        // Clear pending bookmarks
        pendingBookmarks.clear();
        
        // Update UI elements
        updateOrganizeButton();
        updatePendingList();
        
        // Hide pending section when clearing
        pendingSection.style.display = 'none';
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
        
        // Hide bookmark limit warning only in results state, not during execution
        const warningElement = document.getElementById('bookmark-limit-warning');
        if (warningElement && state === 'results') {
            warningElement.style.display = 'none';
        }

        // Reset add status message when returning to normal state
        const addStatus = document.getElementById('add-status');
        if (addStatus && state === 'normal') {
            addStatus.style.display = 'none';
            addStatus.textContent = '';
            addStatus.className = 'status-message';
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
                // Auto-collapse logs when showing results
                if (collapseBtn && logsContainer) {
                    collapseBtn.classList.add('collapsed');
                    logsContainer.classList.add('collapsed');
                    document.querySelector('.logs-header').classList.add('collapsed');
                }
                break;
        }

        // Adjust container padding
        const container = document.querySelector('.container');
        if (container) {
            container.style.padding = state === 'normal' ? '24px' : '12px';
        }
    }

    // Helper function to clean URLs
    function cleanUrl(url) {
        try {
            const urlObj = new URL(url);
            // Remove query parameters and hash
            return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        } catch (e) {
            console.error('Error cleaning URL:', e);
            return url;
        }
    }

    async function processFolder(folder, parentId = '1', isSingleBookmark = false) {
        try {
            // Find or create the current folder
            let targetFolder;
            
            // Check if this is a native Chrome folder (like "Other Bookmarks")
            const isNativeFolder = folder.id === '1' || folder.id === '2' || folder.id === '3';
            
            if (isNativeFolder) {
                // For native folders, get them directly by ID
                addLog(`Using native Chrome folder "${folder.name}" (ID: ${folder.id})...`, 'info');
                try {
                    const nativeFolder = await chrome.bookmarks.getSubTree(folder.id);
                    if (nativeFolder && nativeFolder[0]) {
                        targetFolder = nativeFolder[0];
                        addLog(`✓ Native folder "${folder.name}" found with ID: ${targetFolder.id}`, 'success');
                    } else {
                        throw new Error(`Native folder with ID ${folder.id} not found`);
                    }
                } catch (error) {
                    addLog(`❌ Error accessing native folder: ${error.message}`, 'error');
                    throw error;
                }
            } else {
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
            }

            const folderId = targetFolder.id;

            // Process subfolders first to ensure the complete hierarchy exists
            if (folder.subfolders && folder.subfolders.length > 0) {
                addLog(`Processing ${folder.subfolders.length} subfolders of "${folder.name}"...`, 'info');
                for (const subfolder of folder.subfolders) {
                    await processFolder(subfolder, folderId, isSingleBookmark);
                }
            }

            // Move bookmarks to this folder
            if (folder.bookmarks && folder.bookmarks.length > 0) {
                if (isSingleBookmark) {
                    // For single bookmark addition, only process the first bookmark
                    const bookmark = folder.bookmarks[0];
                    const existingBookmark = Array.from(pendingBookmarks)[0];
                    
                    // Find the deepest folder in the hierarchy that should contain this bookmark
                    let deepestFolder = folder;
                    while (deepestFolder.subfolders && deepestFolder.subfolders.length > 0 && deepestFolder.subfolders[0].bookmarks.length > 0) {
                        deepestFolder = deepestFolder.subfolders[0];
                    }
                    
                    // Get the ID of the deepest folder
                    const finalFolderId = deepestFolder === folder ? folderId : (await findFolderByNameAndParent(deepestFolder.name, folderId)).id;
                    
                    if (existingBookmark.type === 'new') {
                        const created = await chrome.bookmarks.create({
                            parentId: finalFolderId,
                            title: bookmark.title,
                            url: bookmark.url
                        });
                        addLog(`✓ Created: ${bookmark.title} in "${deepestFolder.name}"`, 'success');
                        addLog(`  URL: ${bookmark.url}`, 'info');
                        addLog(`  ID: ${created.id}`, 'info');
                    } else {
                        // Move existing bookmark to the new folder
                        await chrome.bookmarks.move(existingBookmark.id, {
                            parentId: finalFolderId
                        });
                        addLog(`✓ Moved: ${bookmark.title} to "${deepestFolder.name}"`, 'success');
                        addLog(`  From: ${existingBookmark.url}`, 'info');
                        addLog(`  ID: ${existingBookmark.id}`, 'info');
                    }
                } else {
                    // For bulk organization, process all bookmarks
                    addLog(`Moving ${folder.bookmarks.length} bookmarks to "${folder.name}"...`, 'info');
                    for (const bookmark of folder.bookmarks) {
                        try {
                            const cleanedSuggestedUrl = cleanUrl(bookmark.url);
                            const existingBookmark = Array.from(pendingBookmarks).find(bm => {
                                const cleanedExistingUrl = cleanUrl(bm.url);
                                return cleanedExistingUrl === cleanedSuggestedUrl && bm.title === bookmark.title;
                            });
                            
                            if (!existingBookmark) {
                                addLog(`⚠️ Bookmark not found: ${bookmark.title} (${bookmark.url})`, 'warning');
                                continue;
                            }

                            if (existingBookmark.type === 'new') {
                                const created = await chrome.bookmarks.create({
                                    parentId: folderId,
                                    title: bookmark.title,
                                    url: bookmark.url
                                });
                                addLog(`✓ Created: ${bookmark.title} in "${folder.name}"`, 'success');
                                addLog(`  URL: ${bookmark.url}`, 'info');
                                addLog(`  ID: ${created.id}`, 'info');
                            } else {
                                await chrome.bookmarks.move(existingBookmark.id, {
                                    parentId: folderId
                                });
                                addLog(`✓ Moved: ${bookmark.title} to "${folder.name}"`, 'success');
                                addLog(`  From: ${existingBookmark.url}`, 'info');
                                addLog(`  ID: ${existingBookmark.id}`, 'info');
                            }
                        } catch (error) {
                            addLog(`❌ Error processing ${bookmark.title}: ${error.message}`, 'error');
                            addLog(`  URL: ${bookmark.url}`, 'error');
                        }
                    }
                }
            }

            return targetFolder;
        } catch (error) {
            addLog(`❌ Error processing folder ${folder.name}: ${error.message}`, 'error');
            throw error;
        }
    }

    // Helper function to render folder structure
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

    function simulateProgress() {
        let progress = 0;
        const progressIndicator = document.getElementById('progress-indicator');
        const progressCount = document.getElementById('progress-count');
        const progressText = document.getElementById('progress-text');
        
        // Reset progress
        progressIndicator.style.width = '0%';
        progressCount.textContent = '0%';
        
        const interval = setInterval(() => {
            if (progress >= 90) {
                clearInterval(interval);
                return;
            }
            
            // Non-linear increment for more natural feel
            const increment = Math.max(1, (90 - progress) / 10);
            progress += increment;
            
            progressIndicator.style.width = `${progress}%`;
            progressCount.textContent = `${Math.round(progress)}%`;
            
            // Update text based on progress
            if (progress < 30) {
                progressText.textContent = 'Analyzing bookmarks';
            } else if (progress < 60) {
                progressText.textContent = 'Processing structure';
            } else {
                progressText.textContent = 'Finalizing organization';
            }
        }, 100);
        
        return {
            complete: () => {
                clearInterval(interval);
                progressIndicator.style.width = '100%';
                progressCount.textContent = '100%';
                progressText.textContent = 'Completed!';
            }
        };
    }

    organizeBtn.addEventListener('click', async () => {
        try {
            toggleExecutionUI('executing');
            logsContainer.innerHTML = '';
            
            const progress = simulateProgress();
            
            // Show process explanation
            showProcessExplanation();
            
            const selectedBookmarks = Array.from(pendingBookmarks);
            if (selectedBookmarks.length === 0) {
                throw new Error('No bookmarks selected');
            }

            // Use the existing folders hierarchy that we already have
            const existingFolders = JSON.parse(window.existingFoldersHierarchy);
            
            addLog(`🚀 Starting organization of ${selectedBookmarks.length} bookmarks`, 'info');
            addLog('📊 Current Statistics:', 'info', `
                <ul>
                    <li>Bookmarks to organize: ${selectedBookmarks.length}</li>
                    <li>Existing folders: ${existingFolders.length}</li>
                    <li>Maximum folder depth: 3 levels</li>
                </ul>
            `);

            // Show progress section
            progressSection.style.display = 'block';
            progressText.textContent = 'Analyzing bookmarks...';
            progressIndicator.style.width = '30%';
            
            addLog('🔍 Phase 1: Analyzing bookmark patterns...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000));
            progressIndicator.style.width = '50%';
            
            addLog('🤖 Phase 2: Generating organization suggestions...', 'info');
            
            // Get suggestion from Gemini
            let suggestion;
            try {
                addLog('🔍 Sending request to Gemini...', 'info');
                console.log('📝 Sending to Gemini:', {
                    bookmarks: selectedBookmarks.map(b => ({
                        title: b.title,
                        url: b.url,
                        id: b.id
                    })),
                    existingFolders: existingFolders,
                    isSingleBookmark: false
                });
                suggestion = await geminiService.suggestOrganization(selectedBookmarks, existingFolders, addLog, false);
                
                // Completar progresso quando receber a resposta
                progress.complete();
                
                addLog('✅ AI Analysis Complete', 'success');
                addLog('📋 Organization Summary:', 'info', `
                    <ul>
                        <li>Bookmarks organized: ${countTotalBookmarks(suggestion.folders)}</li>
                        <li>New folders to create: ${suggestion.folders.filter(f => f.isNew).length}</li>
                        <li>Existing folders to use: ${suggestion.folders.filter(f => !f.isNew).length}</li>
                        <li>Total folders in structure: ${suggestion.folders.length}</li>
                    </ul>
                `);
                
                if (!suggestion || typeof suggestion !== 'object') {
                    throw new Error('Invalid response format from AI');
                }
                
                // Validate the response structure
                if (!suggestion.folders || !Array.isArray(suggestion.folders) || suggestion.folders.length === 0) {
                    throw new Error('AI response is missing folder structure');
                }
                
                // Find bookmarks that weren't included
                const missingBookmarks = selectedBookmarks.filter(bookmark => {
                    // For existing bookmarks, check by ID
                    if (bookmark.type === 'existing') {
                        return !suggestion.folders.some(folder => {
                            // Check in main folder
                            if (folder.bookmarks.some(bm => bm.id === bookmark.id)) {
                                return true;
                            }
                            // Check in subfolders
                            return folder.subfolders?.some(subfolder => 
                                subfolder.bookmarks.some(bm => bm.id === bookmark.id)
                            );
                        });
                    }
                    // For new bookmarks, check by cleaned URL
                    const cleanedBookmarkUrl = cleanUrl(bookmark.url);
                    return !suggestion.folders.some(folder => {
                        // Check in main folder
                        if (folder.bookmarks.some(bm => cleanUrl(bm.url) === cleanedBookmarkUrl)) {
                            return true;
                        }
                        // Check in subfolders
                        return folder.subfolders?.some(subfolder => 
                            subfolder.bookmarks.some(bm => cleanUrl(bm.url) === cleanedBookmarkUrl)
                        );
                    });
                });
                
                if (missingBookmarks.length > 0) {
                    addLog(`⚠️ Found ${missingBookmarks.length} uncategorized bookmarks`, 'warning');
                    // Add missing bookmarks to an "Uncategorized" folder
                    const uncategorizedFolder = suggestion.folders.find(f => f.name === 'Uncategorized');
                    if (uncategorizedFolder) {
                        uncategorizedFolder.bookmarks = [...uncategorizedFolder.bookmarks, ...missingBookmarks.map(bm => ({
                            title: bm.title,
                            url: bm.url,
                            reason: "Not categorized by AI"
                        }))];
                    } else {
                        suggestion.folders.push({
                            name: 'Uncategorized',
                            isNew: true,
                            icon: '📁',
                            bookmarks: missingBookmarks.map(bm => ({
                                title: bm.title,
                                url: bm.url,
                                reason: "Not categorized by AI"
                            }))
                        });
                    }
                    addLog('✓ Added missing bookmarks to "Uncategorized" folder', 'success');
                }
            } catch (error) {
                progress.complete();
                addLog(`❌ Error during AI analysis: ${error.message}`, 'error');
                
                // Show detailed error information and recovery options
                toggleExecutionUI('results');
                const resultsList = document.getElementById('results-list');
                
                // Determine error type and provide appropriate guidance
                let errorType = 'unknown';
                let errorGuidance = '';
                
                if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('exceeded')) {
                    errorType = 'quota';
                    errorGuidance = 'You have exceeded your API quota or rate limit. Try again later or use a different API key.';
                } else if (error.message.includes('Invalid response') || error.message.includes('JSON') || error.message.includes('parse')) {
                    errorType = 'format';
                    errorGuidance = 'The AI returned an invalid response format. This can happen with very large requests.';
                } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
                    errorType = 'timeout';
                    errorGuidance = 'The request timed out. This usually happens with very large bookmark sets.';
                } else if (error.message.includes('network') || error.message.includes('connection')) {
                    errorType = 'network';
                    errorGuidance = 'There was a network error. Please check your internet connection and try again.';
                }
                
                resultsList.innerHTML = `
                    <div class="error-message">
                        <h3>❌ Organization Error</h3>
                        <p>${error.message}</p>
                        <div class="error-guidance">
                            <p><strong>Possible cause:</strong> ${errorGuidance || 'An unexpected error occurred during the AI analysis.'}</p>
                            <p><strong>Suggestions:</strong></p>
                            <ul>
                                ${selectedBookmarks.length > 80 ? '<li>Try organizing fewer bookmarks at once (under 90 is recommended) for free API keys. </li>' : ''}
                                <li>Check your internet connection</li>
                                <li>If you have a paid API key, verify if it is valid and has sufficient quota</li>
                                <li>Try again in a few minutes</li>
                            </ul>
                        </div>
                        <div class="error-actions">
                            <button id="try-again" class="primary-btn">Try Again</button>
                        </div>
                    </div>
                `;
                
                document.getElementById('try-again').addEventListener('click', () => {
                    toggleExecutionUI('normal');
                });
        
                
                return; // Exit the function to prevent further execution
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
                    <button id="apply-suggestion" class="primary-btn">Apply Suggestion</button>
                    <button id="cancel-suggestion" class="secondary-btn">Back</button>
                </div>
            `;

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

                    // Clear pending bookmarks after successful organization
                    pendingBookmarks.clear();
                    updatePendingList();

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
                        
                        // Ensure the warning is hidden since there are no pending bookmarks
                        const warningElement = document.getElementById('bookmark-limit-warning');
                        if (warningElement) {
                            warningElement.style.display = 'none';
                        }
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

    // Add settings button click handler
    settingsBtn.addEventListener('click', () => {
        settingsSection.style.display = 'block';
        // Hide all other sections
        const mainSections = document.querySelectorAll('.container > *:not(#settings-section)');
        mainSections.forEach(section => {
            if (section !== settingsSection) {
                section.style.display = 'none';
            }
        });
    });

    // Add settings close button handler
    settingsCloseBtn.addEventListener('click', () => {
        settingsSection.style.display = 'none';
        // Show main sections again
        const mainSections = document.querySelectorAll('.container > *:not(#settings-section)');
        mainSections.forEach(section => {
            if (section.classList.contains('header') || 
                section.classList.contains('controls') || 
                section.id === 'bookmarks-container') {
                section.style.display = '';
            }
        });
    });

    // Add Current Page functionality
    addCurrentBtn.addEventListener('click', async () => {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('No active tab found');
            }

            // Show loading state
            addStatus.textContent = 'Analyzing page...';
            addStatus.className = 'status-message loading';
            addStatus.style.display = 'block';

            // Check if the URL is already bookmarked
            const existingBookmarks = await chrome.bookmarks.search({ url: tab.url });
            let bookmarkObj;
            
            if (existingBookmarks && existingBookmarks.length > 0) {
                // Use the existing bookmark
                const existingBookmark = existingBookmarks[0];
                
                // Get parent folder information
                let parentFolder = null;
                try {
                    const parentNode = await chrome.bookmarks.get(existingBookmark.parentId);
                    if (parentNode && parentNode.length > 0) {
                        parentFolder = parentNode[0];
                    }
                } catch (error) {
                    console.error('Error getting parent folder:', error);
                }
                
                addLog(`📌 Found existing bookmark: "${existingBookmark.title}" (ID: ${existingBookmark.id})`, 'info');
                if (parentFolder) {
                    addLog(`📂 Currently in folder: "${parentFolder.title}"`, 'info');
                }
                
                bookmarkObj = {
                    type: 'existing',
                    id: existingBookmark.id,
                    title: existingBookmark.title,
                    url: existingBookmark.url,
                    parentId: existingBookmark.parentId,
                    parentTitle: parentFolder ? parentFolder.title : 'Unknown Folder'
                };
            } else {
                // Create a new bookmark object
                bookmarkObj = {
                    type: 'new',
                    id: 'temp-' + Date.now(), // Add a temporary ID
                    title: tab.title,
                    url: tab.url
                };
                addLog(`🆕 Creating new bookmark for: "${tab.title}"`, 'info');
            }

            // Switch to execution view
            toggleExecutionUI('executing');
            logsContainer.innerHTML = '';
            
            addLog('🔍 Analyzing current page...', 'info');
            addLog(`📄 Page Title: ${tab.title}`, 'info');
            addLog(`🔗 URL: ${tab.url}`, 'info');

            // Add to pending bookmarks
            pendingBookmarks.clear();
            pendingBookmarks.add(bookmarkObj);
            updatePendingList();

            // Get existing folders with hierarchy
            const existingFolders = [];
            function collectFolders(node) {
                if (!node.url) {
                    const folder = {
                        id: node.id,
                        title: node.title,
                        children: []
                    };
                    
                    if (node.children) {
                        node.children.forEach(child => {
                            if (!child.url) {
                                folder.children.push(collectFolders(child));
                            }
                        });
                    }
                    
                    if (node.id !== '0') { // Don't add root node
                        existingFolders.push(folder);
                    }
                    return folder;
                }
            }
            bookmarksTree[0].children.forEach(collectFolders);

            // Iniciar simulação de progresso
            const progress = simulateProgress();
            
            // Get suggestion from Gemini
            addLog('🤖 Requesting AI analysis...', 'info');
            console.log('📝 Sending to Gemini:', {
                bookmarks: [bookmarkObj],
                existingFolders: window.existingFoldersHierarchy, // Now sending the hierarchical JSON
                isSingleBookmark: true
            });
            const suggestion = await geminiService.suggestOrganization([bookmarkObj], JSON.parse(window.existingFoldersHierarchy), addLog, true);
            
            // Completar progresso
            progress.complete();

            if (!suggestion || !suggestion.folders || suggestion.folders.length === 0) {
                throw new Error('Invalid suggestion received');
            }

            // Show results UI
            toggleExecutionUI('results');
            
            // Show suggestion to user
            const resultsList = document.getElementById('results-list');
            
            // If it's an existing bookmark, show different options
            if (bookmarkObj.type === 'existing') {
                const targetFolder = suggestion.folders[0].name;
                
                // Check if bookmark is already in the suggested folder
                if (bookmarkObj.parentTitle === targetFolder) {
                    resultsList.innerHTML = `
                        <div class="suggestion-summary">
                            <h3>Bookmark Already Organized</h3>
                            <p>This page is already bookmarked in the "${targetFolder}" folder.</p>
                        </div>
                        <div class="suggestion-actions">
                            <button id="view-bookmarks" class="primary-btn">View Bookmarks</button>
                        </div>
                    `;
                    
                    document.getElementById('view-bookmarks').addEventListener('click', () => {
                        toggleExecutionUI('normal');
                        loadBookmarksTree();
                        
                        // Ensure the warning is hidden since there are no pending bookmarks
                        const warningElement = document.getElementById('bookmark-limit-warning');
                        if (warningElement) {
                            warningElement.style.display = 'none';
                        }
                    });
                    
                    return;
                }
                
                resultsList.innerHTML = `
                    <div class="suggestion-summary">
                        <h3>Bookmark Already Exists</h3>
                        <p>This page is already bookmarked in the "${bookmarkObj.parentTitle}" folder.</p>
                        <p>Would you like to:</p>
                    </div>
                    <div class="folders-preview">
                        ${renderFolderStructure(suggestion.folders)}
                    </div>
                    <div class="suggestion-actions">
                        <button id="move-bookmark" class="primary-btn">Move to "${targetFolder}"</button>
                        <button id="duplicate-bookmark" class="secondary-btn">Keep Both</button>
                        <button id="cancel-suggestion" class="secondary-btn">Cancel</button>
                    </div>
                `;
                
                // Add event listeners for the buttons
                document.getElementById('move-bookmark').addEventListener('click', async () => {
                    try {
                        toggleExecutionUI('executing');
                        progressSection.style.display = 'block';
                        progressText.textContent = 'Moving bookmark...';
                        addLog(`🔄 Moving bookmark from "${bookmarkObj.parentTitle}" to "${targetFolder}"...`, 'info');
                        
                        // Process the folder structure with isSingleBookmark=true
                        for (const folder of suggestion.folders) {
                            await processFolder(folder, '1', true);
                        }
                        
                        // Update UI
                        toggleExecutionUI('results');
                        resultsList.innerHTML = `
                            <div class="success-message">
                                <p>✅ Bookmark moved successfully!</p>
                                <button id="view-bookmarks" class="primary-btn">View Bookmarks</button>
                            </div>
                        `;
                        
                        document.getElementById('view-bookmarks').addEventListener('click', () => {
                            toggleExecutionUI('normal');
                            loadBookmarksTree();
                            
                            // Ensure the warning is hidden since there are no pending bookmarks
                            const warningElement = document.getElementById('bookmark-limit-warning');
                            if (warningElement) {
                                warningElement.style.display = 'none';
                            }
                        });
                        
                        addLog(`✅ Bookmark moved successfully!`, 'success');
                    } catch (error) {
                        handleProcessingError(error, 'moving', resultsList);
                    }
                });
                
                document.getElementById('duplicate-bookmark').addEventListener('click', async () => {
                    try {
                        toggleExecutionUI('executing');
                        progressSection.style.display = 'block';
                        progressText.textContent = 'Creating duplicate bookmark...';
                        addLog(`📎 Creating duplicate bookmark in "${targetFolder}"...`, 'info');
                        
                        // Change bookmark type to 'new' to force creation instead of moving
                        bookmarkObj.type = 'new';
                        pendingBookmarks.clear();
                        pendingBookmarks.add(bookmarkObj);
                        
                        // Process the folder structure with isSingleBookmark=true
                        for (const folder of suggestion.folders) {
                            await processFolder(folder, '1', true);
                        }
                        
                        // Update UI
                        toggleExecutionUI('results');
                        resultsList.innerHTML = `
                            <div class="success-message">
                                <p>✅ Duplicate bookmark created successfully!</p>
                                <button id="view-bookmarks" class="primary-btn">View Bookmarks</button>
                            </div>
                        `;
                        
                        document.getElementById('view-bookmarks').addEventListener('click', () => {
                            toggleExecutionUI('normal');
                            loadBookmarksTree();
                            
                            // Ensure the warning is hidden since there are no pending bookmarks
                            const warningElement = document.getElementById('bookmark-limit-warning');
                            if (warningElement) {
                                warningElement.style.display = 'none';
                            }
                        });
                        
                        addLog(`✅ Duplicate bookmark created successfully!`, 'success');
                    } catch (error) {
                        handleProcessingError(error, 'duplicating', resultsList);
                    }
                });
                
                document.getElementById('cancel-suggestion').addEventListener('click', () => {
                    toggleExecutionUI('normal');
                    pendingBookmarks.clear();
                    updatePendingList();
                });
            } else {
                // For new bookmarks, show the original UI
                resultsList.innerHTML = `
                    <div class="suggestion-summary">
                        <h3>Add Page to Bookmarks</h3>
                        <p>The page will be bookmarked in the following location:</p>
                    </div>
                    <div class="folders-preview">
                        ${renderFolderStructure(suggestion.folders)}
                    </div>
                    <div class="suggestion-actions">
                        <button id="apply-suggestion" class="primary-btn">Add Bookmark</button>
                        <button id="cancel-suggestion" class="secondary-btn">Cancel</button>
                    </div>
                `;
                
                // Handle suggestion application
                document.getElementById('apply-suggestion').addEventListener('click', async () => {
                    try {
                        toggleExecutionUI('executing');
                        progressSection.style.display = 'block';
                        progressText.textContent = 'Adding bookmark...';
                        addLog('📎 Creating bookmark...', 'info');
                        
                        // Process the folder structure with isSingleBookmark=true
                        for (const folder of suggestion.folders) {
                            await processFolder(folder, '1', true);
                        }
                        
                        // Update UI
                        toggleExecutionUI('results');
                        resultsList.innerHTML = `
                            <div class="success-message">
                                <p>✅ Bookmark added successfully!</p>
                                <button id="view-bookmarks" class="primary-btn">View Bookmarks</button>
                            </div>
                        `;
                        
                        document.getElementById('view-bookmarks').addEventListener('click', () => {
                            toggleExecutionUI('normal');
                            loadBookmarksTree();
                            
                            // Ensure the warning is hidden since there are no pending bookmarks
                            const warningElement = document.getElementById('bookmark-limit-warning');
                            if (warningElement) {
                                warningElement.style.display = 'none';
                            }
                        });
                        
                        addLog(`✅ Bookmark added successfully!`, 'success');
                    } catch (error) {
                        handleProcessingError(error, 'adding', resultsList);
                    }
                });
                
                // Handle cancellation
                document.getElementById('cancel-suggestion').addEventListener('click', () => {
                    toggleExecutionUI('normal');
                    pendingBookmarks.clear();
                    updatePendingList();
                });
            }
            
            // Add click handlers for folder toggles
            const folderHeaders = resultsList.querySelectorAll('.folder-group h4');
            folderHeaders.forEach(header => {
                header.addEventListener('click', () => {
                    header.classList.toggle('expanded');
                    const bookmarksList = header.nextElementSibling;
                    bookmarksList.classList.toggle('expanded');
                });
            });

        } catch (error) {
            console.error('Error adding current page:', error);
            addLog(`❌ Error: ${error.message}`, 'error');
            toggleExecutionUI('normal');
            addStatus.textContent = `Error: ${error.message}`;
            addStatus.className = 'status-message error';
        }
    });

    // Helper function for handling errors in bookmark processing
    function handleProcessingError(error, action, resultsList) {
        addLog(`❌ Error ${action} bookmark: ${error.message}`, 'error');
        resultsList.innerHTML = `
            <div class="error-message">
                <p>❌ Error ${action} bookmark: ${error.message}</p>
                <button id="try-again" class="primary-btn">Try Again</button>
            </div>
        `;
        
        document.getElementById('try-again').addEventListener('click', () => {
            toggleExecutionUI('normal');
        });
    }

    // Load initial bookmarks tree
    loadBookmarksTree();

    // Logs collapse functionality
    collapseBtn.addEventListener('click', () => {
        collapseBtn.classList.toggle('collapsed');
        logsContainer.classList.toggle('collapsed');
        document.querySelector('.logs-header').classList.toggle('collapsed');
    });

    // Helper function to count total bookmarks in folders structure
    function countTotalBookmarks(folders) {
        return folders.reduce((total, folder) => {
            const bookmarksInFolder = folder.bookmarks.length;
            const bookmarksInSubfolders = folder.subfolders ? countTotalBookmarks(folder.subfolders) : 0;
            return total + bookmarksInFolder + bookmarksInSubfolders;
        }, 0);
    }
});