/**
 * Organize Tab
 * Handles bookmark organization functionality
 *
 * CHANGELOG:
 * - 20 JANUARY: Created basic tab structure with placeholder
 * - 24 JANUARY: Added "Add Current Page" feature with metadata extraction
 */

let statusTimeout = null;

export function init(container) {
    console.log('Organize tab initialized');
    render(container);
    setupEventListeners();
}

// ============================================
// 24 JANUARY: Add Current Page UI
// - Pill ghost button style
// - Status message area for feedback
// ============================================
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
    const addBtn = document.getElementById('add-current-btn');
    addBtn?.addEventListener('click', handleAddCurrentPage);
}

// ============================================
// 24 JANUARY: Handle Add Current Page click
// - Shows loading state while analyzing
// - Collects page metadata for AI context
// - TODO: Send to AI for folder suggestion
// ============================================
async function handleAddCurrentPage() {
    const addBtn = document.getElementById('add-current-btn');

    // Prevent double-clicks
    if (addBtn.classList.contains('loading')) return;

    try {
        // Set loading state
        addBtn.classList.add('loading');
        addBtn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32">
                    <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
            Analyzing...
        `;
        showStatus('Getting page information...', 'default');

        // Get current tab info with metadata
        const pageData = await getCurrentPageWithMetadata();

        if (!pageData) {
            showStatus('Could not get current page info', 'error');
            resetButton();
            return;
        }

        console.log('Page data collected:', pageData);
        showStatus(`Analyzing: ${pageData.title}`, 'default');

        // TODO: Send to AI for organization suggestion
        // For now, just show what we collected
        showStatus('Page data collected! AI integration coming soon.', 'success');

    } catch (error) {
        console.error('Error adding current page:', error);
        showStatus('Error: ' + error.message, 'error');
    } finally {
        resetButton();
    }
}

// ============================================
// 24 JANUARY: Page Metadata Extraction
// - Gets URL, title, favicon from Chrome tab API
// - Extracts meta tags, OG tags, schema.org data
// - Helps AI understand page intent (e.g., .ai domain != AI content)
// ============================================
async function getCurrentPageWithMetadata() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs || tabs.length === 0) {
                reject(new Error('No active tab found'));
                return;
            }

            const tab = tabs[0];

            // Basic info from tab
            const pageData = {
                url: tab.url,
                title: tab.title,
                favIconUrl: tab.favIconUrl || null,
            };

            // Try to extract metadata from the page
            try {
                const metadata = await extractPageMetadata(tab.id);
                Object.assign(pageData, metadata);
            } catch (e) {
                console.log('Could not extract metadata:', e.message);
                // Continue with basic info
            }

            resolve(pageData);
        });
    });
}

// ============================================
// 24 JANUARY: Content Script Injection for Metadata
// - Uses chrome.scripting API to run code in page context
// - Extracts: description, keywords, OG tags, Twitter cards, h1, schema.org
// - Requires "scripting" permission in manifest
// ============================================
async function extractPageMetadata(tabId) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                // Extract various metadata from the page
                const getMeta = (name) => {
                    const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                    return el ? el.getAttribute('content') : null;
                };

                return {
                    // Standard meta tags
                    description: getMeta('description') || getMeta('og:description'),
                    keywords: getMeta('keywords'),
                    author: getMeta('author'),

                    // Open Graph tags (social media)
                    ogTitle: getMeta('og:title'),
                    ogType: getMeta('og:type'),
                    ogSiteName: getMeta('og:site_name'),

                    // Twitter card
                    twitterTitle: getMeta('twitter:title'),
                    twitterDescription: getMeta('twitter:description'),

                    // Page structure hints
                    h1: document.querySelector('h1')?.textContent?.trim().slice(0, 200) || null,

                    // Schema.org type if present
                    schemaType: document.querySelector('[itemtype]')?.getAttribute('itemtype') || null,

                    // Canonical URL (actual page identity)
                    canonicalUrl: document.querySelector('link[rel="canonical"]')?.href || null,
                };
            }
        }, (results) => {
            if (chrome.runtime.lastError) {
                resolve({});
                return;
            }
            resolve(results?.[0]?.result || {});
        });
    });
}

// ============================================
// 24 JANUARY: Status & UI Helper Functions
// ============================================
function showStatus(message, type = 'default') {
    const statusEl = document.getElementById('organize-status');
    if (!statusEl) return;

    // Clear any existing timeout
    if (statusTimeout) {
        clearTimeout(statusTimeout);
    }

    statusEl.textContent = message;
    statusEl.className = 'organize-status';
    if (type !== 'default') {
        statusEl.classList.add(type);
    }

    // Auto-clear success/error messages after 5 seconds
    if (type === 'success' || type === 'error') {
        statusTimeout = setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'organize-status';
        }, 5000);
    }
}

function resetButton() {
    const addBtn = document.getElementById('add-current-btn');
    if (!addBtn) return;

    addBtn.classList.remove('loading');
    addBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Current Page
    `;
}

export function onActivate() {
    console.log('Organize tab activated');
}

export function onDeactivate() {
    console.log('Organize tab deactivated');
    // Clear any pending status timeouts
    if (statusTimeout) {
        clearTimeout(statusTimeout);
    }
}
