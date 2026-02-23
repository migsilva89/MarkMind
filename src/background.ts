import { type OrganizeMessage, type StartOrganizePayload } from './types/messaging';
import { type OrganizeSession } from './types/organize';
import { organizeBookmarks } from './services/ai/bulkOrganize';
import { saveOrganizeSession, loadOrganizeSession, getInitialSession } from './services/organizeSession';

const KEEPALIVE_ALARM_NAME = 'organize-keepalive';
const KEEPALIVE_INTERVAL_MINUTES = 0.4;

const notifyPopup = (type: string, payload?: unknown): void => {
  chrome.runtime.sendMessage({ type, payload }).catch(() => {
    // Popup might be closed — this is expected
  });
};

const handleStartOrganize = async (payload: StartOrganizePayload): Promise<void> => {
  chrome.alarms.create(KEEPALIVE_ALARM_NAME, {
    periodInMinutes: KEEPALIVE_INTERVAL_MINUTES,
  });

  const result = await organizeBookmarks(
    payload.serviceId,
    payload.bookmarks,
    payload.folderTree,
    payload.pathToIdMap
  );

  // Merge AI results into the existing session (or a fresh one if storage read fails)
  const existingSession = await loadOrganizeSession() ?? getInitialSession();
  const completedSession: OrganizeSession = {
    ...existingSession,
    status: 'reviewing_plan',
    folderPlan: result.folderPlan,
    assignments: result.assignments,
    serviceId: payload.serviceId,
    folderTree: payload.folderTree,
    pathToIdMap: payload.pathToIdMap,
    defaultParentId: payload.defaultParentId,
  };

  await saveOrganizeSession(completedSession);
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
      case 'START_ORGANIZE':
        handleStartOrganize(message.payload as StartOrganizePayload).catch(async error => {
          console.error('[Background] Error starting organize:', error);
          chrome.alarms.clear(KEEPALIVE_ALARM_NAME);

          const errorMessage = error instanceof Error ? error.message : 'Failed to organize bookmarks.';
          await persistError(errorMessage);
          notifyPopup('ORGANIZE_ERROR', { errorMessage });
        });
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
