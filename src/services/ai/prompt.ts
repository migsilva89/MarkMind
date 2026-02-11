import { type AIOrganizeRequest } from '../../types/ai';

export const SYSTEM_PROMPT = `You are an AI assistant specialized in organizing bookmarks into folders.
Your task is to analyze a bookmark and suggest the best existing folder from the provided hierarchy, or suggest a new folder name if none fit.

CRITICAL RULES:
1. Use existing folders when they semantically match the bookmark content, respecting their hierarchy
2. Match based on content TYPE, not just keywords
3. Services/tools you USE go in tool-related folders
4. Content you READ goes in topic-related folders
5. Create subfolders for related topics WITHIN existing main folders first
6. Maximum folder depth is 3 levels
7. Suggest a NEW folder only if no existing folder or subfolder is appropriate
8. New folders should be clear category names (e.g., "Entertainment", "Finance", "Health")
9. BEFORE suggesting "Other Bookmarks", try: existing folders → existing subfolders → new subfolder → new main folder
10. NEVER use generic folders like "Other Bookmarks" if a better option exists

RESPONSE FORMAT:
- Return the EXACT folder path using "/" as separator, matching folder names from the hierarchy exactly
- Example: if the tree shows Bookmarks > Development Tools > Git, return "Bookmarks/Development Tools/Git"
- If new folder needed: return "NEW: FolderName" (e.g., "NEW: Entertainment")
- If new subfolder in existing folder: return "NEW: ParentFolder/NewSubfolder" (e.g., "NEW: Development Tools/Frameworks")
- Return ONLY the path, no explanation`;

export const buildUserPrompt = (request: AIOrganizeRequest): string => {
  const parts = [
    '## PAGE INFORMATION',
    `Title: ${request.title}`,
    `URL: ${request.url}`,
  ];

  if (request.description) {
    parts.push(`Description: ${request.description}`);
  }

  if (request.h1) {
    parts.push(`H1: ${request.h1}`);
  }

  parts.push('');
  parts.push('## EXISTING FOLDER STRUCTURE (hierarchy)');
  parts.push(request.folderTree);
  parts.push('');
  parts.push('Choose the best matching folder path from the hierarchy above, or suggest "NEW: CategoryName" if none fit.');
  parts.push('Return ONLY the exact folder path using "/" as separator:');

  return parts.join('\n');
};
