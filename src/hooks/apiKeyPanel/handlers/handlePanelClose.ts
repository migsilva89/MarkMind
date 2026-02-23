import { type ApiKeyPanelHandlerDeps } from '../types';

type HandlePanelCloseDeps = Pick<
  ApiKeyPanelHandlerDeps,
  'canClosePanel' | 'clearStatus' | 'onClose'
>;

export const createHandlePanelClose = (deps: HandlePanelCloseDeps) => {
  return (): void => {
    const { canClosePanel, clearStatus, onClose } = deps;

    if (!canClosePanel) return;
    clearStatus();
    onClose?.();
  };
};
