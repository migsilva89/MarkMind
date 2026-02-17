import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SELECTED_SERVICE_STORAGE_KEY } from '../../config/services';
import { LOADING_MESSAGES, getNextLoadingMessage } from '../../config/loadingMessages';
import { type StatusType } from '../../types/common';
import { type OrganizeSession } from '../../types/organize';
import { getBookmarkStats, flattenAllBookmarks, filterBookmarksByFolders, createBatches } from '../../utils/bookmarkScanner';
import { getFolderDataForAI, buildIdToPathMap } from '../../utils/folders';
import { planFolderStructure } from '../../services/ai/bulkOrganize';
import { saveOrganizeSession, loadOrganizeSession, clearOrganizeSession, getInitialSession } from '../../services/organizeSession';
import { moveBookmark, createFolderPath } from '../../services/bookmarks';
import { type UseBulkOrganizeReturn } from './types';

const LOADING_MESSAGE_INTERVAL_MS = 2000;
const BATCH_SIZE = 25;

export const useBulkOrganize = (): UseBulkOrganizeReturn => {
  const [session, setSession] = useState<OrganizeSession>(getInitialSession());
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<StatusType>('default');

  const loadingMessageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingMessageIndexRef = useRef(0);

  // Resume session from storage on mount
  useEffect(() => {
    const resumeSession = async (): Promise<void> => {
      try {
        const savedSession = await loadOrganizeSession();
        if (savedSession && savedSession.status !== 'idle') {
          setSession(savedSession);
          if (savedSession.status === 'assigning') {
            startLoadingMessages();
          }
        }
      } catch (error) {
        console.error('Error resuming organize session:', error);
      }
    };

    resumeSession();
  }, []);

  // Cleanup loading message interval on unmount
  useEffect(() => {
    return () => {
      if (loadingMessageIntervalRef.current) {
        clearInterval(loadingMessageIntervalRef.current);
      }
    };
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    const handleMessage = (message: { type: string; payload?: unknown }): void => {
      if (message.type === 'ORGANIZE_BATCH_COMPLETE') {
        const payload = message.payload as {
          batchProgress: OrganizeSession['batchProgress'];
          latestAssignments: OrganizeSession['assignments'];
        };
        setSession(previousSession => ({
          ...previousSession,
          batchProgress: payload.batchProgress,
          assignments: [...previousSession.assignments, ...payload.latestAssignments],
        }));
      }

      if (message.type === 'ORGANIZE_COMPLETE') {
        const payload = message.payload as {
          assignments: OrganizeSession['assignments'];
          batchProgress: OrganizeSession['batchProgress'];
        };
        clearLoadingMessages();
        setSession(previousSession => ({
          ...previousSession,
          status: 'reviewing_assignments',
          assignments: payload.assignments,
          batchProgress: payload.batchProgress,
        }));
      }

      if (message.type === 'ORGANIZE_ERROR') {
        const payload = message.payload as { errorMessage: string };
        clearLoadingMessages();
        setSession(previousSession => ({
          ...previousSession,
          status: 'error',
          errorMessage: payload.errorMessage,
        }));
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const clearLoadingMessages = useCallback((): void => {
    if (loadingMessageIntervalRef.current) {
      clearInterval(loadingMessageIntervalRef.current);
      loadingMessageIntervalRef.current = null;
    }
    setStatusMessage('');
    setStatusType('default');
  }, []);

  const startLoadingMessages = useCallback((): void => {
    loadingMessageIndexRef.current = 0;
    setStatusMessage(LOADING_MESSAGES[0]);
    setStatusType('loading');

    loadingMessageIntervalRef.current = setInterval(() => {
      const { message, nextIndex } = getNextLoadingMessage(loadingMessageIndexRef.current);
      loadingMessageIndexRef.current = nextIndex;
      setStatusMessage(message);
    }, LOADING_MESSAGE_INTERVAL_MS);
  }, []);

  const updateSession = useCallback(async (updates: Partial<OrganizeSession>): Promise<void> => {
    setSession(previousSession => {
      const updatedSession = { ...previousSession, ...updates };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving organize session:', error);
      });
      return updatedSession;
    });
  }, []);

  const bookmarkStats = useMemo(() => {
    if (session.allBookmarks.length === 0) return null;
    return getBookmarkStats(session.allBookmarks);
  }, [session.allBookmarks]);

  const handleStartScan = useCallback(async (): Promise<void> => {
    try {
      await updateSession({ status: 'scanning' });

      const folderData = await getFolderDataForAI();
      const idToPathMap = buildIdToPathMap(folderData.pathToIdMap);
      const bookmarkTree = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
        chrome.bookmarks.getTree((tree) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(tree);
        });
      });
      const allBookmarks = flattenAllBookmarks(bookmarkTree, idToPathMap);

      const folderIds = [...new Set(allBookmarks.map(bookmark => bookmark.currentFolderId))];

      await updateSession({
        status: 'selecting',
        allBookmarks,
        selectedFolderIds: folderIds,
        folderTree: folderData.textTree,
        pathToIdMap: folderData.pathToIdMap,
        defaultParentId: folderData.defaultParentId,
      });
    } catch (error) {
      console.error('Error scanning bookmarks:', error);
      await updateSession({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to scan bookmarks',
      });
    }
  }, [updateSession]);

  const handleToggleFolder = useCallback((folderId: string): void => {
    setSession(previousSession => {
      const currentSelected = previousSession.selectedFolderIds ?? [];
      const isSelected = currentSelected.includes(folderId);
      const updatedFolderIds = isSelected
        ? currentSelected.filter(id => id !== folderId)
        : [...currentSelected, folderId];

      const updatedSession = { ...previousSession, selectedFolderIds: updatedFolderIds };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving folder selection:', error);
      });
      return updatedSession;
    });
  }, []);

  const handleSelectAllFolders = useCallback((): void => {
    setSession(previousSession => {
      const allFolderIds = [...new Set(previousSession.allBookmarks.map(bookmark => bookmark.currentFolderId))];
      const updatedSession = { ...previousSession, selectedFolderIds: allFolderIds };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving folder selection:', error);
      });
      return updatedSession;
    });
  }, []);

  const handleDeselectAllFolders = useCallback((): void => {
    setSession(previousSession => {
      const updatedSession = { ...previousSession, selectedFolderIds: [] };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving folder selection:', error);
      });
      return updatedSession;
    });
  }, []);

  const handleStartPlanning = useCallback(async (): Promise<void> => {
    try {
      const selectedFolderIds = session.selectedFolderIds ?? [];
      if (selectedFolderIds.length === 0) return;

      const bookmarksToOrganize = filterBookmarksByFolders(session.allBookmarks, selectedFolderIds);
      if (bookmarksToOrganize.length === 0) return;

      await updateSession({
        status: 'planning',
        bookmarksToOrganize,
      });

      startLoadingMessages();

      let serviceId = '';
      const storageResult = await chrome.storage.local.get([SELECTED_SERVICE_STORAGE_KEY]);
      serviceId = storageResult[SELECTED_SERVICE_STORAGE_KEY] ?? '';

      if (!serviceId) {
        clearLoadingMessages();
        await updateSession({ status: 'error', errorMessage: 'No AI provider selected' });
        return;
      }

      const folderPlan = await planFolderStructure(serviceId, bookmarksToOrganize, session.folderTree);

      clearLoadingMessages();

      await updateSession({
        status: 'reviewing_plan',
        folderPlan,
        serviceId,
      });
    } catch (error) {
      console.error('Error planning folder structure:', error);
      clearLoadingMessages();
      await updateSession({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to plan folder structure',
      });
    }
  }, [session.selectedFolderIds, session.allBookmarks, session.folderTree, updateSession, startLoadingMessages, clearLoadingMessages]);

  const handleApprovePlan = useCallback(async (): Promise<void> => {
    try {
      const batches = createBatches(session.bookmarksToOrganize, BATCH_SIZE);

      const assigningSession: OrganizeSession = {
        ...session,
        status: 'assigning',
        batches,
        assignments: [],
        batchProgress: {
          totalBatches: batches.length,
          completedBatches: 0,
          totalBookmarks: session.bookmarksToOrganize.length,
          processedBookmarks: 0,
          failedBatches: [],
        },
      };

      setSession(assigningSession);
      await saveOrganizeSession(assigningSession);
      startLoadingMessages();

      const approvedPlan = session.folderPlan ? {
        ...session.folderPlan,
        folders: session.folderPlan.folders.filter(folder => !folder.isExcluded),
      } : session.folderPlan;

      chrome.runtime.sendMessage({
        type: 'START_BULK_ORGANIZE',
        payload: {
          serviceId: session.serviceId,
          bookmarks: session.bookmarksToOrganize,
          approvedPlan,
          folderTree: session.folderTree,
          pathToIdMap: session.pathToIdMap,
          defaultParentId: session.defaultParentId,
        },
      }).catch(error => {
        console.error('Error starting bulk organize:', error);
      });
    } catch (error) {
      console.error('Error approving plan:', error);
      clearLoadingMessages();
    }
  }, [session, startLoadingMessages, clearLoadingMessages]);

  const handleRejectPlan = useCallback((): void => {
    updateSession({
      status: 'selecting',
      folderPlan: null,
    });
  }, [updateSession]);

  const handleTogglePlanFolder = useCallback((folderPath: string): void => {
    setSession(previousSession => {
      if (!previousSession.folderPlan) return previousSession;

      const updatedFolders = previousSession.folderPlan.folders.map(folder =>
        folder.path === folderPath
          ? { ...folder, isExcluded: !folder.isExcluded }
          : folder
      );

      const updatedSession = {
        ...previousSession,
        folderPlan: { ...previousSession.folderPlan, folders: updatedFolders },
      };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving folder toggle:', error);
      });
      return updatedSession;
    });
  }, []);

  const handleStartAssigning = useCallback((): void => {
    startLoadingMessages();

    chrome.runtime.sendMessage({
      type: 'RESUME_BULK_ORGANIZE',
    }).catch(error => {
      console.error('Error resuming bulk organize:', error);
    });
  }, [startLoadingMessages]);

  const handlePause = useCallback((): void => {
    chrome.runtime.sendMessage({ type: 'PAUSE_BULK_ORGANIZE' }).catch(error => {
      console.error('Error pausing bulk organize:', error);
    });
  }, []);

  const handleResume = useCallback((): void => {
    chrome.runtime.sendMessage({ type: 'RESUME_BULK_ORGANIZE' }).catch(error => {
      console.error('Error resuming bulk organize:', error);
    });
  }, []);

  const handleToggleAssignment = useCallback((bookmarkId: string): void => {
    setSession(previousSession => {
      const updatedAssignments = previousSession.assignments.map(assignment =>
        assignment.bookmarkId === bookmarkId
          ? { ...assignment, isApproved: !assignment.isApproved }
          : assignment
      );
      const updatedSession = { ...previousSession, assignments: updatedAssignments };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving assignment toggle:', error);
      });
      return updatedSession;
    });
  }, []);

  const handleApproveAllAssignments = useCallback((): void => {
    setSession(previousSession => {
      const updatedAssignments = previousSession.assignments.map(assignment => ({
        ...assignment,
        isApproved: true,
      }));
      const updatedSession = { ...previousSession, assignments: updatedAssignments };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving approve all:', error);
      });
      return updatedSession;
    });
  }, []);

  const handleRejectAllAssignments = useCallback((): void => {
    setSession(previousSession => {
      const updatedAssignments = previousSession.assignments.map(assignment => ({
        ...assignment,
        isApproved: false,
      }));
      const updatedSession = { ...previousSession, assignments: updatedAssignments };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving reject all:', error);
      });
      return updatedSession;
    });
  }, []);

  const handleApplyMoves = useCallback(async (): Promise<void> => {
    try {
      await updateSession({ status: 'applying', startedAt: Date.now() });

      const approvedAssignments = session.assignments.filter(assignment => assignment.isApproved);
      let appliedCount = 0;
      let skippedCount = 0;
      const mutablePathToIdMap = { ...session.pathToIdMap };

      for (const assignment of approvedAssignments) {
        try {
          let targetFolderId = assignment.suggestedFolderId;

          if (!targetFolderId && assignment.isNewFolder) {
            targetFolderId = await createFolderPath(
              assignment.suggestedPath,
              mutablePathToIdMap,
              session.defaultParentId
            );
          }

          if (!targetFolderId) {
            skippedCount += 1;
            continue;
          }

          await moveBookmark(assignment.bookmarkId, targetFolderId);
          appliedCount += 1;
        } catch (error) {
          console.error('Error moving bookmark:', assignment.bookmarkId, error);
          skippedCount += 1;
        }
      }

      const rejectedCount = session.assignments.length - approvedAssignments.length;

      await updateSession({
        status: 'completed',
        appliedCount,
        skippedCount: skippedCount + rejectedCount,
        completedAt: Date.now(),
        pathToIdMap: mutablePathToIdMap,
      });
    } catch (error) {
      console.error('Error applying moves:', error);
      await updateSession({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to apply bookmark moves',
      });
    }
  }, [session.assignments, session.pathToIdMap, session.defaultParentId, updateSession]);

  const handleReset = useCallback((): void => {
    clearLoadingMessages();
    setSession(getInitialSession());
    clearOrganizeSession().catch(error => {
      console.error('Error clearing organize session:', error);
    });
  }, [clearLoadingMessages]);

  return {
    session,
    bookmarkStats,
    statusMessage,
    statusType,
    handleStartScan,
    handleToggleFolder,
    handleSelectAllFolders,
    handleDeselectAllFolders,
    handleStartPlanning,
    handleApprovePlan,
    handleRejectPlan,
    handleTogglePlanFolder,
    handleStartAssigning,
    handlePause,
    handleResume,
    handleToggleAssignment,
    handleApproveAllAssignments,
    handleRejectAllAssignments,
    handleApplyMoves,
    handleReset,
  };
};
