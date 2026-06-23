import { type FolderPlan, type ProposedFolder, type BookmarkAssignment, type CompactBookmark, type BulkOrganizeResult } from '../../types/organize';
import { type FolderPathMap } from '../../types/bookmarks';
import { BULK_ORGANIZE_SYSTEM_PROMPT, buildBulkOrganizeUserPrompt } from './bulkPrompt';
import { getApiKey, callProvider } from './providerUtils';
import { findFolderIdByAIPath } from '../../utils/folders';
import { chunkArray, isRetryableError } from '../../utils/helpers';
import { parseJsonLoose } from '../../utils/json';
import { type ModelOption } from '../../types/services';
import { MODELS_CACHE_KEY_PREFIX } from '../../config/services';

// Batch size is derived from the model's output token budget — the JSON of
// assignments is what overflows small/free models, so we size each pass to fit.
const TOKENS_PER_ASSIGNMENT = 70;
const OUTPUT_SAFETY_FACTOR = 0.6;
const MIN_BATCH_SIZE = 25;
const MAX_BATCH_SIZE = 150;
const FALLBACK_MAX_OUTPUT_TOKENS = 4096;

export const computeBatchSize = (maxOutputTokens?: number): number => {
  const budget = (maxOutputTokens ?? FALLBACK_MAX_OUTPUT_TOKENS) * OUTPUT_SAFETY_FACTOR;
  const estimated = Math.floor(budget / TOKENS_PER_ASSIGNMENT);
  return Math.min(MAX_BATCH_SIZE, Math.max(MIN_BATCH_SIZE, estimated));
};

export type OrganizeProgressCallback = (organizedCount: number, totalCount: number) => void;

// Transient failures (overload/rate-limit/timeout) are retried with exponential
// backoff so free tiers that 503 under load still succeed.
const MAX_BATCH_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1500;

const delay = (milliseconds: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

const withRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_BATCH_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === MAX_BATCH_RETRIES) throw error;
      await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }
  throw lastError;
};

const lookupMaxOutputTokens = async (serviceId: string, modelId: string): Promise<number | undefined> => {
  const cacheKey = `${MODELS_CACHE_KEY_PREFIX}${serviceId}`;
  const cached = await chrome.storage.local.get([cacheKey]);
  const entry = cached[cacheKey] as { models: ModelOption[] } | undefined;
  const model = entry?.models?.find((m) => m.id === modelId);
  return model?.maxOutputTokens;
};

const extractJsonFromResponse = (responseText: string): string => {
  const trimmed = responseText.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  return trimmed;
};

const parseBulkOrganizeResponse = (
  responseText: string,
  bookmarks: CompactBookmark[],
  pathToIdMap: FolderPathMap
): BulkOrganizeResult => {
  const jsonText = extractJsonFromResponse(responseText);

  try {
    const parsed = parseJsonLoose(jsonText) as {
      folders?: unknown;
      assignments?: unknown;
      summary?: unknown;
    };

    if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.folders)) {
      throw new Error('Response missing "folders" array');
    }

    if (!Array.isArray(parsed.assignments)) {
      throw new Error('Response missing "assignments" array');
    }

    const folders = parsed.folders.map((folder: Record<string, unknown>) => ({
      path: String(folder.path ?? ''),
      description: String(folder.description ?? ''),
      isNew: Boolean(folder.isNew),
      isExcluded: false,
    }));

    const folderPlan: FolderPlan = {
      folders,
      summary: String(parsed.summary ?? ''),
    };

    const bookmarkMap = new Map(bookmarks.map(bookmark => [bookmark.id, bookmark]));
    const newFolderPaths = new Set(
      folders.filter((folder: { isNew: boolean }) => folder.isNew).map((folder: { path: string }) => folder.path)
    );

    const assignments: BookmarkAssignment[] = parsed.assignments.map((entry: Record<string, unknown>) => {
      const bookmarkId = String(entry.bookmarkId ?? '');
      const suggestedPath = String(entry.suggestedPath ?? '');
      const bookmark = bookmarkMap.get(bookmarkId);

      if (!bookmark) {
        console.error('[BulkOrganize] Unknown bookmarkId in assignment:', bookmarkId);
      }

      return {
        bookmarkId,
        bookmarkTitle: bookmark?.title ?? '',
        bookmarkUrl: bookmark?.url ?? '',
        currentPath: bookmark?.currentFolderPath ?? '',
        suggestedPath,
        suggestedFolderId: findFolderIdByAIPath(suggestedPath, pathToIdMap) ?? null,
        isNewFolder: newFolderPaths.has(suggestedPath),
        isApproved: true,
      };
    });

    return { folderPlan, assignments };
  } catch (error) {
    // Log the failure and response size only — not the body, which can contain user bookmark data.
    console.error('Failed to parse bulk organize response:', error, `(response length: ${responseText.length})`);
    throw new Error("The AI's response wasn't readable. Please try again.");
  }
};

// Runs one AI pass over a single batch of bookmarks.
const organizeBatch = async (
  serviceId: string,
  modelId: string,
  apiKey: string,
  batch: CompactBookmark[],
  folderTree: string,
  pathToIdMap: FolderPathMap,
  proposedFolders: ProposedFolder[],
  maxOutputTokens?: number
): Promise<BulkOrganizeResult> => {
  const userPrompt = buildBulkOrganizeUserPrompt(
    batch,
    folderTree,
    proposedFolders.map(folder => ({ path: folder.path, description: folder.description }))
  );

  const responseText = await callProvider(
    serviceId,
    apiKey,
    BULK_ORGANIZE_SYSTEM_PROMPT,
    userPrompt,
    modelId,
    maxOutputTokens,
    batch.length
  );

  return parseBulkOrganizeResponse(responseText, batch, pathToIdMap);
};

export const organizeBookmarks = async (
  serviceId: string,
  modelId: string,
  bookmarks: CompactBookmark[],
  folderTree: string,
  pathToIdMap: FolderPathMap,
  maxOutputTokens?: number,
  onProgress?: OrganizeProgressCallback
): Promise<BulkOrganizeResult> => {
  const resolvedTokens = maxOutputTokens ?? await lookupMaxOutputTokens(serviceId, modelId);
  const apiKey = await getApiKey(serviceId);

  const batchSize = computeBatchSize(resolvedTokens);
  const batches = chunkArray(bookmarks, batchSize);

  // Sequential passes share an accumulating folder plan so later batches reuse
  // the folders earlier ones proposed (keeps the structure coherent).
  const foldersByPath = new Map<string, ProposedFolder>();
  const allAssignments: BookmarkAssignment[] = [];
  const summaries: string[] = [];
  let processedCount = 0;
  let failedCount = 0;

  for (const batch of batches) {
    try {
      const result = await withRetry(() =>
        organizeBatch(
          serviceId,
          modelId,
          apiKey,
          batch,
          folderTree,
          pathToIdMap,
          [...foldersByPath.values()],
          resolvedTokens
        )
      );

      for (const folder of result.folderPlan.folders) {
        if (!foldersByPath.has(folder.path)) {
          foldersByPath.set(folder.path, folder);
        }
      }
      allAssignments.push(...result.assignments);
      if (result.folderPlan.summary) {
        summaries.push(result.folderPlan.summary);
      }
    } catch (error) {
      // One failed pass shouldn't discard the bookmarks that already succeeded.
      console.error('[BulkOrganize] Batch failed:', error);
      failedCount += batch.length;

      // If nothing has succeeded yet and this was the only/last batch, surface the real error.
      if (allAssignments.length === 0 && processedCount + batch.length >= bookmarks.length) {
        throw error;
      }
    }

    processedCount += batch.length;
    // Report bookmarks actually organized (not merely attempted) so the count is honest on failures.
    onProgress?.(allAssignments.length, bookmarks.length);
  }

  if (allAssignments.length === 0) {
    throw new Error('Could not organize any bookmarks. Please try again.');
  }

  // Single pass keeps the AI's own summary; multi-pass uses a neutral one.
  let summary = batches.length === 1 ? (summaries[0] ?? '') : `Organized ${allAssignments.length} bookmarks into ${foldersByPath.size} folders.`;
  if (failedCount > 0) {
    summary += ` ${failedCount} couldn't be processed — run organize again to finish the rest.`;
  }

  const folderPlan: FolderPlan = {
    folders: [...foldersByPath.values()],
    summary,
  };

  return { folderPlan, assignments: allAssignments };
};
