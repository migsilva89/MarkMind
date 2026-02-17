import { type OrganizeSession } from '../types/organize';

export const ORGANIZE_SESSION_STORAGE_KEY = 'organizeSession';

export const getInitialSession = (): OrganizeSession => ({
  status: 'idle',
  allBookmarks: [],
  selectedFolderIds: null,
  bookmarksToOrganize: [],
  folderPlan: null,
  folderTree: '',
  batches: [],
  batchProgress: {
    totalBatches: 0,
    completedBatches: 0,
    totalBookmarks: 0,
    processedBookmarks: 0,
    failedBatches: [],
  },
  assignments: [],
  appliedCount: 0,
  skippedCount: 0,
  errorMessage: null,
  startedAt: null,
  completedAt: null,
  serviceId: '',
  pathToIdMap: {},
  defaultParentId: '',
});

export const saveOrganizeSession = async (session: OrganizeSession): Promise<void> => {
  await chrome.storage.local.set({ [ORGANIZE_SESSION_STORAGE_KEY]: session });
};

export const loadOrganizeSession = async (): Promise<OrganizeSession | null> => {
  const result = await chrome.storage.local.get([ORGANIZE_SESSION_STORAGE_KEY]);
  return result[ORGANIZE_SESSION_STORAGE_KEY] ?? null;
};

export const clearOrganizeSession = async (): Promise<void> => {
  await chrome.storage.local.remove(ORGANIZE_SESSION_STORAGE_KEY);
};
