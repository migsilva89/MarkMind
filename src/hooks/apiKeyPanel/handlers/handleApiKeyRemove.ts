import { type ApiKeyPanelHandlerDeps } from '../types';

type HandleApiKeyRemoveDeps = Pick<
  ApiKeyPanelHandlerDeps,
  'currentService' | 'setHasExistingKey' | 'setApiKeyInput' | 'showStatusMessage' | 'onClose'
>;

export const createHandleApiKeyRemove = (deps: HandleApiKeyRemoveDeps) => {
  return async (): Promise<void> => {
    const { currentService, setHasExistingKey, setApiKeyInput, showStatusMessage, onClose } = deps;

    const confirmRemoval = window.confirm(
      'Are you sure you want to remove your API key?'
    );

    if (!confirmRemoval) return;

    try {
      const keysToRemove = [currentService.storageKey];
      if (currentService.baseUrlStorageKey) {
        keysToRemove.push(currentService.baseUrlStorageKey);
      }
      await chrome.storage.local.remove(keysToRemove);
      setHasExistingKey(false);
      setApiKeyInput('');
      onClose?.();
    } catch (error) {
      console.error('Failed to remove API key:', error);
      showStatusMessage('Failed to remove API key', 'error');
    }
  };
};
