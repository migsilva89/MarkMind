import { type ApiKeyPanelHandlerDeps, type ApiKeyPanelStatusMessage } from '../types';
import { fetchModelsForProvider } from '../../../services/ai/providerUtils';
import { MODELS_CACHE_KEY_PREFIX } from '../../../config/services';

interface HandleApiKeySaveDeps extends Pick<
  ApiKeyPanelHandlerDeps,
  | 'currentService'
  | 'apiKeyInput'
  | 'setHasExistingKey'
  | 'setApiKeyInput'
  | 'showStatusMessage'
> {
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
      setHasExistingKey,
      setApiKeyInput,
      showStatusMessage,
      showButtonError,
      setStatus,
      setIsEditingKey,
      onModelsLoaded,
    } = deps;

    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      showButtonError('Please enter an API key');
      return;
    }

    if (!currentService.validateKey(trimmedKey)) {
      showButtonError('Invalid API key format');
      return;
    }

    try {
      await chrome.storage.local.set({ [currentService.storageKey]: trimmedKey });
      setHasExistingKey(true);
      setApiKeyInput('');

      showStatusMessage('Validating key & loading models...', 'loading');

      // Fetching models validates the key implicitly — if the key is invalid, this throws
      const models = await fetchModelsForProvider(currentService.id, trimmedKey);

      if (models.length === 0) {
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

      // Signal ServiceSelector to reload models from cache
      onModelsLoaded();
    } catch (error) {
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
