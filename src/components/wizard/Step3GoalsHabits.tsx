'use client';

import { useState } from 'react';
import {
  Briefcase,
  Heart,
  Zap,
  Globe,
  TrendingUp,
  Palette,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WizardState } from '@/hooks/use-wizard';
import type { LifeArea, Goal, Timeline } from '@/lib/validations/wizard';
import { cn } from '@/lib/utils';

interface Step3Props {
  state: WizardState;
  update: (updates: Partial<WizardState>) => void;
  next: () => void;
  prev: () => void;
}

const AREA_META: Record<
  LifeArea,
  {
    label: string;
    Icon: React.ElementType;
    objectivePlaceholder: string;
    habitPlaceholder: string;
  }
> = {
  career: {
    label: 'Career & Purpose',
    Icon: Briefcase,
    objectivePlaceholder: 'Build a business generating $10k/month',
    habitPlaceholder: 'Work on my business for 1 hour before 9am',
  },
  love: {
    label: 'Love & Relationships',
    Icon: Heart,
    objectivePlaceholder: 'Build a deeply loving, committed partnership',
    habitPlaceholder: 'Express gratitude to someone I love each morning',
  },
  health: {
    label: 'Health & Vitality',
    Icon: Zap,
    objectivePlaceholder: 'Feel energetic, fit, and strong every day',
    habitPlaceholder: 'Move my body for 30 minutes every morning',
  },
  travel: {
    label: 'Travel & Adventure',
    Icon: Globe,
    objectivePlaceholder: 'Visit 3 new countries this year',
    habitPlaceholder: 'Save $20/day toward my travel fund',
  },
  wealth: {
    label: 'Wealth & Abundance',
    Icon: TrendingUp,
    objectivePlaceholder: 'Achieve financial freedom by 35',
    habitPlaceholder: 'Track my net worth and review my finances weekly',
  },
  creativity: {
    label: 'Creativity & Joy',
    Icon: Palette,
    objectivePlaceholder: 'Complete and share a creative project I am proud of',
    habitPlaceholder: 'Create something every day for 20 minutes',
  },
};

const TIMELINE_OPTIONS: { value: Timeline; label: string }[] = [
  { value: '30days', label: '30 Days' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: '1year', label: '1 Year' },
];

function buildManifesto(state: WizardState): string {
  const areaNames = state.selectedAreas
    .map((a) => AREA_META[a].label.toLowerCase())
    .join(', ');

  const goalsText = state.goals
    .filter((g) => g.objective.trim())
    .map(
      (g) =>
        `I am committed to ${g.objective.trim()} through the daily practice of ${g.habit.trim() || 'consistent action'}.`,
    )
    .join(' ');

  const dreamsSnippet = state.dreams.trim().slice(0, 200);

  return `My dream life is one where ${dreamsSnippet}. I am building a life of ${areaNames}. ${goalsText} This is my life. This is my time.`;
}

export function Step3GoalsHabits({ state, update, next }: Step3Props) {
  const [openAreas, setOpenAreas] = useState<Record<LifeArea, boolean>>(
    () =>
      Object.fromEntries(state.selectedAreas.map((a) => [a, true])) as Record<LifeArea, boolean>,
  );

  const toggleArea = (area: LifeArea) => {
    setOpenAreas((prev) => ({ ...prev, [area]: !prev[area] }));
  };

  const getGoal = (area: LifeArea): Goal => {
    return (
      state.goals.find((g) => g.area === area) ?? {
        area,
        objective: '',
        habit: '',
        timeline: undefined,
      }
    );
  };

  const updateGoal = (area: LifeArea, patch: Partial<Omit<Goal, 'area'>>) => {
    const existing = state.goals.find((g) => g.area === area);
    let updated: Goal[];
    if (existing) {
      updated = state.goals.map((g) => (g.area === area ? { ...g, ...patch } : g));
    } else {
      updated = [...state.goals, { area, objective: '', habit: '', ...patch }];
    }
    update({ goals: updated });
  };

  const handleGenerate = () => {
    const manifesto = buildManifesto(state);
    update({ manifesto });
    next();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-2">
          Turn your dreams into daily action
        </h1>
        <p className="font-sans text-forest/60 text-base">
          One goal + one daily habit per area you selected.
        </p>
      </div>

      {/* Timeline toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={state.enableTimeline}
          onClick={() => update({ enableTimeline: !state.enableTimeline })}
          className={cn(
            'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2',
            state.enableTimeline ? 'bg-sage' : 'bg-sage/20',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              state.enableTimeline ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
        <span className="font-sans text-sm font-medium text-forest/70">
          Add target dates?
        </span>
      </div>

      {/* Goal cards per area */}
      <div className="flex flex-col gap-4">
        {state.selectedAreas.map((area) => {
          const meta = AREA_META[area];
          const goal = getGoal(area);
          const isOpen = openAreas[area] ?? true;

          return (
            <div
              key={area}
              className="rounded-xl border border-sage/15 bg-cream overflow-hidden shadow-sm"
            >
              {/* Area header */}
              <button
                type="button"
                onClick={() => toggleArea(area)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-sage-light/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center flex-shrink-0">
                    <meta.Icon className="w-4 h-4 text-sage" />
                  </div>
                  <span className="font-sans text-sm font-semibold text-forest">
                    {meta.label}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-forest/40" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-forest/40" />
                )}
              </button>

              {/* Area content */}
              {isOpen && (
                <div className="px-5 pb-5 flex flex-col gap-4 border-t border-sage/10 pt-4">
                  {/* Objective */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-forest/60 uppercase tracking-wider">
                      My goal for {meta.label}
                    </Label>
                    <Input
                      value={goal.objective}
                      onChange={(e) => updateGoal(area, { objective: e.target.value })}
                      placeholder={meta.objectivePlaceholder}
                      className="text-sm"
                    />
                  </div>

                  {/* Daily habit */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-forest/60 uppercase tracking-wider">
                      My daily habit
                    </Label>
                    <Input
                      value={goal.habit}
                      onChange={(e) => updateGoal(area, { habit: e.target.value })}
                      placeholder={meta.habitPlaceholder}
                      className="text-sm"
                    />
                  </div>

                  {/* Timeline dropdown (only if enabled) */}
                  {state.enableTimeline && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold text-forest/60 uppercase tracking-wider">
                        Timeline
                      </Label>
                      <select
                        value={goal.timeline ?? ''}
                        onChange={(e) =>
                          updateGoal(area, {
                            timeline: (e.target.value as Timeline) || undefined,
                          })
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-forest shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
                      >
                        <option value="">Select timeline</option>
                        {TIMELINE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <Button
        variant="gold"
        size="lg"
        className="w-full text-base mt-2"
        onClick={handleGenerate}
      >
        Generate My Board →
      </Button>
    </div>
  );
}
