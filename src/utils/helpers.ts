export const hasArrayWithItems = (data: unknown, propertyName: string): boolean => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj[propertyName]) && obj[propertyName].length > 0;
};

export const extractApiErrorMessage = (responseBody: string): string | null => {
  try {
    const parsed = JSON.parse(responseBody);
    return parsed?.error?.message || null;
  } catch {
    return null;
  }
};
