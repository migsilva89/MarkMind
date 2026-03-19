---
title: Merge Bulk Organize Plan & Review into a Single Screen
version: 1.0
date_created: 2026-03-18
owner: Miguel Silva
tags: design, UX, bulk-organize, simplification
---

# Introduction

Currently the bulk organize flow has **two separate review screens** after the AI responds:

1. **OrganizePlan** (`reviewing_plan`) — shows proposed folders with include/exclude checkboxes
2. **OrganizeReview** (`reviewing_assignments`) — shows bookmarks grouped by folder with approve/reject checkboxes

This spec defines the changes needed to **merge these into a single screen** that shows the folder tree with bookmarks inside each folder, allowing the user to review and apply everything in one step.

## 1. Purpose & Scope

**Purpose**: Eliminate the intermediate `reviewing_plan` step. When the AI responds, skip directly to a unified review screen that shows folders **with their assigned bookmarks inside**, so the user can approve/reject at bookmark level and apply in one click.

**Scope**:
- State machine change in `OrganizeSessionStatus`
- Hook logic change in `useBulkOrganize`
- Service worker message handler update
- UI: retire `OrganizePlan` component usage, enhance `OrganizeReview` to include folder descriptions and "New" badges
- `OrganizeTab` routing update

**Out of scope**:
- Changes to the AI prompt or response format
- Changes to the scan/select flow
- Changes to the apply/complete/error flows
- Deleting OrganizePlan component files (can be done in a follow-up cleanup)

**Audience**: Developer implementing the change (AI or human).

## 2. Definitions

| Term | Definition |
|------|-----------|
| **Bulk organize** | Feature that organizes multiple bookmarks at once via AI |
| **OrganizePlan** | Current screen 1: shows proposed folder structure for approval |
| **OrganizeReview** | Current screen 2: shows bookmark-to-folder assignments for approval |
| **FolderPlan** | AI response object containing proposed folders with descriptions |
| **BookmarkAssignment** | AI response object mapping a bookmark to a suggested folder |
| **State machine** | The `OrganizeSessionStatus` type that drives which screen is shown |

## 3. Requirements, Constraints & Guidelines

### State Machine

- **REQ-001**: Remove `reviewing_plan` from the `OrganizeSessionStatus` type
- **REQ-002**: When the AI responds (`ORGANIZE_COMPLETE` message), transition directly from `organizing` to `reviewing_assignments`
- **REQ-003**: The session must still store `folderPlan` data (needed for folder descriptions and `isNew` flags)

### Hook (`useBulkOrganize`)

- **REQ-004**: Remove `handleApprovePlan` handler (no longer needed — there is no plan approval step)
- **REQ-005**: Remove `handleRejectPlan` handler (replace with a "Re-organize" action on the unified screen that goes back to `selecting`)
- **REQ-006**: Remove `handleTogglePlanFolder`, `handleToggleGroupPlanFolders`, `handleSelectAllPlanFolders`, `handleDeselectAllPlanFolders` handlers (folder-level toggling is replaced by bookmark-level toggling)
- **REQ-007**: The `ORGANIZE_COMPLETE` message handler must set status to `reviewing_assignments` (instead of `reviewing_plan`)
- **REQ-008**: The `handleApplyMoves` logic remains unchanged — it already filters by `isApproved` on assignments
- **REQ-009**: Add a `handleReOrganize` handler that resets to `selecting` status with `folderPlan: null` and `assignments: []` (same behavior as current `handleRejectPlan`)

### Session Resume

- **REQ-010**: The `resumeSession` logic in `useBulkOrganize` must handle the case where a saved session has `status: 'reviewing_plan'` (from a previous version) — treat it as `reviewing_assignments`

### UI: Enhanced OrganizeReview

- **REQ-011**: Each folder group header must show the folder **description** from `folderPlan.folders` (currently only shows the folder name)
- **REQ-012**: Each folder group header must show a **"New" badge** if the folder `isNew === true` (currently only shown on individual bookmark rows)
- **REQ-013**: The AI's `summary` text from `folderPlan.summary` must be shown at the top of the review screen
- **REQ-014**: Replace the "Start Over" button with two actions: **"Re-organize"** (goes back to `selecting` to re-run AI) and **"Start Over"** (full reset to `idle`)
- **REQ-015**: Keep existing bookmark-level toggle functionality (checkbox per bookmark, group toggle, select all, deselect all)

### OrganizeTab Routing

- **REQ-016**: Remove the `reviewing_plan` case from the `switch` statement in `OrganizeTab`
- **REQ-017**: Pass `folderPlan` to `OrganizeReview` as a new prop so it can display folder descriptions and summary

### Cleanup

- **GUD-001**: Remove `OrganizePlan` import from `OrganizeTab.tsx`
- **GUD-002**: Remove all plan-related handler props from `UseBulkOrganizeReturn` type
- **CON-001**: Do NOT delete the `OrganizePlan` component files yet — defer to a cleanup task

## 4. Interfaces & Data Contracts

### Modified Type: `OrganizeSessionStatus`

```typescript
// BEFORE
export type OrganizeSessionStatus =
  | 'idle' | 'scanning' | 'selecting' | 'organizing'
  | 'reviewing_plan' | 'reviewing_assignments'
  | 'applying' | 'completed' | 'error';

// AFTER
export type OrganizeSessionStatus =
  | 'idle' | 'scanning' | 'selecting' | 'organizing'
  | 'reviewing_assignments'
  | 'applying' | 'completed' | 'error';
```

### Modified Props: `OrganizeReviewProps`

```typescript
// BEFORE
interface OrganizeReviewProps {
  assignments: BookmarkAssignment[];
  onToggleGroupAssignments: (bookmarkIds: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleAssignment: (bookmarkId: string) => void;
  onApplyMoves: () => void;
  onReset: () => void;
}

// AFTER
interface OrganizeReviewProps {
  assignments: BookmarkAssignment[];
  folderPlan: FolderPlan | null;
  onToggleGroupAssignments: (bookmarkIds: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleAssignment: (bookmarkId: string) => void;
  onApplyMoves: () => void;
  onReOrganize: () => void;
  onReset: () => void;
}
```

### Modified Return Type: `UseBulkOrganizeReturn`

Remove these handlers:
- `handleApprovePlan`
- `handleRejectPlan`
- `handleTogglePlanFolder`
- `handleToggleGroupPlanFolders`
- `handleSelectAllPlanFolders`
- `handleDeselectAllPlanFolders`

Add this handler:
- `handleReOrganize: () => void`

### Service Worker Message Handler (unchanged)

The `ORGANIZE_COMPLETE` message payload structure remains the same. Only the resulting status changes from `reviewing_plan` to `reviewing_assignments`.

## 5. Acceptance Criteria

- **AC-001**: Given the user has selected bookmarks and clicked "Organize", When the AI responds successfully, Then the user sees a single review screen showing folders with bookmarks inside (no intermediate plan screen)
- **AC-002**: Given the review screen is shown, When the user looks at a folder group, Then they see the folder description text and a "New" badge if applicable
- **AC-003**: Given the review screen is shown, Then the AI summary text is visible at the top
- **AC-004**: Given the review screen is shown, When the user toggles individual bookmarks off and clicks "Apply", Then only the approved bookmarks are moved
- **AC-005**: Given the review screen is shown, When the user clicks "Re-organize", Then they return to the selection screen and can re-run the AI
- **AC-006**: Given the review screen is shown, When the user clicks "Start Over", Then the session resets completely to idle
- **AC-007**: Given a saved session from a previous version with `status: 'reviewing_plan'`, When the extension resumes, Then it loads as `reviewing_assignments`
- **AC-008**: Given the user closes the popup during AI analysis and reopens it, When the AI has completed, Then the user lands directly on the unified review screen

## 6. Test Automation Strategy

- **Test Levels**: Manual testing in Chrome (extension context)
- **Manual Test Checklist**:
  1. Scan bookmarks, select some, click Organize
  2. Verify loading screen appears during AI call
  3. Verify single review screen appears after AI responds (no plan screen)
  4. Verify folder descriptions and "New" badges show in group headers
  5. Verify AI summary text at top
  6. Toggle some bookmarks off, click Apply, verify only approved ones moved
  7. Test "Re-organize" button returns to selection
  8. Test "Start Over" button resets to idle
  9. Close popup during AI call, reopen, verify it resumes correctly
  10. Test with a build that previously saved a `reviewing_plan` session — verify it loads as `reviewing_assignments`

## 7. Rationale & Context

The two-screen approach was originally designed to let users first approve the folder structure, then approve individual assignments. In practice:

- Users don't want to approve folders in isolation — they want to see **which bookmarks go where**
- The folder plan screen provides limited value since the real decision is "should this bookmark go to this folder?"
- Merging the screens reduces friction: one click less to get bookmarks organized
- The bookmark-level toggle already provides sufficient granularity (if a user doesn't want a folder, they just uncheck all bookmarks in it)

## 8. Dependencies & External Integrations

### Internal Dependencies
- **INT-001**: `FolderPlan` type from `src/types/organize.ts` — used to pass folder metadata to `OrganizeReview`
- **INT-002**: Chrome Storage API — session persistence remains unchanged
- **INT-003**: Service worker message passing — message types unchanged, only resulting state differs

No external dependency changes required.

## 9. Examples & Edge Cases

### Example: Unified Review Screen Structure

```
[AI Summary: "Organized 15 bookmarks into 4 folders..."]

[Select All] [Deselect All]

v Development Tools (5)                    [New] [x]
  [x] React Documentation
  [x] TypeScript Handbook
  [x] VS Code Extensions
  [ ] GitHub Actions Guide        <-- user unchecked
  [x] MDN Web Docs

v Shopping (3)                             [x]
  [x] Amazon Wishlist
  [x] Best Buy Deals
  [x] IKEA Catalog

v AI / Learning (4)                        [New] [x]
  [x] ChatGPT
  [x] Anthropic Docs
  [x] Hugging Face
  [x] Papers With Code

v Entertainment (3)                        [x]
  [x] Netflix
  [x] Spotify
  [x] YouTube

[Apply 14 Moves]
[Re-organize]    [Start Over]
```

### Edge Cases

1. **All bookmarks in one folder unchecked**: The folder still appears in the list but with 0 count. No special handling needed — `handleApplyMoves` already filters by `isApproved`.

2. **Session from old version**: If `session.status === 'reviewing_plan'` is loaded from storage, treat as `reviewing_assignments`. The `folderPlan` and `assignments` data is already present.

3. **Empty folderPlan**: If `folderPlan` is null (shouldn't happen but defensive), show the review without descriptions — same as current behavior.

## 10. Validation Criteria

1. The `reviewing_plan` status no longer exists in the type system (TypeScript compile check)
2. OrganizeTab has no `reviewing_plan` case in its switch
3. After AI responds, user sees bookmarks grouped by folder in one screen
4. Folder descriptions from `folderPlan` are visible in group headers
5. All bookmark toggle operations work (individual, group, select all, deselect all)
6. Apply only moves approved bookmarks
7. Build succeeds with `npm run build` (no TypeScript errors)

## 11. Related Specifications / Further Reading

- [src/types/organize.ts](../src/types/organize.ts) — Type definitions
- [src/hooks/useBulkOrganize/useBulkOrganize.ts](../src/hooks/useBulkOrganize/useBulkOrganize.ts) — Core hook
- [src/components/tabs/OrganizeTab.tsx](../src/components/tabs/OrganizeTab.tsx) — Tab routing
- [src/components/OrganizeReview/OrganizeReview.tsx](../src/components/OrganizeReview/OrganizeReview.tsx) — Review component to enhance
- [src/components/OrganizePlan/OrganizePlan.tsx](../src/components/OrganizePlan/OrganizePlan.tsx) — Component being retired

### Files to Modify

| File | Change |
|------|--------|
| `src/types/organize.ts` | Remove `reviewing_plan` from status type |
| `src/hooks/useBulkOrganize/useBulkOrganize.ts` | Remove plan handlers, change `ORGANIZE_COMPLETE` target status, add `handleReOrganize`, update session resume |
| `src/hooks/useBulkOrganize/types.ts` | Update `UseBulkOrganizeReturn` type |
| `src/components/tabs/OrganizeTab.tsx` | Remove `reviewing_plan` case, pass `folderPlan` to `OrganizeReview`, remove plan handler props |
| `src/components/OrganizeReview/OrganizeReview.tsx` | Add `folderPlan` prop, show summary, show folder descriptions and "New" badges in group headers, add "Re-organize" button |
| `src/components/OrganizeReview/OrganizeReview.css` | Add styles for folder description and summary |
