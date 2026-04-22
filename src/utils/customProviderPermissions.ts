const SUPPORTED_CUSTOM_PROVIDER_PROTOCOLS = new Set(['http:', 'https:']);

const parseCustomBaseUrl = (baseUrl: string): URL => {
  let url: URL;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error('Invalid base URL format');
  }

  if (!SUPPORTED_CUSTOM_PROVIDER_PROTOCOLS.has(url.protocol)) {
    throw new Error('Base URL must start with http:// or https://');
  }

  if (url.username || url.password) {
    throw new Error('Base URL cannot include embedded credentials');
  }

  if (url.search || url.hash) {
    throw new Error('Base URL cannot include query parameters or fragments');
  }

  return url;
};

export const normalizeCustomBaseUrl = (baseUrlInput: string): string => {
  const trimmedUrl = baseUrlInput.trim();

  if (!trimmedUrl) {
    throw new Error('Please enter a base URL');
  }

  const url = parseCustomBaseUrl(trimmedUrl);
  const normalizedPath = url.pathname.replace(/\/+$/, '');

  return normalizedPath ? `${url.origin}${normalizedPath}` : url.origin;
};

export const getCustomOriginPermission = (baseUrl: string): string => {
  const url = parseCustomBaseUrl(baseUrl);
  return `${url.protocol}//${url.hostname}/*`;
};

export const requestCustomOriginPermission = async (baseUrl: string): Promise<boolean> => {
  return chrome.permissions.request({
    origins: [getCustomOriginPermission(baseUrl)],
  });
};

export const removeCustomOriginPermission = async (baseUrl: string): Promise<void> => {
  await chrome.permissions.remove({
    origins: [getCustomOriginPermission(baseUrl)],
  });
};
