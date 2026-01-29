import { type StatusType, type StatusMessage } from '../../types/common';
import { type ServiceConfig } from '../../types/services';

export interface ApiKeyPanelStatusMessage extends StatusMessage {
  showGoToApp?: boolean;
}

export interface UseApiKeyPanelProps {
  isOpen: boolean;
  canClose: boolean;
  onClose?: () => void;
}

export interface ApiKeyPanelState {
  currentService: ServiceConfig;
  apiKeyInput: string;
  hasExistingKey: boolean;
  status: ApiKeyPanelStatusMessage;
  canClosePanel: boolean;
}

export interface ApiKeyPanelHandlerDeps {
  currentService: ServiceConfig;
  apiKeyInput: string;
  canClosePanel: boolean;
  setApiKeyInput: (value: string) => void;
  setHasExistingKey: (value: boolean) => void;
  setStatus: (status: ApiKeyPanelStatusMessage) => void;
  setCanClosePanel: (value: boolean) => void;
  setCurrentService: (service: ServiceConfig) => void;
  showStatusMessage: (message: string, type: StatusType) => void;
  clearStatus: () => void;
  checkExistingApiKey: (service: ServiceConfig) => Promise<boolean>;
  onClose?: () => void;
  autoCloseTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export const AUTO_CLOSE_DELAY_MS = 1500;
