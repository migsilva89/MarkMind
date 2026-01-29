import { type ApiKeyPanelHandlerDeps, AUTO_CLOSE_DELAY_MS } from '../types';

interface HandleApiKeySaveDeps extends Pick<
  ApiKeyPanelHandlerDeps,
  | 'currentService'
  | 'apiKeyInput'
  | 'canClosePanel'
  | 'setHasExistingKey'
  | 'setApiKeyInput'
  | 'setCanClosePanel'
  | 'showStatusMessage'
  | 'autoCloseTimeoutRef'
> {
  handlePanelClose: () => void;
}

export const createHandleApiKeySave = (deps: HandleApiKeySaveDeps) => {
  return async (): Promise<void> => {
    const {
      currentService,
      apiKeyInput,
      canClosePanel,
      setHasExistingKey,
      setApiKeyInput,
      setCanClosePanel,
      showStatusMessage,
      autoCloseTimeoutRef,
      handlePanelClose,
    } = deps;

    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      showStatusMessage('Please enter an API key', 'error');
      return;
    }

    if (!currentService.validateKey(trimmedKey)) {
      showStatusMessage('Invalid API key format', 'error');
      return;
    }

    showStatusMessage('Saving...', 'loading');

    try {
      await chrome.storage.local.set({ [currentService.storageKey]: trimmedKey });
      showStatusMessage('API key saved successfully', 'success');
      setHasExistingKey(true);
      setApiKeyInput('');

      if (!canClosePanel) {
        setCanClosePanel(true);
        if (autoCloseTimeoutRef.current) {
          clearTimeout(autoCloseTimeoutRef.current);
        }
        autoCloseTimeoutRef.current = setTimeout(() => {
          handlePanelClose();
          autoCloseTimeoutRef.current = null;
        }, AUTO_CLOSE_DELAY_MS);
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      showStatusMessage('Failed to save API key', 'error');
    }
  };
};
