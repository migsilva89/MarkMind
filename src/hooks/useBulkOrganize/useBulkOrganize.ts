import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SELECTED_SERVICE_STORAGE_KEY, SELECTED_MODEL_STORAGE_KEY } from '../../config/services';
import { buildLoadingMessage, getNextLoadingMessageIndex } from '../../utils/loadingMessages';
import { type StatusType } from '../../types/common';
import { type OrganizeSession, type BulkOrganizeResult } from '../../types/organize';
import { getBookmarkStats, flattenAllBookmarks } from '../../utils/bookmarkScanner';
import { getFolderDataForAI, buildFullIdToPathMapFromTree } from '../../utils/folders';
import { saveOrganizeSession, loadOrganizeSession, clearOrganizeSession, getInitialSession } from '../../services/organizeSession';
import { moveBookmark, createFolderPath, removeBookmark } from '../../services/bookmarks';
import { getSelectedMaxOutputTokens } from '../../services/selectedState';
import { type UseBulkOrganizeReturn } from './types';

const STATUS_TICK_MS = 1000;
const MESSAGE_ROTATE_EVERY_TICKS = 2;
const DEBOUNCE_SAVE_MS = 500;

export const useBulkOrganize = (): UseBulkOrganizeReturn => {
  const [session, setSession] = useState<OrganizeSession>(getInitialSession());
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<StatusType>('default');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [organizeProgress, setOrganizeProgress] = useState<{ processed: number; total: number } | null>(null);

  // Ref always holds the latest session — avoids stale closures in handlers
  // and race conditions when multiple updates happen before React re-renders
  const sessionRef = useRef<OrganizeSession>(session);
  sessionRef.current = session;

  const loadingMessageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingMessageIndexRef = useRef(0);
  const debouncedSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadingMessages = useCallback((): void => {
    if (loadingMessageIntervalRef.current) {
      clearInterval(loadingMessageIntervalRef.current);
      loadingMessageIntervalRef.current = null;
    }
    setStatusMessage('');
    setStatusType('default');
    setElapsedSeconds(0);
    setOrganizeProgress(null);
  }, []);

  // Shows rotating status built from the real provider + bookmark count, plus a
  // live elapsed timer (derived from startedAt so it stays accurate across popup
  // reopen). The AI runs as a single service-worker call, so there is no
  // per-bookmark progress to report — this is the honest signal we can give.
  const startLoadingMessages = useCallback(
    (bookmarkCount: number, startedAt: number): void => {
      loadingMessageIndexRef.current = 0;
      setOrganizeProgress(null);
      setStatusMessage(buildLoadingMessage(0, bookmarkCount));
      setStatusType('loading');
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));

      let tickCount = 0;
      loadingMessageIntervalRef.current = setInterval(() => {
        tickCount += 1;
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));

        if (tickCount % MESSAGE_ROTATE_EVERY_TICKS === 0) {
          loadingMessageIndexRef.current = getNextLoadingMessageIndex(loadingMessageIndexRef.current);
          setStatusMessage(buildLoadingMessage(loadingMessageIndexRef.current, bookmarkCount));
        }
      }, STATUS_TICK_MS);
    },
    []
  );

  const debouncedSaveSession = useCallback((sessionToSave: OrganizeSession): void => {
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    debouncedSaveRef.current = setTimeout(() => {
      saveOrganizeSession(sessionToSave).catch(error => {
        console.error('Error saving session:', error);
      });
    }, DEBOUNCE_SAVE_MS);
  }, []);

  // Resume session from storage on mount
  useEffect(() => {
    const resumeSession = async (): Promise<void> => {
      try {
        const savedSession = await loadOrganizeSession();
        if (!savedSession || savedSession.status === 'idle') return;

        // Scanning runs in popup context — if popup closed mid-scan, reset to idle
        if (savedSession.status === 'scanning') {
          const resetSession = { ...savedSession, status: 'idle' as const };
          setSession(resetSession);
          await saveOrganizeSession(resetSession);
          return;
        }

        // Legacy sessions may have 'reviewing_plan' — treat as 'reviewing_assignments'
        if ((savedSession.status as string) === 'reviewing_plan') {
          const migratedSession = { ...savedSession, status: 'reviewing_assignments' as const };
          setSession(migratedSession);
          await saveOrganizeSession(migratedSession);
          return;
        }

        // Applying runs in popup context — if popup closed mid-apply, reset to review
        if (savedSession.status === 'applying') {
          const resetSession = { ...savedSession, status: 'reviewing_assignments' as const };
          setSession(resetSession);
          await saveOrganizeSession(resetSession);
          return;
        }

        setSession(savedSession);

        // AI call runs in service worker — resume loading messages while waiting
        if (savedSession.status === 'organizing') {
          startLoadingMessages(
            savedSession.bookmarksToOrganize.length,
            savedSession.startedAt ?? Date.now()
          );
        }
      } catch (error) {
        console.error('Error resuming organize session:', error);
      }
    };

    resumeSession();
  }, [startLoadingMessages]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (loadingMessageIntervalRef.current) {
        clearInterval(loadingMessageIntervalRef.current);
      }
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    const handleMessage = (message: { type: string; payload?: unknown }): void => {
      // Ignore service worker responses if the user already cancelled
      if (sessionRef.current.status !== 'organizing') return;

      if (message.type === 'ORGANIZE_PROGRESS') {
        const payload = message.payload as { processedCount: number; totalCount: number };
        setOrganizeProgress({ processed: payload.processedCount, total: payload.totalCount });
      }

      if (message.type === 'ORGANIZE_COMPLETE') {
        const payload = message.payload as { result: BulkOrganizeResult };
        clearLoadingMessages();
        setSession(previousSession => ({
          ...previousSession,
          status: 'reviewing_assignments',
          folderPlan: payload.result.folderPlan,
          assignments: payload.result.assignments,
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

    // Catch race: service worker may have saved result to storage between resumeSession
    // reading storage and this listener being registered — check for a missed completion
    if (sessionRef.current.status === 'organizing') {
      loadOrganizeSession().then(latestSession => {
        if (latestSession && latestSession.status !== 'organizing') {
          clearLoadingMessages();
          setSession(latestSession);
        }
      }).catch(error => console.error('Error checking for missed organize completion:', error));
    }

    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [clearLoadingMessages]);

  const updateSession = useCallback(async (updates: Partial<OrganizeSession>): Promise<void> => {
    const updatedSession = { ...sessionRef.current, ...updates };
    sessionRef.current = updatedSession;
    setSession(updatedSession);

    try {
      await saveOrganizeSession(updatedSession);
    } catch (error) {
      console.error('Error saving organize session:', error);
    }
  }, []);

  const bookmarkStats = useMemo(() => {
    if (session.allBookmarks.length === 0) return null;
    return getBookmarkStats(session.allBookmarks);
  }, [session.allBookmarks]);

  const handleStartScan = useCallback(async (): Promise<void> => {
    try {
      await updateSession({ status: 'scanning' });

      const bookmarkTree = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
        chrome.bookmarks.getTree((tree) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(tree);
        });
      });

      // Build idToPathMap from the same tree used for scanning — guarantees 100% folder coverage
      const idToPathMap = buildFullIdToPathMapFromTree(bookmarkTree);
      const allBookmarks = flattenAllBookmarks(bookmarkTree, idToPathMap);

      // getFolderDataForAI is still needed for the AI prompt tree and pathToIdMap used during organising
      const folderData = await getFolderDataForAI();

      await updateSession({
        status: 'selecting',
        allBookmarks,
        selectedBookmarkIds: allBookmarks.map(bookmark => bookmark.id),
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

  const handleRemoveDuplicates = useCallback(async (bookmarkIdsToRemove: string[]): Promise<void> => {
    // Remove in parallel — deletions target distinct bookmark nodes and don't
    // depend on each other. Per-item catch so one failure doesn't abort the rest.
    await Promise.all(
      bookmarkIdsToRemove.map(async (bookmarkId) => {
        try {
          await removeBookmark(bookmarkId);
        } catch (error) {
          console.error('Error removing duplicate bookmark:', bookmarkId, error);
        }
      })
    );
    // Re-scan so the bookmark list and selection reflect the removals.
    await handleStartScan();
  }, [handleStartScan]);

  const handleToggleBookmarks = useCallback((bookmarkIds: string[]): void => {
    setSession(previousSession => {
      const currentSelected = new Set(previousSession.selectedBookmarkIds ?? []);
      const allSelected = bookmarkIds.every(id => currentSelected.has(id));

      if (allSelected) {
        bookmarkIds.forEach(id => currentSelected.delete(id));
      } else {
        bookmarkIds.forEach(id => currentSelected.add(id));
      }

      const updatedSession = { ...previousSession, selectedBookmarkIds: [...currentSelected] };
      debouncedSaveSession(updatedSession);
      return updatedSession;
    });
  }, [debouncedSaveSession]);

  const handleSelectAll = useCallback((): void => {
    setSession(previousSession => {
      const updatedSession = {
        ...previousSession,
        selectedBookmarkIds: previousSession.allBookmarks.map(bookmark => bookmark.id),
      };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving bookmark selection:', error);
      });
      return updatedSession;
    });
  }, []);

  const handleDeselectAll = useCallback((): void => {
    setSession(previousSession => {
      const updatedSession = { ...previousSession, selectedBookmarkIds: [] };
      saveOrganizeSession(updatedSession).catch(error => {
        console.error('Error saving bookmark selection:', error);
      });
      return updatedSession;
    });
  }, []);

  const handleStartOrganizing = useCallback(async (): Promise<void> => {
    try {
      const currentSession = sessionRef.current;
      const selectedBookmarkIds = new Set(currentSession.selectedBookmarkIds ?? []);
      if (selectedBookmarkIds.size === 0) return;

      const bookmarksToOrganize = currentSession.allBookmarks.filter(bookmark => selectedBookmarkIds.has(bookmark.id));
      if (bookmarksToOrganize.length === 0) return;

      const storageResult = await chrome.storage.local.get([SELECTED_SERVICE_STORAGE_KEY, SELECTED_MODEL_STORAGE_KEY]);
      const serviceId = storageResult[SELECTED_SERVICE_STORAGE_KEY] ?? '';
      const modelId = storageResult[SELECTED_MODEL_STORAGE_KEY] ?? '';

      if (!serviceId) {
        await updateSession({ status: 'error', errorMessage: 'No AI provider selected' });
        return;
      }

      if (!modelId) {
        await updateSession({ status: 'error', errorMessage: 'No model selected. Please select a model in Settings.' });
        return;
      }

      const startedAt = Date.now();
      await updateSession({
        status: 'organizing',
        bookmarksToOrganize,
        serviceId,
        startedAt,
      });

      startLoadingMessages(bookmarksToOrganize.length, startedAt);

      chrome.runtime.sendMessage({
        type: 'START_ORGANIZE',
        payload: {
          serviceId,
          modelId,
          bookmarks: bookmarksToOrganize,
          folderTree: currentSession.folderTree,
          pathToIdMap: currentSession.pathToIdMap,
          defaultParentId: currentSession.defaultParentId,
          maxOutputTokens: getSelectedMaxOutputTokens(),
        },
      }).catch(async (error) => {
        console.error('Error starting organize:', error);
        clearLoadingMessages();
        await updateSession({
          status: 'error',
          errorMessage: 'Failed to connect to background service. Please reload the extension.',
        });
      });
    } catch (error) {
      console.error('Error starting organize:', error);
      clearLoadingMessages();
      await updateSession({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Failed to start organization',
      });
    }
  }, [updateSession, startLoadingMessages, clearLoadingMessages]);

  const handleReOrganize = useCallback((): void => {
    updateSession({
      status: 'selecting',
      folderPlan: null,
      assignments: [],
    });
  }, [updateSession]);

  const handleToggleGroupAssignments = useCallback((bookmarkIds: string[]): void => {
    setSession(previousSession => {
      const groupSet = new Set(bookmarkIds);
      const allInGroupApproved = bookmarkIds.every(id =>
        previousSession.assignments.find(assignment => assignment.bookmarkId === id)?.isApproved
      );
      const updatedAssignments = previousSession.assignments.map(assignment =>
        groupSet.has(assignment.bookmarkId)
          ? { ...assignment, isApproved: !allInGroupApproved }
          : assignment
      );
      const updatedSession = { ...previousSession, assignments: updatedAssignments };
      debouncedSaveSession(updatedSession);
      return updatedSession;
    });
  }, [debouncedSaveSession]);

  const handleSelectAllAssignments = useCallback((): void => {
    setSession(previousSession => {
      const updatedAssignments = previousSession.assignments.map(assignment => ({ ...assignment, isApproved: true }));
      const updatedSession = { ...previousSession, assignments: updatedAssignments };
      debouncedSaveSession(updatedSession);
      return updatedSession;
    });
  }, [debouncedSaveSession]);

  const handleDeselectAllAssignments = useCallback((): void => {
    setSession(previousSession => {
      const updatedAssignments = previousSession.assignments.map(assignment => ({ ...assignment, isApproved: false }));
      const updatedSession = { ...previousSession, assignments: updatedAssignments };
      debouncedSaveSession(updatedSession);
      return updatedSession;
    });
  }, [debouncedSaveSession]);

  const handleToggleAssignment = useCallback((bookmarkId: string): void => {
    setSession(previousSession => {
      const updatedAssignments = previousSession.assignments.map(assignment =>
        assignment.bookmarkId === bookmarkId
          ? { ...assignment, isApproved: !assignment.isApproved }
          : assignment
      );
      const updatedSession = { ...previousSession, assignments: updatedAssignments };
      debouncedSaveSession(updatedSession);
      return updatedSession;
    });
  }, [debouncedSaveSession]);

  const handleApplyMoves = useCallback(async (): Promise<void> => {
    try {
      await updateSession({ status: 'applying', startedAt: Date.now() });
      const currentSession = sessionRef.current;

      const approvedAssignments = currentSession.assignments.filter(assignment => assignment.isApproved);
      let appliedCount = 0;
      let skippedCount = 0;
      const mutablePathToIdMap = { ...currentSession.pathToIdMap };

      for (const assignment of approvedAssignments) {
        try {
          let targetFolderId = assignment.suggestedFolderId;

          if (!targetFolderId) {
            targetFolderId = await createFolderPath(
              assignment.suggestedPath,
              mutablePathToIdMap,
              currentSession.defaultParentId
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

      const rejectedCount = currentSession.assignments.length - approvedAssignments.length;

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
  }, [updateSession]);

  const handleCancelOrganizing = useCallback((): void => {
    clearLoadingMessages();
    updateSession({ status: 'selecting', folderPlan: null }).catch(error => {
      console.error('Error cancelling organize:', error);
    });
  }, [clearLoadingMessages, updateSession]);

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
    elapsedSeconds,
    organizeProgress,
    handleStartScan,
    handleRemoveDuplicates,
    handleToggleBookmarks,
    handleSelectAll,
    handleDeselectAll,
    handleStartOrganizing,
    handleCancelOrganizing,
    handleReOrganize,
    handleToggleGroupAssignments,
    handleSelectAllAssignments,
    handleDeselectAllAssignments,
    handleToggleAssignment,
    handleApplyMoves,
    handleReset,
  };
};
