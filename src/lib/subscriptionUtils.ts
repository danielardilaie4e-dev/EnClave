import { getPlanDetails, SubscriptionPlan } from '../lib/subscriptionPlans';

export function canCreateJob(profile: { subscription?: SubscriptionPlan; role: string }, currentJobsCount: number): boolean {
  if (profile.role !== 'employer') return false;

  const plan = profile.subscription || 'free';
  const details = getPlanDetails(plan);

  if (details.benefits.eventsPerMonth === -1) return true; // unlimited

  return currentJobsCount < details.benefits.eventsPerMonth;
}

export function canHire(profile: { subscription?: SubscriptionPlan; role: string }, currentHiresCount: number): boolean {
  if (profile.role !== 'employer') return false;

  const plan = profile.subscription || 'free';
  const details = getPlanDetails(plan);

  if (details.benefits.hiresPerMonth === -1) return true; // unlimited

  return currentHiresCount < details.benefits.hiresPerMonth;
}

export function isSuggestedProfile(profile: { subscription?: SubscriptionPlan; role: string }): boolean {
  if (profile.role !== 'musician') return false;

  const plan = profile.subscription || 'free';
  const details = getPlanDetails(plan);

  return details.benefits.suggestedProfiles;
}

export function getVisibilityLevel(profile: { subscription?: SubscriptionPlan }): string {
  const plan = profile.subscription || 'free';
  return getPlanDetails(plan).benefits.visibility;
}