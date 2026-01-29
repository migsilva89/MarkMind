# CLAUDE.md

## CRITICAL: Before Writing ANY Code

**ALWAYS invoke `/architecture` before:**
- Creating new components or files
- Refactoring existing code
- Adding new features
- Any code modifications

This loads detailed patterns and examples. **Do NOT skip. Do NOT wait for user to remind you.**

---

## Project Overview

MarkMind is a **Chrome Extension (Manifest V3)** that uses AI to intelligently organize bookmarks. Supports Google Gemini, OpenAI, Anthropic, and OpenRouter.

### Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite with @crxjs/vite-plugin
- **Extension**: Chrome Manifest V3
- **Styling**: CSS with design tokens (variables in `src/styles/index.css`)

---

## Development Setup

```bash
npm install       # Install dependencies
npm run dev       # Start dev server with HMR
npm run build     # Build for production (outputs to dist/)
```

### Loading the Extension

1. Run `npm run build`
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select `dist/`

---

## Project Structure

```
src/
├── components/          # React components (ONE per file)
│   ├── ApiKeyPanel/
│   ├── Button/
│   ├── icons/
│   ├── MainContent/
│   └── ServiceSelector/
├── hooks/               # Custom React hooks
├── config/              # Configuration DATA only
├── types/               # TypeScript types/interfaces
├── utils/               # Reusable utility functions
├── styles/              # Design tokens (CSS variables)
├── pages/               # Page-level components
└── App.tsx              # Root component only
```

---

## Architecture Rules (MUST FOLLOW)

### File Organization
- [ ] **One component per file** - Never define multiple components in same file
- [ ] **Types go in `src/types/`** - Not in config or component files
- [ ] **Helpers go in `src/utils/`** - Reusable functions, not in config
- [ ] **Config only contains DATA** - No type definitions, no helper functions
- [ ] **Each component folder** - ComponentName.tsx + ComponentName.css

### Separation of Concerns
| Folder | Contains | Does NOT Contain |
|--------|----------|------------------|
| `types/` | Interfaces, type definitions | Logic, data |
| `config/` | Configuration data, constants | Types, helpers |
| `utils/` | Reusable helper functions | Types, config |
| `hooks/` | React hooks | Components, types |
| `components/` | ONE React component per file | Multiple components |

### Code Patterns
- [ ] **Arrow functions** for all components and handlers
- [ ] **useCallback** for handlers passed to children
- [ ] **useEffect cleanup** for timers and subscriptions
- [ ] **Design tokens only** - Never hardcode colors/spacing/sizes
- [ ] **Descriptive names** - No abbreviations (service not s, bookmark not b)
- [ ] **Error logging** - Always console.error in catch blocks

### Type Rules
- [ ] **Props interfaces** stay in component file
- [ ] **Shared types** (2+ files use it) go to `src/types/`
- [ ] **Domain models** go to `src/types/models.ts`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/config/services.ts` | AI provider configurations (data only) |
| `src/types/services.ts` | ServiceConfig, ServiceTestConfig interfaces |
| `src/types/common.ts` | StatusType, StatusMessage |
| `src/types/pages.ts` | PageMetadata |
| `src/utils/helpers.ts` | Reusable utility functions |
| `src/styles/index.css` | Design tokens (all CSS variables) |
| `src/hooks/useApiKeyPanel.ts` | API key panel state management |

---

## Quick Reference

### Storage Keys
```typescript
geminiApiKey, openaiApiKey, anthropicApiKey, openrouterApiKey, selectedService
```

### Design Token Prefixes
```css
--color-*    /* Colors */
--spacing-*  /* Spacing (2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl) */
--font-size-* /* Typography */
--radius-*   /* Border radius */
```

---

## Remember

1. **Read this file** at session start
2. **Invoke `/architecture`** before ANY code changes
3. **Follow the checklist** - Every rule exists because of past mistakes
4. **When in doubt** - Check existing code patterns in the codebase
