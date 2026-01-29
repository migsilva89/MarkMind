import { useEffect, useState, useCallback } from 'react';
import {
  SERVICES,
  DEFAULT_SERVICE_ID,
  SELECTED_SERVICE_STORAGE_KEY,
  getServiceIds,
} from '../../config/services';
import Button from '../Button/Button';
import './ServiceSelector.css';

interface ServiceSelectorProps {
  onServiceChange: (serviceId: string) => void;
  initialServiceId?: string;
}

const ServiceSelector = ({
  onServiceChange,
  initialServiceId,
}: ServiceSelectorProps) => {
  const [currentServiceId, setCurrentServiceId] = useState<string>(
    initialServiceId || DEFAULT_SERVICE_ID
  );

  useEffect(() => {
    const loadSavedServiceFromStorage = async (): Promise<void> => {
      const result = await chrome.storage.local.get([SELECTED_SERVICE_STORAGE_KEY]);
      const savedServiceId = result[SELECTED_SERVICE_STORAGE_KEY];

      if (savedServiceId && SERVICES[savedServiceId]) {
        setCurrentServiceId(savedServiceId);
        onServiceChange(savedServiceId);
      }
    };

    loadSavedServiceFromStorage();
  }, [onServiceChange]);

  const handleServiceSelect = useCallback((serviceId: string): void => {
    if (!SERVICES[serviceId]) return;

    setCurrentServiceId(serviceId);
    chrome.storage.local.set({ [SELECTED_SERVICE_STORAGE_KEY]: serviceId });
    onServiceChange(serviceId);
  }, [onServiceChange]);

  return (
    <div className="service-selector">
      <p className="service-selector-label">AI Provider</p>
      <div className="service-tabs-pill">
        {getServiceIds().map((serviceId) => (
          <Button
            key={serviceId}
            variant="tab"
            active={serviceId === currentServiceId}
            onClick={() => handleServiceSelect(serviceId)}
          >
            {SERVICES[serviceId].name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ServiceSelector;
