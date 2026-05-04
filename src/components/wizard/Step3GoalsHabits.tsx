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

const AREA_META: Record<LifeArea, { label: string; Icon: React.ElementType }> = {
  career: { label: 'Career & Purpose', Icon: Briefcase },
  love: { label: 'Love & Relationships', Icon: Heart },
  health: { label: 'Health & Vitality', Icon: Zap },
  travel: { label: 'Travel & Adventure', Icon: Globe },
  wealth: { label: 'Wealth & Abundance', Icon: TrendingUp },
  creativity: { label: 'Creativity & Joy', Icon: Palette },
};

const GOAL_SUGGESTIONS: Record<LifeArea, string[]> = {
  career: [
    'Launch a business generating $10k/month',
    'Leave my 9-5 and work entirely for myself',
    'Get promoted to a senior leadership role',
    'Build a $3k/month passive income stream',
  ],
  love: [
    'Build a deeply loving, committed relationship',
    'Strengthen my closest friendships with real quality time',
    'Heal past patterns and show up fully in relationships',
    'Build a warm, supportive community around me',
  ],
  health: [
    'Get lean, strong, and feel energetic every single day',
    'Complete a marathon or major fitness challenge',
    'Build a consistent sleep routine and wake refreshed',
    'Heal my relationship with food and feel at peace',
  ],
  travel: [
    'Visit 3 new countries this year',
    'Take a solo trip abroad that changes my perspective',
    'Live as a digital nomad for at least 3 months',
    'Reach my bucket-list destination before year-end',
  ],
  wealth: [
    'Build a 6-month emergency fund',
    'Invest consistently and grow my net worth by 30%',
    'Pay off all high-interest debt completely',
    'Reach a level where my money works for me',
  ],
  creativity: [
    'Complete and publicly share a project I am proud of',
    'Launch a creative side project or brand',
    'Master a new creative skill and reach an advanced level',
    'Create something that genuinely moves people',
  ],
};

const HABIT_SUGGESTIONS: Record<LifeArea, string[]> = {
  career: [
    'Work on my business for 1 focused hour before 9am',
    'Review my top 3 priorities every single morning',
    'Reach out to one new connection or mentor each week',
    'Block 2 hours of uninterrupted deep work daily',
  ],
  love: [
    'Express gratitude or appreciation to someone I love daily',
    'Put my phone away fully during meals and quality time',
    'Journal about my feelings and relationships for 10 min',
    'Plan one intentional date or connection session weekly',
  ],
  health: [
    'Move my body for 30 minutes every morning',
    'Drink 2L of water and eat a nourishing breakfast daily',
    'Be in bed by 10:30pm — no screens, no exceptions',
    'Meditate or breathe deeply for 10 minutes each morning',
  ],
  travel: [
    'Save $20 every day into a dedicated travel fund',
    'Research and plan one upcoming trip each Sunday',
    'Learn 5 phrases in a language I want to speak weekly',
    'Read one travel book or destination guide monthly',
  ],
  wealth: [
    'Track every expense and review finances every Sunday',
    'Auto-invest a fixed amount on every payday',
    'Read 15 minutes of finance or investing content daily',
    'Find and cancel one unnecessary subscription monthly',
  ],
  creativity: [
    'Create something — write, draw, or build — for 20 min daily',
    'Share one piece of my work publicly every week',
    'Spend 30 min with inspiring books, art, or film daily',
    'Attend one creative class or workshop per month',
  ],
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

function SuggestionChips({
  suggestions,
  currentValue,
  onSelect,
}: {
  suggestions: string[];
  currentValue: string;
  onSelect: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s)}
          className={cn(
            'text-xs px-2.5 py-1 rounded-full border transition-all duration-150 font-sans text-left leading-snug',
            currentValue === s
              ? 'bg-sage text-white border-sage shadow-sm'
              : 'bg-cream text-forest/70 border-sage/20 hover:border-sage/50 hover:bg-sage-light/60',
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
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
          One goal + one daily habit per area. Pick a suggestion or write your own.
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
        <span className="font-sans text-sm font-medium text-forest/70">Add target dates?</span>
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
                <div className="px-5 pb-5 flex flex-col gap-5 border-t border-sage/10 pt-4">
                  {/* Objective */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold text-forest/60 uppercase tracking-wider">
                      My goal for {meta.label}
                    </Label>
                    <SuggestionChips
                      suggestions={GOAL_SUGGESTIONS[area]}
                      currentValue={goal.objective}
                      onSelect={(s) => updateGoal(area, { objective: s })}
                    />
                    <Input
                      value={goal.objective}
                      onChange={(e) => updateGoal(area, { objective: e.target.value })}
                      placeholder="Or write your own goal…"
                      className="text-sm mt-0.5"
                      data-testid={`goal-${area}-objective`}
                    />
                  </div>

                  {/* Daily habit */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold text-forest/60 uppercase tracking-wider">
                      My daily habit
                    </Label>
                    <SuggestionChips
                      suggestions={HABIT_SUGGESTIONS[area]}
                      currentValue={goal.habit}
                      onSelect={(s) => updateGoal(area, { habit: s })}
                    />
                    <Input
                      value={goal.habit}
                      onChange={(e) => updateGoal(area, { habit: e.target.value })}
                      placeholder="Or write your own habit…"
                      className="text-sm mt-0.5"
                      data-testid={`goal-${area}-habit`}
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
        data-testid="generate-board"
      >
        Generate My Board →
      </Button>
    </div>
  );
}
