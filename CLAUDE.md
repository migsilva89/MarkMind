# CLAUDE.md

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

```text
src/
├── components/          # React components (ONE per file)
│   ├── ApiKeyPanel/
│   ├── BookmarkTreePath/
│   ├── Button/
│   ├── CurrentPageCard/ # Page info card with dynamic organize/accept/decline
│   ├── Dropdown/
│   ├── FolderTreeGroup/
│   ├── Footer/
│   ├── icons/
│   ├── MainContent/     # Thin orchestrator (header + tabs + active tab routing)
│   ├── OrganizeCheckbox/
│   ├── OrganizeComplete/
│   ├── OrganizeError/
│   ├── OrganizePlan/
│   ├── OrganizeReview/
│   ├── OrganizeScan/
│   ├── OrganizeStatusView/
│   ├── QuickActions/
│   ├── ServiceSelector/
│   ├── TabNavigation/   # Ghost pill tab bar (Home, Organize, Discover, Blog↗)
│   ├── TreeNode/
│   ├── WelcomeBanner/
│   └── tabs/            # One component per tab content
│       ├── HomeTab.tsx
│       ├── OrganizeTab.tsx
│       ├── DiscoverTab.tsx
│       └── discover/    # Discover sub-components
├── hooks/               # Custom React hooks (folder per hook)
│   ├── apiKeyPanel/
│   ├── useBulkOrganize/
│   ├── useOrganizeBookmark/
│   └── useTheme/
├── services/            # External API and Chrome API wrappers
│   ├── ai/              # AI organization service
│   │   ├── index.ts     # organizeBookmark (orchestration)
│   │   ├── prompt.ts    # System prompt + user prompt builder
│   │   └── providers/   # One file per AI provider
│   ├── bookmarks.ts     # Chrome Bookmarks API wrapper
│   ├── organizeSession.ts
│   ├── pageMetadata.ts  # Page metadata extraction
│   └── selectedState.ts
├── config/              # Configuration DATA only
│   ├── services.ts      # AI provider configurations
│   ├── discoverContent.ts
│   └── loadingMessages.ts
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

| Folder         | Contains                                 | Does NOT Contain       |
| -------------- | ---------------------------------------- | ---------------------- |
| `types/`       | Interfaces, type definitions             | Logic, data            |
| `config/`      | Configuration data, constants            | Types, helpers         |
| `services/`    | External API calls, Chrome API wrappers  | React state, UI logic  |
| `utils/`       | Reusable helper functions                | Types, config          |
| `hooks/`       | React hooks (folder per hook)            | Components             |
| `components/`  | ONE React component per file             | Multiple components    |

### Hook Organization (Complex Hooks)

- [ ] **Folder per hook** - `hooks/hookName/` not `hooks/useHookName.ts`
- [ ] **Handlers in separate files** - `handlers/handleAction.ts`
- [ ] **Types in hook folder** - `types.ts` for hook-specific types
- [ ] **Index exports** - `index.ts` for clean imports

### Code Patterns

- [ ] **Arrow functions** for all components and handlers
- [ ] **useCallback** for handlers passed to children
- [ ] **useEffect cleanup** for timers and subscriptions
- [ ] **Design tokens only** - Never hardcode colors/spacing/sizes
- [ ] **Descriptive names** - No abbreviations (service not s, bookmark not b)
- [ ] **Error logging** - Always console.error in catch blocks
- [ ] **Button component** - Use `<Button>` not raw `<button>` elements

### Type Rules

- [ ] **Props interfaces** stay in component file
- [ ] **Shared types** (2+ files use it) go to `src/types/`
- [ ] **Domain models** go to `src/types/`

---

## Key Files Reference

| File | Purpose |
| ---- | ------- |
| `src/config/services.ts` | AI provider configurations (data only) |
| `src/config/loadingMessages.ts` | Rotating loading messages during AI analysis |
| `src/config/discoverContent.ts` | Discover tab content + blog URL |
| `src/services/ai/` | AI bookmark organization (prompt, providers, orchestration) |
| `src/services/bookmarks.ts` | Chrome Bookmarks API wrapper |
| `src/services/pageMetadata.ts` | Extracts page title, h1, meta from active tab |
| `src/types/` | All TypeScript interfaces and types |
| `src/utils/` | Utility functions (folders, debug, helpers) |
| `src/styles/index.css` | Design tokens (all CSS variables) |
| `src/hooks/` | All custom hooks with folder-per-hook pattern |
| `src/components/MainContent/` | Thin orchestrator (header + tabs + routing) |
| `src/components/TabNavigation/` | Ghost pill tab bar (config-driven) |
| `src/components/CurrentPageCard/` | Page info card with organize/accept/decline |

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
2. **Follow the checklist** - Every rule exists because of past mistakes
3. **When in doubt** - Check existing code patterns in the codebase
