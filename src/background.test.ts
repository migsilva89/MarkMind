import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { organizeBookmarks } from './services/ai/bulkOrganize';
import { type OrganizeSession, type BulkOrganizeResult } from './types/organize';

vi.mock('./services/ai/bulkOrganize', () => ({ organizeBookmarks: vi.fn() }));

type MessageListener = (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean;

const RESULT: BulkOrganizeResult = {
  folderPlan: { folders: [{ path: 'Dev', description: '', isNew: true, isExcluded: false }], summary: 'ok' },
  assignments: [],
};

const START_PAYLOAD = {
  serviceId: 'custom',
  modelId: 'qwen2.5:3b',
  bookmarks: [],
  folderTree: '',
  pathToIdMap: {},
  defaultParentId: '1',
};

let storage: Record<string, unknown>;
let sentMessages: { type: string; payload?: unknown }[];
let messageListener: MessageListener;
let clearAlarm: ReturnType<typeof vi.fn>;

const flush = async (): Promise<void> => {
  for (let index = 0; index < 10; index += 1) await new Promise(resolve => setTimeout(resolve, 0));
};

const sendToBackground = (message: unknown): void => {
  messageListener(message, {}, () => {});
};

const storedSession = (): OrganizeSession => storage.organizeSession as OrganizeSession;

beforeEach(async () => {
  storage = {};
  sentMessages = [];
  clearAlarm = vi.fn();
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn(async (keys: string[]) => Object.fromEntries(keys.map(key => [key, storage[key]]))),
        set: vi.fn(async (values: Record<string, unknown>) => { Object.assign(storage, values); }),
        remove: vi.fn(async () => {}),
      },
    },
    runtime: {
      onMessage: { addListener: (listener: MessageListener) => { messageListener = listener; } },
      sendMessage: vi.fn(async (message: { type: string; payload?: unknown }) => { sentMessages.push(message); }),
    },
    alarms: { create: vi.fn(), clear: clearAlarm, onAlarm: { addListener: vi.fn() } },
  });
  vi.resetModules();
  await import('./background');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(organizeBookmarks).mockReset();
});

describe('background organize run', () => {
  it('delivers the result even if a stale popup write changed the stored status', async () => {
    // Bug: a late "selecting" write made the background think the run was
    // cancelled — it threw the result away and never told the popup.
    storage.organizeSession = { status: 'selecting' };
    vi.mocked(organizeBookmarks).mockResolvedValue(RESULT);

    sendToBackground({ type: 'START_ORGANIZE', payload: START_PAYLOAD });
    await flush();

    expect(sentMessages.map(message => message.type)).toContain('ORGANIZE_COMPLETE');
    expect(storedSession().status).toBe('reviewing_assignments');
  });

  it('stops the run on cancel: aborts the AI call and keeps the cancelled state', async () => {
    let receivedSignal: AbortSignal | undefined;
    vi.mocked(organizeBookmarks).mockImplementation((...args: unknown[]) => {
      receivedSignal = args[7] as AbortSignal | undefined;
      return new Promise((_resolve, reject) => {
        receivedSignal?.addEventListener('abort', () => reject(receivedSignal?.reason));
      });
    });
    storage.organizeSession = { status: 'organizing' };

    sendToBackground({ type: 'START_ORGANIZE', payload: START_PAYLOAD });
    await flush();
    storage.organizeSession = { status: 'selecting' };
    sendToBackground({ type: 'CANCEL_ORGANIZE' });
    await flush();

    expect(receivedSignal?.aborted).toBe(true);
    expect(sentMessages.map(message => message.type)).not.toContain('ORGANIZE_ERROR');
    expect(storedSession().status).toBe('selecting');
    expect(clearAlarm).toHaveBeenCalled();
  });

  it('aborts a previous run when a new one starts', async () => {
    const signals: AbortSignal[] = [];
    vi.mocked(organizeBookmarks).mockImplementation((...args: unknown[]) => {
      signals.push(args[7] as AbortSignal);
      return new Promise(() => {});
    });

    sendToBackground({ type: 'START_ORGANIZE', payload: START_PAYLOAD });
    sendToBackground({ type: 'START_ORGANIZE', payload: START_PAYLOAD });
    await flush();

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it('without a destination, passes the full folder data to the AI (original behavior)', async () => {
    vi.mocked(organizeBookmarks).mockResolvedValue(RESULT);
    const fullPayload = { ...START_PAYLOAD, folderTree: '├── Bookmarks bar', pathToIdMap: { 'Bookmarks bar': '1' } };

    sendToBackground({ type: 'START_ORGANIZE', payload: fullPayload });
    await flush();

    const args = vi.mocked(organizeBookmarks).mock.calls[0];
    expect(args[3]).toBe('├── Bookmarks bar');
    expect(args[4]).toEqual({ 'Bookmarks bar': '1' });
    expect(args[8]).toBeUndefined();
    expect(storedSession().destinationFolderId).toBeNull();
  });

  it('with a destination, shows the AI only that subtree but keeps the full data in the session', async () => {
    vi.mocked(organizeBookmarks).mockResolvedValue(RESULT);
    const destinationFolders = [
      { id: '1', parentId: null, path: 'Bookmarks bar' },
      { id: '10', parentId: '1', path: 'Bookmarks bar/Work' },
      { id: '11', parentId: '1', path: 'Bookmarks bar/Sorted' },
      { id: '12', parentId: '11', path: 'Bookmarks bar/Sorted/Dev' },
    ];
    const fullMap = { 'Bookmarks bar': '1', 'Bookmarks bar/Work': '10', 'Bookmarks bar/Sorted': '11', 'Bookmarks bar/Sorted/Dev': '12' };

    sendToBackground({
      type: 'START_ORGANIZE',
      payload: { ...START_PAYLOAD, folderTree: 'full tree', pathToIdMap: fullMap, destinationFolderId: '11', destinationFolders },
    });
    await flush();

    const args = vi.mocked(organizeBookmarks).mock.calls[0];
    expect(args[3]).toBe('└── Dev');
    expect(args[4]).toEqual({ Dev: '12' });
    expect(args[8]).toBe('Bookmarks bar / Sorted');
    expect(storedSession()).toMatchObject({
      status: 'reviewing_assignments',
      folderTree: 'full tree',
      pathToIdMap: fullMap,
      destinationFolderId: '11',
    });
  });

  it('fails clearly, without calling the AI, when the destination is not in the scanned folders', async () => {
    sendToBackground({
      type: 'START_ORGANIZE',
      payload: { ...START_PAYLOAD, destinationFolderId: 'gone', destinationFolders: [] },
    });
    await flush();

    expect(organizeBookmarks).not.toHaveBeenCalled();
    expect(sentMessages.map(message => message.type)).toContain('ORGANIZE_ERROR');
    expect(storedSession().status).toBe('error');
  });
});
