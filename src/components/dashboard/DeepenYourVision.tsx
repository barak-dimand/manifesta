'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Heart, Zap, Globe, TrendingUp, Palette,
  ChevronDown, ChevronUp, Target, Check, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Board } from '@/lib/db/schema';
import type { LifeArea, Goal } from '@/lib/validations/wizard';
import { getExplorerItems } from '@/lib/wizard/explorationPrompts';

const AREA_META: Record<LifeArea, { label: string; Icon: React.ElementType }> = {
  career: { label: 'Career & Purpose', Icon: Briefcase },
  love: { label: 'Love & Relationships', Icon: Heart },
  health: { label: 'Health & Vitality', Icon: Zap },
  travel: { label: 'Travel & Adventure', Icon: Globe },
  wealth: { label: 'Wealth & Abundance', Icon: TrendingUp },
  creativity: { label: 'Creativity & Joy', Icon: Palette },
};

const GOAL_SUGGESTIONS: Record<LifeArea, string[]> = {
  career: ['Launch a business generating $10k/month', 'Leave my 9-5 and work entirely for myself', 'Get promoted to a senior leadership role', 'Build a $3k/month passive income stream'],
  love: ['Build a deeply loving, committed relationship', 'Strengthen my closest friendships with real quality time', 'Heal past patterns and show up fully in relationships', 'Build a warm, supportive community around me'],
  health: ['Get lean, strong, and feel energetic every single day', 'Complete a marathon or major fitness challenge', 'Build a consistent sleep routine and wake refreshed', 'Heal my relationship with food and feel at peace'],
  travel: ['Visit 3 new countries this year', 'Take a solo trip abroad that changes my perspective', 'Live as a digital nomad for at least 3 months', 'Reach my bucket-list destination before year-end'],
  wealth: ['Build a 6-month emergency fund', 'Invest consistently and grow my net worth by 30%', 'Pay off all high-interest debt completely', 'Reach a level where my money works for me'],
  creativity: ['Complete and publicly share a project I am proud of', 'Launch a creative side project or brand', 'Master a new creative skill and reach an advanced level', 'Create something that genuinely moves people'],
};

const HABIT_SUGGESTIONS: Record<LifeArea, string[]> = {
  career: ['Work on my business for 1 focused hour before 9am', 'Review my top 3 priorities every single morning', 'Reach out to one new connection or mentor each week', 'Block 2 hours of uninterrupted deep work daily'],
  love: ['Express gratitude or appreciation to someone I love daily', 'Put my phone away fully during meals and quality time', 'Journal about my feelings and relationships for 10 min', 'Plan one intentional date or connection session weekly'],
  health: ['Move my body for 30 minutes every morning', 'Drink 2L of water and eat a nourishing breakfast daily', 'Be in bed by 10:30pm, no screens, no exceptions', 'Meditate or breathe deeply for 10 minutes each morning'],
  travel: ['Save $20 every day into a dedicated travel fund', 'Research and plan one upcoming trip each Sunday', 'Learn 5 phrases in a language I want to speak weekly', 'Read one travel book or destination guide monthly'],
  wealth: ['Track every expense and review finances every Sunday', 'Auto-invest a fixed amount on every payday', 'Read 15 minutes of finance or investing content daily', 'Find and cancel one unnecessary subscription monthly'],
  creativity: ['Create something (write, draw, or build) for 20 min daily', 'Share one piece of my work publicly every week', 'Spend 30 min with inspiring books, art, or film daily', 'Attend one creative class or workshop per month'],
};

type Priority = { want: number; believe: number };

type ExplorerData = {
  promptStates?: Array<{ selectedIndices: number[]; edits: Record<number, string>; customText: string }>;
  priorities?: Record<string, Priority>;
};

interface Props {
  board: Board;
}

export function DeepenYourVision({ board }: Props) {
  const explorerData = board.explorerData as ExplorerData | null;
  const initialPriorities = explorerData?.priorities ?? {};
  const dreamItems = getExplorerItems(explorerData?.promptStates);

  const [goals, setGoals] = useState<Goal[]>((board.goals as Goal[]) ?? []);
  const [priorities, setPriorities] = useState<Record<string, Priority>>(
    () => {
      const init = { ...initialPriorities };
      for (const item of dreamItems) {
        if (!init[item.text]) init[item.text] = { want: 5, believe: 5 };
      }
      return init;
    },
  );
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>(
    () => Object.fromEntries(board.selectedAreas.map((a) => [a, false])),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'goals' | 'prioritize'>('goals');

  const hasDreamItems = dreamItems.length > 0;

  const toggleArea = (area: string) => setOpenAreas((prev) => ({ ...prev, [area]: !prev[area] }));

  const getGoal = (area: LifeArea): Goal =>
    goals.find((g) => g.area === area) ?? { area, objective: '', habit: '' };

  const updateGoal = (area: LifeArea, patch: Partial<Omit<Goal, 'area'>>) => {
    const existing = goals.find((g) => g.area === area);
    setGoals(existing
      ? goals.map((g) => (g.area === area ? { ...g, ...patch } : g))
      : [...goals, { area, objective: '', habit: '', ...patch }],
    );
  };

  const setPriority = (text: string, key: keyof Priority, val: number) => {
    setPriorities((prev) => ({ ...prev, [text]: { ...(prev[text] ?? { want: 5, believe: 5 }), [key]: val } }));
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const cleanGoals = goals.filter((g) => g.objective.trim() || g.habit.trim());
      const updatedExplorerData = {
        ...explorerData,
        priorities,
      };
      await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: cleanGoals, explorerData: updatedExplorerData }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Swallow — non-critical
    } finally {
      setIsSaving(false);
    }
  }, [board.id, goals, priorities, explorerData]);

  const sortedItems = hasDreamItems
    ? [...dreamItems].sort((a, b) => {
        const sa = (priorities[a.text]?.want ?? 5) + (priorities[a.text]?.believe ?? 5);
        const sb = (priorities[b.text]?.want ?? 5) + (priorities[b.text]?.believe ?? 5);
        return sb - sa;
      })
    : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-forest">Deepen Your Vision</h2>
          <p className="font-sans text-forest/55 text-sm mt-1">
            Set goals, build habits, and rank what matters most.
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="gap-1.5"
        >
          {isSaving ? (
            <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check className="w-3.5 h-3.5" /> Saved</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Save progress</>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-sage-light/40 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('goals')}
          className={cn(
            'flex-1 rounded-lg py-2 font-sans text-sm font-medium transition-all duration-200',
            activeTab === 'goals' ? 'bg-white shadow-sm text-forest' : 'text-forest/50 hover:text-forest',
          )}
        >
          Goals & Habits
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prioritize')}
          className={cn(
            'flex-1 rounded-lg py-2 font-sans text-sm font-medium transition-all duration-200',
            activeTab === 'prioritize' ? 'bg-white shadow-sm text-forest' : 'text-forest/50 hover:text-forest',
          )}
        >
          Prioritize Dreams
        </button>
      </div>

      {/* Goals tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {board.selectedAreas.map((area) => {
              const meta = AREA_META[area as LifeArea];
              if (!meta) return null;
              const goal = getGoal(area as LifeArea);
              const isOpen = openAreas[area] ?? false;

              return (
                <div key={area} className="rounded-xl border border-sage/15 bg-cream overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleArea(area)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-sage-light/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center flex-shrink-0">
                        <meta.Icon className="w-4 h-4 text-sage" />
                      </div>
                      <div className="text-left">
                        <span className="font-sans text-sm font-semibold text-forest">{meta.label}</span>
                        {goal.objective && !isOpen && (
                          <p className="font-sans text-xs text-forest/40 mt-0.5 line-clamp-1">{goal.objective}</p>
                        )}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-forest/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-forest/40 flex-shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 flex flex-col gap-5 border-t border-sage/10 pt-4">
                      <div className="flex flex-col gap-2">
                        <p className="font-sans text-xs font-semibold text-forest/60 uppercase tracking-wider">My goal</p>
                        <div className="flex flex-wrap gap-1.5">
                          {GOAL_SUGGESTIONS[area as LifeArea].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateGoal(area as LifeArea, { objective: s })}
                              className={cn(
                                'text-xs px-2.5 py-1 rounded-full border transition-all duration-150 font-sans text-left leading-snug',
                                goal.objective === s
                                  ? 'bg-sage text-white border-sage shadow-sm'
                                  : 'bg-cream text-forest/70 border-sage/20 hover:border-sage/50 hover:bg-sage-light/60',
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <Input
                          value={goal.objective}
                          onChange={(e) => updateGoal(area as LifeArea, { objective: e.target.value })}
                          placeholder="Or write your own goal…"
                          className="text-sm mt-0.5"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="font-sans text-xs font-semibold text-forest/60 uppercase tracking-wider">My daily habit</p>
                        <div className="flex flex-wrap gap-1.5">
                          {HABIT_SUGGESTIONS[area as LifeArea].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateGoal(area as LifeArea, { habit: s })}
                              className={cn(
                                'text-xs px-2.5 py-1 rounded-full border transition-all duration-150 font-sans text-left leading-snug',
                                goal.habit === s
                                  ? 'bg-sage text-white border-sage shadow-sm'
                                  : 'bg-cream text-forest/70 border-sage/20 hover:border-sage/50 hover:bg-sage-light/60',
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <Input
                          value={goal.habit}
                          onChange={(e) => updateGoal(area as LifeArea, { habit: e.target.value })}
                          placeholder="Or write your own habit…"
                          className="text-sm mt-0.5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Prioritize tab */}
        {activeTab === 'prioritize' && (
          <motion.div
            key="prioritize"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {!hasDreamItems ? (
              <div className="rounded-2xl border-2 border-dashed border-sage/20 p-10 text-center">
                <Target className="w-8 h-8 text-sage/30 mx-auto mb-3" />
                <p className="font-display text-lg text-forest/50 mb-1">No dream items yet</p>
                <p className="font-sans text-sm text-forest/40">
                  Use the Dream Explorer when editing your board to add items you can prioritize here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="font-sans text-xs text-forest/50">
                  Rank each dream by how much you want it and how much you believe you can have it. Items are sorted live by your scores.
                </p>
                {sortedItems.map((item, rank) => {
                  const p = priorities[item.text] ?? { want: 5, believe: 5 };
                  const wantPct = ((p.want - 1) / 9) * 100;
                  const believePct = ((p.believe - 1) / 9) * 100;
                  return (
                    <motion.div key={item.text} layout className="bg-white/70 rounded-xl border border-sage/15 p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300">
                          <span className="font-sans text-xs font-bold text-white">{rank + 1}</span>
                        </div>
                        <p className="font-sans text-sm text-forest font-medium leading-snug">{item.text}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-sans text-[11px] text-forest/50">
                              <Heart className="h-2.5 w-2.5" />
                              How much I want it
                            </span>
                            <span className="font-sans text-xs font-semibold text-forest/70 ml-1">{p.want}</span>
                          </div>
                          <input
                            type="range" min="1" max="10" value={p.want}
                            onChange={(e) => setPriority(item.text, 'want', Number(e.target.value))}
                            className="dream-slider w-full"
                            aria-label={`How much I want: ${item.text}`}
                            aria-valuemin={1} aria-valuemax={10} aria-valuenow={p.want}
                            style={{ background: `linear-gradient(to right, var(--color-sage) ${wantPct}%, hsl(150,18%,82%) ${wantPct}%)` }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 font-sans text-[11px] text-forest/50">
                              <Target className="h-2.5 w-2.5" />
                              How much I believe it
                            </span>
                            <span className="font-sans text-xs font-semibold text-forest/70 ml-1">{p.believe}</span>
                          </div>
                          <input
                            type="range" min="1" max="10" value={p.believe}
                            onChange={(e) => setPriority(item.text, 'believe', Number(e.target.value))}
                            className="dream-slider w-full"
                            aria-label={`How much I believe in: ${item.text}`}
                            aria-valuemin={1} aria-valuemax={10} aria-valuenow={p.believe}
                            style={{ background: `linear-gradient(to right, var(--color-sage) ${believePct}%, hsl(150,18%,82%) ${believePct}%)` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
