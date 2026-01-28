# MarkMind Chrome Extension Permissions

This document explains in detail why MarkMind requires certain Chrome permissions and how they are used.

## Required Permissions

### 1. `bookmarks`
**Purpose**: To read and organize your Chrome bookmarks
**Usage**:
- Read existing bookmarks and folder structure
- Create new bookmark folders
- Move bookmarks between folders
- Update bookmark properties
- Delete bookmarks (only when explicitly requested)

**Why it's necessary**: This is the core functionality of MarkMind. Without this permission, the extension cannot help you organize your bookmarks.

### 2. `storage`
**Purpose**: To save your settings locally
**Usage**:
- Store your API key securely
- Save user preferences
- Remember last used settings
- Cache temporary data during organization

**Why it's necessary**: This allows the extension to remember your settings between sessions and operate efficiently without requiring you to re-enter information.

### 3. `activeTab`
**Purpose**: To bookmark the current page
**Usage**:
- Access the current tab's URL and title
- Add the current page to bookmarks
- Organize newly added bookmarks

**Why it's necessary**: This enables the "Add Current Page" feature, allowing you to quickly bookmark and organize the page you're viewing.

## Security Measures

1. **Data Storage**
   - All data is stored locally in your browser
   - No data is sent to external servers (except AI queries)
   - API key is stored securely using Chrome's storage API

2. **Permission Usage**
   - Permissions are only used when necessary
   - No background processes running constantly
   - Clear feedback when permissions are being used

3. **Privacy Protection**
   - No tracking or analytics
   - No personal data collection
   - Minimal data access required for operation

## What We Don't Request

1. **`history`**: We don't need or want access to your browsing history
2. **`tabs`**: We only need the active tab, not all tabs
3. **`webNavigation`**: Not required for our functionality
4. **`downloads`**: No download functionality needed
5. **`cookies`**: No need to access or modify cookies

## Permission Changes

If we need to add or modify permissions in the future:
1. We will clearly communicate the changes
2. Explain why new permissions are needed
3. Make it optional when possible
4. Provide alternatives if available

## Questions or Concerns

If you have questions about our permissions usage:
1. Check our [Privacy Policy](../PRIVACY.md)
2. Open an issue on GitHub
3. Contact our support team

## Best Practices

We follow Chrome extension best practices:
1. Request minimum necessary permissions
2. Use optional permissions when possible
3. Provide clear documentation
4. Maintain transparency in usage 