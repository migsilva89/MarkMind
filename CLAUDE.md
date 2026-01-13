# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MarkMind is a Chrome extension that uses Google's Gemini AI to intelligently organize bookmarks. It replaces Chrome's native bookmark button with AI-powered organization that automatically categorizes bookmarks into appropriate folders.

## Development Setup

This is a vanilla JavaScript Chrome extension with no build process or package manager.

### Loading the Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `src` folder

### Testing Changes

After making changes, reload the extension in Chrome (click the refresh icon on the extension card in `chrome://extensions/`).

### API Key Setup

The extension requires a Google AI Studio API key (Gemini). Keys are stored in Chrome's local storage via `chrome.storage.local`.

## Architecture

### Core Components

- **popup.js** - Main UI controller. Handles bookmark selection, organization workflow, settings management, and user interactions. Contains the state machine for switching between normal/executing/results views.

- **background.js** - Service worker for Chrome extension background tasks. Handles message passing and basic bookmark operations. Currently minimal as most logic is in popup.js.

- **services/geminiService.js** - Gemini AI integration. Builds prompts for bookmark organization, validates AI responses, handles folder merging, and ensures bookmarks aren't duplicated. Key method is `suggestOrganization()`.

- **config.js** - API configuration including Gemini API URL, model settings (temperature, tokens), and default category list.

### Key Data Flows

1. **Single Bookmark Addition**: User clicks "Add Current Page" -> popup.js checks if URL already bookmarked -> geminiService suggests folder -> user approves -> bookmark created/moved

2. **Bulk Organization**: User selects bookmarks -> geminiService analyzes all selected -> returns folder structure with `isNew` flags -> user reviews -> popup.js creates folders and moves bookmarks via Chrome Bookmarks API

### Chrome APIs Used

- `chrome.bookmarks` - Tree operations, create, move, search
- `chrome.storage.local` - API key persistence
- `chrome.tabs` - Get current tab for "Add Current Page"

### Folder Structure Rules

- Maximum folder depth: 3 levels
- Chrome native folders (Bookmarks Bar id=1, Other Bookmarks id=2, Mobile Bookmarks id=3) are handled specially
- AI is instructed to prefer existing folders over creating new ones
- Empty folders are recursively cleaned from AI responses
