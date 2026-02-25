import { useEffect, useState, useCallback } from 'react';
import {
  SERVICES,
  DEFAULT_SERVICE_ID,
  SELECTED_SERVICE_STORAGE_KEY,
  SELECTED_MODEL_STORAGE_KEY,
  getServiceIds,
} from '../../config/services';
import { setSelectedServiceId, setSelectedModelId } from '../../services/selectedState';
import Dropdown from '../Dropdown/Dropdown';
import './ServiceSelector.css';

const getPerProviderModelKey = (serviceId: string): string =>
  `${SELECTED_MODEL_STORAGE_KEY}_${serviceId}`;

interface ServiceSelectorProps {
  onServiceChange: (serviceId: string) => void;
  onModelChange: (modelId: string) => void;
}

const ServiceSelector = ({
  onServiceChange,
  onModelChange,
}: ServiceSelectorProps) => {
  const [currentServiceId, setCurrentServiceId] = useState<string>('');
  const [currentModelId, setCurrentModelId] = useState<string>('');

  useEffect(() => {
    const loadSavedSelectionsFromStorage = async (): Promise<void> => {
      const result = await chrome.storage.local.get([
        SELECTED_SERVICE_STORAGE_KEY,
        SELECTED_MODEL_STORAGE_KEY,
      ]);

      const savedServiceId = result[SELECTED_SERVICE_STORAGE_KEY];
      const savedModelId = result[SELECTED_MODEL_STORAGE_KEY];

      if (savedServiceId && SERVICES[savedServiceId]) {
        setCurrentServiceId(savedServiceId);
        setSelectedServiceId(savedServiceId);
        onServiceChange(savedServiceId);

        const service = SERVICES[savedServiceId];
        if (savedModelId && service.models.some(model => model.id === savedModelId)) {
          setCurrentModelId(savedModelId);
          setSelectedModelId(savedModelId);
          onModelChange(savedModelId);
        }
      }
    };

    loadSavedSelectionsFromStorage();
  }, [onServiceChange, onModelChange]);

  const handleProviderSelect = useCallback(async (serviceId: string): Promise<void> => {
    if (!SERVICES[serviceId]) return;

    setCurrentServiceId(serviceId);
    setSelectedServiceId(serviceId);
    await chrome.storage.local.set({ [SELECTED_SERVICE_STORAGE_KEY]: serviceId });
    onServiceChange(serviceId);

    const perProviderKey = getPerProviderModelKey(serviceId);
    const result = await chrome.storage.local.get([perProviderKey]);
    const savedModel = result[perProviderKey];

    const service = SERVICES[serviceId];
    if (savedModel && service.models.some(model => model.id === savedModel)) {
      setCurrentModelId(savedModel);
      setSelectedModelId(savedModel);
      await chrome.storage.local.set({ [SELECTED_MODEL_STORAGE_KEY]: savedModel });
      onModelChange(savedModel);
    } else {
      setCurrentModelId('');
      setSelectedModelId('');
      await chrome.storage.local.set({ [SELECTED_MODEL_STORAGE_KEY]: '' });
      onModelChange('');
    }
  }, [onServiceChange, onModelChange]);

  const handleModelSelect = useCallback(async (modelId: string): Promise<void> => {
    setCurrentModelId(modelId);
    setSelectedModelId(modelId);
    if (currentServiceId) {
      setSelectedServiceId(currentServiceId);
      await chrome.storage.local.set({
        [getPerProviderModelKey(currentServiceId)]: modelId,
        [SELECTED_MODEL_STORAGE_KEY]: modelId,
      });
    }
    onModelChange(modelId);
  }, [currentServiceId, onModelChange]);

  const hasProvider = currentServiceId !== '';
  const currentService = hasProvider
    ? SERVICES[currentServiceId] || SERVICES[DEFAULT_SERVICE_ID]
    : null;

  const providerOptions = getServiceIds().map((serviceId) => ({
    id: serviceId,
    label: SERVICES[serviceId].name,
  }));

  const modelOptions = currentService
    ? currentService.models.map((model) => ({ id: model.id, label: model.name }))
    : [];

  return (
    <div className="service-selector">
      <Dropdown
        label="AI Provider"
        options={providerOptions}
        selectedId={currentServiceId}
        onSelect={handleProviderSelect}
        placeholder="Select a provider..."
      />
      <Dropdown
        label="Model"
        options={modelOptions}
        selectedId={currentModelId}
        onSelect={handleModelSelect}
        placeholder="Select a model..."
        disabled={!hasProvider}
      />
    </div>
  );
};

export default ServiceSelector;
