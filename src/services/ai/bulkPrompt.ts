import { type CompactBookmark, type FolderPlan } from '../../types/organize';

export const BULK_PLANNING_SYSTEM_PROMPT = `You are a bookmark organizer AI. Analyze bookmarks and propose a clean folder structure.

ANALYSIS STRATEGY:
1. URL DOMAIN is your strongest signal — it reveals what a bookmark IS:
   - Code/dev sites → Development-related folders
   - Documentation sites → Development or topic-specific folders
   - SaaS tools and dashboards → Tools or Productivity folders
   - News, blogs, articles → Reading or topic-specific folders
   - Shopping and e-commerce → Shopping-related folders
   - Video, music, streaming → Entertainment or Media folders
   - Learning platforms → Education or Learning folders
   - Social media → Social or Communication folders
2. TITLE refines the category within a domain
3. CURRENT FOLDER shows the user's existing organization — respect it when the folder name is descriptive and accurate
4. Group by PURPOSE: why the user saved it (daily tool, reference, learning, shopping, entertainment)

FOLDER DESIGN RULES:
1. Reuse existing folders when they semantically match — do NOT rename or remove them
2. Only create new folders when no existing folder covers the content
3. Maximum folder depth: 3 levels
4. A new folder needs at least 3 bookmarks to justify its existence — otherwise merge into a broader category
5. Use clear, broad category names — avoid overly specific names
6. If bookmarks are already in well-named folders, INCLUDE those folders in the plan
7. Prefer fewer well-organized folders over many small ones

RESPONSE FORMAT:
Return ONLY valid JSON (no markdown fences, no extra text):
{
  "folders": [
    { "path": "ExistingFolder/ExistingSubfolder", "description": "What goes here", "isNew": false },
    { "path": "ExistingFolder/NewSubfolder", "description": "What goes here", "isNew": true }
  ],
  "summary": "Brief explanation of proposed organization strategy"
}

PATH FORMAT RULES:
- Use "/" as separator
- For existing folders: use the EXACT path from the provided folder tree
- For new folders: include the full parent path (e.g., "ParentFolder/NewChild")
- isNew = true ONLY for folders that need to be created
- isNew = false for folders that already exist in the tree`;

export const buildBulkPlanningUserPrompt = (
  bookmarks: CompactBookmark[],
  folderTree: string
): string => {
  const bookmarkLines = bookmarks
    .map((bookmark, index) =>
      `${index + 1}. ${bookmark.title} | ${bookmark.url} | Current: ${bookmark.currentFolderPath}`
    )
    .join('\n');

  const parts = [
    '## BOOKMARKS TO ORGANIZE',
    bookmarkLines,
    '',
    '## CURRENT FOLDER STRUCTURE',
    folderTree,
    '',
    'Analyze these bookmarks and propose the ideal folder structure.',
    'Reuse existing folders where appropriate. Only create new folders when necessary.',
    'Return ONLY the JSON response.',
  ];

  return parts.join('\n');
};

export const BULK_ASSIGNMENT_SYSTEM_PROMPT = `You are a bookmark organizer AI. Assign each bookmark to the BEST matching folder from the approved list.

MATCHING STRATEGY:
1. URL DOMAIN is your strongest signal — it reveals what the bookmark IS (tool, article, store, social, etc.)
2. Match based on the bookmark's PURPOSE (tool you use, reference you read, thing you buy), not just title keywords
3. If a bookmark's CURRENT folder closely matches an approved folder, prefer keeping it there — avoid unnecessary moves
4. Services/apps/dashboards the user USES → tool or productivity folders
5. Content the user READS (articles, tutorials, docs) → topic or learning folders
6. When multiple folders could fit, choose the most specific match

RULES:
1. Every bookmark MUST be assigned to exactly one folder from the approved list
2. Use the EXACT folder path from the approved list — do NOT invent new paths or modify them
3. Do NOT leave any bookmark unassigned

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
