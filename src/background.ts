import { type OrganizeMessage, type StartBulkOrganizePayload } from './types/messaging';
import { type OrganizeSession } from './types/organize';
import { assignBookmarkBatch } from './services/ai/bulkOrganize';
import { saveOrganizeSession, loadOrganizeSession } from './services/organizeSession';
const KEEPALIVE_ALARM_NAME = 'organize-keepalive';
const KEEPALIVE_INTERVAL_MINUTES = 0.4;

let isPaused = false;

const notifyPopup = (type: string, payload?: unknown): void => {
  chrome.runtime.sendMessage({ type, payload }).catch(() => {
    // Popup might be closed — this is expected
  });
};

const processBatches = async (session: OrganizeSession): Promise<void> => {
  const { batches, serviceId, folderPlan, pathToIdMap, batchProgress } = session;
  console.log('[Background] Starting batch processing —', batches.length, 'batches, serviceId:', serviceId);

  if (!folderPlan) {
    console.log('[Background] No folder plan found — aborting');
    notifyPopup('ORGANIZE_ERROR', { errorMessage: 'No folder plan found' });
    return;
  }

  let currentSession = { ...session };
  const allAssignments = [...currentSession.assignments];

  for (let batchIndex = batchProgress.completedBatches; batchIndex < batches.length; batchIndex++) {
    console.log('[Background] Processing batch', batchIndex + 1, 'of', batches.length);
    if (isPaused) {
      console.log('[Background] Paused at batch:', batchIndex);
      await saveOrganizeSession(currentSession);
      return;
    }

    const batch = batches[batchIndex];

    try {
      const batchAssignments = await assignBookmarkBatch(
        serviceId,
        batch,
        folderPlan,
        pathToIdMap
      );

      console.log('[Background] Batch', batchIndex + 1, 'complete —', batchAssignments.length, 'assignments');
      allAssignments.push(...batchAssignments);

      const updatedProgress = {
        ...currentSession.batchProgress,
        completedBatches: batchIndex + 1,
        processedBookmarks: currentSession.batchProgress.processedBookmarks + batch.length,
      };

      currentSession = {
        ...currentSession,
        batchProgress: updatedProgress,
        assignments: allAssignments,
      };

      await saveOrganizeSession(currentSession);

      notifyPopup('ORGANIZE_BATCH_COMPLETE', {
        batchProgress: updatedProgress,
        latestAssignments: batchAssignments,
      });
    } catch (error) {
      console.error(`[Background] Batch ${batchIndex} failed:`, error);

      try {
        console.log('[Background] Retrying batch:', batchIndex);
        const retryAssignments = await assignBookmarkBatch(
          serviceId,
          batch,
          folderPlan,
          pathToIdMap
        );

        allAssignments.push(...retryAssignments);

        const updatedProgress = {
          ...currentSession.batchProgress,
          completedBatches: batchIndex + 1,
          processedBookmarks: currentSession.batchProgress.processedBookmarks + batch.length,
        };

        currentSession = {
          ...currentSession,
          batchProgress: updatedProgress,
          assignments: allAssignments,
        };

        await saveOrganizeSession(currentSession);

        notifyPopup('ORGANIZE_BATCH_COMPLETE', {
          batchProgress: updatedProgress,
          latestAssignments: retryAssignments,
        });
      } catch (retryError) {
        console.error(`[Background] Batch ${batchIndex} retry failed:`, retryError);

        const updatedProgress = {
          ...currentSession.batchProgress,
          completedBatches: batchIndex + 1,
          processedBookmarks: currentSession.batchProgress.processedBookmarks + batch.length,
          failedBatches: [...currentSession.batchProgress.failedBatches, batchIndex],
        };

        currentSession = {
          ...currentSession,
          batchProgress: updatedProgress,
        };

        await saveOrganizeSession(currentSession);

        notifyPopup('ORGANIZE_BATCH_COMPLETE', {
          batchProgress: updatedProgress,
          latestAssignments: [],
        });
      }
    }
  }

  console.log('[Background] All batches complete —', allAssignments.length, 'total assignments');

  currentSession = {
    ...currentSession,
    status: 'reviewing_assignments',
  };
  await saveOrganizeSession(currentSession);

  notifyPopup('ORGANIZE_COMPLETE', {
    assignments: allAssignments,
    batchProgress: currentSession.batchProgress,
  });

  chrome.alarms.clear(KEEPALIVE_ALARM_NAME);
};

const handleStartBulkOrganize = async (payload: StartBulkOrganizePayload): Promise<void> => {
  isPaused = false;
  console.log('[Background] START_BULK_ORGANIZE received — loading session from storage');

  const session = await loadOrganizeSession();
  if (!session) {
    console.log('[Background] No session found in storage — aborting');
    notifyPopup('ORGANIZE_ERROR', { errorMessage: 'No session found' });
    return;
  }

  console.log('[Background] Session loaded — status:', session.status, 'batches:', session.batches.length);

  chrome.alarms.create(KEEPALIVE_ALARM_NAME, {
    periodInMinutes: KEEPALIVE_INTERVAL_MINUTES,
  });

  const updatedSession: OrganizeSession = {
    ...session,
    status: 'assigning',
    serviceId: payload.serviceId,
    folderPlan: payload.approvedPlan,
    folderTree: payload.folderTree,
    pathToIdMap: payload.pathToIdMap,
    defaultParentId: payload.defaultParentId,
  };

  await saveOrganizeSession(updatedSession);
  await processBatches(updatedSession);
};

chrome.runtime.onMessage.addListener(
  (message: OrganizeMessage, _sender, sendResponse) => {
    console.log('[Background] Received message:', message.type);

    switch (message.type) {
      case 'START_BULK_ORGANIZE':
        handleStartBulkOrganize(message.payload as StartBulkOrganizePayload);
        break;

      case 'PAUSE_BULK_ORGANIZE':
        isPaused = true;
        console.log('[Background] Pausing batch processing');
        break;

      case 'RESUME_BULK_ORGANIZE':
        isPaused = false;
        console.log('[Background] Resuming batch processing');
        loadOrganizeSession().then(session => {
          if (session && session.status === 'assigning') {
            processBatches(session);
          }
        }).catch(error => {
          console.error('[Background] Error resuming:', error);
        });
        break;

      case 'GET_ORGANIZE_STATUS':
        loadOrganizeSession().then(session => {
          sendResponse({ session });
        }).catch(error => {
          console.error('[Background] Error getting status:', error);
          sendResponse({ session: null });
        });
        return true;
    }

    sendResponse({ success: true });
    return true;
  }
);

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === KEEPALIVE_ALARM_NAME) {
    console.log('[Background] Keepalive ping');
  }
});
