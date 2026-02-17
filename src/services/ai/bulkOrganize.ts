import { type FolderPlan, type BookmarkAssignment, type CompactBookmark } from '../../types/organize';
import { type FolderPathMap } from '../../types/bookmarks';
import { SERVICES } from '../../config/services';
import {
  BULK_PLANNING_SYSTEM_PROMPT,
  BULK_ASSIGNMENT_SYSTEM_PROMPT,
  buildBulkPlanningUserPrompt,
  buildBulkAssignmentUserPrompt,
} from './bulkPrompt';
import { callGemini, callOpenAI, callAnthropic, callOpenRouter } from './providers';
import { debug } from '../../utils/debug';

const PLANNING_MAX_TOKENS = 4096;
const ASSIGNMENT_MAX_TOKENS = 1500;

const getApiKey = async (serviceId: string): Promise<string> => {
  const service = SERVICES[serviceId];
  if (!service) {
    throw new Error(`Unknown service: ${serviceId}`);
  }

  const storageResult = await chrome.storage.local.get([service.storageKey]);
  const apiKey = storageResult[service.storageKey];

  if (!apiKey) {
    throw new Error(`No API key found for ${service.name}`);
  }

  return apiKey;
};

const callProvider = async (
  serviceId: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> => {
  switch (serviceId) {
    case 'google':
      return callGemini(apiKey, systemPrompt, userPrompt, maxTokens);
    case 'openai':
      return callOpenAI(apiKey, systemPrompt, userPrompt, maxTokens);
    case 'anthropic':
      return callAnthropic(apiKey, systemPrompt, userPrompt, maxTokens);
    case 'openrouter':
      return callOpenRouter(apiKey, systemPrompt, userPrompt, maxTokens);
    default:
      throw new Error(`Unsupported service: ${serviceId}`);
  }
};

const extractJsonFromResponse = (responseText: string): string => {
  const trimmed = responseText.trim();

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  return trimmed;
};

export const parseFolderPlan = (responseText: string): FolderPlan => {
  const jsonText = extractJsonFromResponse(responseText);

  try {
    const parsed = JSON.parse(jsonText);

    if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.folders)) {
      throw new Error('Response missing "folders" array');
    }

    const folders = parsed.folders.map((folder: Record<string, unknown>) => ({
      path: String(folder.path ?? ''),
      description: String(folder.description ?? ''),
      isNew: Boolean(folder.isNew),
    }));

    return {
      folders,
      summary: String(parsed.summary ?? ''),
    };
  } catch (error) {
    console.error('Failed to parse folder plan:', error, '\nResponse:', responseText);
    throw new Error('Failed to parse AI folder plan response');
  }
};

export const parseAssignments = (
  responseText: string,
  batch: CompactBookmark[],
  approvedPlan: FolderPlan,
  pathToIdMap: FolderPathMap
): BookmarkAssignment[] => {
  const jsonText = extractJsonFromResponse(responseText);

  try {
    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    const bookmarkMap = new Map(batch.map(bookmark => [bookmark.id, bookmark]));
    const newFolderPaths = new Set(
      approvedPlan.folders.filter(folder => folder.isNew).map(folder => folder.path)
    );

    return parsed.map((entry: Record<string, unknown>) => {
      const bookmarkId = String(entry.bookmarkId ?? '');
      const suggestedPath = String(entry.suggestedPath ?? '');
      const bookmark = bookmarkMap.get(bookmarkId);

      if (!bookmark) {
        debug('[BulkOrganize] Unknown bookmarkId in assignment:', bookmarkId);
      }

      return {
        bookmarkId,
        bookmarkTitle: bookmark?.title ?? '',
        bookmarkUrl: bookmark?.url ?? '',
        currentPath: bookmark?.currentFolderPath ?? '',
        suggestedPath,
        suggestedFolderId: pathToIdMap[suggestedPath] ?? null,
        isNewFolder: newFolderPaths.has(suggestedPath),
        isApproved: true,
      };
    });
  } catch (error) {
    console.error('Failed to parse assignments:', error, '\nResponse:', responseText);
    throw new Error('Failed to parse AI assignment response');
  }
};

export const planFolderStructure = async (
  serviceId: string,
  bookmarks: CompactBookmark[],
  folderTree: string
): Promise<FolderPlan> => {
  const apiKey = await getApiKey(serviceId);
  const userPrompt = buildBulkPlanningUserPrompt(bookmarks, folderTree);

  debug(
    '[BulkOrganize] Planning prompt:\n\n--- SYSTEM ---\n' +
      BULK_PLANNING_SYSTEM_PROMPT +
      '\n\n--- USER ---\n' +
      userPrompt
  );

  const responseText = await callProvider(
    serviceId,
    apiKey,
    BULK_PLANNING_SYSTEM_PROMPT,
    userPrompt,
    PLANNING_MAX_TOKENS
  );

  debug('[BulkOrganize] Planning response:', responseText);

  return parseFolderPlan(responseText);
};

export const assignBookmarkBatch = async (
  serviceId: string,
  batch: CompactBookmark[],
  approvedPlan: FolderPlan,
  pathToIdMap: FolderPathMap
): Promise<BookmarkAssignment[]> => {
  const apiKey = await getApiKey(serviceId);
  const userPrompt = buildBulkAssignmentUserPrompt(batch, approvedPlan);

  debug(
    '[BulkOrganize] Assignment prompt:\n\n--- SYSTEM ---\n' +
      BULK_ASSIGNMENT_SYSTEM_PROMPT +
      '\n\n--- USER ---\n' +
      userPrompt
  );

  const responseText = await callProvider(
    serviceId,
    apiKey,
    BULK_ASSIGNMENT_SYSTEM_PROMPT,
    userPrompt,
    ASSIGNMENT_MAX_TOKENS
  );

  debug('[BulkOrganize] Assignment response:', responseText);

  return parseAssignments(responseText, batch, approvedPlan, pathToIdMap);
};
