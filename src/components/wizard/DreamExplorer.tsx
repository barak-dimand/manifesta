'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Wand2, ArrowRight, Lightbulb, Plus, Pencil, Heart, Target, Sparkles, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SerializablePromptState } from '@/hooks/use-wizard';

const EXPLORATION_PROMPTS = [
  {
    question: "If money and time were no object, where would you wake up every morning?",
    placeholder: "e.g., A sun-drenched villa overlooking the Mediterranean…",
    category: "environment",
    suggestions: [
      "A modern penthouse in New York City with floor-to-ceiling views",
      "A peaceful beachfront villa in Bali with the sound of waves",
      "A cozy mountain cabin surrounded by nature in the Swiss Alps",
      "A sun-drenched home in Tuscany with vineyards and olive groves",
      "A sleek apartment in Tokyo with city lights all around me",
      "A charming cottage in the English countryside with a garden",
      "A luxurious estate in Malibu overlooking the Pacific Ocean",
      "A tropical overwater bungalow in the Maldives",
    ],
  },
  {
    question: "What would a perfect workday look like for you?",
    placeholder: "e.g., Running my own creative studio, collaborating with inspiring people…",
    category: "career",
    suggestions: [
      "Running my own business from anywhere in the world",
      "Leading a creative agency with a passionate, talented team",
      "Coaching and mentoring others to unlock their potential",
      "Building an app or tech product that changes millions of lives",
      "Writing books and sharing my ideas on global stages",
      "Designing beautiful spaces as an interior architect",
      "Creating content full-time: videos, podcasts, and writing",
      "Working in fashion or beauty, launching my own brand",
    ],
  },
  {
    question: "Who is around you, and how do those relationships feel?",
    placeholder: "e.g., A loving partner, close friends who inspire me, a supportive community…",
    category: "relationships",
    suggestions: [
      "A deeply loving and supportive life partner who truly gets me",
      "A tight circle of ambitious, uplifting friends who celebrate each other",
      "A warm, close-knit family that gathers often and shares joy",
      "A thriving community of like-minded creators and entrepreneurs",
      "A mentor who guides me and believes in my vision",
      "Beautiful friendships across the globe with people I adore",
      "A happy, healthy family with kids who are curious and kind",
      "Collaborators and co-founders who share my passion and energy",
    ],
  },
  {
    question: "How does your body feel? What does your health look like?",
    placeholder: "e.g., Strong, energized, glowing. I move my body joyfully every day…",
    category: "health",
    suggestions: [
      "Strong, toned, and full of energy. I feel amazing every morning",
      "Calm, balanced, and deeply at peace with daily meditation practice",
      "Flexible and powerful from a consistent yoga and movement routine",
      "Glowing skin, bright eyes, and vibrant health from nourishing food",
      "Running marathons, hiking mountains. My body is capable of anything",
      "Sleeping deeply, waking refreshed, with a clear and focused mind",
      "Dancing, swimming, surfing. I move my body with pure joy",
      "Mentally sharp, emotionally resilient, and spiritually grounded",
    ],
  },
  {
    question: "What experiences make your soul come alive?",
    placeholder: "e.g., Traveling to new countries, creating art, learning new skills…",
    category: "experiences",
    suggestions: [
      "Exploring a new country every month and immersing in local culture",
      "Creating art: painting, sculpting, or making music that moves people",
      "Attending incredible events: fashion weeks, film festivals, galleries",
      "Learning new languages and connecting with people everywhere",
      "Cooking gourmet meals and hosting beautiful dinner parties",
      "Skydiving, scuba diving, surfing. Chasing adventure and adrenaline",
      "Volunteering and giving back to communities that need it most",
      "Reading, journaling, and growing into the wisest version of myself",
    ],
  },
];

type PromptState = {
  selectedIndices: Set<number>;
  edits: Record<number, string>;
  customText: string;
};

type Priority = { want: number; believe: number };

interface DreamExplorerProps {
  onComplete: (combinedDream: string) => void;
  initialPromptStates?: SerializablePromptState[] | null;
  onStateChange?: (states: SerializablePromptState[]) => void;
  initialPriorities?: Record<string, Priority>;
  onPrioritiesChange?: (priorities: Record<string, Priority>) => void;
}

export function DreamExplorer({ onComplete, initialPromptStates, onStateChange, initialPriorities, onPrioritiesChange }: DreamExplorerProps) {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [promptStates, setPromptStates] = useState<PromptState[]>(() =>
    EXPLORATION_PROMPTS.map((_, i) => {
      const saved = initialPromptStates?.[i];
      if (!saved) return { selectedIndices: new Set<number>(), edits: {}, customText: '' };
      return {
        selectedIndices: new Set(saved.selectedIndices),
        edits: saved.edits,
        customText: saved.customText,
      };
    })
  );
  const [editing, setEditing] = useState<[number, number] | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [priorities, setPriorities] = useState<Record<string, Priority>>(initialPriorities ?? {});
  const [showScrollHint, setShowScrollHint] = useState(false);
  const prioritizeListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editing]);

  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; });
  useEffect(() => {
    onStateChangeRef.current?.(
      promptStates.map((s) => ({
        selectedIndices: Array.from(s.selectedIndices),
        edits: s.edits,
        customText: s.customText,
      })),
    );
  }, [promptStates]);

  const onPrioritiesChangeRef = useRef(onPrioritiesChange);
  useEffect(() => { onPrioritiesChangeRef.current = onPrioritiesChange; });
  useEffect(() => {
    onPrioritiesChangeRef.current?.(priorities);
  }, [priorities]);

  const editingIndex = editing?.[0] === currentPrompt ? editing[1] : null;

  const prompt = EXPLORATION_PROMPTS[currentPrompt];
  const state = promptStates[currentPrompt];

  const updateState = (partial: Partial<PromptState>) => {
    setPromptStates((prev) =>
      prev.map((s, i) => (i === currentPrompt ? { ...s, ...partial } : s))
    );
  };

  const toggleSuggestion = (idx: number) => {
    const next = new Set(state.selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
      const newEdits = { ...state.edits };
      delete newEdits[idx];
      updateState({ selectedIndices: next, edits: newEdits });
    } else {
      next.add(idx);
      updateState({ selectedIndices: next });
    }
    setEditing(null);
  };

  const saveEdit = (idx: number, newText: string) => {
    const trimmed = newText.trim();
    if (trimmed && trimmed !== prompt.suggestions[idx]) {
      updateState({ edits: { ...state.edits, [idx]: trimmed } });
    } else {
      const newEdits = { ...state.edits };
      delete newEdits[idx];
      updateState({ edits: newEdits });
    }
    setEditing(null);
  };

  const getDisplayText = (idx: number) => state.edits[idx] ?? prompt.suggestions[idx];

  const handleNext = () => {
    if (currentPrompt < EXPLORATION_PROMPTS.length - 1) {
      setCurrentPrompt(currentPrompt + 1);
    }
  };

  const handleBack = () => {
    if (currentPrompt > 0) {
      setCurrentPrompt(currentPrompt - 1);
    }
  };

  // Build flat ordered list of all selected items across all prompts
  const getAllItems = (): { text: string }[] => {
    const items: { text: string }[] = [];
    for (let i = 0; i < EXPLORATION_PROMPTS.length; i++) {
      const ps = promptStates[i];
      const p = EXPLORATION_PROMPTS[i];
      for (const idx of Array.from(ps.selectedIndices).sort((a, b) => a - b)) {
        items.push({ text: ps.edits[idx] ?? p.suggestions[idx] });
      }
      const custom = ps.customText.trim();
      if (custom) items.push({ text: custom });
    }
    return items;
  };

  // Direct complete — used by Skip actions only
  const handleFinish = () => {
    const items = getAllItems();
    const combined = items.map((i) => i.text).join('. ');
    onComplete(combined ? combined + '.' : '');
  };

  // Enter the prioritize screen, initialising missing priorities to 5
  const enterPrioritize = () => {
    const items = getAllItems();
    setPriorities((prev) => {
      const next = { ...prev };
      for (const item of items) {
        if (!next[item.text]) next[item.text] = { want: 5, believe: 5 };
      }
      return next;
    });
    setIsPrioritizing(true);
    setShowScrollHint(true);
  };

  // Hide scroll hint on first scroll of the prioritize list
  useEffect(() => {
    const el = prioritizeListRef.current;
    if (!isPrioritizing || !el) return;
    const onScroll = () => setShowScrollHint(false);
    el.addEventListener('scroll', onScroll, { passive: true, once: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [isPrioritizing]);

  // Sort by combined score and complete — output includes priority scores for the textarea and AI context
  const handleSortAndComplete = () => {
    const items = getAllItems();
    const sorted = [...items].sort((a, b) => {
      const sa = (priorities[a.text]?.want ?? 5) + (priorities[a.text]?.believe ?? 5);
      const sb = (priorities[b.text]?.want ?? 5) + (priorities[b.text]?.believe ?? 5);
      return sb - sa;
    });
    const lines = sorted.map((item, i) => {
      const p = priorities[item.text];
      const score = p ? ` (want ${p.want}/10, believe ${p.believe}/10)` : '';
      return `${i + 1}. ${item.text}${score}`;
    });
    onComplete(lines.join('\n'));
  };

  const totalAnswered = promptStates.filter(
    (ps) => ps.selectedIndices.size > 0 || ps.customText.trim().length > 0
  ).length;
  const isLast = currentPrompt === EXPLORATION_PROMPTS.length - 1;

  const handleSkip = () => {
    if (!isLast) {
      setCurrentPrompt(currentPrompt + 1);
    } else {
      handleFinish();
    }
  };

  // ── Prioritize screen ──────────────────────────────────────────────────────

  if (isPrioritizing) {
    const allItems = getAllItems();

    // Compute rank of each item based on current slider values (updates live)
    const sorted = [...allItems].sort((a, b) => {
      const sa = (priorities[a.text]?.want ?? 5) + (priorities[a.text]?.believe ?? 5);
      const sb = (priorities[b.text]?.want ?? 5) + (priorities[b.text]?.believe ?? 5);
      return sb - sa;
    });
    const rankOf = Object.fromEntries(sorted.map((item, i) => [item.text, i + 1]));

    const setPriority = (text: string, key: keyof Priority, val: number) => {
      setPriorities((prev) => ({
        ...prev,
        [text]: { ...(prev[text] ?? { want: 5, believe: 5 }), [key]: val },
      }));
    };

    return (
      <div className="space-y-5 rounded-2xl border-2 border-sage/20 bg-sage-light/30 p-5">
        {/* Header */}
        <div className="flex items-center gap-2 text-sage">
          <Sparkles className="h-4 w-4" />
          <span className="font-sans text-sm font-semibold">Prioritize Your Dreams</span>
        </div>

        {/* Title */}
        <div>
          <h2 className="font-display text-xl font-semibold text-forest leading-snug mb-1">
            How much do you want each one, and how much do you believe you can have it?
          </h2>
          <p className="font-sans text-xs text-forest/50">
            Slide from 1 to 10. We&apos;ll sort your manifesto so what you want most and believe in most rises to the top.
          </p>
        </div>

        {/* Items — scrollable with fade hint */}
        <div className="relative">
          <div ref={prioritizeListRef} className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          {allItems.map((item) => {
            const rank = rankOf[item.text];
            const want = priorities[item.text]?.want ?? 5;
            const believe = priorities[item.text]?.believe ?? 5;
            const wantPct = ((want - 1) / 9) * 100;
            const believePct = ((believe - 1) / 9) * 100;

            return (
              <motion.div
                key={item.text}
                layout
                className="bg-white/70 rounded-xl border border-sage/15 p-4 space-y-3"
              >
                {/* Item header */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300">
                    <span className="font-sans text-xs font-bold text-white">{rank}</span>
                  </div>
                  <p className="font-sans text-sm text-forest font-medium leading-snug">{item.text}</p>
                </div>

                {/* Sliders — side by side */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {/* Want */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-sans text-[11px] text-forest/50">
                        <Heart className="h-2.5 w-2.5" />
                        How much I want it
                      </span>
                      <span className="font-sans text-xs font-semibold text-forest/70 ml-1">{want}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={want}
                      onChange={(e) => setPriority(item.text, 'want', Number(e.target.value))}
                      className="dream-slider w-full"
                      aria-label={`How much I want: ${item.text}`}
                      aria-valuemin={1}
                      aria-valuemax={10}
                      aria-valuenow={want}
                      style={{
                        background: `linear-gradient(to right, var(--color-sage) ${wantPct}%, hsl(150,18%,82%) ${wantPct}%)`,
                      }}
                    />
                  </div>

                  {/* Believe */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-sans text-[11px] text-forest/50">
                        <Target className="h-2.5 w-2.5" />
                        How much I believe it
                      </span>
                      <span className="font-sans text-xs font-semibold text-forest/70 ml-1">{believe}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={believe}
                      onChange={(e) => setPriority(item.text, 'believe', Number(e.target.value))}
                      className="dream-slider w-full"
                      aria-label={`How much I believe in: ${item.text}`}
                      aria-valuemin={1}
                      aria-valuemax={10}
                      aria-valuenow={believe}
                      style={{
                        background: `linear-gradient(to right, var(--color-sage) ${believePct}%, hsl(150,18%,82%) ${believePct}%)`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
          {/* Bottom fade gradient to hint at scrollability */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[hsl(150,20%,93%)] to-transparent" />
        </div>

        {/* Scroll hint */}
        {showScrollHint && allItems.length > 3 && (
          <p className="text-center font-sans text-[11px] text-forest/40 animate-bounce">
            scroll to rate all ↓
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setIsPrioritizing(false)}
            className="font-sans text-sm text-forest/50 hover:text-forest transition-colors"
          >
            ← Back to prompts
          </button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSortAndComplete}
            data-testid="explorer-sort-complete"
          >
            Sort &amp; Complete ✨
          </Button>
        </div>
      </div>
    );
  }

  // ── Normal prompt screen ───────────────────────────────────────────────────

  return (
    <div className="space-y-5 rounded-2xl border-2 border-sage/20 bg-sage-light/30 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sage">
          <Wand2 className="h-4 w-4" />
          <span className="font-sans text-sm font-semibold">Dream Explorer</span>
        </div>
        <span className="font-sans text-xs text-forest/40">
          {currentPrompt + 1} of {EXPLORATION_PROMPTS.length} · all optional
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {EXPLORATION_PROMPTS.map((_, i) => {
          const filled =
            promptStates[i].selectedIndices.size > 0 ||
            promptStates[i].customText.trim().length > 0;
          return (
            <button
              key={i}
              onClick={() => setCurrentPrompt(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === currentPrompt
                  ? 'w-8 bg-sage'
                  : filled
                    ? 'w-4 bg-sage/40'
                    : 'w-4 bg-sage/15'
              )}
            />
          );
        })}
      </div>

      {/* Prompt content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPrompt}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-sage/15 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-4 w-4 text-sage" />
            </div>
            <h2 className="font-display text-xl font-semibold text-forest leading-snug">
              {prompt.question}
            </h2>
          </div>

          {/* Suggestion chips */}
          <div className="space-y-2">
            <p className="font-sans text-xs text-forest/60 font-semibold flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5 text-sage flex-shrink-0" />
              Tap to select, tap again to remove. Selected items are editable.
            </p>
            <div className="flex flex-wrap gap-2" data-testid="explorer-suggestions">
              {prompt.suggestions.map((_, idx) => {
                const isSelected = state.selectedIndices.has(idx);
                const displayText = getDisplayText(idx);
                const isEdited = idx in state.edits;
                const isEditing = editingIndex === idx;

                if (isEditing && isSelected) {
                  return (
                    <motion.div
                      key={idx}
                      layout
                      className="rounded-full bg-sage border border-sage shadow-sm overflow-hidden flex items-center"
                    >
                      <input
                        ref={editInputRef}
                        defaultValue={displayText}
                        onBlur={(e) => saveEdit(idx, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        className="bg-transparent outline-none px-3.5 py-2 font-sans text-xs text-white placeholder:text-white/50 min-w-[200px]"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSuggestion(idx)}
                        className="px-2 py-2 text-white/60 hover:text-white transition-colors"
                        aria-label="Remove this item"
                      >
                        ✕
                      </button>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSuggestion(idx)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSuggestion(idx)}
                    className={cn(
                      'group rounded-full px-3.5 py-2 font-sans text-xs transition-all duration-200 border flex items-center gap-1.5 cursor-pointer select-none',
                      isSelected
                        ? 'bg-sage text-white border-sage shadow-sm'
                        : 'bg-cream text-forest border-sage/20 hover:border-sage/50 hover:bg-sage-light/60'
                    )}
                  >
                    <span>{displayText}</span>
                    {isEdited && (
                      <span className="text-[9px] opacity-60">(edited)</span>
                    )}
                    {isSelected ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing([currentPrompt, idx]);
                        }}
                        className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                        aria-label="Edit this item"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                    ) : (
                      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-30 transition-opacity ml-0.5 flex-shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Custom input */}
          <div className="space-y-1.5">
            <p className="font-sans text-xs text-forest/50 font-medium flex items-center gap-1.5">
              <Plus className="h-3 w-3" />
              Or add your own:
            </p>
            <textarea
              value={state.customText}
              onChange={(e) => updateState({ customText: e.target.value })}
              placeholder={prompt.placeholder}
              className="w-full min-h-[80px] rounded-xl border-2 border-sage/20 bg-cream p-4 font-sans text-forest placeholder:text-forest/30 focus:border-sage focus:outline-none transition-colors resize-none text-sm"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handleBack}
          disabled={currentPrompt === 0}
          className="font-sans text-sm text-forest/50 hover:text-forest transition-colors disabled:opacity-30"
        >
          ← Back
        </button>

        <div className="flex items-center gap-2">
          {/* Skip — bypasses prioritize */}
          <button
            onClick={handleSkip}
            className="font-sans text-sm text-forest/40 hover:text-forest/70 transition-colors"
          >
            {isLast ? 'Skip & finish' : 'Skip →'}
          </button>

          {/* Prioritize — available as soon as at least 1 prompt is answered */}
          {totalAnswered >= 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={enterPrioritize}
              className="text-xs"
            >
              Use {totalAnswered} answer{totalAnswered === 1 ? '' : 's'} ✨
            </Button>
          )}

          {/* Next prompt */}
          {!isLast && (
            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              className="text-xs"
              data-testid="explorer-next"
            >
              Next
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}

          {/* Complete on last prompt — goes to prioritize if answers exist */}
          {isLast && (
            <Button
              variant="default"
              size="sm"
              onClick={totalAnswered > 0 ? enterPrioritize : handleFinish}
              className="text-xs"
              data-testid="explorer-complete"
            >
              {totalAnswered > 0 ? `Prioritize ${totalAnswered} answer${totalAnswered === 1 ? '' : 's'} ✨` : 'Finish'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
