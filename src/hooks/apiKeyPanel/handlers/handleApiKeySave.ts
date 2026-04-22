import { type ApiKeyPanelHandlerDeps, type ApiKeyPanelStatusMessage } from '../types';
import { fetchModelsForProvider } from '../../../services/ai/providerUtils';
import { MODELS_CACHE_KEY_PREFIX } from '../../../config/services';
import {
  getCustomOriginPermission,
  normalizeCustomBaseUrl,
  removeCustomOriginPermission,
  requestCustomOriginPermission,
} from '../../../utils/customProviderPermissions';

interface HandleApiKeySaveDeps extends Pick<
  ApiKeyPanelHandlerDeps,
  | 'currentService'
  | 'apiKeyInput'
  | 'setHasExistingKey'
  | 'setApiKeyInput'
  | 'showStatusMessage'
> {
  baseUrlInput: string;
  setStatus: (status: ApiKeyPanelStatusMessage) => void;
  setIsEditingKey: (value: boolean) => void;
  showButtonError: (message: string) => void;
  onModelsLoaded: () => void;
}

export const createHandleApiKeySave = (deps: HandleApiKeySaveDeps) => {
  return async (): Promise<void> => {
    const {
      currentService,
      apiKeyInput,
      baseUrlInput,
      setHasExistingKey,
      setApiKeyInput,
      showStatusMessage,
      showButtonError,
      setStatus,
      setIsEditingKey,
      onModelsLoaded,
    } = deps;

    const trimmedKey = apiKeyInput.trim();
    let normalizedBaseUrl = '';
    let previousBaseUrl = '';
    let requestedOriginPermission = '';
    let shouldRollbackRequestedPermission = false;

    if (!trimmedKey) {
      showButtonError('Please enter an API key');
      return;
    }

    if (!currentService.validateKey(trimmedKey)) {
      showButtonError('Invalid API key format');
      return;
    }

    try {
      if (currentService.baseUrlStorageKey) {
        try {
          normalizedBaseUrl = normalizeCustomBaseUrl(baseUrlInput);
        } catch (error) {
          showButtonError(error instanceof Error ? error.message : 'Invalid base URL format');
          return;
        }

        requestedOriginPermission = getCustomOriginPermission(normalizedBaseUrl);
        const permissionGranted = await requestCustomOriginPermission(normalizedBaseUrl);

        if (!permissionGranted) {
          setStatus({
            message: 'Host access was not granted. Allow access to this endpoint to use the Custom provider.',
            type: 'error',
            showGoToApp: false,
          });
          return;
        }

        const storedBaseUrlResult = await chrome.storage.local.get([currentService.baseUrlStorageKey]);
        previousBaseUrl = storedBaseUrlResult[currentService.baseUrlStorageKey] as string || '';
        const previousOriginPermission = previousBaseUrl
          ? getCustomOriginPermission(previousBaseUrl)
          : '';

        shouldRollbackRequestedPermission = requestedOriginPermission !== previousOriginPermission;
      }

      showStatusMessage('Validating key & loading models...', 'loading');

      // Fetching models validates the key implicitly — if the key is invalid, this throws.
      const models = await fetchModelsForProvider(currentService.id, trimmedKey, normalizedBaseUrl || undefined);

      await chrome.storage.local.set({
        [currentService.storageKey]: trimmedKey,
        ...(currentService.baseUrlStorageKey && { [currentService.baseUrlStorageKey]: normalizedBaseUrl }),
      });
      setHasExistingKey(true);
      setApiKeyInput('');
      const shouldRemovePreviousPermission = (
        previousBaseUrl &&
        getCustomOriginPermission(previousBaseUrl) !== requestedOriginPermission
      );

      if (models.length === 0) {
        if (shouldRemovePreviousPermission) {
          await removeCustomOriginPermission(previousBaseUrl);
        }

        setStatus({
          message: 'Key accepted but no models found.',
          type: 'default',
          showGoToApp: false,
        });
        return;
      }

      // Cache models so ServiceSelector can read them instantly without re-fetching
      const cacheKey = `${MODELS_CACHE_KEY_PREFIX}${currentService.id}`;
      await chrome.storage.local.set({
        [cacheKey]: { models, fetchedAt: Date.now() },
      });

      setStatus({
        message: `Key valid — ${models.length} models available! Select a model below.`,
        type: 'success',
        showGoToApp: false,
      });
      setIsEditingKey(false);

      if (shouldRemovePreviousPermission) {
        await removeCustomOriginPermission(previousBaseUrl);
      }

      // Signal ServiceSelector to reload models from cache
      onModelsLoaded();
    } catch (error) {
      if (currentService.baseUrlStorageKey && shouldRollbackRequestedPermission) {
        try {
          await removeCustomOriginPermission(normalizedBaseUrl);
        } catch (permissionError) {
          console.warn('Failed to roll back custom host permission:', permissionError);
        }
      }

      console.error('Failed to save or validate API key:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setStatus({
        message: errorMessage.includes('401') || errorMessage.includes('403')
          ? 'Invalid API key. Please check and try again.'
          : `Validation failed: ${errorMessage}`,
        type: 'error',
        showGoToApp: false,
      });
    }
  };
};
