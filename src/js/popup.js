/**
 * MarkMind v2 - Entry Point
 *
 * This is a clean slate for v2 development.
 * v1 code is archived at: ../v1/js/popup.js
 */

import * as OrganizeTab from './tabs/organize.js';
import * as InsightsTab from './tabs/insights.js';
import * as DiscoverTab from './tabs/discover.js';

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

    // Initialize all tab modules
    initializeTabs(elements);

    // Setup event listeners
    setupEventListeners(elements);
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
        console.log('Settings clicked');
        // TODO: Implement settings panel
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
