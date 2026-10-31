import { vi } from 'vitest';
import { type ChromeBookmarkNode } from '../types/bookmarks';

// In-memory stand-in for chrome.bookmarks with the same callback API and
// move/create semantics (append to the end of the new parent). Lets tests run
// the real move logic against a synthetic tree — never the user's bookmarks.

export interface FakeNodeSpec {
  id: string;
  title: string;
  url?: string;
  unmodifiable?: string;
  children?: FakeNodeSpec[];
}

interface FakeNode {
  id: string;
  parentId?: string;
  title: string;
  url?: string;
  unmodifiable?: string;
  childIds: string[];
}

export interface FakeBookmarks {
  getTree: () => ChromeBookmarkNode[];
  parentOf: (id: string) => string | undefined;
  childTitles: (id: string) => string[];
  childIds: (id: string) => string[];
  indexOf: (id: string) => number;
  findChildFolder: (parentId: string, title: string) => string | undefined;
  remove: (id: string) => void;
  // A change made outside MarkMind (e.g. the user in Chrome); not recorded in moveCalls
  relocate: (id: string, parentId: string) => void;
  moveCalls: { id: string; parentId: string }[];
}

export const installFakeBookmarks = (root: FakeNodeSpec): FakeBookmarks => {
  const nodes = new Map<string, FakeNode>();
  let nextId = 9000;
  const moveCalls: { id: string; parentId: string }[] = [];
  const runtime: { lastError?: { message: string } } = {};

  const add = (spec: FakeNodeSpec, parentId?: string): void => {
    nodes.set(spec.id, {
      id: spec.id,
      parentId,
      title: spec.title,
      url: spec.url,
      unmodifiable: spec.unmodifiable,
      childIds: (spec.children ?? []).map(child => child.id),
    });
    (spec.children ?? []).forEach(child => add(child, spec.id));
  };
  add(root);

  const toNode = (id: string): ChromeBookmarkNode => {
    const node = nodes.get(id)!;
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    return {
      id: node.id,
      parentId: node.parentId,
      index: parent ? parent.childIds.indexOf(node.id) : undefined,
      title: node.title,
      url: node.url,
      unmodifiable: node.unmodifiable,
      children: node.url ? undefined : node.childIds.map(toNode),
    };
  };

  const respond = <T>(callback: (value: T) => void, value: T, error?: string): void => {
    runtime.lastError = error ? { message: error } : undefined;
    callback(value);
    runtime.lastError = undefined;
  };

  const detach = (id: string): void => {
    const node = nodes.get(id)!;
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.childIds = parent.childIds.filter(childId => childId !== id);
  };

  const bookmarks = {
    getTree: (callback: (tree: ChromeBookmarkNode[]) => void) => respond(callback, [toNode(root.id)]),
    get: (id: string, callback: (results: ChromeBookmarkNode[]) => void) => {
      if (!nodes.has(id)) return respond(callback, [], `Can't find bookmark for id.`);
      respond(callback, [toNode(id)]);
    },
    create: (details: { parentId: string; title: string; url?: string }, callback: (node: ChromeBookmarkNode) => void) => {
      const parent = nodes.get(details.parentId);
      if (!parent || parent.url) return respond(callback, undefined as unknown as ChromeBookmarkNode, `Can't find parent bookmark for id.`);
      if (parent.unmodifiable) return respond(callback, undefined as unknown as ChromeBookmarkNode, `Can't modify managed bookmarks.`);
      const id = String(nextId++);
      nodes.set(id, { id, parentId: parent.id, title: details.title, url: details.url, childIds: [] });
      parent.childIds.push(id);
      respond(callback, toNode(id));
    },
    move: (id: string, destination: { parentId: string }, callback: (node: ChromeBookmarkNode) => void) => {
      const node = nodes.get(id);
      const parent = nodes.get(destination.parentId);
      if (!node || !parent || parent.url) return respond(callback, undefined as unknown as ChromeBookmarkNode, `Can't find bookmark for id.`);
      if (parent.unmodifiable || node.unmodifiable) return respond(callback, undefined as unknown as ChromeBookmarkNode, `Can't modify managed bookmarks.`);
      moveCalls.push({ id, parentId: parent.id });
      detach(id);
      node.parentId = parent.id;
      parent.childIds.push(id);
      respond(callback, toNode(id));
    },
    remove: (id: string, callback: () => void) => {
      detach(id);
      nodes.delete(id);
      respond(callback, undefined);
    },
  };

  vi.stubGlobal('chrome', {
    bookmarks,
    runtime,
    storage: { local: { get: vi.fn(async () => ({})), set: vi.fn(async () => {}) } },
  });

  return {
    getTree: () => [toNode(root.id)],
    parentOf: id => nodes.get(id)?.parentId,
    childTitles: id => (nodes.get(id)?.childIds ?? []).map(childId => nodes.get(childId)!.title),
    childIds: id => [...(nodes.get(id)?.childIds ?? [])],
    indexOf: id => {
      const parentId = nodes.get(id)?.parentId;
      return parentId ? nodes.get(parentId)!.childIds.indexOf(id) : -1;
    },
    findChildFolder: (parentId, title) =>
      nodes.get(parentId)?.childIds.find(childId => {
        const child = nodes.get(childId)!;
        return !child.url && child.title === title;
      }),
    remove: id => {
      detach(id);
      nodes.delete(id);
    },
    relocate: (id, parentId) => {
      detach(id);
      nodes.get(id)!.parentId = parentId;
      nodes.get(parentId)!.childIds.push(id);
    },
    moveCalls,
  };
};
