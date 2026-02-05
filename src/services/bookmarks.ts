import { type ChromeBookmarkNode } from '../types/bookmarks';

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
