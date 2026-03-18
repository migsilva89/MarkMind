import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { EMPTY_SERVICE, type ServiceConfig } from '../../config/services';
import { type StatusType } from '../../types/common';
import {
  type ApiKeyPanelStatusMessage,
  type UseApiKeyPanelProps,
  AUTO_CLOSE_DELAY_MS,
} from './types';
import {
  createHandleApiKeySave,
  createHandleApiKeyRemove,
  createHandleServiceChange,
  createHandlePanelClose,
} from './handlers';

export const useApiKeyPanel = ({ isOpen, canClose, onClose }: UseApiKeyPanelProps) => {
  const [currentService, setCurrentService] = useState<ServiceConfig>(EMPTY_SERVICE);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [status, setStatus] = useState<ApiKeyPanelStatusMessage>({
    message: '',
    type: null,
    showGoToApp: false,
  });
  const [canClosePanel, setCanClosePanel] = useState(canClose);
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [buttonError, setButtonError] = useState('');
  const buttonErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modelsRefreshTrigger, setModelsRefreshTrigger] = useState(0);

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
      setSelectedModel,
    }),
    [clearStatus, checkExistingApiKey]
  );

  const handleModelChange = useCallback((modelId: string): void => {
    setSelectedModel(modelId);

    // Auto-close after save only for first-time users to guide them to main app
    if (modelId && !canClosePanel) {
      setCanClosePanel(true);
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
      autoCloseTimeoutRef.current = setTimeout(() => {
        handlePanelClose();
        autoCloseTimeoutRef.current = null;
      }, AUTO_CLOSE_DELAY_MS);
    }
  }, [canClosePanel, handlePanelClose]);

  const showButtonError = useCallback((message: string): void => {
    if (buttonErrorTimeoutRef.current) {
      clearTimeout(buttonErrorTimeoutRef.current);
    }
    setButtonError(message);
    buttonErrorTimeoutRef.current = setTimeout(() => {
      setButtonError('');
      buttonErrorTimeoutRef.current = null;
    }, 3000);
  }, []);

  const handleStartEditingKey = useCallback((): void => {
    setIsEditingKey(true);
    clearStatus();
  }, [clearStatus]);

  const handleCancelEditing = useCallback((): void => {
    setIsEditingKey(false);
    setApiKeyInput('');
    setButtonError('');
    clearStatus();
  }, [clearStatus]);

  const handleModelsLoaded = useCallback((): void => {
    setModelsRefreshTrigger((previous) => previous + 1);
  }, []);

  const handleApiKeySave = useMemo(
    () => createHandleApiKeySave({
      currentService,
      apiKeyInput,
      setHasExistingKey,
      setApiKeyInput,
      showStatusMessage,
      showButtonError,
      setStatus,
      setIsEditingKey,
      onModelsLoaded: handleModelsLoaded,
    }),
    [currentService, apiKeyInput, showStatusMessage, showButtonError, handleModelsLoaded]
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
    const timeoutRef = autoCloseTimeoutRef;
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (buttonErrorTimeoutRef.current) {
        clearTimeout(buttonErrorTimeoutRef.current);
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
    selectedModel,
    modelsRefreshTrigger,
    hasExistingKey,
    isEditingKey,
    status,
    buttonError,
    canClosePanel,
    handleServiceChange,
    handleModelChange,
    handleApiKeyInputChange,
    handleApiKeySave,
    handleApiKeyInputKeyDown,
    handleApiKeyRemove,
    handleStartEditingKey,
    handleCancelEditing,
    handleOverlayClick,
    handleGoToApp,
    handlePanelClose,
  };
};
