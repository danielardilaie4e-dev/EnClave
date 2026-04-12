const ONBOARDING_INTENT_KEY = 'enclave:onboarding-intent';

export const setOnboardingIntent = (uid: string) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ONBOARDING_INTENT_KEY, uid);
};

export const getOnboardingIntent = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ONBOARDING_INTENT_KEY);
};

export const clearOnboardingIntent = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ONBOARDING_INTENT_KEY);
};

export const hasOnboardingIntent = (uid?: string | null) => {
  if (!uid) return false;
  return getOnboardingIntent() === uid;
};
