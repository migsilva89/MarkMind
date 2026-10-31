import { describe, it, expect } from 'vitest';
import { listDestinationFolders, scopeFolderDataToDestination, getDestinationSubtreeIds, formatDestinationLabel } from './destination';
import { type ChromeBookmarkNode } from '../types/bookmarks';

const TREE: ChromeBookmarkNode[] = [{
  id: '0', title: '', children: [
    { id: '1', title: 'Bookmarks bar', children: [
      { id: '10', title: 'Sorted', children: [
        { id: '100', title: 'Dev', children: [
          { id: '1000', title: 'Frontend', children: [] },
        ] },
        { id: '101', title: 'AI/ML', children: [] },
        { id: '102', title: 'a bookmark', url: 'https://example.com' },
      ] },
      { id: '11', title: 'Sorted', children: [
        { id: '110', title: 'Elsewhere', children: [] },
      ] },
    ] },
    { id: '4', title: 'Managed', unmodifiable: 'managed', children: [
      { id: '40', title: 'Company', unmodifiable: 'managed', children: [] },
    ] },
  ],
}];

describe('listDestinationFolders', () => {
  it('lists writable folders in tree order, with escaped paths and parents', () => {
    expect(listDestinationFolders(TREE)).toEqual([
      { id: '1', parentId: null, path: 'Bookmarks bar' },
      { id: '10', parentId: '1', path: 'Bookmarks bar/Sorted' },
      { id: '100', parentId: '10', path: 'Bookmarks bar/Sorted/Dev' },
      { id: '1000', parentId: '100', path: 'Bookmarks bar/Sorted/Dev/Frontend' },
      { id: '101', parentId: '10', path: 'Bookmarks bar/Sorted/AI\\/ML' },
      { id: '11', parentId: '1', path: 'Bookmarks bar/Sorted' },
      { id: '110', parentId: '11', path: 'Bookmarks bar/Sorted/Elsewhere' },
    ]);
  });

  it('leaves out the synthetic root, bookmarks and managed folders', () => {
    const ids = listDestinationFolders(TREE).map(folder => folder.id);
    expect(ids).not.toContain('0');
    expect(ids).not.toContain('102');
    expect(ids).not.toContain('4');
    expect(ids).not.toContain('40');
  });
});

describe('scopeFolderDataToDestination', () => {
  const folders = listDestinationFolders(TREE);

  it('returns relative paths for the destination subtree only, by folder ID', () => {
    const scope = scopeFolderDataToDestination('10', folders);
    // The same-named "Sorted" sibling (id 11) and its child never leak in
    expect(scope?.pathToIdMap).toEqual({ Dev: '100', 'Dev/Frontend': '1000', 'AI\\/ML': '101' });
    expect(scope?.defaultParentId).toBe('10');
    expect(scope?.folderTree).toBe('└── Dev\n    └── Frontend\n└── AI/ML');
  });

  it('gives an empty tree for an empty destination', () => {
    expect(scopeFolderDataToDestination('1000', folders)).toEqual({ folderTree: '', pathToIdMap: {}, defaultParentId: '1000' });
  });

  it('returns null for a missing or read-only destination', () => {
    expect(scopeFolderDataToDestination('gone', folders)).toBeNull();
    expect(scopeFolderDataToDestination('40', folders)).toBeNull();
  });
});

describe('getDestinationSubtreeIds', () => {
  it('includes the destination and all its descendants, nothing else', () => {
    expect([...getDestinationSubtreeIds('10', listDestinationFolders(TREE))].sort()).toEqual(['10', '100', '1000', '101']);
  });
});

describe('formatDestinationLabel', () => {
  it('shows a readable path, unescaping slashes in folder names', () => {
    expect(formatDestinationLabel('Bookmarks bar/Sorted/AI\\/ML')).toBe('Bookmarks bar / Sorted / AI/ML');
  });
});
