'use client';
import { useState, useCallback } from 'react';
import type { LifeArea, AestheticStyle, Goal } from '@/lib/validations/wizard';

export interface WizardState {
  step: number; // 0-3
  selectedAreas: LifeArea[];
  dreams: string;
  photos: string[]; // blob URLs
  style: AestheticStyle;
  goals: Goal[];
  enableTimeline: boolean;
  manifesto: string;
}

const initialState: WizardState = {
  step: 0,
  selectedAreas: [],
  dreams: '',
  photos: [],
  style: 'minimal',
  goals: [],
  enableTimeline: false,
  manifesto: '',
};

export function useWizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const next = useCallback(
    () => setState((s) => ({ ...s, step: Math.min(s.step + 1, 3) })),
    [],
  );

  const prev = useCallback(
    () => setState((s) => ({ ...s, step: Math.max(s.step - 1, 0) })),
    [],
  );

  const update = useCallback(
    (updates: Partial<WizardState>) => setState((s) => ({ ...s, ...updates })),
    [],
  );

  const reset = useCallback(() => setState(initialState), []);

  return { state, next, prev, update, reset };
}
