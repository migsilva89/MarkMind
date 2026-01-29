import { type ApiKeyPanelHandlerDeps, type ApiKeyPanelStatusMessage } from '../types';

interface HandleApiKeyTestDeps extends Pick<
  ApiKeyPanelHandlerDeps,
  'currentService' | 'showStatusMessage'
> {
  setStatus: (status: ApiKeyPanelStatusMessage) => void;
}

export const createHandleApiKeyTest = (deps: HandleApiKeyTestDeps) => {
  return async (): Promise<void> => {
    const { currentService, showStatusMessage, setStatus } = deps;
    const { testConfig } = currentService;

    if (!testConfig) {
      showStatusMessage('Test not available for this service', 'error');
      return;
    }

    showStatusMessage('Testing connection...', 'loading');

    try {
      const result = await chrome.storage.local.get([currentService.storageKey]);
      const apiKey = result[currentService.storageKey] as string | undefined;

      if (!apiKey) {
        showStatusMessage('No API key found', 'error');
        return;
      }

      const response = await fetch(testConfig.getEndpoint(apiKey), {
        method: 'POST',
        headers: testConfig.getHeaders(apiKey),
        body: JSON.stringify(testConfig.getBody()),
      });

      if (response.ok) {
        const data = await response.json();
        if (testConfig.validateResponse(data)) {
          setStatus({
            message: 'Connection successful! Your API key is working.',
            type: 'success',
            showGoToApp: true,
          });
        } else {
          showStatusMessage('Unexpected response format', 'error');
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Invalid API key';
        showStatusMessage(`Error: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('API test failed:', error);
      showStatusMessage('Connection failed', 'error');
    }
  };
};
