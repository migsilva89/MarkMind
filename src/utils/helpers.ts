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

export const throwApiResponseError = async (providerName: string, response: Response): Promise<never> => {
  const errorBody = await response.text();
  console.error(`${providerName} API error [${response.status}]:`, errorBody);
  const rawMessage = extractApiErrorMessage(errorBody);
  throw new Error(humanizeApiError(rawMessage || `${providerName} error: ${response.status}`, response.status));
};

export const humanizeApiError = (rawMessage: string, statusCode: number): string => {
  const lower = rawMessage.toLowerCase();

  if (statusCode === 429 || lower.includes('quota') || lower.includes('rate limit')) {
    return 'Rate limit reached. Wait a moment or try a different model.';
  }

  if (statusCode === 401 || lower.includes('unauthorized') || lower.includes('invalid api key') || lower.includes('incorrect api key')) {
    return 'Invalid API key. Please check your key in Settings.';
  }

  if (statusCode === 403 || lower.includes('forbidden') || lower.includes('permission')) {
    return 'Access denied. This model may not be available on your plan.';
  }

  if (statusCode === 404 || lower.includes('not found') || lower.includes('does not exist')) {
    return 'Model not available. Try selecting a different model.';
  }

  if (statusCode >= 500) {
    return 'AI service temporarily unavailable. Please try again later.';
  }

  if (rawMessage.length > 120) {
    return rawMessage.slice(0, 117) + '...';
  }

  return rawMessage;
};
