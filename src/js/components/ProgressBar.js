/**
 * ProgressBar Component
 * Handles progress visualization with simulated progress
 */

class ProgressBar {
    constructor() {
        this.indicator = null;
        this.text = null;
        this.count = null;
        this.section = null;
        this.simulationInterval = null;
        this.initialized = false;
    }

    /**
     * Initializes the progress bar
     * @param {HTMLElement} indicator - Progress indicator element
     * @param {HTMLElement} text - Progress text element
     * @param {HTMLElement} count - Progress count element
     * @param {HTMLElement} section - Progress section element
     */
    init(indicator, text, count, section) {
        this.indicator = indicator;
        this.text = text;
        this.count = count;
        this.section = section;
        this.initialized = true;
    }

    /**
     * Shows the progress section
     */
    show() {
        if (this.section) {
            this.section.style.display = 'block';
        }
    }

    /**
     * Hides the progress section
     */
    hide() {
        if (this.section) {
            this.section.style.display = 'none';
        }
    }

    /**
     * Resets the progress bar
     */
    reset() {
        this.stopSimulation();
        this.update(0, '');
    }

    /**
     * Updates the progress bar
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} text - Status text
     */
    update(progress, text) {
        if (this.indicator) {
            this.indicator.style.width = `${progress}%`;
        }
        if (this.text) {
            this.text.textContent = text;
        }
        if (this.count) {
            this.count.textContent = `${Math.round(progress)}%`;
        }
    }

    /**
     * Updates progress for item processing
     * @param {number} current - Current item number
     * @param {number} total - Total items
     */
    updateForItems(current, total) {
        const progress = (current / total) * 100;
        this.update(progress, `Processing ${current} of ${total}`);
    }

    /**
     * Starts a simulated progress animation
     * Useful for operations where actual progress can't be tracked
     * @returns {Object} Controller object with complete() method
     */
    startSimulation() {
        let progress = 0;

        // Reset first
        this.update(0, 'Initializing...');

        this.simulationInterval = setInterval(() => {
            if (progress >= 90) {
                clearInterval(this.simulationInterval);
                return;
            }

            // Non-linear increment for natural feel
            const increment = Math.max(1, (90 - progress) / 10);
            progress += increment;

            // Update text based on progress
            let statusText = 'Analyzing bookmarks';
            if (progress >= 30 && progress < 60) {
                statusText = 'Processing structure';
            } else if (progress >= 60) {
                statusText = 'Finalizing organization';
            }

            this.update(progress, statusText);
        }, 100);

        // Return controller
        return {
            complete: () => this.completeSimulation(),
            stop: () => this.stopSimulation()
        };
    }

    /**
     * Completes the simulated progress
     */
    completeSimulation() {
        this.stopSimulation();
        this.update(100, 'Completed!');
    }

    /**
     * Stops the simulation
     */
    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    }

    /**
     * Sets specific phase progress
     * @param {number} phase - Phase number (1-4)
     * @param {string} message - Phase message
     */
    setPhase(phase, message) {
        const phaseProgress = {
            1: 25,
            2: 50,
            3: 75,
            4: 100
        };

        this.update(phaseProgress[phase] || 0, message);
    }
}

// Export singleton instance
const progressBar = new ProgressBar();
export default progressBar;
