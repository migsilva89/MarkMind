import { type ApiKeyPanelHandlerDeps } from '../types';

interface HandlePanelCloseDeps extends Pick<
  ApiKeyPanelHandlerDeps,
  'canClosePanel' | 'clearStatus' | 'onClose'
> {}

export const createHandlePanelClose = (deps: HandlePanelCloseDeps) => {
  return (): void => {
    const { canClosePanel, clearStatus, onClose } = deps;

    if (!canClosePanel) return;
    clearStatus();
    onClose?.();
  };
};
