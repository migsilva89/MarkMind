export const hasArrayWithItems = (data: unknown, propertyName: string): boolean => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj[propertyName]) && obj[propertyName].length > 0;
};

const SIMILARITY_THRESHOLD = 0.75;

const normalizeToWords = (text: string): string[] =>
  text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).filter(Boolean);

export const isHeadingSimilarToTitle = (title: string, heading: string): boolean => {
  const titleWords = new Set(normalizeToWords(title));
  const headingWords = normalizeToWords(heading);

  if (headingWords.length === 0) return true;

  const matchingWordCount = headingWords.filter(word => titleWords.has(word)).length;
  const similarity = matchingWordCount / headingWords.length;

  return similarity >= SIMILARITY_THRESHOLD;
};

export const extractApiErrorMessage = (responseBody: string): string | null => {
  try {
    const parsed = JSON.parse(responseBody);
    return parsed?.error?.message || null;
  } catch {
    return null;
  }
};
