import { type FolderPlan, type BookmarkAssignment, type CompactBookmark, type BulkOrganizeResult } from '../../types/organize';
import { type FolderPathMap } from '../../types/bookmarks';
import { BULK_ORGANIZE_SYSTEM_PROMPT, buildBulkOrganizeUserPrompt } from './bulkPrompt';
import { getApiKey, callProvider } from './providerUtils';
import { findFolderIdByAIPath } from '../../utils/folders';
import { type ModelOption } from '../../types/services';
import { MODELS_CACHE_KEY_PREFIX } from '../../config/services';

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
    const parsed = JSON.parse(jsonText);

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
    console.error('Failed to parse bulk organize response:', error, '\nResponse:', responseText);
    throw new Error('Failed to parse AI response');
  }
};

export const organizeBookmarks = async (
  serviceId: string,
  modelId: string,
  bookmarks: CompactBookmark[],
  folderTree: string,
  pathToIdMap: FolderPathMap,
  maxOutputTokens?: number
): Promise<BulkOrganizeResult> => {
  const resolvedTokens = maxOutputTokens ?? await lookupMaxOutputTokens(serviceId, modelId);
  const apiKey = await getApiKey(serviceId);
  const userPrompt = buildBulkOrganizeUserPrompt(bookmarks, folderTree);

  const responseText = await callProvider(
    serviceId,
    apiKey,
    BULK_ORGANIZE_SYSTEM_PROMPT,
    userPrompt,
    modelId,
    resolvedTokens
  );

  return parseBulkOrganizeResponse(responseText, bookmarks, pathToIdMap);
};
