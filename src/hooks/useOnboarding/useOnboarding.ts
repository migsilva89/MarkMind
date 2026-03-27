import { useState, useEffect, useCallback, useMemo } from 'react';
import { type OnboardingStep } from '../../types/onboarding';
import {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_STORAGE_KEY,
  ONBOARDING_COMPLETE_STORAGE_KEY,
  ONBOARDING_TOOLTIPS_PENDING_KEY,
} from '../../config/onboarding';
import { type UseOnboardingProps, type UseOnboardingReturn } from './types';
import { createHandleOnboardingKeySave } from './handlers';

export const useOnboarding = ({
  onComplete,
  onEscapeToApiKeyPanel,
  startAtStep,
}: UseOnboardingProps): UseOnboardingReturn => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(startAtStep || 'welcome');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (startAtStep) return;

    const loadSavedStep = async (): Promise<void> => {
      try {
        const result = await chrome.storage.local.get(ONBOARDING_STEP_STORAGE_KEY);
        const savedStep = result[ONBOARDING_STEP_STORAGE_KEY] as OnboardingStep | undefined;
        if (savedStep && ONBOARDING_STEPS.includes(savedStep)) {
          setCurrentStep(savedStep);
        }
      } catch (error) {
        console.error('Failed to load onboarding step:', error);
      }
    };

    loadSavedStep();
  }, [startAtStep]);

  const stepIndex = ONBOARDING_STEPS.indexOf(currentStep);

  const persistStep = useCallback(async (step: OnboardingStep): Promise<void> => {
    try {
      await chrome.storage.local.set({ [ONBOARDING_STEP_STORAGE_KEY]: step });
    } catch (error) {
      console.error('Failed to persist onboarding step:', error);
    }
  }, []);

  const handleNext = useCallback((): void => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < ONBOARDING_STEPS.length) {
      const nextStep = ONBOARDING_STEPS[nextIndex];
      setCurrentStep(nextStep);
      setErrorMessage('');
      persistStep(nextStep);
    }
  }, [stepIndex, persistStep]);

  const handleBack = useCallback((): void => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = ONBOARDING_STEPS[prevIndex];
      setCurrentStep(prevStep);
      setErrorMessage('');
      persistStep(prevStep);
    }
  }, [stepIndex, persistStep]);

  const handleApiKeyInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setApiKeyInput(event.target.value);
      if (errorMessage) {
        setErrorMessage('');
      }
    },
    [errorMessage]
  );

  const handleApiKeySubmit = useMemo(
    () => createHandleOnboardingKeySave({
      apiKeyInput,
      setIsValidating,
      setErrorMessage,
      setCurrentStep,
      persistStep,
    }),
    [apiKeyInput, persistStep]
  );

  const handleApiKeyInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        handleApiKeySubmit();
      }
    },
    [handleApiKeySubmit]
  );

  const handleOpenAIStudio = useCallback((): void => {
    chrome.tabs.create({ url: 'https://aistudio.google.com/apikey' });
  }, []);

  const handleEscape = useCallback(async (): Promise<void> => {
    try {
      await chrome.storage.local.set({ [ONBOARDING_COMPLETE_STORAGE_KEY]: true });
    } catch (error) {
      console.error('Failed to mark onboarding as complete:', error);
    }
    onEscapeToApiKeyPanel();
  }, [onEscapeToApiKeyPanel]);

  const handleComplete = useCallback(async (): Promise<void> => {
    try {
      await chrome.storage.local.set({
        [ONBOARDING_COMPLETE_STORAGE_KEY]: true,
        [ONBOARDING_TOOLTIPS_PENDING_KEY]: true,
      });
    } catch (error) {
      console.error('Failed to mark onboarding as complete:', error);
    }
    onComplete();
  }, [onComplete]);

  const wrappedHandleNext = useCallback((): void => {
    if (currentStep === 'success') {
      handleComplete();
    } else {
      handleNext();
    }
  }, [currentStep, handleComplete, handleNext]);

  return {
    currentStep,
    stepIndex,
    apiKeyInput,
    isValidating,
    errorMessage,
    handleNext: wrappedHandleNext,
    handleBack,
    handleApiKeyInputChange,
    handleApiKeyInputKeyDown,
    handleApiKeySubmit,
    handleOpenAIStudio,
    handleEscape,
  };
};
