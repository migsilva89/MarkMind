import { type ApiKeyPanelHandlerDeps } from '../types';

interface HandleApiKeyRemoveDeps extends Pick<
  ApiKeyPanelHandlerDeps,
  'currentService' | 'setHasExistingKey' | 'setApiKeyInput' | 'showStatusMessage'
> {}

export const createHandleApiKeyRemove = (deps: HandleApiKeyRemoveDeps) => {
  return async (): Promise<void> => {
    const { currentService, setHasExistingKey, setApiKeyInput, showStatusMessage } = deps;

    const confirmRemoval = window.confirm(
      'Are you sure you want to remove your API key?'
    );

    if (!confirmRemoval) return;

    try {
      await chrome.storage.local.remove([currentService.storageKey]);
      showStatusMessage('API key removed', 'success');
      setHasExistingKey(false);
      setApiKeyInput('');
    } catch (error) {
      console.error('Failed to remove API key:', error);
      showStatusMessage('Failed to remove API key', 'error');
    }
  };
};
