import { type ApiKeyPanelHandlerDeps } from '../types';

interface HandleApiKeyRemoveDeps extends Pick<
  ApiKeyPanelHandlerDeps,
  'currentService' | 'setHasExistingKey' | 'setApiKeyInput' | 'showStatusMessage' | 'onClose'
> {}

export const createHandleApiKeyRemove = (deps: HandleApiKeyRemoveDeps) => {
  return async (): Promise<void> => {
    const { currentService, setHasExistingKey, setApiKeyInput, showStatusMessage, onClose } = deps;

    const confirmRemoval = window.confirm(
      'Are you sure you want to remove your API key?'
    );

    if (!confirmRemoval) return;

    try {
      await chrome.storage.local.remove([currentService.storageKey]);
      setHasExistingKey(false);
      setApiKeyInput('');
      onClose?.();
    } catch (error) {
      console.error('Failed to remove API key:', error);
      showStatusMessage('Failed to remove API key', 'error');
    }
  };
};
