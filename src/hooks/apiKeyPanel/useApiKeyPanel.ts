import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getService, DEFAULT_SERVICE_ID, type ServiceConfig } from '../../config/services';
import { type StatusType } from '../../types/common';
import {
  type ApiKeyPanelStatusMessage,
  type UseApiKeyPanelProps,
} from './types';
import {
  createHandleApiKeySave,
  createHandleApiKeyTest,
  createHandleApiKeyRemove,
  createHandleServiceChange,
  createHandlePanelClose,
} from './handlers';

export const useApiKeyPanel = ({ isOpen, canClose, onClose }: UseApiKeyPanelProps) => {
  const [currentService, setCurrentService] = useState<ServiceConfig>(
    getService(DEFAULT_SERVICE_ID)
  );
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [status, setStatus] = useState<ApiKeyPanelStatusMessage>({
    message: '',
    type: null,
    showGoToApp: false,
  });
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

  const handlePanelClose = useMemo(
    () => createHandlePanelClose({ canClosePanel, clearStatus, onClose }),
    [canClosePanel, clearStatus, onClose]
  );

  const handleServiceChange = useMemo(
    () => createHandleServiceChange({
      setCurrentService,
      setApiKeyInput,
      clearStatus,
      checkExistingApiKey,
    }),
    [clearStatus, checkExistingApiKey]
  );

  const handleApiKeySave = useMemo(
    () => createHandleApiKeySave({
      currentService,
      apiKeyInput,
      canClosePanel,
      setHasExistingKey,
      setApiKeyInput,
      setCanClosePanel,
      showStatusMessage,
      autoCloseTimeoutRef,
      handlePanelClose,
    }),
    [currentService, apiKeyInput, canClosePanel, showStatusMessage, handlePanelClose]
  );

  const handleApiKeyTest = useMemo(
    () => createHandleApiKeyTest({
      currentService,
      showStatusMessage,
      setStatus,
    }),
    [currentService, showStatusMessage]
  );

  const handleApiKeyRemove = useMemo(
    () => createHandleApiKeyRemove({
      currentService,
      setHasExistingKey,
      setApiKeyInput,
      showStatusMessage,
      onClose,
    }),
    [currentService, showStatusMessage, onClose]
  );

  const handleApiKeyInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setApiKeyInput(event.target.value);
    },
    []
  );

  const handleApiKeyInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        handleApiKeySave();
      }
    },
    [handleApiKeySave]
  );

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
