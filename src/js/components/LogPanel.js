/**
 * LogPanel Component
 * Handles logging UI with timestamps and different log types
 */

import { LOG_TYPES } from '../config/constants.js';
import { createElement } from '../utils/domUtils.js';

class LogPanel {
    constructor() {
        this.container = null;
        this.section = null;
        this.collapseBtn = null;
        this.initialized = false;
    }

    /**
     * Initializes the log panel
     * @param {HTMLElement} container - Logs container element
     * @param {HTMLElement} section - Logs section element
     * @param {HTMLElement} collapseBtn - Collapse button element
     */
    init(container, section, collapseBtn) {
        this.container = container;
        this.section = section;
        this.collapseBtn = collapseBtn;
        this.initialized = true;

        // Setup collapse functionality
        if (this.collapseBtn) {
            this.collapseBtn.addEventListener('click', () => this.toggleCollapse());
        }
    }

    /**
     * Adds a log entry
     * @param {string} message - Log message
     * @param {string} type - Log type (info, success, error, warning)
     * @param {string} [details] - Optional HTML details
     */
    addLog(message, type = LOG_TYPES.INFO, details = null) {
        if (!this.container) {
            console.warn('LogPanel not initialized');
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = createElement('div', {
            className: `log-entry ${type}`
        });

        let logContent = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;

        if (details) {
            logContent += `<div class="log-details">${details}</div>`;
        }

        logEntry.innerHTML = logContent;
        this.container.appendChild(logEntry);

        // Auto-scroll if not collapsed
        if (!this.container.classList.contains('collapsed')) {
            this.container.scrollTop = this.container.scrollHeight;
        }

        // Show section if hidden
        if (this.section && this.section.style.display === 'none') {
            this.section.style.display = 'block';
            this.expand();
        }
    }

    /**
     * Adds an info log
     * @param {string} message - Log message
     * @param {string} [details] - Optional details
     */
    info(message, details = null) {
        this.addLog(message, LOG_TYPES.INFO, details);
    }

    /**
     * Adds a success log
     * @param {string} message - Log message
     * @param {string} [details] - Optional details
     */
    success(message, details = null) {
        this.addLog(message, LOG_TYPES.SUCCESS, details);
    }

    /**
     * Adds an error log
     * @param {string} message - Log message
     * @param {string} [details] - Optional details
     */
    error(message, details = null) {
        this.addLog(message, LOG_TYPES.ERROR, details);
    }

    /**
     * Adds a warning log
     * @param {string} message - Log message
     * @param {string} [details] - Optional details
     */
    warning(message, details = null) {
        this.addLog(message, LOG_TYPES.WARNING, details);
    }

    /**
     * Clears all logs
     */
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Toggles collapse state
     */
    toggleCollapse() {
        if (this.collapseBtn) {
            this.collapseBtn.classList.toggle('collapsed');
        }
        if (this.container) {
            this.container.classList.toggle('collapsed');
        }

        const logsHeader = document.querySelector('.logs-header');
        if (logsHeader) {
            logsHeader.classList.toggle('collapsed');
        }
    }

    /**
     * Collapses the log panel
     */
    collapse() {
        if (this.collapseBtn) {
            this.collapseBtn.classList.add('collapsed');
        }
        if (this.container) {
            this.container.classList.add('collapsed');
        }

        const logsHeader = document.querySelector('.logs-header');
        if (logsHeader) {
            logsHeader.classList.add('collapsed');
        }
    }

    /**
     * Expands the log panel
     */
    expand() {
        if (this.collapseBtn) {
            this.collapseBtn.classList.remove('collapsed');
        }
        if (this.container) {
            this.container.classList.remove('collapsed');
        }

        const logsHeader = document.querySelector('.logs-header');
        if (logsHeader) {
            logsHeader.classList.remove('collapsed');
        }
    }

    /**
     * Shows the process explanation
     */
    showProcessExplanation() {
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

        this.info('Organization Process:', explanation);
    }

    /**
     * Creates a bound logger function for passing to services
     * @returns {Function} Logger function
     */
    createLogger() {
        return (message, type = LOG_TYPES.INFO, details = null) => {
            this.addLog(message, type, details);
        };
    }
}

// Export singleton instance
const logPanel = new LogPanel();
export default logPanel;
