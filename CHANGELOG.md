# CHANGELOG

All notable changes to MarkMind are documented in this file.

**Important:** Since `manifest.json` doesn't support comments, all manifest changes are documented here.

---

## 24 JANUARY 2026

### Features
- **Add Current Page Button**: Added pill ghost style button to Organize tab
  - Extracts page metadata (title, description, OG tags, keywords, schema.org)
  - Helps AI understand page intent beyond just the URL
  - Files: `src/js/tabs/organize.js`, `src/css/style.css`

- **OpenRouter Service**: Added OpenRouter as 4th AI provider option
  - API aggregator with access to multiple AI models
  - Uses OpenAI-compatible API format
  - Keys start with `sk-or-`
  - Files: `src/js/config/services.js`

- **API Testing for All Services**: Extended API key testing to all 4 providers
  - Google: Gemini API
  - OpenAI: Chat completions endpoint
  - Anthropic: Messages endpoint with browser access header
  - OpenRouter: OpenAI-compatible endpoint
  - Files: `src/js/components/ApiKeyPanel.js`

### UI Changes
- **Pill Ghost Tabs**: Updated main navigation tabs (Organize, Insights, Discover)
  - Transparent background, border-based design
  - Matches service selector pill style
  - Files: `src/css/style.css`

- **Service Selector Adjustment**: Reduced padding to fit 4 service tabs
  - Added flex-wrap for smaller screens
  - Files: `src/css/style.css`

### Manifest Changes (`manifest.json`)
```json
// ADDED: "tabs" permission - Required to access tab.url and tab.title
"permissions": ["bookmarks", "activeTab", "tabs", "storage", "scripting"]

// ADDED: "scripting" permission - Required for metadata extraction via content script

// ADDED: host_permissions - Required for API testing (CORS bypass)
"host_permissions": [
  "https://generativelanguage.googleapis.com/*",
  "https://api.openai.com/*",
  "https://api.anthropic.com/*",
  "https://openrouter.ai/*"
]
```

### Code Convention
- Added dated comments to all modified files
- Created this CHANGELOG.md
- Updated CLAUDE.md with comment convention rules

---

## 21 JANUARY 2026

### Bug Fixes
- PR review feedback fixes
- Files: `src/css/style.css`, `src/js/components/ApiKeyPanel.js`, `src/js/popup.js`

---

## 20 JANUARY 2026

### Major Version Upgrade - V2.0.0

#### Architecture Overhaul
- Reorganized codebase structure for maintainability
- Archived V1 code to `src/v1/` folder
- Created new modular architecture with tabs system

#### New Files Created
- `src/js/popup.js` - New V2 entry point
- `src/js/tabs/organize.js` - Organize tab module
- `src/js/tabs/insights.js` - Insights tab module
- `src/js/tabs/discover.js` - Discover tab module
- `src/js/components/Welcome.js` - Welcome screen component
- `src/js/components/Settings.js` - Settings component
- `src/js/components/ApiKeyPanel.js` - API key management panel
- `src/js/components/ServiceSelector.js` - AI provider selector
- `src/js/config/services.js` - AI service configurations

#### UI Redesign
- Clean minimal design with Zinc color palette
- Tabbed navigation (Organize, Insights, Discover)
- Service selector with pill-style tabs (Google, OpenAI, Anthropic)
- Settings panel with privacy info and danger zone
- Files: `src/css/style.css`, `src/popup.html`

#### Manifest Changes (`manifest.json`)
```json
// Updated version
"version": "2.0.0"

// Initial V2 permissions
"permissions": ["bookmarks", "activeTab", "storage"]
```

---

## 13 JANUARY 2026

### Bug Fixes
- Updated Gemini API URL to version 2.5 for content generation
- Files: `src/js/services/geminiService.js` (V1)

---

## How to Read This Changelog

- **Features**: New functionality added
- **UI Changes**: Visual/styling updates
- **Bug Fixes**: Corrections to existing features
- **Manifest Changes**: All changes to manifest.json (since JSON doesn't support comments)
- **Code Convention**: Documentation and code style changes

Each entry includes the affected files for easy reference.
