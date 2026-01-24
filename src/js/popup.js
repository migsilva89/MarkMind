/**
 * MarkMind v2 - Entry Point
 *
 * This is a clean slate for v2 development.
 * v1 code is archived at: ../v1/js/popup.js
 *
 * CHANGELOG:
 * - 20 JANUARY: Created V2 entry point with tab system
 * - 21 JANUARY: PR review feedback fixes
 * - 24 JANUARY: Added OpenRouter to API key check
 */

import * as OrganizeTab from './tabs/organize.js';
import * as InsightsTab from './tabs/insights.js';
import * as DiscoverTab from './tabs/discover.js';
import * as Welcome from './components/Welcome.js';
import * as Settings from './components/Settings.js';

// Tab modules registry
const tabModules = {
    organize: OrganizeTab,
    insights: InsightsTab,
    discover: DiscoverTab,
};

let currentTab = 'organize';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log('MarkMind v2 initialized');

    // Cache DOM elements
    const elements = {
        settingsBtn: document.getElementById('settings-btn'),
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content'),
    };

    // Initialize components
    Welcome.init();

    // Check if first time user (no API key)
    const hasApiKey = await checkApiKey();
    if (!hasApiKey) {
        Welcome.open();
    }

    // Initialize all tab modules
    initializeTabs(elements);

    // Setup event listeners
    setupEventListeners(elements);
}

// 24 JANUARY: Added 'openrouterApiKey' to the list of keys to check
async function checkApiKey() {
    return new Promise((resolve) => {
        const keysToCheck = ['geminiApiKey', 'openaiApiKey', 'anthropicApiKey', 'openrouterApiKey'];
        chrome.storage.local.get(keysToCheck, (result) => {
            const hasAnyKey = keysToCheck.some(key => !!result[key]);
            resolve(hasAnyKey);
        });
    });
}

function initializeTabs(elements) {
    Object.entries(tabModules).forEach(([name, module]) => {
        const container = document.getElementById(`${name}-tab`);
        if (container && module.init) {
            module.init(container);
        }
    });
}

function setupEventListeners(elements) {
    // Settings button
    elements.settingsBtn?.addEventListener('click', () => {
        Settings.open();
    });

    // Tab switching
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab, elements));
    });
}

function switchTab(selectedTab, elements) {
    const tabName = selectedTab.dataset.tab;
    const previousTab = currentTab;

    // Notify previous tab of deactivation
    if (tabModules[previousTab]?.onDeactivate) {
        tabModules[previousTab].onDeactivate();
    }

    // Update tab buttons
    elements.tabs.forEach(tab => tab.classList.remove('active'));
    selectedTab.classList.add('active');

    // Update tab content
    elements.tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`)?.classList.add('active');

    // Notify new tab of activation
    if (tabModules[tabName]?.onActivate) {
        tabModules[tabName].onActivate();
    }

    currentTab = tabName;
}
