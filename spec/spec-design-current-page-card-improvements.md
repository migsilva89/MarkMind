---
title: "CurrentPageCard Improvements: Re-organize, Expand/Collapse, Adaptive Header, Label Size"
version: 1.0
date_created: 2026-03-19
owner: Max / Miguel
tags: [design, app, UX, CurrentPageCard, bookmarks]
---

# Introduction

When a user opens the MarkMind extension on a page they have already bookmarked, the CurrentPageCard displays "Already saved in" with the folder path but provides no further actions. This spec defines four improvements to make the already-bookmarked experience more useful: re-organize support, visual expand/collapse affordance, adaptive header text, and increased label prominence.

## 1. Purpose & Scope

**Purpose**: Improve the CurrentPageCard UX for already-bookmarked pages across four dimensions: re-organization, visual feedback, contextual labeling, and typography.

**Scope**: Changes are limited to the CurrentPageCard component, the BookmarkTreePath component, the useOrganizeBookmark hook, and the bookmarks service. No changes to bulk organize, AI providers, or other tabs.

**Audience**: Developers implementing these changes in the MarkMind Chrome Extension.

**Assumptions**:
- The existing `moveBookmark` function in `src/services/bookmarks.ts` (line 70-83) is already implemented and tested.
- The `FolderTreeGroup` component already renders a chevron expand/collapse icon that should be reused.
- The `BookmarkTreePath` component already wraps `FolderTreeGroup`, which has built-in expand/collapse behavior.

## 2. Definitions

| Term | Definition |
|------|-----------|
| **CurrentPageCard** | The card at the top of HomeTab showing info about the active browser tab |
| **BookmarkTreePath** | Component that renders a folder path as a tree with a label ("Suggested location" or "Already saved in") |
| **FolderTreeGroup** | Reusable collapsible folder tree component with chevron icon, used across Organize phases and HomeTab |
| **useOrganizeBookmark** | Hook managing single-page organize flow: page load, AI call, accept/decline |
| **existingBookmarkPath** | State variable holding the folder path string when the current URL is already bookmarked |
| **existingBookmarkId** | New state variable (to be added) holding the Chrome bookmark ID for move operations |
| **PendingSuggestion** | Type representing an AI-suggested folder location pending user approval |
| **FOUC** | Flash of Unstyled Content |

## 3. Requirements, Constraints & Guidelines

### Subtask 1: Allow re-organizing already saved bookmarks

- **REQ-001**: When a URL is already bookmarked, display a "Re-organize" button below the "Already saved in" tree path.
- **REQ-002**: Clicking "Re-organize" must call the AI service to suggest a new folder, exactly as for new bookmarks.
- **REQ-003**: When the user accepts a re-organize suggestion, the bookmark must be **moved** (not duplicated) using `moveBookmark(bookmarkId, targetFolderId)` from `src/services/bookmarks.ts`.
- **REQ-004**: The hook must store the existing bookmark's Chrome ID (`existingBookmarkId`) so it can be passed to `moveBookmark`.
- **REQ-005**: After a successful move, update `existingBookmarkPath` to reflect the new location and clear `pendingSuggestion`.

### Subtask 2: Expand/collapse icon on "Already saved in"

- **REQ-006**: The "Already saved in" tree path must show the same chevron expand/collapse icon as other `FolderTreeGroup` instances.
- **CON-001**: `BookmarkTreePath` already delegates to `FolderTreeGroup` which renders a chevron. Verify this is visible for the "Already saved in" case. If `defaultExpanded` hides the collapsed state, consider starting collapsed so the chevron is meaningful.
- **GUD-001**: The "Already saved in" `BookmarkTreePath` should render with `defaultExpanded={false}` so the user sees the folder name with a chevron they can click to reveal the bookmark title inside.

### Subtask 3: Adaptive header text

- **REQ-007**: When the current page URL is already bookmarked (`existingBookmarkPath` is set), the card header label must read **"Already bookmarked"** instead of "You're visiting".
- **REQ-008**: The `GlobeIcon` should change to a `BookmarkIcon` (or `CheckIcon`) when the page is already bookmarked, providing a visual distinction.
- **GUD-002**: The header text change must happen reactively when `existingBookmarkPath` is set, including after a successful re-organize (the label should remain "Already bookmarked").

### Subtask 4: Increase label text size

- **REQ-009**: The `.current-page-card-label` font size must increase from `var(--font-size-sm)` (11px) to `var(--font-size-lg)` (14px).
- **GUD-003**: Verify the larger label looks balanced with the 28px icon circle. If needed, increase the icon container size to match.

### Cross-cutting

- **PAT-001**: Follow arrow function pattern for all new handlers.
- **PAT-002**: Use `useCallback` for any handler passed to child components.
- **PAT-003**: Use design tokens only (no hardcoded colors, spacing, or font sizes).
- **PAT-004**: Use the `Button` component (not raw `<button>` elements).
- **CON-002**: One component per file. Do not add new components inside existing files.
- **CON-003**: Do not modify `old-version/` directory.

## 4. Interfaces & Data Contracts

### Modified Hook Return Type (`src/hooks/useOrganizeBookmark/types.ts`)

```typescript
export interface UseOrganizeBookmarkReturn {
  currentPageData: PageMetadata | null;
  isLoadingPage: boolean;
  isOrganizing: boolean;
  statusMessage: string;
  statusType: StatusType;
  pendingSuggestion: PendingSuggestion | null;
  existingBookmarkPath: string | null;
  existingBookmarkId: string | null;          // NEW
  handleOrganizePage: () => Promise<void>;
  handleAcceptSuggestion: () => Promise<void>;
  handleDeclineSuggestion: () => void;
}
```

### Modified CurrentPageCard Props

```typescript
interface CurrentPageCardProps {
  currentPage: PageMetadata | null;
  isLoadingPage: boolean;
  isOrganizing: boolean;
  statusMessage: string;
  statusType: StatusType;
  pendingSuggestion: PendingSuggestion | null;
  existingBookmarkPath: string | null;
  existingBookmarkId: string | null;          // NEW — needed to distinguish move vs create
  onOrganize: () => void;
  onAccept: () => void;
  onDecline: () => void;
}
```

### Bookmark Service (already exists, no changes needed)

```typescript
// src/services/bookmarks.ts — moveBookmark already exists at line 70-83
export const moveBookmark = async (
  bookmarkId: string,
  destinationFolderId: string
): Promise<ChromeBookmarkNode>;
```

## 5. Acceptance Criteria

- **AC-001**: Given a page that is already bookmarked, When the user opens the extension, Then a "Re-organize" button is visible below the "Already saved in" path.
- **AC-002**: Given a page that is already bookmarked, When the user clicks "Re-organize", Then the AI is called and a new folder suggestion is shown with Accept/Decline buttons.
- **AC-003**: Given a pending re-organize suggestion, When the user clicks "Accept", Then `moveBookmark` is called (not `createBookmark`) and the bookmark is moved to the new folder.
- **AC-004**: Given a pending re-organize suggestion, When the user clicks "Accept", Then `existingBookmarkPath` updates to the new folder path and `pendingSuggestion` is cleared.
- **AC-005**: Given a page that is already bookmarked, When the user views the "Already saved in" section, Then a chevron icon is visible next to the folder path indicating it can be expanded/collapsed.
- **AC-006**: Given a page that is already bookmarked, When the user opens the extension, Then the card header reads "Already bookmarked" (not "You're visiting").
- **AC-007**: Given a page that is NOT bookmarked, When the user opens the extension, Then the card header reads "You're visiting" (unchanged behavior).
- **AC-008**: The `.current-page-card-label` font size is `var(--font-size-lg)` (14px).
- **AC-009**: After a successful re-organize move, the card returns to the "Already bookmarked" state with the updated folder path and the "Re-organize" button is available again.

## 6. Test Automation Strategy

- **Test Levels**: Manual testing in Chrome with `npm run build` + Load Unpacked
- **Test Data Management**: Use real Chrome bookmarks (create test bookmarks, navigate to their URLs, verify card behavior)
- **Scenarios**:
  1. Open extension on unbookmarked page: "You're visiting" header, "Organize this page" button
  2. Open extension on bookmarked page: "Already bookmarked" header, "Already saved in" path (collapsed), "Re-organize" button
  3. Click "Re-organize": AI runs, suggestion appears with Accept/Decline
  4. Accept suggestion: bookmark moves, path updates, returns to "Already bookmarked" state
  5. Decline suggestion: returns to "Already bookmarked" state with original path
  6. Toggle expand/collapse on "Already saved in" path: chevron rotates, bookmark title shows/hides

## 7. Rationale & Context

**Re-organize**: Users frequently discover that their initial bookmarking was in the wrong folder. Forcing them to manually move bookmarks defeats the purpose of an AI organizer. Allowing re-organize leverages the existing AI pipeline and the already-implemented `moveBookmark` service function.

**Expand/collapse icon**: The `FolderTreeGroup` component already renders a chevron, but when `defaultExpanded={true}` is set (current behavior for "Already saved in"), the collapsed state is never seen and the tree feels static. Defaulting to collapsed makes the chevron meaningful and saves vertical space.

**Adaptive header**: "You're visiting" is misleading when the page is already saved. "Already bookmarked" sets the right expectation immediately.

**Label size**: The current `--font-size-sm` (11px) label is too small for the primary identifier on the card. Increasing to `--font-size-lg` (14px) makes it a clear section title.

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001**: Chrome Bookmarks API — `chrome.bookmarks.move()` for re-organize, `chrome.bookmarks.search()` for finding existing bookmarks.

### Third-Party Services
- **SVC-001**: AI Provider (Gemini/OpenAI/Anthropic/OpenRouter) — Called to generate folder suggestion during re-organize. Same flow as new bookmark organize.

### Technology Platform Dependencies
- **PLT-001**: Chrome Manifest V3 — Extension popup context, `chrome.bookmarks` API requires `bookmarks` permission (already declared).

## 9. Examples & Edge Cases

### Edge Case: Bookmark moved externally

```
User bookmarks a page, then manually moves it in Chrome's bookmark manager.
Next time they open MarkMind on that page:
- findBookmarkByUrl still finds it (searches by URL, not folder)
- existingBookmarkPath resolves from the NEW parentId
- "Already bookmarked" shows the updated path
No special handling needed — the existing flow already reads parentId at runtime.
```

### Edge Case: Bookmark deleted externally during re-organize

```
User clicks "Re-organize", AI returns suggestion.
Meanwhile, user deletes the bookmark from Chrome's bookmark manager.
User clicks "Accept" → moveBookmark is called with a stale bookmarkId.
chrome.bookmarks.move() will reject → catch block shows error status.
Recommendation: Show "Bookmark not found — it may have been removed" error.
```

### Edge Case: Re-organize suggests same folder

```
AI suggests the same folder the bookmark is already in.
moveBookmark is still called (Chrome handles no-op moves gracefully).
User sees the same path after accept — no error, but feels redundant.
Recommendation: Detect same-folder and show "Already in the best folder!" message
instead of calling moveBookmark. Compare existingBookmarkPath with suggestion folderPath.
```

### Flow: Re-organize sequence

```
1. User opens extension on bookmarked page
2. Card shows: "Already bookmarked" header + "Already saved in" tree (collapsed) + "Re-organize" button
3. User clicks "Re-organize"
4. handleOrganizePage runs → skips the existingBookmark early-return → calls AI
5. AI returns folderPath → setPendingSuggestion
6. Card shows: Accept / Decline buttons (same as new bookmark flow)
7a. Accept → moveBookmark(existingBookmarkId, targetFolderId) → update existingBookmarkPath
7b. Decline → clear pendingSuggestion → back to step 2
```

## 10. Validation Criteria

| # | Criterion | Pass Condition |
|---|-----------|---------------|
| 1 | Re-organize button visible | Bookmarked page shows "Re-organize" below tree path |
| 2 | AI called on re-organize | Network request to AI provider visible in DevTools |
| 3 | Bookmark moved (not duplicated) | After accept, `chrome.bookmarks.search({url})` returns exactly 1 result in the new folder |
| 4 | Chevron visible | "Already saved in" section shows ArrowRightIcon chevron |
| 5 | Expand/collapse works | Clicking chevron toggles bookmark title visibility |
| 6 | Header adapts | "Already bookmarked" for saved pages, "You're visiting" for unsaved |
| 7 | Label size increased | Computed font-size of `.current-page-card-label` is 14px |
| 8 | No duplicate bookmarks | Re-organize never creates a second bookmark for the same URL |

## 11. Related Specifications / Further Reading

- [spec-design-merge-bulk-organize-review-screens.md](/spec/spec-design-merge-bulk-organize-review-screens.md) — Related bulk organize UX patterns
- [CLAUDE.md](/CLAUDE.md) — Project architecture rules and code patterns
- [Chrome Bookmarks API](https://developer.chrome.com/docs/extensions/reference/api/bookmarks) — `move()`, `search()`, `create()`
