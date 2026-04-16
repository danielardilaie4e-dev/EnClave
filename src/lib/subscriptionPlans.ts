export type SubscriptionPlan = 'free' | 'intermediate' | 'premium';

export interface PlanDetails {
  name: string;
  price: string; // e.g., '$0', '$10/month', '$20/month'
  benefits: {
    eventsPerMonth: number; // for employers
    hiresPerMonth: number; // for employers
    visibility: string; // description
    suggestedProfiles: boolean; // for musicians
  };
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    name: 'Gratis',
    price: '$0',
    benefits: {
      eventsPerMonth: 1,
      hiresPerMonth: 2,
      visibility: 'Básica',
      suggestedProfiles: false,
    },
  },
  intermediate: {
    name: 'Intermedio',
    price: '$10/mes',
    benefits: {
      eventsPerMonth: 5,
      hiresPerMonth: 10,
      visibility: 'Media',
      suggestedProfiles: true,
    },
  },
  premium: {
    name: 'Premium',
    price: '$20/mes',
    benefits: {
      eventsPerMonth: -1, // unlimited
      hiresPerMonth: -1, // unlimited
      visibility: 'Máxima',
      suggestedProfiles: true,
    },
  },
};

export const getPlanDetails = (plan: SubscriptionPlan): PlanDetails => {
  return SUBSCRIPTION_PLANS[plan];
};