const TIMEOUT_BASE_MS = 60_000;
const TIMEOUT_PER_BOOKMARK_MS = 500;
const TIMEOUT_CEILING_MS = 300_000;

export const getAiTimeoutMs = (bookmarkCount: number = 1): number => {
  return Math.min(
    TIMEOUT_BASE_MS + bookmarkCount * TIMEOUT_PER_BOOKMARK_MS,
    TIMEOUT_CEILING_MS
  );
};

// Errors flagged retryable are transient (overload, rate limit, timeout) and
// worth retrying with backoff — important for free tiers that 503 under load.
export interface RetryableError extends Error {
  retryable?: boolean;
}

export const createRetryableError = (message: string): RetryableError => {
  const error: RetryableError = new Error(message);
  error.retryable = true;
  return error;
};

export const isRetryableError = (error: unknown): boolean =>
  Boolean((error as RetryableError)?.retryable);

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs = getAiTimeoutMs()
): Promise<Response> => {
  if (options.signal) {
    throw new Error('fetchWithTimeout does not support passing an external AbortSignal.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw createRetryableError('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Formats elapsed seconds as m:ss (e.g. 75 -> "1:15") for the organizing timer.
export const formatElapsedTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Splits an array into chunks of at most chunkSize items (last chunk may be smaller).
export const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  const safeSize = Math.max(1, Math.floor(chunkSize));
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += safeSize) {
    chunks.push(items.slice(index, index + safeSize));
  }
  return chunks;
};

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

// Shown when the model's reply is cut off — kept jargon-free (no "tokens").
export const TRUNCATED_RESPONSE_MESSAGE =
  'The AI response was cut off. Try selecting fewer bookmarks, or choose a model with a larger response limit.';

export const throwApiResponseError = async (providerName: string, response: Response): Promise<never> => {
  const errorBody = await response.text();
  console.error(`${providerName} API error [${response.status}]:`, errorBody);
  const rawMessage = extractApiErrorMessage(errorBody);
  const error: RetryableError = new Error(
    humanizeApiError(rawMessage || `${providerName} error: ${response.status}`, response.status)
  );
  // 429 (rate limit) and 5xx (overload/unavailable) are transient — safe to retry.
  error.retryable = response.status === 429 || response.status >= 500;
  throw error;
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

  if (statusCode === 400) {
    return "The AI couldn't handle this request. Try a different model or fewer bookmarks.";
  }

  // Unknown error — keep it friendly. Never expose raw API text or status codes;
  // the real detail is already logged to the console for developers.
  return 'Something went wrong with the AI service. Please try again, or choose a different model.';
};
