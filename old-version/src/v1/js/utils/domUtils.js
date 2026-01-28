/**
 * DOM utility functions
 * Centralizes common DOM manipulation operations
 */

/**
 * Creates an element with specified attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} options - Options object
 * @param {string} options.className - CSS class name(s)
 * @param {string} options.id - Element ID
 * @param {string} options.textContent - Text content
 * @param {string} options.innerHTML - HTML content
 * @param {Object} options.attributes - Additional attributes
 * @param {Object} options.dataset - Data attributes
 * @param {Object} options.style - Inline styles
 * @returns {HTMLElement} The created element
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.className) {
        element.className = options.className;
    }

    if (options.id) {
        element.id = options.id;
    }

    if (options.textContent) {
        element.textContent = options.textContent;
    }

    if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
    }

    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }

    if (options.dataset) {
        Object.entries(options.dataset).forEach(([key, value]) => {
            element.dataset[key] = value;
        });
    }

    if (options.style) {
        Object.entries(options.style).forEach(([key, value]) => {
            element.style[key] = value;
        });
    }

    return element;
}

/**
 * Creates a checkbox input element
 * @param {string} id - Checkbox ID
 * @param {Object} dataset - Data attributes
 * @returns {HTMLInputElement} The checkbox element
 */
export function createCheckbox(id, dataset = {}) {
    return createElement('input', {
        id,
        attributes: { type: 'checkbox' },
        dataset
    });
}

/**
 * Creates a label element
 * @param {string} forId - The ID of the associated input
 * @param {string} text - Label text
 * @param {string} className - CSS class name
 * @returns {HTMLLabelElement} The label element
 */
export function createLabel(forId, text, className = '') {
    const label = createElement('label', {
        className,
        textContent: text
    });
    label.htmlFor = forId;
    return label;
}

/**
 * Creates a button element
 * @param {string} text - Button text
 * @param {string} className - CSS class name
 * @param {Function} onClick - Click handler
 * @returns {HTMLButtonElement} The button element
 */
export function createButton(text, className, onClick) {
    const button = createElement('button', {
        className,
        textContent: text
    });
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    return button;
}

/**
 * Shows an element by setting display style
 * @param {HTMLElement} element - The element to show
 * @param {string} display - Display value (default: 'block')
 */
export function showElement(element, display = 'block') {
    if (element) {
        element.style.display = display;
    }
}

/**
 * Hides an element by setting display to 'none'
 * @param {HTMLElement} element - The element to hide
 */
export function hideElement(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Toggles element visibility
 * @param {HTMLElement} element - The element to toggle
 * @param {boolean} visible - Whether to show or hide
 * @param {string} display - Display value when shown
 */
export function toggleElement(element, visible, display = 'block') {
    if (element) {
        element.style.display = visible ? display : 'none';
    }
}

/**
 * Adds event listener with automatic cleanup tracking
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 * @returns {Function} Cleanup function
 */
export function addEvent(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    return () => element.removeEventListener(event, handler, options);
}

/**
 * Scrolls an element into view smoothly
 * @param {HTMLElement} element - The element to scroll to
 * @param {Object} options - ScrollIntoView options
 */
export function scrollIntoView(element, options = { behavior: 'smooth', block: 'start' }) {
    if (element) {
        element.scrollIntoView(options);
    }
}

/**
 * Gets the value of a form input safely
 * @param {string} selector - CSS selector for the input
 * @returns {string} The input value or empty string
 */
export function getInputValue(selector) {
    const element = document.querySelector(selector);
    return element ? element.value.trim() : '';
}

/**
 * Sets the value of a form input
 * @param {string} selector - CSS selector for the input
 * @param {string} value - The value to set
 */
export function setInputValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.value = value;
    }
}
