import { useEffect, useState, useCallback } from 'react';
import {
  SERVICES,
  SELECTED_SERVICE_STORAGE_KEY,
  SELECTED_MODEL_STORAGE_KEY,
  MODELS_CACHE_KEY_PREFIX,
  getServiceIds,
} from '../../config/services';
import { setSelectedServiceId, setSelectedModelId } from '../../services/selectedState';
import { fetchModelsForProvider } from '../../services/ai/providerUtils';
import { type ModelOption } from '../../types/services';
import { SpinnerIcon, RefreshIcon } from '../icons/Icons';
import Dropdown from '../Dropdown/Dropdown';
import Button from '../Button/Button';
import './ServiceSelector.css';

const getPerProviderModelKey = (serviceId: string): string =>
  `${SELECTED_MODEL_STORAGE_KEY}_${serviceId}`;

const MODELS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface ServiceSelectorProps {
  onServiceChange: (serviceId: string) => void;
  onModelChange: (modelId: string) => void;
  refreshTrigger?: number;
  section?: 'all' | 'provider' | 'model';
  externalServiceId?: string;
}

const ServiceSelector = ({
  onServiceChange,
  onModelChange,
  refreshTrigger = 0,
  section = 'all',
  externalServiceId,
}: ServiceSelectorProps) => {
  const [currentServiceId, setCurrentServiceId] = useState<string>('');
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');

  const loadModelsForService = useCallback(async (serviceId: string): Promise<ModelOption[]> => {
    const service = SERVICES[serviceId];
    if (!service) return [];

    const storageResult = await chrome.storage.local.get([service.storageKey]);
    const apiKey = storageResult[service.storageKey];

    if (!apiKey) {
      setAvailableModels([]);
      return [];
    }

    const cacheKey = `${MODELS_CACHE_KEY_PREFIX}${serviceId}`;
    const cachedResult = await chrome.storage.local.get([cacheKey]);
    const cached = cachedResult[cacheKey] as { models: ModelOption[]; fetchedAt: number } | undefined;

    if (cached && Date.now() - cached.fetchedAt < MODELS_CACHE_TTL_MS) {
      setAvailableModels(cached.models);
      return cached.models;
    }

    setIsLoadingModels(true);
    setModelsError('');

    try {
      const models = await fetchModelsForProvider(serviceId, apiKey);
      setAvailableModels(models);
      await chrome.storage.local.set({
        [cacheKey]: { models, fetchedAt: Date.now() },
      });
      return models;
    } catch (error) {
      console.error('Failed to fetch models:', error);
      if (cached?.models) {
        setAvailableModels(cached.models);
        return cached.models;
      }
      setModelsError('Could not load models. Check your API key.');
      setAvailableModels([]);
      return [];
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  const selectModel = useCallback(async (serviceId: string, modelId: string): Promise<void> => {
    setCurrentModelId(modelId);
    setSelectedModelId(modelId);
    await chrome.storage.local.set({
      [getPerProviderModelKey(serviceId)]: modelId,
      [SELECTED_MODEL_STORAGE_KEY]: modelId,
    });
    onModelChange(modelId);
  }, [onModelChange]);

  const restoreOrFirstAvailableModel = useCallback(async (serviceId: string, models: ModelOption[]): Promise<void> => {
    if (models.length === 0) return;

    const perProviderKey = getPerProviderModelKey(serviceId);
    const result = await chrome.storage.local.get([perProviderKey]);
    const savedModel = result[perProviderKey] as string | undefined;

    const matchesSaved = savedModel && models.some((model) => model.id === savedModel);
    const modelToSelect = matchesSaved ? savedModel : models[0].id;

    await selectModel(serviceId, modelToSelect);
  }, [selectModel]);

  useEffect(() => {
    if (section === 'model') return;

    const loadSavedSelectionsFromStorage = async (): Promise<void> => {
      const result = await chrome.storage.local.get([SELECTED_SERVICE_STORAGE_KEY]);
      const savedServiceId = result[SELECTED_SERVICE_STORAGE_KEY];

      if (savedServiceId && SERVICES[savedServiceId]) {
        setCurrentServiceId(savedServiceId);
        setSelectedServiceId(savedServiceId);
        onServiceChange(savedServiceId);

        const models = await loadModelsForService(savedServiceId);
        await restoreOrFirstAvailableModel(savedServiceId, models);
      }
    };

    loadSavedSelectionsFromStorage();
  }, [section, onServiceChange, loadModelsForService, restoreOrFirstAvailableModel]);

  // For model-only section: load models whenever the external provider changes
  useEffect(() => {
    if (section !== 'model') return;

    if (!externalServiceId) {
      setAvailableModels([]);
      setCurrentModelId('');
      return;
    }

    setCurrentServiceId(externalServiceId);

    const loadExternalModels = async (): Promise<void> => {
      const models = await loadModelsForService(externalServiceId);
      await restoreOrFirstAvailableModel(externalServiceId, models);
    };

    loadExternalModels();
  }, [section, externalServiceId, loadModelsForService, restoreOrFirstAvailableModel]);

  // Reload models when API key is saved (handleApiKeySave caches them first)
  useEffect(() => {
    if (refreshTrigger === 0 || !currentServiceId) return;

    const reloadModels = async (): Promise<void> => {
      const models = await loadModelsForService(currentServiceId);
      await restoreOrFirstAvailableModel(currentServiceId, models);
    };

    reloadModels();
  }, [refreshTrigger, currentServiceId, loadModelsForService, restoreOrFirstAvailableModel]);

  const handleProviderSelect = useCallback(async (serviceId: string): Promise<void> => {
    if (!SERVICES[serviceId]) return;

    setCurrentServiceId(serviceId);
    setSelectedServiceId(serviceId);
    await chrome.storage.local.set({ [SELECTED_SERVICE_STORAGE_KEY]: serviceId });
    onServiceChange(serviceId);

    setCurrentModelId('');
    setSelectedModelId('');
    setAvailableModels([]);
    setModelsError('');
    onModelChange('');

    const models = await loadModelsForService(serviceId);
    await restoreOrFirstAvailableModel(serviceId, models);
  }, [onServiceChange, onModelChange, loadModelsForService, restoreOrFirstAvailableModel]);

  const handleModelSelect = useCallback(async (modelId: string): Promise<void> => {
    if (currentServiceId) {
      setSelectedServiceId(currentServiceId);
      await selectModel(currentServiceId, modelId);
    }
  }, [currentServiceId, selectModel]);

  const handleRefreshModels = useCallback(async (): Promise<void> => {
    if (!currentServiceId) return;
    const cacheKey = `${MODELS_CACHE_KEY_PREFIX}${currentServiceId}`;
    await chrome.storage.local.remove([cacheKey]);
    const models = await loadModelsForService(currentServiceId);
    await restoreOrFirstAvailableModel(currentServiceId, models);
  }, [currentServiceId, loadModelsForService, restoreOrFirstAvailableModel]);

  const hasProvider = currentServiceId !== '';

  const providerOptions = getServiceIds().map((serviceId) => ({
    id: serviceId,
    label: SERVICES[serviceId].name,
  }));

  const modelOptions = availableModels.map((model) => ({
    id: model.id,
    label: model.name,
  }));

  return (
    <div className="service-selector">
      {section !== 'model' && (
        <Dropdown
          label="AI Provider"
          options={providerOptions}
          selectedId={currentServiceId}
          onSelect={handleProviderSelect}
          placeholder="Select a provider..."
        />
      )}
      {section !== 'provider' && (
        <>
          <div className="service-selector-model-row">
            <Dropdown
              label="Model"
              options={modelOptions}
              selectedId={currentModelId}
              onSelect={handleModelSelect}
              placeholder={isLoadingModels ? 'Loading models...' : modelsError || 'Select a model...'}
              disabled={!hasProvider || isLoadingModels || availableModels.length === 0}
            />
            {isLoadingModels && (
              <div className="service-selector-model-spinner">
                <SpinnerIcon width={12} height={12} />
              </div>
            )}
            {!isLoadingModels && availableModels.length > 0 && (
              <Button
                variant="icon"
                className="service-selector-refresh"
                onClick={handleRefreshModels}
                title="Refresh models"
              >
                <RefreshIcon width={12} height={12} />
              </Button>
            )}
          </div>
          {modelsError && (
            <p className="service-selector-error">{modelsError}</p>
          )}
        </>
      )}
    </div>
  );
};

export default ServiceSelector;
