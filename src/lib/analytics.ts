import posthog from 'posthog-js';
import { pixelPageView, pixelViewContent, pixelLead, pixelInitiateCheckout, pixelCompleteRegistration } from './pixel';

function ph(event: string, props?: Record<string, unknown>) {
  if (typeof window !== 'undefined') posthog.capture(event, props);
}

export const analytics = {
  // ── Identity ────────────────────────────────────────────────────────────────

  identify(userId: string, traits?: Record<string, unknown>) {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, traits);
    }
  },

  reset() {
    if (typeof window !== 'undefined') posthog.reset();
  },

  // ── Pages ───────────────────────────────────────────────────────────────────

  page(path: string) {
    ph('$pageview', { $current_url: path });
    pixelPageView();
  },

  // ── Landing ─────────────────────────────────────────────────────────────────

  landingCtaClicked(placement: 'hero' | 'pricing' | 'navbar' | 'how_it_works' | 'footer') {
    ph('landing_cta_clicked', { placement });
    pixelViewContent('landing_cta');
  },

  // ── Wizard funnel ───────────────────────────────────────────────────────────

  wizardStarted() {
    ph('wizard_started');
    pixelViewContent('wizard');
  },

  wizardStepViewed(step: number, stepName: string) {
    ph('wizard_step_viewed', { step, step_name: stepName });
  },

  // Step 1 — Dream Life
  step1Completed(props: {
    areas: string[];
    dreamWordCount: number;
    usedExplorer: boolean;
    explorerAnswersCount: number;
  }) {
    ph('wizard_step1_completed', {
      areas: props.areas,
      area_count: props.areas.length,
      dream_word_count: props.dreamWordCount,
      used_explorer: props.usedExplorer,
      explorer_answers: props.explorerAnswersCount,
    });
  },

  // Step 2 — Photos & Style
  photoUploaded(count: number) {
    ph('photo_uploaded', { photo_count: count });
  },

  styleSelected(style: string) {
    ph('style_selected', { style });
  },

  genderSelected(gender: string) {
    ph('gender_selected', { gender });
  },

  step2Completed(props: { style: string; photoCount: number; gender: string | null }) {
    ph('wizard_step2_completed', props);
  },

  // Step 3 — Quotes
  quoteToggled(action: 'selected' | 'deselected', source: 'curated' | 'custom') {
    ph('quote_toggled', { action, source });
  },

  step3Completed(props: { selectedCount: number; customCount: number }) {
    ph('wizard_step3_completed', {
      selected_quotes: props.selectedCount,
      custom_quotes: props.customCount,
      total_quotes: props.selectedCount + props.customCount,
    });
  },

  // Step 4 — Offers
  offerToggled(offerId: string, action: 'added' | 'removed') {
    ph('offer_toggled', { offer_id: offerId, action });
    if (action === 'added') {
      pixelInitiateCheckout([offerId]);
    }
  },

  signInTriggered(trigger: 'board_save') {
    ph('sign_in_triggered', { trigger });
  },

  boardSaved(props: {
    boardId: string;
    offers: string[];
    hasPaid: boolean;
    areas: string[];
    style: string;
    hasPhotos: boolean;
    quoteCount: number;
    gender: string | null;
  }) {
    ph('board_saved', {
      board_id: props.boardId,
      offers: props.offers,
      has_paid_offer: props.hasPaid,
      life_areas: props.areas,
      style: props.style,
      has_photos: props.hasPhotos,
      quote_count: props.quoteCount,
      gender: props.gender,
    });
    // Facebook: Lead for free, CompleteRegistration for any board save post-auth
    pixelLead();
    pixelCompleteRegistration();
  },

  // ── Dashboard ───────────────────────────────────────────────────────────────

  dashboardViewed() {
    ph('dashboard_viewed');
  },

  boardShared() {
    ph('board_shared');
  },

  boardRenamed() {
    ph('board_renamed');
  },

  boardDeleted() {
    ph('board_deleted');
  },

  boardEdited() {
    ph('board_edited');
  },

  wallpaperShared() {
    ph('wallpaper_shared');
  },

  wallpaperDownloaded() {
    ph('wallpaper_downloaded');
  },

  wallpaperDeleted() {
    ph('wallpaper_deleted');
  },
};
