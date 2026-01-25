/**
 * Organize Tab - Handles bookmark organization functionality
 */

let statusTimeout = null;

export function init(container) {
    render(container);
    setupEventListeners();
}

export function render(container) {
    container.innerHTML = `
        <div class="organize-container">
            <div class="organize-actions">
                <button id="add-current-btn" class="btn-pill-ghost">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Current Page
                </button>
            </div>
            <div id="organize-status" class="organize-status"></div>
        </div>
    `;
}

function setupEventListeners() {
    document.getElementById('add-current-btn')?.addEventListener('click', handleAddCurrentPage);
}

/**
 * Main handler for "Add Current Page" button
 * Extracts page metadata and will send to AI for folder suggestion
 */
async function handleAddCurrentPage() {
    const addBtn = document.getElementById('add-current-btn');

    // Prevent double-clicks while processing
    if (addBtn.classList.contains('loading')) return;

    try {
        setButtonLoading(addBtn, true);
        showStatus('Getting page information...', 'default');

        // Extract metadata from current page
        const pageData = await getCurrentPageData();

        if (!pageData?.url) {
            showStatus('Could not get current page info', 'error');
            return;
        }

        console.log('Page data collected:', pageData);
        showStatus(`Analyzing: ${pageData.title}`, 'default');

        // TODO: Send pageData to AI for organization suggestion
        showStatus('Page data collected! AI integration coming soon.', 'success');

    } catch (error) {
        console.error('Error adding current page:', error);
        showStatus('Error: ' + error.message, 'error');
    } finally {
        setButtonLoading(addBtn, false);
    }
}

/**
 * Gets page data by injecting a script into the active tab
 * Uses activeTab + scripting permissions (no 'tabs' permission needed)
 */
async function getCurrentPageData() {
    // Get active tab ID (activeTab permission grants access when user clicks extension)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');

    try {
        // Inject script to extract metadata directly from the page
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractMetadata
        });
        return result;
    } catch (e) {
        // Fallback for restricted pages (chrome://, chrome-extension://, etc.)
        // These pages block script injection for security
        return { url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl };
    }
}

/**
 * Runs inside the page context to extract metadata
 * This function is injected via chrome.scripting.executeScript
 */
function extractMetadata() {
    // Helper to get meta tag content by name or property
    const getMeta = (name) => {
        const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return el?.getAttribute('content') || null;
    };

    return {
        url: location.href,
        title: document.title,
        favIconUrl: document.querySelector('link[rel="icon"]')?.href || null,
        // Get description from standard meta or Open Graph
        description: getMeta('description') || getMeta('og:description'),
        // Keywords help AI understand page topics
        keywords: getMeta('keywords'),
        // H1 is often the most descriptive element on the page
        h1: document.querySelector('h1')?.textContent?.trim().slice(0, 200) || null
    };
}

function showStatus(message, type = 'default') {
    const statusEl = document.getElementById('organize-status');
    if (!statusEl) return;

    if (statusTimeout) clearTimeout(statusTimeout);

    statusEl.textContent = message;
    statusEl.className = `organize-status${type !== 'default' ? ` ${type}` : ''}`;

    // Auto-clear success/error messages after 5 seconds
    if (type === 'success' || type === 'error') {
        statusTimeout = setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'organize-status';
        }, 5000);
    }
}

function setButtonLoading(btn, isLoading) {
    if (!btn) return;

    if (isLoading) {
        btn.classList.add('loading');
        btn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32">
                    <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
            Analyzing...
        `;
    } else {
        btn.classList.remove('loading');
        btn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Current Page
        `;
    }
}

export function onActivate() {}

export function onDeactivate() {
    // Clean up any pending status timeouts when leaving tab
    if (statusTimeout) clearTimeout(statusTimeout);
}
