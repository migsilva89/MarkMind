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
│   ├── CurrentPageCard/ # Page info card with dynamic organize/accept/decline
│   ├── icons/
│   ├── MainContent/     # Thin orchestrator (header + tabs + active tab routing)
│   ├── ServiceSelector/
│   ├── TabNavigation/   # Ghost pill tab bar (Home, Organize, Insights, Discover)
│   ├── BookmarkTreePath/ # Suggested location display (uses FolderTreeGroup)
│   ├── FolderTreeGroup/ # Expandable group with chevron toggle (shared)
│   ├── OrganizeScan/    # Scan + folder selection view
│   ├── OrganizePlan/    # AI plan review with folder toggles
│   ├── OrganizeProgress/# Batch progress bar + reassurance hint
│   ├── OrganizeReview/  # Assignment review with approve/reject toggles
│   ├── OrganizeComplete/# Success summary
│   ├── OrganizeError/   # Error display + retry
│   ├── OrganizeStatusView/ # Reusable status layout (icon + title + children)
│   └── tabs/            # One component per tab content
│       ├── HomeTab.tsx         # CurrentPageCard + organize flow
│       ├── OrganizeTab.tsx     # Bulk organize orchestrator (state → component)
│       ├── InsightsTab.tsx     # Placeholder (future)
│       └── DiscoverTab.tsx     # Placeholder (future)
├── hooks/               # Custom React hooks (folder per hook)
│   ├── apiKeyPanel/
│   │   ├── useApiKeyPanel.ts   # Main hook
│   │   ├── types.ts            # Hook-specific types
│   │   ├── index.ts            # Exports
│   │   └── handlers/           # Separated handlers
│   │       ├── handleApiKeySave.ts
│   │       ├── handleApiKeyTest.ts
│   │       └── ...
│   ├── useOrganizeBookmark/    # Single-bookmark organize logic (Home tab)
│   │   ├── useOrganizeBookmark.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── useBulkOrganize/       # Bulk organize state machine (Organize tab)
│       ├── useBulkOrganize.ts
│       ├── types.ts
│       └── index.ts
├── services/            # External API and Chrome API wrappers
│   ├── ai/              # AI organization service
│   │   ├── index.ts     # organizeBookmark — single-bookmark orchestration
│   │   ├── prompt.ts    # Single-bookmark prompts
│   │   ├── bulkOrganize.ts # Bulk orchestration (plan + assign)
│   │   ├── bulkPrompt.ts   # Bulk prompts (planning + assignment)
│   │   └── providers/   # One file per AI provider
│   │       ├── gemini.ts
│   │       ├── openai.ts
│   │       ├── anthropic.ts
│   │       └── openRouter.ts
│   ├── bookmarks.ts     # Chrome Bookmarks API wrapper
│   ├── organizeSession.ts # Session persistence to chrome.storage.local
│   └── pageMetadata.ts  # Page metadata extraction (title, h1, meta)
├── config/              # Configuration DATA only
│   ├── services.ts      # AI provider configurations
│   └── loadingMessages.ts # Fun rotating loading messages for AI analysis
├── background.ts        # Service worker — batch processing for bulk organize
├── types/               # TypeScript types/interfaces
│   ├── organize.ts      # OrganizeSession state machine, CompactBookmark, FolderPlan
│   └── messaging.ts     # Popup ↔ service worker message types
├── utils/               # Reusable utility functions
│   ├── bookmarkScanner.ts # Flatten, filter, batch bookmark utilities
│   └── folderDisplay.ts   # Path display helpers (stripRoot, getLastSegment)
├── styles/              # Design tokens (CSS variables)
├── pages/               # Page-level components
└── App.tsx              # Root component only
```

---

## Architecture Rules (MUST FOLLOW)

### Off-Limits
- [ ] **NEVER modify `old-version/`** - Legacy code kept for reference only. Zero changes, ever.

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
| `services/` | External API calls, Chrome API wrappers | React state, UI logic |
| `utils/` | Reusable helper functions | Types, config |
| `hooks/` | React hooks (folder per hook) | Components |
| `components/` | ONE React component per file | Multiple components |

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

### Type Rules
- [ ] **Props interfaces** stay in component file
- [ ] **Shared types** (2+ files use it) go to `src/types/`
- [ ] **Domain models** go to `src/types/models.ts`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/config/services.ts` | AI provider configurations (data only) |
| `src/config/loadingMessages.ts` | Fun rotating loading messages during AI analysis |
| `src/services/ai/` | AI bookmark organization (prompt, providers, orchestration) |
| `src/services/ai/providers/` | One file per AI provider (gemini, openai, anthropic, openRouter) |
| `src/services/bookmarks.ts` | Chrome Bookmarks API wrapper (getTree, create, search, createFolderPath) |
| `src/services/pageMetadata.ts` | Extracts page title, h1, meta from active tab |
| `src/types/services.ts` | ServiceConfig, ServiceTestConfig interfaces |
| `src/types/bookmarks.ts` | ChromeBookmarkNode, FolderDataForAI, FolderPathMap, PendingSuggestion |
| `src/types/common.ts` | StatusType, StatusMessage |
| `src/types/pages.ts` | PageMetadata |
| `src/utils/folders.ts` | Builds ASCII folder tree and path-to-ID map for AI |
| `src/utils/helpers.ts` | Reusable utility functions |
| `src/utils/debug.ts` | Debug logging (silent in production builds) |
| `src/styles/index.css` | Design tokens (all CSS variables) |
| `src/hooks/apiKeyPanel/` | API key panel hook (folder with handlers) |
| `src/hooks/useOrganizeBookmark/` | Single-bookmark organize hook (Home tab) |
| `src/hooks/useBulkOrganize/` | Bulk organize state machine hook (Organize tab) |
| `src/services/ai/bulkOrganize.ts` | Bulk AI orchestration (planFolderStructure, assignBookmarkBatch) |
| `src/services/ai/bulkPrompt.ts` | Two-phase prompts: planning (folder structure) + assignment (per batch) |
| `src/services/organizeSession.ts` | Session persistence (save/load/clear from chrome.storage.local) |
| `src/background.ts` | Service worker — batch processing, retry, keepalive alarm |
| `src/types/organize.ts` | OrganizeSession, state machine types, CompactBookmark, FolderPlan |
| `src/types/messaging.ts` | Popup ↔ service worker message types |
| `src/components/MainContent/` | Thin orchestrator (header + tabs + active tab routing) |
| `src/components/TabNavigation/` | Ghost pill tab bar (config-driven, easy to add tabs) |
| `src/components/CurrentPageCard/` | Page info card with dynamic organize/accept/decline |
| `src/components/FolderTreeGroup/` | Shared expandable group component (used in scan, plan, review, Home) |
| `src/components/tabs/` | One component per tab (HomeTab, OrganizeTab, InsightsTab, DiscoverTab) |

---

## Quick Reference

### Storage Keys
```typescript
geminiApiKey, openaiApiKey, anthropicApiKey, openrouterApiKey, selectedService, organizeSession
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
