import { type OrganizeMessage, type StartOrganizePayload } from './types/messaging';
import { type OrganizeSession } from './types/organize';
import { organizeBookmarks } from './services/ai/bulkOrganize';
import { saveOrganizeSession, loadOrganizeSession, getInitialSession } from './services/organizeSession';
import { isCancelledError } from './utils/helpers';
import { scopeFolderDataToDestination, formatDestinationLabel } from './utils/destination';

const KEEPALIVE_ALARM_NAME = 'organize-keepalive';
const KEEPALIVE_INTERVAL_MINUTES = 0.4;

// The run in progress. Cancelling aborts its in-flight AI request and stops
// further batches; starting a new run cancels the previous one.
let activeRun: AbortController | null = null;

const cancelActiveRun = (): void => {
  activeRun?.abort();
  activeRun = null;
  chrome.alarms.clear(KEEPALIVE_ALARM_NAME);
};

const notifyPopup = (type: string, payload?: unknown): void => {
  chrome.runtime.sendMessage({ type, payload }).catch(() => {
    // Popup might be closed — this is expected
  });
};

const handleStartOrganize = async (payload: StartOrganizePayload, run: AbortController): Promise<void> => {
  chrome.alarms.create(KEEPALIVE_ALARM_NAME, {
    periodInMinutes: KEEPALIVE_INTERVAL_MINUTES,
  });

  // With a destination the AI only sees that folder's subtree, with relative
  // paths, so every suggestion resolves inside it.
  const destinationFolderId = payload.destinationFolderId ?? null;
  const destinationFolders = payload.destinationFolders ?? [];
  let aiFolderTree = payload.folderTree;
  let aiPathToIdMap = payload.pathToIdMap;
  let destinationLabel: string | undefined;

  if (destinationFolderId) {
    const scope = scopeFolderDataToDestination(destinationFolderId, destinationFolders);
    if (!scope) {
      throw new Error('The destination folder is no longer available. Re-scan and pick another one.');
    }
    aiFolderTree = scope.folderTree;
    aiPathToIdMap = scope.pathToIdMap;
    const destination = destinationFolders.find(folder => folder.id === destinationFolderId);
    destinationLabel = destination ? formatDestinationLabel(destination.path) : undefined;
  }

  const result = await organizeBookmarks(
    payload.serviceId,
    payload.modelId,
    payload.bookmarks,
    aiFolderTree,
    aiPathToIdMap,
    payload.maxOutputTokens,
    (processedCount, totalCount) => {
      notifyPopup('ORGANIZE_PROGRESS', { processedCount, totalCount });
    },
    run.signal,
    destinationLabel
  );

  // Only an explicit cancel (or a newer run) discards the result. The stored
  // status is not used for this: a stale popup write could flip it and the
  // finished run was thrown away while the popup kept showing "Working".
  if (run.signal.aborted) return;

  // Merge AI results into the existing session (or a fresh one if storage read fails)
  const existingSession = await loadOrganizeSession() ?? getInitialSession();

  const completedSession: OrganizeSession = {
    ...existingSession,
    status: 'reviewing_assignments',
    folderPlan: result.folderPlan,
    assignments: result.assignments,
    serviceId: payload.serviceId,
    folderTree: payload.folderTree,
    pathToIdMap: payload.pathToIdMap,
    defaultParentId: payload.defaultParentId,
    destinationFolderId,
    destinationFolders,
  };

  // Re-check right before persisting: the user may have cancelled while the
  // session was being read.
  if (run.signal.aborted) return;

  await saveOrganizeSession(completedSession);
  if (activeRun === run) activeRun = null;
  chrome.alarms.clear(KEEPALIVE_ALARM_NAME);

  notifyPopup('ORGANIZE_COMPLETE', { result });
};

const persistError = async (errorMessage: string): Promise<void> => {
  const existingSession = await loadOrganizeSession() ?? getInitialSession();
  await saveOrganizeSession({
    ...existingSession,
    status: 'error',
    errorMessage,
  });
};

chrome.runtime.onMessage.addListener(
  (message: OrganizeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'START_ORGANIZE': {
        cancelActiveRun();
        const run = new AbortController();
        activeRun = run;
        handleStartOrganize(message.payload as StartOrganizePayload, run).catch(async error => {
          // Cancelled runs end quietly — the popup already shows the cancelled state.
          if (run.signal.aborted || isCancelledError(error)) return;
          if (activeRun === run) activeRun = null;
          console.error('[Background] Error starting organize:', error);
          chrome.alarms.clear(KEEPALIVE_ALARM_NAME);

          const errorMessage = error instanceof Error ? error.message : 'Failed to organize bookmarks.';
          await persistError(errorMessage);
          notifyPopup('ORGANIZE_ERROR', { errorMessage });
        });
        sendResponse({ success: true });
        return true;
      }

      case 'CANCEL_ORGANIZE':
        cancelActiveRun();
        sendResponse({ success: true });
        return true;

      case 'GET_ORGANIZE_STATUS':
        loadOrganizeSession().then(session => {
          sendResponse({ session });
        }).catch(error => {
          console.error('[Background] Error getting status:', error);
          sendResponse({ session: null });
        });
        return true;

      default:
        sendResponse({ success: true });
        return true;
    }
  }
);

chrome.alarms.onAlarm.addListener(() => {
  // Keepalive — prevents service worker from going idle during AI call
});
