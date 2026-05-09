// Meta Pixel (Facebook) — fires conversion events for Custom/Lookalike Audiences.
// All functions are safe to call server-side (no-ops when window is undefined).

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: (...args: any[]) => void;
    _fbq: unknown;
  }
}

function fbq(action: string, event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq(action, event, params);
}

export function pixelPageView() {
  fbq('track', 'PageView');
}

/** User showed intent — landed on wizard or viewed key content. */
export function pixelViewContent(contentName: string) {
  fbq('track', 'ViewContent', { content_name: contentName });
}

/** User submitted their email / completed the board form — high intent signal. */
export function pixelLead() {
  fbq('track', 'Lead');
}

/** User added a paid offer to their selection. */
export function pixelInitiateCheckout(offerIds: string[]) {
  fbq('track', 'InitiateCheckout', { content_ids: offerIds });
}

/** User completed sign-up and saved their board — strongest conversion signal. */
export function pixelCompleteRegistration() {
  fbq('track', 'CompleteRegistration');
}
