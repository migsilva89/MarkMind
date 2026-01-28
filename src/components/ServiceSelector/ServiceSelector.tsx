/**
 * ServiceSelector Component
 *
 * Displays service selection tabs (Google, OpenAI, Anthropic, OpenRouter)
 * Reusable in Welcome and Settings screens
 */

import { useEffect, useState } from 'react';
import {
  SERVICES,
  DEFAULT_SERVICE_ID,
  SELECTED_SERVICE_STORAGE_KEY,
  getServiceIds,
} from '../../config/services';
import './ServiceSelector.css';

interface ServiceSelectorProps {
  onServiceChange: (serviceId: string) => void;
  initialServiceId?: string;
}

function ServiceSelector({
  onServiceChange,
  initialServiceId,
}: ServiceSelectorProps) {
  const [currentServiceId, setCurrentServiceId] = useState<string>(
    initialServiceId || DEFAULT_SERVICE_ID
  );

  useEffect(() => {
    loadSavedServiceFromStorage();
  }, []);

  async function loadSavedServiceFromStorage(): Promise<void> {
    const result = await chrome.storage.local.get([SELECTED_SERVICE_STORAGE_KEY]);
    const savedServiceId = result[SELECTED_SERVICE_STORAGE_KEY];

    if (savedServiceId && SERVICES[savedServiceId]) {
      setCurrentServiceId(savedServiceId);
      onServiceChange(savedServiceId);
    }
  }

  function handleServiceSelect(serviceId: string): void {
    if (!SERVICES[serviceId]) return;

    setCurrentServiceId(serviceId);
    chrome.storage.local.set({ [SELECTED_SERVICE_STORAGE_KEY]: serviceId });
    onServiceChange(serviceId);
  }

  return (
    <div className="service-selector">
      <p className="service-selector-label">AI Provider</p>
      <div className="service-tabs-pill">
        {getServiceIds().map((serviceId) => (
          <button
            key={serviceId}
            className={`service-tab-pill ${serviceId === currentServiceId ? 'active' : ''}`}
            onClick={() => handleServiceSelect(serviceId)}
          >
            {SERVICES[serviceId].name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ServiceSelector;
