# Architecture & Patterns Guide

This skill contains detailed patterns, examples, and guidelines for MarkMind development. Invoke with `/architecture` before writing code.

---

## Design System

### CRITICAL: Use Design Tokens Only

**NEVER hardcode colors, spacing, font sizes, or any visual values.**

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
  background-color: var(--color-surface);
}

.btn-ghost.active {
  background-color: var(--color-surface);
  border-color: var(--color-primary);
}
```

---

## Naming Conventions

### Functions

```typescript
// BAD
handleClick, doStuff, processData, onClick, cb, fn

// GOOD
saveApiKey, testApiConnection, removeApiKey
handleApiKeySave, handleServiceChange, handlePanelClose
loadSavedServiceFromStorage, validateApiKeyFormat
```

### Variables

```typescript
// BAD
data, info, val, isX, temp, arr, obj, idx

// GOOD
currentService, apiKeyInput, isConnectionTesting
hasExistingKey, selectedServiceId, bookmarkList
```

### Loop/Map Variables

```typescript
// BAD
services.map(s => ...)
services.map(el => ...)
bookmarks.forEach(b => ...)

// GOOD
services.map(service => ...)
bookmarks.forEach(bookmark => ...)
tabs.map(tabConfig => ...)
```

### Event Handlers

```typescript
// BAD
onClick, onChange, onSubmit

// GOOD
onApiKeySave, onServiceSelect, onPanelClose
onTabChange, onApiKeyInputChange
```

### Component Props

```typescript
// BAD
interface Props {
  cb: () => void;
  fn: (x: string) => void;
}

// GOOD
interface ServiceSelectorProps {
  onServiceChange: (serviceId: string) => void;
  onPanelClose: () => void;
  currentServiceId: string;
}
```

### Boolean Variables

```typescript
// BAD
flag, is, has, check

// GOOD
isLoading, hasExistingApiKey, isConnectionTesting
canClosePanel, shouldShowWelcome, isApiKeyValid
```

### Constants

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

## Modern React Patterns

### Arrow Functions for Everything

```typescript
// BAD - function declarations
function MyComponent() { ... }
function handleClick() { ... }

// GOOD - arrow functions
const MyComponent = () => { ... };
const handleClick = () => { ... };
```

### useCallback for Props

```typescript
// BAD - creates new function on every render
const handleServiceChange = (serviceId: string) => {
  setCurrentService(getService(serviceId));
};
<ServiceSelector onServiceChange={handleServiceChange} />

// GOOD - memoized, stable reference
const handleServiceChange = useCallback((serviceId: string) => {
  setCurrentService(getService(serviceId));
}, []);
<ServiceSelector onServiceChange={handleServiceChange} />
```

### useEffect Cleanup

```typescript
// BAD - memory leak
useEffect(() => {
  setTimeout(() => {
    setStatusMessage('');
  }, 5000);
}, []);

// GOOD - cleanup prevents memory leak
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setStatusMessage('');
  }, 5000);

  return () => clearTimeout(timeoutId);
}, []);
```

### Exhaustive Dependencies

```typescript
// BAD - missing dependency
useEffect(() => {
  onServiceChange(selectedServiceId);
}, []); // onServiceChange is missing!

// GOOD - all dependencies included
useEffect(() => {
  onServiceChange(selectedServiceId);
}, [onServiceChange, selectedServiceId]);
```

### Type Guards Over Type Assertions

```typescript
// BAD - unsafe type assertion
const validateResponse = (data: unknown) => {
  const candidates = data.candidates as unknown[];
  return candidates?.length > 0;
};

// GOOD - type-safe validation
const validateResponse = (data: unknown): boolean => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.candidates) && obj.candidates.length > 0;
};
```

### Error Handling

```typescript
// BAD - silent error
try {
  await fetchData();
} catch {
  return fallbackValue;
}

// GOOD - logged error
try {
  await fetchData();
} catch (error) {
  console.error('Failed to fetch data:', error);
  return fallbackValue;
}
```

### Dynamic Values from Runtime

```typescript
// BAD - hardcoded version
<span>MarkMind v2.0.0</span>

// GOOD - dynamic version
<span>MarkMind v{chrome.runtime.getManifest().version}</span>
```

---

## Component Structure Template

```typescript
import { useState, useCallback } from 'react';
import './ComponentName.css';

interface ComponentNameProps {
  propName: string;
  onAction: () => void;
}

const ComponentName = ({ propName, onAction }: ComponentNameProps) => {
  // 1. State declarations
  const [isLoading, setIsLoading] = useState(false);

  // 2. Derived state / computed values
  const isValid = propName.length > 0;

  // 3. Event handlers (useCallback for props)
  const handleButtonClick = useCallback(() => {
    setIsLoading(true);
    onAction();
  }, [onAction]);

  // 4. Render
  return (
    <div className="component-name">
      <button onClick={handleButtonClick} disabled={!isValid}>
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </div>
  );
};

export default ComponentName;
```

---

## Type Organization

### Where Types Go

| Type Category | Location | Example |
|--------------|----------|---------|
| Props interfaces | In component file | `ApiKeyPanelProps` in `ApiKeyPanel.tsx` |
| Shared UI types | `src/types/common.ts` | `StatusType`, `StatusMessage` |
| Domain models | `src/types/models.ts` | `Bookmark`, `Collection` |
| Service types | `src/types/services.ts` | `ServiceConfig`, `ServiceTestConfig` |
| Page types | `src/types/pages.ts` | `PageMetadata` |

### Extending Types

```typescript
// src/types/common.ts - Shared base type
export interface StatusMessage {
  message: string;
  type: StatusType;
}

// Component file - Extend for specific needs
interface ApiKeyPanelStatusMessage extends StatusMessage {
  showGoToApp?: boolean;
}
```

---

## Comments Policy

### NEVER Write These

```typescript
// BAD - Obvious from code
// Cleanup timeout on unmount
useEffect(() => {
  return () => clearTimeout(timeoutRef.current);
}, []);

// BAD - Function name explains it
// Load extension version from manifest
const manifest = chrome.runtime.getManifest();
```

### ONLY Write These

```typescript
// GOOD - Explains WHY (business decision)
// Auto-close after save only for first-time users to guide them to main app
if (!canClosePanel) {
  autoCloseTimeoutRef.current = setTimeout(handlePanelClose, 1500);
}

// GOOD - TODO for incomplete work
// TODO: Send pageData to AI for organization suggestion

// GOOD - Non-obvious workaround
// Chrome requires activeTab permission to access tab.url in some contexts
```

---

## Chrome Extension Patterns

### Storage

```typescript
// Get
await chrome.storage.local.get(['keyName']);

// Set
await chrome.storage.local.set({ keyName: value });

// Remove
await chrome.storage.local.remove(['keyName']);
```

### Tabs

```typescript
const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
```

### Scripting

```typescript
const results = await chrome.scripting.executeScript({
  target: { tabId: activeTab.id },
  func: extractPageMetadata,
});
```

---

## AI Service Configuration Pattern

Services in `src/config/services.ts` use data-driven approach:

```typescript
export const SERVICES: Record<string, ServiceConfig> = {
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
      getEndpoint: (apiKey) => `https://...?key=${apiKey}`,
      getHeaders: () => ({ 'Content-Type': 'application/json' }),
      getBody: () => ({ contents: [{ parts: [{ text: 'Hi' }] }] }),
      validateResponse: (data) => hasArrayWithItems(data, 'candidates'),
    },
  },
};
```

---

## DRY Principle

```typescript
// BAD - Repeated logic
if (key.startsWith('AI') && key.length >= 30) { ... }
if (key.startsWith('sk-') && key.length >= 30) { ... }

// GOOD - Centralized
const SERVICES = {
  google: { validateKey: (key) => key.startsWith('AI') && key.length >= 30 },
  openai: { validateKey: (key) => key.startsWith('sk-') && key.length >= 30 },
};
```

---

## Single Responsibility

```typescript
// BAD - Function does too much
const handleSave = () => {
  validateKey();
  saveToStorage();
  updateUI();
  showNotification();
  closePanel();
};

// GOOD - Separate concerns
const saveApiKey = async (apiKey: string): Promise<void> => {
  await chrome.storage.local.set({ [storageKey]: apiKey });
};

const handleApiKeySave = () => {
  if (!validateApiKeyFormat(apiKeyInput)) {
    showStatusMessage('Invalid format', 'error');
    return;
  }
  saveApiKey(apiKeyInput).then(() => {
    showStatusMessage('Saved', 'success');
  });
};
```

---

## Pre-Implementation Checklist

Before writing ANY code, verify:

1. [ ] Am I creating only ONE component per file?
2. [ ] Are my types in `src/types/` (not in config or components)?
3. [ ] Are my helpers in `src/utils/` (not in config)?
4. [ ] Am I using design tokens (no hardcoded values)?
5. [ ] Am I using arrow functions for components and handlers?
6. [ ] Am I using useCallback for handlers passed to children?
7. [ ] Do my useEffects have cleanup functions where needed?
8. [ ] Am I logging errors in catch blocks?
9. [ ] Are my names descriptive (no abbreviations)?
10. [ ] Does this follow existing patterns in the codebase?
