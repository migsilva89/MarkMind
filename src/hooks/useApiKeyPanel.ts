import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getService,
  DEFAULT_SERVICE_ID,
  type ServiceConfig,
} from '../config/services';
import { type StatusType, type StatusMessage } from '../types/common';

const AUTO_CLOSE_DELAY_MS = 1500;

interface ApiKeyPanelStatusMessage extends StatusMessage {
  showGoToApp?: boolean;
}

interface UseApiKeyPanelProps {
  isOpen: boolean;
  canClose: boolean;
  onClose?: () => void;
}

export const useApiKeyPanel = ({ isOpen, canClose, onClose }: UseApiKeyPanelProps) => {
  const [currentService, setCurrentService] = useState<ServiceConfig>(
    getService(DEFAULT_SERVICE_ID)
  );
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [status, setStatus] = useState<ApiKeyPanelStatusMessage>({ message: '', type: null, showGoToApp: false });
  const [canClosePanel, setCanClosePanel] = useState(canClose);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkExistingApiKey = useCallback(async (service: ServiceConfig): Promise<boolean> => {
    const result = await chrome.storage.local.get([service.storageKey]);
    const keyExists = !!result[service.storageKey];
    setHasExistingKey(keyExists);
    return keyExists;
  }, []);

  const showStatusMessage = useCallback((message: string, type: StatusType): void => {
    setStatus({ message, type, showGoToApp: false });
  }, []);

  const clearStatus = useCallback((): void => {
    setStatus({ message: '', type: null, showGoToApp: false });
  }, []);

  const handlePanelClose = useCallback((): void => {
    if (!canClosePanel) return;
    clearStatus();
    onClose?.();
  }, [canClosePanel, clearStatus, onClose]);

  const handleServiceChange = useCallback((serviceId: string): void => {
    const service = getService(serviceId);
    setCurrentService(service);
    setApiKeyInput('');
    clearStatus();
    checkExistingApiKey(service);
  }, [clearStatus, checkExistingApiKey]);

  const handleApiKeyInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setApiKeyInput(event.target.value);
  }, []);

  const handleApiKeySave = useCallback(async (): Promise<void> => {
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
  }, [apiKeyInput, currentService, canClosePanel, showStatusMessage, handlePanelClose]);

  const handleApiKeyInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      handleApiKeySave();
    }
  }, [handleApiKeySave]);

  const handleApiKeyTest = useCallback(async (): Promise<void> => {
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
  }, [currentService, showStatusMessage]);

  const handleApiKeyRemove = useCallback(async (): Promise<void> => {
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
  }, [currentService.storageKey, showStatusMessage]);

  const handleOverlayClick = useCallback((): void => {
    if (canClosePanel) {
      handlePanelClose();
    }
  }, [canClosePanel, handlePanelClose]);

  const handleGoToApp = useCallback((): void => {
    clearStatus();
    onClose?.();
  }, [clearStatus, onClose]);

  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkExistingApiKey(currentService);
    }
  }, [isOpen, currentService, checkExistingApiKey]);

  useEffect(() => {
    setCanClosePanel(canClose);
  }, [canClose]);

  return {
    currentService,
    apiKeyInput,
    hasExistingKey,
    status,
    canClosePanel,
    handleServiceChange,
    handleApiKeyInputChange,
    handleApiKeySave,
    handleApiKeyInputKeyDown,
    handleApiKeyTest,
    handleApiKeyRemove,
    handleOverlayClick,
    handleGoToApp,
    handlePanelClose,
  };
};
