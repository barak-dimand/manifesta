import posthog from 'posthog-js';

export const analytics = {
  identify: (userId: string, traits?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') posthog.identify(userId, traits);
  },
  track: (event: string, properties?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') posthog.capture(event, properties);
  },
  reset: () => {
    if (typeof window !== 'undefined') posthog.reset();
  },
};
