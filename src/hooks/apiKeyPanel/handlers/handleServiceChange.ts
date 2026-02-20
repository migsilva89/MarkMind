import { getService } from '../../../config/services';
import { type ApiKeyPanelHandlerDeps } from '../types';

interface HandleServiceChangeDeps extends Pick<
  ApiKeyPanelHandlerDeps,
  'setCurrentService' | 'setApiKeyInput' | 'clearStatus' | 'checkExistingApiKey' | 'setSelectedModel'
> {}

export const createHandleServiceChange = (deps: HandleServiceChangeDeps) => {
  return (serviceId: string): void => {
    const { setCurrentService, setApiKeyInput, clearStatus, checkExistingApiKey, setSelectedModel } = deps;

    const service = getService(serviceId);
    setCurrentService(service);
    setApiKeyInput('');
    clearStatus();
    checkExistingApiKey(service);
    setSelectedModel('');
  };
};
