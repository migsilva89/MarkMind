// Status messages shown while the AI organizes bookmarks.
// {bookmarks} is replaced with the real count (e.g. "1,240 bookmarks").
// Templates are DATA only — substitution lives in utils/loadingMessages.ts.
export const LOADING_MESSAGE_TEMPLATES: string[] = [
  'Sending your {bookmarks} for analysis...',
  'MarkMind is reading your {bookmarks}...',
  'MarkMind is choosing the best folders...',
  'Analyzing {bookmarks}...',
  'MarkMind is thinking this through — larger collections take longer...',
  'Smart sorting in progress...',
  'Still working — organizing your {bookmarks}...',
];
