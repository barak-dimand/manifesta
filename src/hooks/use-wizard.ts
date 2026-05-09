'use client';
import { useState, useCallback } from 'react';
import type { LifeArea, AestheticStyle, Goal } from '@/lib/validations/wizard';

export type SerializablePromptState = {
  selectedIndices: number[];
  edits: Record<number, string>;
  customText: string;
};

export interface WizardState {
  step: number;
  maxStep: number; // furthest step ever reached in this session
  selectedAreas: LifeArea[];
  dreams: string;
  explorerPromptStates: SerializablePromptState[] | null; // Dream Explorer chip selections
  photos: string[]; // blob URLs — not persisted
  style: AestheticStyle;
  goals: Goal[];
  enableTimeline: boolean;
  manifesto: string;
  boardId: string | null; // set after successful post-auth board save
  selectedOffers: string[]; // which offer tiers the user selected
  selectedQuotes: string[]; // curated quotes chosen in step 3
  customQuotes: string[]; // user-written quotes / affirmations
  quoteEdits: Record<string, string>; // original text → edited text for curated quotes
  dreamPriorities: Record<string, { want: number; believe: number }>; // dream text → priority scores
  gender: 'male' | 'female' | 'prefer_not_to_say' | null;
}

const initialState: WizardState = {
  step: 0,
  maxStep: 0,
  selectedAreas: [],
  dreams: '',
  explorerPromptStates: null,
  photos: [],
  style: 'minimal',
  goals: [],
  enableTimeline: false,
  manifesto: '',
  boardId: null,
  selectedOffers: ['wallpaper'],
  selectedQuotes: [],
  customQuotes: [],
  quoteEdits: {},
  dreamPriorities: {},
  gender: null,
};

const STORAGE_KEY = 'manifesta-wizard';

function loadState(): WizardState {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<WizardState>;
    // Only keep persisted photos that are real server URLs (discard stale blob: URLs)
    const photos = (parsed.photos ?? []).filter((p: string) => p.startsWith('http'));
    return { ...initialState, ...parsed, photos };
  } catch {
    return initialState;
  }
}

function persistState(s: WizardState) {
  try {
    // Only persist server-uploaded photo URLs, not ephemeral blob: URLs
    const photos = s.photos.filter((p) => p.startsWith('http'));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, photos }));
  } catch {
    // ignore quota errors
  }
}

export function useWizard() {
  const [state, setState] = useState<WizardState>(loadState);

  const setAndPersist = useCallback((updater: (s: WizardState) => WizardState) => {
    setState((s) => {
      const next = updater(s);
      persistState(next);
      return next;
    });
  }, []);

  const next = useCallback(
    () =>
      setAndPersist((s) => {
        const newStep = Math.min(s.step + 1, 3);
        return { ...s, step: newStep, maxStep: Math.max(s.maxStep, newStep) };
      }),
    [setAndPersist],
  );

  const prev = useCallback(
    () => setAndPersist((s) => ({ ...s, step: Math.max(s.step - 1, 0) })),
    [setAndPersist],
  );

  const goToStep = useCallback(
    (target: number) =>
      setAndPersist((s) => ({
        ...s,
        step: Math.max(0, Math.min(target, s.maxStep)),
      })),
    [setAndPersist],
  );

  const update = useCallback(
    (updates: Partial<WizardState>) => setAndPersist((s) => ({ ...s, ...updates })),
    [setAndPersist],
  );

  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(initialState);
  }, []);

  return { state, next, prev, goToStep, update, reset };
}
