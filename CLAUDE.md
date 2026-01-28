# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

MarkMind is a **Chrome Extension (Manifest V3)** that uses AI to intelligently organize bookmarks. It supports multiple AI providers (Google Gemini, OpenAI, Anthropic, OpenRouter) and automatically categorizes bookmarks into appropriate folders.

### Technology Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite with @crxjs/vite-plugin
- **Extension**: Chrome Manifest V3
- **Styling**: CSS with design tokens (CSS variables)

### Migration Context

This codebase was migrated from **vanilla JavaScript (V2)** to **React + TypeScript**. The previous vanilla JS code is archived in `old-version/` for reference. Key changes:

- `old-version/src/js/` → `src/` (React components)
- `old-version/src/css/style.css` → `src/styles/index.css` (design tokens)
- Direct DOM manipulation → React declarative components
- Module singletons → React hooks and context

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm

### Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server with HMR
npm run build     # Build for production (outputs to dist/)
```

### Loading the Extension

1. Run `npm run build`
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

---

## Project Structure

```
MarkMind/
├── dist/                    # Built extension (load this in Chrome)
├── old-version/             # Archived V1 + V2 vanilla JS code
├── public/
│   └── assets/icons/        # Extension icons
├── src/
│   ├── components/          # Reusable React components
│   ├── pages/               # Page-level components
│   ├── hooks/               # Custom React hooks
│   ├── config/              # Configuration (services, constants)
│   ├── styles/
│   │   └── index.css        # Design system tokens
│   ├── App.tsx              # Root component
│   ├── main.tsx             # React entry point
│   ├── manifest.json        # Chrome extension manifest
│   └── popup.html           # Popup HTML entry
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Design System

### CRITICAL: Use Design Tokens Only

**NEVER hardcode colors, spacing, font sizes, or any visual values.**

All styling must use CSS variables defined in `src/styles/index.css`.

```css
/* BAD - Hardcoded values */
.button {
  background: #18181b;
  padding: 10px 16px;
  font-size: 12px;
  border-radius: 9999px;
}

/* GOOD - Design tokens */
.button {
  background: var(--color-primary);
  padding: var(--spacing-lg) var(--spacing-2xl);
  font-size: var(--font-size-base);
  border-radius: var(--radius-full);
}
```

### Color Palette (Zinc)

```css
--color-primary: #18181b;           /* zinc-900 - Main brand color */
--color-primary-hover: #27272a;     /* zinc-800 */
--color-background: #fafafa;        /* zinc-50 */
--color-surface: #f4f4f5;           /* zinc-100 - Hover backgrounds */
--color-surface-hover: #e4e4e7;     /* zinc-200 - Active backgrounds */
--color-text: #18181b;              /* zinc-900 */
--color-text-secondary: #52525b;    /* zinc-600 */
--color-text-muted: #71717a;        /* zinc-500 */
--color-text-light: #a1a1aa;        /* zinc-400 */
--color-border: #e4e4e7;            /* zinc-200 */
--color-border-light: #d4d4d8;      /* zinc-300 */
--color-white: #ffffff;
```

### Status Colors

```css
--color-success-bg: #d1fae5;        /* emerald-100 */
--color-success: #059669;           /* emerald-600 */
--color-error-bg: #ffe4e6;          /* rose-100 */
--color-error: #e11d48;             /* rose-600 */
--color-warning-bg: #fef3c7;        /* amber-100 */
--color-warning: #d97706;           /* amber-600 */
--color-link: #2563eb;              /* blue-600 */
```

### Spacing Scale

```css
--spacing-2xs: 2px;
--spacing-xs: 4px;
--spacing-sm: 6px;
--spacing-md: 8px;
--spacing-lg: 10px;
--spacing-xl: 12px;
--spacing-2xl: 16px;
--spacing-3xl: 20px;
--spacing-4xl: 24px;
```

### Typography

```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-size-2xs: 9px;
--font-size-xs: 10px;
--font-size-sm: 11px;
--font-size-base: 12px;
--font-size-md: 13px;
--font-size-lg: 14px;
--font-size-xl: 16px;
--font-size-2xl: 20px;
```

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;    /* Pill shape */
```

### Layout

```css
--popup-width: 400px;
--popup-height: 650px;
```

### Button Styles

**Ghost buttons** (primary style): Transparent background with border, soft grey on hover.

```css
.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
}

.btn-ghost:hover {
  background-color: var(--color-surface);  /* Soft grey */
}

.btn-ghost.active {
  background-color: var(--color-surface);
  border-color: var(--color-primary);
}
```

---

## Naming Conventions

### CRITICAL: Use Descriptive Names

Code must be self-documenting. No abbreviations or cryptic names.

#### Functions

```typescript
// BAD
handleClick, doStuff, processData, onClick, cb, fn

// GOOD
saveApiKey, testApiConnection, removeApiKey
handleApiKeySave, handleServiceChange, handlePanelClose
loadSavedServiceFromStorage, validateApiKeyFormat
```

#### Variables

```typescript
// BAD
data, info, val, isX, temp, arr, obj, idx

// GOOD
currentService, apiKeyInput, isConnectionTesting
hasExistingKey, selectedServiceId, bookmarkList
```

#### Loop/Map Variables

```typescript
// BAD
services.map(s => ...)
services.map(el => ...)
services.map(item => ...)
bookmarks.forEach(b => ...)

// GOOD
services.map(service => ...)
bookmarks.forEach(bookmark => ...)
tabs.map(tabConfig => ...)
apiKeys.filter(apiKey => ...)
```

#### Event Handlers

```typescript
// BAD
onClick, onChange, onSubmit

// GOOD
onApiKeySave, onServiceSelect, onPanelClose
onTabChange, onApiKeyInputChange, onRemoveApiKeyConfirm
```

#### Component Props

```typescript
// BAD
interface Props {
  cb: () => void;
  fn: (x: string) => void;
  handler: () => void;
}

// GOOD
interface ServiceSelectorProps {
  onServiceChange: (serviceId: string) => void;
  onPanelClose: () => void;
  currentServiceId: string;
}
```

#### Boolean Variables

```typescript
// BAD
flag, is, has, check

// GOOD
isLoading, hasExistingApiKey, isConnectionTesting
canClosePanel, shouldShowWelcome, isApiKeyValid
```

#### Constants

```typescript
// BAD
const KEY = 'key';
const VAL = 123;

// GOOD
const STORAGE_KEY_SELECTED_SERVICE = 'selectedService';
const DEFAULT_SERVICE_ID = 'google';
const API_TEST_TIMEOUT_MS = 5000;
```

---

## Code Standards

### DRY (Don't Repeat Yourself)

Extract repeated logic into reusable functions or components.

```typescript
// BAD - Repeated validation logic
if (key.startsWith('AI') && key.length >= 30) { ... }
if (key.startsWith('sk-') && key.length >= 30) { ... }

// GOOD - Centralized in config
const SERVICES = {
  google: {
    validateKey: (key) => key.startsWith('AI') && key.length >= 30,
  },
  openai: {
    validateKey: (key) => key.startsWith('sk-') && key.length >= 30,
  },
};
```

### Single Responsibility

Each function/component should do ONE thing well.

```typescript
// BAD - Function does too much
function handleSave() {
  validateKey();
  saveToStorage();
  updateUI();
  showNotification();
  closePanel();
}

// GOOD - Separate concerns
async function saveApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({ [storageKey]: apiKey });
}

function handleApiKeySave() {
  if (!validateApiKeyFormat(apiKeyInput)) {
    showStatusMessage('Invalid format', 'error');
    return;
  }
  saveApiKey(apiKeyInput).then(() => {
    showStatusMessage('Saved', 'success');
  });
}
```

### Component Structure

```typescript
// Standard component structure
import { useState } from 'react';
import './ComponentName.css';

interface ComponentNameProps {
  propName: string;
  onAction: () => void;
}

function ComponentName({ propName, onAction }: ComponentNameProps) {
  // 1. State declarations
  const [isLoading, setIsLoading] = useState(false);

  // 2. Derived state / computed values
  const isValid = propName.length > 0;

  // 3. Event handlers
  function handleButtonClick() {
    setIsLoading(true);
    onAction();
  }

  // 4. Render
  return (
    <div className="component-name">
      <button onClick={handleButtonClick} disabled={!isValid}>
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </div>
  );
}

export default ComponentName;
```

---

## Chrome Extension Guidelines

### Manifest Permissions

Only request permissions that are absolutely necessary:

```json
{
  "permissions": ["bookmarks", "activeTab", "storage", "scripting"],
  "host_permissions": [
    "https://generativelanguage.googleapis.com/*",
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://openrouter.ai/*"
  ]
}
```

### Chrome APIs

Use Chrome APIs with proper typing:

```typescript
// Storage
await chrome.storage.local.get(['keyName']);
await chrome.storage.local.set({ keyName: value });
await chrome.storage.local.remove(['keyName']);

// Tabs
const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

// Scripting (for metadata extraction)
const results = await chrome.scripting.executeScript({
  target: { tabId: activeTab.id },
  func: extractPageMetadata,
});
```

### Storage Keys

Define storage keys as constants:

```typescript
// config/constants.ts
export const STORAGE_KEYS = {
  GEMINI_API_KEY: 'geminiApiKey',
  OPENAI_API_KEY: 'openaiApiKey',
  ANTHROPIC_API_KEY: 'anthropicApiKey',
  OPENROUTER_API_KEY: 'openrouterApiKey',
  SELECTED_SERVICE: 'selectedService',
} as const;
```

---

## AI Service Configuration

Services are configured in `src/config/services.ts` with a data-driven approach:

```typescript
export const SERVICES = {
  google: {
    id: 'google',
    name: 'Google',
    label: 'Gemini API Key',
    storageKey: 'geminiApiKey',
    placeholder: 'Enter your Gemini API key',
    helpLink: 'https://aistudio.google.com/apikey',
    helpLinkText: 'Google AI Studio',
    validateKey: (key: string) => key.startsWith('AI') && key.length >= 30,
    testConfig: {
      getEndpoint: (key) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      getHeaders: () => ({ 'Content-Type': 'application/json' }),
      getBody: () => ({ contents: [{ parts: [{ text: 'Hi' }] }] }),
      validateResponse: (data) => data.candidates?.length > 0,
    },
  },
  // ... other services
};
```

---

## File Organization

### Component Files

Each component should have its own CSS file using design tokens:

```
src/components/
├── ServiceSelector/
│   ├── ServiceSelector.tsx
│   └── ServiceSelector.css
├── ApiKeyCard/
│   ├── ApiKeyCard.tsx
│   └── ApiKeyCard.css
```

### Hooks

Custom hooks for Chrome APIs and shared logic:

```
src/hooks/
├── useStorage.ts        # Chrome storage wrapper
├── useCurrentTab.ts     # Active tab info
├── useApiKeyStatus.ts   # Check if API key exists
```

### Config

Centralized configuration:

```
src/config/
├── services.ts          # AI provider configurations
├── constants.ts         # Storage keys, limits, defaults
```

---

## Reference: Old Codebase

The vanilla JS V2 code is preserved in `old-version/` for reference:

- `old-version/src/js/components/ApiKeyPanel.js` - API key management
- `old-version/src/js/components/ServiceSelector.js` - Service selection
- `old-version/src/js/config/services.js` - Service configurations
- `old-version/src/js/tabs/organize.js` - Organize tab logic
- `old-version/src/css/style.css` - Original styles

Use these files to understand the original logic when recreating in React.
