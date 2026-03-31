import { type OnboardingStep } from '../types/onboarding';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'explain',
  'guide',
  'success',
];

export const ONBOARDING_STEP_STORAGE_KEY = 'onboardingStep';
export const ONBOARDING_COMPLETE_STORAGE_KEY = 'onboardingComplete';
export const ONBOARDING_TOOLTIPS_PENDING_KEY = 'showOnboardingTooltips';
export const ONBOARDING_TOOLTIPS_SEEN_KEY = 'onboardingTooltipsSeen';

export const AI_STUDIO_URL = 'https://aistudio.google.com/apikey';
