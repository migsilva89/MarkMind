import { SERVICES, MODELS_CACHE_KEY_PREFIX, SELECTED_SERVICE_STORAGE_KEY, SELECTED_MODEL_STORAGE_KEY } from '../../../config/services';
import { fetchModelsForProvider } from '../../../services/ai/providerUtils';
import { setSelectedServiceId, setSelectedModelId } from '../../../services/selectedState';
import { type HandleOnboardingKeySaveDeps } from '../types';

export const createHandleOnboardingKeySave = (deps: HandleOnboardingKeySaveDeps) => {
  return async (): Promise<void> => {
    const { apiKeyInput, setIsValidating, setErrorMessage, setCurrentStep, persistStep } = deps;

    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      setErrorMessage('Paste your key in the field above first.');
      return;
    }

    const geminiService = SERVICES.google;

    if (!geminiService.validateKey(trimmedKey)) {
      setErrorMessage("Hmm, that doesn't look right. Make sure you copied the whole key from Google AI Studio.");
      return;
    }

    setIsValidating(true);
    setErrorMessage('');

    try {
      await chrome.storage.local.set({ [geminiService.storageKey]: trimmedKey });

      const models = await fetchModelsForProvider('google', trimmedKey);

      if (models.length === 0) {
        setErrorMessage('Something went wrong loading AI models. Try again in a moment.');
        setIsValidating(false);
        return;
      }

      const cacheKey = `${MODELS_CACHE_KEY_PREFIX}google`;
      await chrome.storage.local.set({
        [cacheKey]: { models, fetchedAt: Date.now() },
      });

      const firstModel = models[0].id;
      await chrome.storage.local.set({
        [SELECTED_SERVICE_STORAGE_KEY]: 'google',
        [SELECTED_MODEL_STORAGE_KEY]: firstModel,
        [`selectedModel_google`]: firstModel,
      });

      setSelectedServiceId('google');
      setSelectedModelId(firstModel);

      setCurrentStep('success');
      await persistStep('success');

      setIsValidating(false);
    } catch (error) {
      console.error('Failed to validate onboarding API key:', error);
      const message = error instanceof Error ? error.message.toLowerCase() : '';

      const isAuthError = message.includes('invalid') || message.includes('api key')
        || message.includes('unauthorized') || message.includes('permission');

      if (isAuthError) {
        setErrorMessage("That key didn't work. Double-check you copied the full key from Google AI Studio.");
      } else {
        setErrorMessage("Something went wrong on our end. Your key might be fine. Try again in a moment.");
      }
      setIsValidating(false);
    }
  };
};
