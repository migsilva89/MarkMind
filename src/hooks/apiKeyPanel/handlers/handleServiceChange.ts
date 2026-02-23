import { getService } from '../../../config/services';
import { type ApiKeyPanelHandlerDeps } from '../types';

type HandleServiceChangeDeps = Pick<
  ApiKeyPanelHandlerDeps,
  'setCurrentService' | 'setApiKeyInput' | 'clearStatus' | 'checkExistingApiKey'
>;

export const createHandleServiceChange = (deps: HandleServiceChangeDeps) => {
  return (serviceId: string): void => {
    const { setCurrentService, setApiKeyInput, clearStatus, checkExistingApiKey } = deps;

    const service = getService(serviceId);
    setCurrentService(service);
    setApiKeyInput('');
    clearStatus();
    checkExistingApiKey(service);
  };
};
