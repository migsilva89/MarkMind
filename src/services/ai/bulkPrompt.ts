import { type CompactBookmark, type FolderPlan } from '../../types/organize';

export const BULK_PLANNING_SYSTEM_PROMPT = `You are an AI assistant specialized in organizing bookmarks into a clean folder structure.
Analyze the bookmark titles and the current folder hierarchy, then propose an ideal folder structure.

RULES:
1. Reuse existing folders when they semantically match the content
2. Propose new folders only when existing ones don't cover the content
3. Maximum folder depth is 3 levels
4. Use clear, broad category names — not too specific, not too generic
5. Group related content together logically
6. Every bookmark should have a natural home in the proposed structure
7. Prefer fewer, well-organized folders over many small ones
8. Do NOT rename or remove existing folders — only add new ones or reuse existing

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown fences, no extra text):
{
  "folders": [
    { "path": "ExistingFolder/ExistingSubfolder", "description": "What goes here", "isNew": false },
    { "path": "ExistingFolder/NewSubfolder", "description": "What goes here", "isNew": true }
  ],
  "summary": "Brief explanation of proposed organization strategy"
}

PATH RULES:
- Use "/" as separator
- For existing folders: use the EXACT path from the provided folder tree
- For new folders: include the full parent path (e.g., "ParentFolder/NewChild")
- Set isNew to true only for folders that need to be created
- Set isNew to false for folders that already exist in the tree`;

export const buildBulkPlanningUserPrompt = (
  bookmarkTitles: string[],
  folderTree: string
): string => {
  const numberedTitles = bookmarkTitles
    .map((title, index) => `${index + 1}. ${title}`)
    .join('\n');

  const parts = [
    '## BOOKMARK TITLES',
    numberedTitles,
    '',
    '## CURRENT FOLDER STRUCTURE',
    folderTree,
    '',
    'Analyze these bookmarks and propose the ideal folder structure.',
    'Return ONLY the JSON response.',
  ];

  return parts.join('\n');
};

export const BULK_ASSIGNMENT_SYSTEM_PROMPT = `You are an AI assistant that assigns bookmarks to folders.
For each bookmark in the batch, choose the BEST matching folder from the approved folder list.

RULES:
1. Every bookmark MUST be assigned to exactly one folder from the approved list
2. Match based on content TYPE and topic, not just keywords
3. Services and tools go in tool-related folders
4. Content you READ goes in topic-related folders
5. Use the EXACT folder path from the approved list — do not invent new paths

RESPONSE FORMAT:
Return ONLY a valid JSON array (no markdown fences, no extra text):
[
  { "bookmarkId": "123", "suggestedPath": "Folder/Subfolder" }
]`;

export const buildBulkAssignmentUserPrompt = (
  bookmarks: CompactBookmark[],
  approvedPlan: FolderPlan
): string => {
  const folderList = approvedPlan.folders
    .map(folder => `- ${folder.path} — ${folder.description}`)
    .join('\n');

  const bookmarkLines = bookmarks
    .map(bookmark =>
      `- ID: ${bookmark.id} | Title: ${bookmark.title} | URL: ${bookmark.url} | Current: ${bookmark.currentFolderPath}`
    )
    .join('\n');

  const parts = [
    '## APPROVED FOLDERS',
    folderList,
    '',
    '## BOOKMARKS TO ASSIGN',
    bookmarkLines,
    '',
    'Assign each bookmark to the best matching folder.',
    'Return ONLY the JSON array.',
  ];

  return parts.join('\n');
};
