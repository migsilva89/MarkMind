import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyAssignments, buildLiveDestinationScope } from './applyAssignments';
import { organizeBookmarks } from './ai/bulkOrganize';
import { callProvider, getApiKey } from './ai/providerUtils';
import { buildFullIdToPathMapFromTree, getFolderDataForAI } from '../utils/folders';
import { flattenAllBookmarks } from '../utils/bookmarkScanner';
import { listDestinationFolders, scopeFolderDataToDestination, getDestinationSubtreeIds, formatDestinationLabel } from '../utils/destination';
import { installFakeBookmarks, type FakeBookmarks, type FakeNodeSpec } from '../test/fakeBookmarks';
import { type BookmarkAssignment, type CompactBookmark } from '../types/organize';

vi.mock('./ai/providerUtils', () => ({ callProvider: vi.fn(), getApiKey: vi.fn() }));

// Synthetic tree. Bookmark titles start with "keep-" (never selected) or
// "pick-" (selected for organizing).
const TREE: FakeNodeSpec = {
  id: '0', title: '', children: [
    { id: '1', title: 'Bookmarks bar', children: [
      { id: '10', title: 'Work', children: [
        { id: '101', title: 'keep-work-1', url: 'https://keep1.example' },
        { id: '100', title: 'pick-github', url: 'https://github.com' },
        { id: '102', title: 'keep-work-2', url: 'https://keep2.example' },
      ] },
      { id: '11', title: 'Sorted', children: [
        { id: '111', title: 'keep-in-sorted', url: 'https://keep3.example' },
        { id: '110', title: 'Inbox', children: [
          { id: '1100', title: 'Existing Dev', children: [] },
        ] },
      ] },
      // Same name as the destination's parent — must never receive moves
      { id: '14', title: 'Sorted', children: [
        { id: '140', title: 'Inbox', children: [] },
      ] },
      { id: '12', title: 'pick-loose-docs', url: 'https://docs.example' },
      { id: '13', title: 'keep-loose', url: 'https://keep4.example' },
    ] },
    { id: '2', title: 'Other bookmarks', children: [
      { id: '20', title: 'Reading', children: [
        { id: '200', title: 'pick-article', url: 'https://news.example' },
      ] },
    ] },
    { id: '4', title: 'Managed', unmodifiable: 'managed', children: [
      // Chrome marks every node under a managed folder as unmodifiable
      { id: '40', title: 'Company', unmodifiable: 'managed', children: [] },
    ] },
  ],
};

const SELECTED_IDS = ['100', '12', '200'];

let fake: FakeBookmarks;

const scan = async () => {
  const tree = fake.getTree();
  const allBookmarks = flattenAllBookmarks(tree, buildFullIdToPathMapFromTree(tree));
  const folderData = await getFolderDataForAI();
  const destinationFolders = listDestinationFolders(tree);
  return { allBookmarks, folderData, destinationFolders };
};

const mockAIResponse = (response: object): void => {
  vi.mocked(callProvider).mockResolvedValue(JSON.stringify(response));
};

const snapshotUnselected = (bookmarks: CompactBookmark[]) =>
  bookmarks
    .filter(bookmark => !SELECTED_IDS.includes(bookmark.id))
    .map(bookmark => ({ id: bookmark.id, parentId: fake.parentOf(bookmark.id) }));

const assignment = (overrides: Partial<BookmarkAssignment>): BookmarkAssignment => ({
  bookmarkId: '100',
  bookmarkTitle: 'pick-github',
  bookmarkUrl: 'https://github.com',
  currentPath: 'Bookmarks bar/Work',
  suggestedPath: 'Dev',
  suggestedFolderId: null,
  isNewFolder: true,
  isApproved: true,
  ...overrides,
});

beforeEach(() => {
  fake = installFakeBookmarks(TREE);
  vi.mocked(getApiKey).mockResolvedValue('test-key');
  vi.mocked(callProvider).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('organize into a nested destination folder', () => {
  it('moves only selected bookmarks, into groups whose parent is the destination', async () => {
    const { allBookmarks, destinationFolders } = await scan();
    const unselectedBefore = snapshotUnselected(allBookmarks);
    const selected = allBookmarks.filter(bookmark => SELECTED_IDS.includes(bookmark.id));

    // Destination: "Bookmarks bar/Sorted/Inbox" (nested two levels down)
    const scope = scopeFolderDataToDestination('110', destinationFolders)!;
    expect(scope.pathToIdMap).toEqual({ 'Existing Dev': '1100' });

    // The AI also tries to assign an unselected bookmark (101) and an unknown ID.
    mockAIResponse({
      folders: [
        { path: 'Dev', description: 'Code', isNew: true },
        { path: 'Existing Dev', description: 'Docs', isNew: false },
        { path: 'Reading/News', description: 'News', isNew: true },
      ],
      assignments: [
        { bookmarkId: '100', suggestedPath: 'Dev' },
        { bookmarkId: '12', suggestedPath: 'Existing Dev' },
        { bookmarkId: '200', suggestedPath: 'Reading/News' },
        { bookmarkId: '101', suggestedPath: 'Dev' },
        { bookmarkId: '999', suggestedPath: 'Dev' },
      ],
      summary: 'ok',
    });

    const result = await organizeBookmarks(
      'openai', 'test-model', selected, scope.folderTree, scope.pathToIdMap,
      4096, undefined, undefined, formatDestinationLabel('Bookmarks bar/Sorted/Inbox')
    );

    // Preview only lists selected bookmarks
    expect(result.assignments.map(item => item.bookmarkId).sort()).toEqual(['100', '12', '200']);
    expect(result.assignments.find(item => item.bookmarkId === '12')?.suggestedFolderId).toBe('1100');

    // The AI saw only the destination's contents, never the rest of the tree
    const userPrompt = vi.mocked(callProvider).mock.calls[0][3];
    expect(userPrompt).toContain('Bookmarks bar / Sorted / Inbox');
    const structureSection = userPrompt.split('## CURRENT FOLDER STRUCTURE (inside the destination)')[1];
    expect(structureSection).toContain('Existing Dev');
    expect(structureSection).not.toMatch(/Work|Reading|Other bookmarks|Managed/);

    const applied = await applyAssignments({
      assignments: result.assignments,
      allowedBookmarkIds: new Set(SELECTED_IDS),
      pathToIdMap: scope.pathToIdMap,
      defaultParentId: scope.defaultParentId,
      allowedFolderIds: getDestinationSubtreeIds('110', destinationFolders),
    });

    expect(applied).toMatchObject({ appliedCount: 3, skippedCount: 0 });

    const devId = fake.findChildFolder('110', 'Dev')!;
    const readingId = fake.findChildFolder('110', 'Reading')!;
    const newsId = fake.findChildFolder(readingId, 'News')!;
    expect(fake.parentOf(devId)).toBe('110');
    expect(fake.parentOf(readingId)).toBe('110');
    expect(fake.parentOf('100')).toBe(devId);
    expect(fake.parentOf('12')).toBe('1100');
    expect(fake.parentOf('200')).toBe(newsId);

    // Nothing was created outside the destination, nothing else moved
    expect(fake.childTitles('1')).toEqual(['Work', 'Sorted', 'Sorted', 'keep-loose']);
    expect(fake.childTitles('140')).toEqual([]);
    expect(fake.moveCalls.map(call => call.id).sort()).toEqual(['100', '12', '200']);
    expect(snapshotUnselected(allBookmarks)).toEqual(unselectedBefore);
  });

  it('keeps non-selected bookmarks in their folder and in the same relative order', async () => {
    const { destinationFolders } = await scan();
    const scope = scopeFolderDataToDestination('110', destinationFolders)!;

    await applyAssignments({
      assignments: [assignment({ bookmarkId: '100', suggestedPath: 'Dev' })],
      allowedBookmarkIds: new Set(['100']),
      pathToIdMap: scope.pathToIdMap,
      defaultParentId: scope.defaultParentId,
      allowedFolderIds: getDestinationSubtreeIds('110', destinationFolders),
    });

    // Not moved means same parent and same relative order. Chrome renumbers the
    // indexes of siblings after a node leaves, so exact indexes are not promised.
    // "Work" lost the moved bookmark; the two others kept their order.
    expect(fake.childTitles('10')).toEqual(['keep-work-1', 'keep-work-2']);
    // A sibling before the moved one is not renumbered.
    expect(fake.indexOf('101')).toBe(0);
    // Folders nothing left from are unchanged, indexes included.
    expect(fake.childTitles('1')).toEqual(['Work', 'Sorted', 'Sorted', 'pick-loose-docs', 'keep-loose']);
    expect(fake.indexOf('13')).toBe(4);
    expect(fake.parentOf('111')).toBe('11');
  });

  it('never moves a bookmark outside the selection, even if the stored review lists it', async () => {
    const { destinationFolders } = await scan();
    const scope = scopeFolderDataToDestination('110', destinationFolders)!;

    const applied = await applyAssignments({
      assignments: [
        assignment({ bookmarkId: '100' }),
        assignment({ bookmarkId: '101', bookmarkTitle: 'keep-work-1' }),
      ],
      allowedBookmarkIds: new Set(['100']),
      pathToIdMap: scope.pathToIdMap,
      defaultParentId: scope.defaultParentId,
      allowedFolderIds: getDestinationSubtreeIds('110', destinationFolders),
    });

    expect(applied).toMatchObject({ appliedCount: 1, skippedCount: 1 });
    expect(fake.parentOf('101')).toBe('10');
    expect(fake.moveCalls.map(call => call.id)).toEqual(['100']);
  });

  it('re-resolves a target folder outside the destination to a folder inside it', async () => {
    const { destinationFolders } = await scan();
    const scope = scopeFolderDataToDestination('110', destinationFolders)!;

    await applyAssignments({
      // A stale or tampered suggestion pointing at "Bookmarks bar/Work" and at
      // the same-named "Sorted/Inbox" sibling
      assignments: [
        assignment({ bookmarkId: '100', suggestedPath: 'Work', suggestedFolderId: '10' }),
        assignment({ bookmarkId: '12', suggestedPath: 'Docs', suggestedFolderId: '140' }),
      ],
      allowedBookmarkIds: new Set(['100', '12']),
      pathToIdMap: scope.pathToIdMap,
      defaultParentId: scope.defaultParentId,
      allowedFolderIds: getDestinationSubtreeIds('110', destinationFolders),
    });

    const workInsideId = fake.findChildFolder('110', 'Work')!;
    expect(fake.parentOf('100')).toBe(workInsideId);
    expect(fake.parentOf('12')).toBe(fake.findChildFolder('110', 'Docs'));
    expect(fake.childTitles('140')).toEqual([]);
  });

  it('puts a bookmark with an empty suggested path directly in the destination', async () => {
    const { destinationFolders } = await scan();
    const scope = scopeFolderDataToDestination('110', destinationFolders)!;

    await applyAssignments({
      assignments: [assignment({ bookmarkId: '100', suggestedPath: '' })],
      allowedBookmarkIds: new Set(['100']),
      pathToIdMap: scope.pathToIdMap,
      defaultParentId: scope.defaultParentId,
      allowedFolderIds: getDestinationSubtreeIds('110', destinationFolders),
    });

    expect(fake.parentOf('100')).toBe('110');
    expect(fake.childTitles('110')).toEqual(['Existing Dev', 'pick-github']);
  });

  it('works when a selected bookmark is already inside the destination', async () => {
    const { destinationFolders } = await scan();
    const scope = scopeFolderDataToDestination('11', destinationFolders)!;

    const applied = await applyAssignments({
      assignments: [assignment({ bookmarkId: '111', bookmarkTitle: 'keep-in-sorted', suggestedPath: 'Inbox/Existing Dev', suggestedFolderId: '1100' })],
      allowedBookmarkIds: new Set(['111']),
      pathToIdMap: scope.pathToIdMap,
      defaultParentId: scope.defaultParentId,
      allowedFolderIds: getDestinationSubtreeIds('11', destinationFolders),
    });

    expect(applied.appliedCount).toBe(1);
    expect(fake.parentOf('111')).toBe('1100');
  });

  it('skips rejected moves (review checkboxes) and leaves those bookmarks alone', async () => {
    const { destinationFolders } = await scan();
    const scope = scopeFolderDataToDestination('110', destinationFolders)!;

    const applied = await applyAssignments({
      assignments: [
        assignment({ bookmarkId: '100' }),
        assignment({ bookmarkId: '12', isApproved: false }),
      ],
      allowedBookmarkIds: new Set(['100', '12']),
      pathToIdMap: scope.pathToIdMap,
      defaultParentId: scope.defaultParentId,
      allowedFolderIds: getDestinationSubtreeIds('110', destinationFolders),
    });

    expect(applied).toMatchObject({ appliedCount: 1, skippedCount: 1 });
    expect(fake.parentOf('12')).toBe('1');
  });
});

describe('default flow (no destination) is unchanged', () => {
  it('organizes all bookmarks using existing folders anywhere and new folders in the first root', async () => {
    const { allBookmarks, folderData } = await scan();

    mockAIResponse({
      folders: [
        { path: 'Work', description: '', isNew: false },
        { path: 'Reading', description: '', isNew: false },
        { path: 'Tools', description: '', isNew: true },
      ],
      assignments: allBookmarks.map(bookmark => ({
        bookmarkId: bookmark.id,
        suggestedPath: bookmark.url.includes('news') ? 'Reading' : bookmark.url.includes('github') ? 'Work' : 'Tools',
      })),
      summary: 'ok',
    });

    const result = await organizeBookmarks(
      'openai', 'test-model', allBookmarks, folderData.textTree, folderData.pathToIdMap, 4096
    );
    const userPrompt = vi.mocked(callProvider).mock.calls[0][3];
    expect(userPrompt).not.toContain('DESTINATION FOLDER');
    expect(userPrompt).toContain('Other bookmarks');

    const applied = await applyAssignments({
      assignments: result.assignments,
      allowedBookmarkIds: new Set(allBookmarks.map(bookmark => bookmark.id)),
      pathToIdMap: folderData.pathToIdMap,
      defaultParentId: folderData.defaultParentId,
    });

    expect(applied.appliedCount).toBe(allBookmarks.length);
    const toolsId = fake.findChildFolder('1', 'Tools')!;
    expect(fake.parentOf(toolsId)).toBe('1');
    expect(fake.parentOf('100')).toBe('10');
    expect(fake.parentOf('200')).toBe('20');
    expect(fake.parentOf('12')).toBe(toolsId);
  });

  it('with a partial selection, still moves only the selected bookmarks', async () => {
    const { allBookmarks, folderData } = await scan();
    const unselectedBefore = snapshotUnselected(allBookmarks);

    const applied = await applyAssignments({
      assignments: [
        assignment({ bookmarkId: '12', suggestedPath: 'Reading', suggestedFolderId: '20' }),
        assignment({ bookmarkId: '13', suggestedPath: 'Reading', suggestedFolderId: '20' }),
      ],
      allowedBookmarkIds: new Set(SELECTED_IDS),
      pathToIdMap: folderData.pathToIdMap,
      defaultParentId: folderData.defaultParentId,
    });

    expect(applied).toMatchObject({ appliedCount: 1, skippedCount: 1 });
    expect(fake.parentOf('12')).toBe('20');
    expect(snapshotUnselected(allBookmarks)).toEqual(unselectedBefore);
  });
});

describe('buildLiveDestinationScope (state at apply time, not at scan time)', () => {
  it('matches the scan when nothing changed', async () => {
    const { destinationFolders } = await scan();
    const live = await buildLiveDestinationScope('110');
    expect(live?.pathToIdMap).toEqual(scopeFolderDataToDestination('110', destinationFolders)?.pathToIdMap);
    expect(live?.allowedFolderIds).toEqual(getDestinationSubtreeIds('110', destinationFolders));
  });

  it('returns null for a destination deleted since the scan', async () => {
    fake.remove('110');
    expect(await buildLiveDestinationScope('110')).toBeNull();
  });

  it('returns null for a bookmark or a managed (read-only) folder', async () => {
    expect(await buildLiveDestinationScope('100')).toBeNull();
    expect(await buildLiveDestinationScope('40')).toBeNull();
  });

  it('a child folder moved out of the destination after the scan cannot receive selected bookmarks', async () => {
    // Scan-time snapshot: "Existing Dev" (1100) is inside the destination "Inbox" (110)
    const { allBookmarks, destinationFolders } = await scan();
    const unselectedBefore = snapshotUnselected(allBookmarks);
    const cachedScope = scopeFolderDataToDestination('110', destinationFolders)!;
    expect(cachedScope.pathToIdMap).toEqual({ 'Existing Dev': '1100' });
    expect(getDestinationSubtreeIds('110', destinationFolders).has('1100')).toBe(true);

    // The review was produced against that snapshot: one move with the cached
    // folder ID, one resolved only through the cached path map.
    const assignments = [
      assignment({ bookmarkId: '12', suggestedPath: 'Existing Dev', suggestedFolderId: '1100', isNewFolder: false }),
      assignment({ bookmarkId: '100', suggestedPath: 'Existing Dev/Sub', suggestedFolderId: null }),
      // Unknown / unselected IDs must still be refused
      assignment({ bookmarkId: '101', suggestedPath: 'Existing Dev', suggestedFolderId: '1100' }),
      assignment({ bookmarkId: 'not-a-bookmark', suggestedPath: 'Existing Dev', suggestedFolderId: '1100' }),
    ];

    // Before apply, the user moves "Existing Dev" out to "Other bookmarks"
    fake.relocate('1100', '2');

    const live = (await buildLiveDestinationScope('110'))!;
    expect(live.pathToIdMap).toEqual({});
    expect(live.allowedFolderIds.has('1100')).toBe(false);

    const applied = await applyAssignments({
      assignments,
      allowedBookmarkIds: new Set(['12', '100']),
      pathToIdMap: live.pathToIdMap,
      defaultParentId: live.defaultParentId,
      allowedFolderIds: live.allowedFolderIds,
    });

    expect(applied).toMatchObject({ appliedCount: 2, skippedCount: 2 });
    // The stale folder received nothing
    expect(fake.childIds('1100')).toEqual([]);
    expect(fake.moveCalls.some(call => call.parentId === '1100')).toBe(false);
    // Both bookmarks landed in a fresh "Existing Dev" created inside the destination
    const recreatedId = fake.findChildFolder('110', 'Existing Dev')!;
    expect(recreatedId).not.toBe('1100');
    expect(fake.parentOf('12')).toBe(recreatedId);
    expect(fake.parentOf(fake.parentOf('100')!)).toBe(recreatedId);
    expect(fake.moveCalls.map(call => call.id).sort()).toEqual(['100', '12']);
    expect(snapshotUnselected(allBookmarks)).toEqual(unselectedBefore);
  });

  it('the scan-time snapshot alone would have let the stale folder receive the bookmark', async () => {
    // Documents the hole the live scope closes
    const { destinationFolders } = await scan();
    fake.relocate('1100', '2');

    await applyAssignments({
      assignments: [assignment({ bookmarkId: '12', suggestedPath: 'Existing Dev', suggestedFolderId: '1100' })],
      allowedBookmarkIds: new Set(['12']),
      pathToIdMap: scopeFolderDataToDestination('110', destinationFolders)!.pathToIdMap,
      defaultParentId: '110',
      allowedFolderIds: getDestinationSubtreeIds('110', destinationFolders),
    });

    expect(fake.parentOf('12')).toBe('1100');
    expect(fake.parentOf('1100')).toBe('2');
  });
});
