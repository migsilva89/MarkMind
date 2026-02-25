import { type ApiKeyPanelHandlerDeps, type ApiKeyPanelStatusMessage, AUTO_CLOSE_DELAY_MS } from '../types';
import { humanizeApiError } from '../../../utils/helpers';

interface HandleApiKeySaveDeps extends Pick<
  ApiKeyPanelHandlerDeps,
  | 'currentService'
  | 'apiKeyInput'
  | 'selectedModel'
  | 'canClosePanel'
  | 'setHasExistingKey'
  | 'setApiKeyInput'
  | 'setCanClosePanel'
  | 'showStatusMessage'
  | 'autoCloseTimeoutRef'
> {
  handlePanelClose: () => void;
  setStatus: (status: ApiKeyPanelStatusMessage) => void;
  setIsEditingKey: (value: boolean) => void;
  showButtonError: (message: string) => void;
}

export const createHandleApiKeySave = (deps: HandleApiKeySaveDeps) => {
  return async (): Promise<void> => {
    const {
      currentService,
      apiKeyInput,
      selectedModel,
      canClosePanel,
      setHasExistingKey,
      setApiKeyInput,
      setCanClosePanel,
      showStatusMessage,
      showButtonError,
      autoCloseTimeoutRef,
      handlePanelClose,
      setStatus,
      setIsEditingKey,
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

      showStatusMessage('Validating...', 'loading');

      const { testConfig } = currentService;
      const response = await fetch(testConfig.getEndpoint(trimmedKey, selectedModel), {
        method: 'POST',
        headers: testConfig.getHeaders(trimmedKey),
        body: JSON.stringify(testConfig.getBody(selectedModel)),
      });

      const data = await response.json();

      if (response.ok && testConfig.validateResponse(data)) {
        setStatus({
          message: "You're all set!",
          type: 'success',
          showGoToApp: true,
        });
        setIsEditingKey(false);

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
      } else {
        const rawMessage = data?.error?.message || 'API key is invalid';
        setStatus({
          message: humanizeApiError(rawMessage, response.status),
          type: 'error',
          showGoToApp: false,
        });
      }
    } catch (error) {
      console.error('Failed to save or validate API key:', error);
      setStatus({
        message: 'Connection failed. Key saved but could not validate.',
        type: 'error',
        showGoToApp: false,
      });
    }
  };
};
