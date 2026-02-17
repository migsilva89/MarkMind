import { type ChromeBookmarkNode, type FolderPathMap } from '../types/bookmarks';

export const getBookmarkTree = async (): Promise<ChromeBookmarkNode[]> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tree as ChromeBookmarkNode[]);
    });
  });
};

export const getBookmarkById = async (id: string): Promise<ChromeBookmarkNode | null> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.get(id, (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(results.length > 0 ? (results[0] as ChromeBookmarkNode) : null);
    });
  });
};

export const findBookmarkByUrl = async (url: string): Promise<ChromeBookmarkNode | null> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.search({ url }, (results) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(results.length > 0 ? (results[0] as ChromeBookmarkNode) : null);
    });
  });
};

export const createFolder = async (
  parentId: string,
  title: string
): Promise<ChromeBookmarkNode> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create({ parentId, title }, (folder) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(folder as ChromeBookmarkNode);
    });
  });
};

export const createBookmark = async (
  parentId: string,
  title: string,
  url: string
): Promise<ChromeBookmarkNode> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create({ parentId, title, url }, (bookmark) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(bookmark as ChromeBookmarkNode);
    });
  });
};

export const moveBookmark = async (
  bookmarkId: string,
  destinationFolderId: string
): Promise<ChromeBookmarkNode> => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.move(bookmarkId, { parentId: destinationFolderId }, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result as ChromeBookmarkNode);
    });
  });
};

export const createFolderPath = async (
  folderPath: string,
  pathToIdMap: FolderPathMap,
  defaultParentId: string
): Promise<string> => {
  const segments = folderPath.split('/');
  let currentParentId = defaultParentId;
  let resolvedPath = '';

  for (const segment of segments) {
    resolvedPath = resolvedPath ? `${resolvedPath}/${segment}` : segment;

    if (pathToIdMap[resolvedPath]) {
      currentParentId = pathToIdMap[resolvedPath];
      continue;
    }

    const newFolder = await createFolder(currentParentId, segment);
    currentParentId = newFolder.id;
    pathToIdMap[resolvedPath] = newFolder.id;
  }

  return currentParentId;
};
