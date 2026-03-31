import { type OnboardingStep } from '../../types/onboarding';

export interface UseOnboardingProps {
  onComplete: () => void;
  onEscapeToApiKeyPanel: () => void;
  startAtStep?: OnboardingStep;
}

export interface UseOnboardingReturn {
  currentStep: OnboardingStep;
  stepIndex: number;
  apiKeyInput: string;
  isValidating: boolean;
  errorMessage: string;
  handleNext: () => void;
  handleBack: () => void;
  handleApiKeyInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleApiKeyInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleApiKeySubmit: () => Promise<void>;
  handleOpenAIStudio: () => void;
  handleEscape: () => void;
}

export interface HandleOnboardingKeySaveDeps {
  apiKeyInput: string;
  setIsValidating: (value: boolean) => void;
  setErrorMessage: (message: string) => void;
  setCurrentStep: (step: OnboardingStep) => void;
  persistStep: (step: OnboardingStep) => Promise<void>;
}
