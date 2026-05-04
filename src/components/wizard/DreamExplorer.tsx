'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Wand2, ArrowRight, Lightbulb, Plus, Pencil } from 'lucide-react';
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
      "Creating content full-time — videos, podcasts, and writing",
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
    placeholder: "e.g., Strong, energized, glowing — I move my body joyfully every day…",
    category: "health",
    suggestions: [
      "Strong, toned, and full of energy — I feel amazing every morning",
      "Calm, balanced, and deeply at peace with daily meditation practice",
      "Flexible and powerful from a consistent yoga and movement routine",
      "Glowing skin, bright eyes, and vibrant health from nourishing food",
      "Running marathons, hiking mountains — my body is capable of anything",
      "Sleeping deeply, waking refreshed, with a clear and focused mind",
      "Dancing, swimming, surfing — I move my body with pure joy",
      "Mentally sharp, emotionally resilient, and spiritually grounded",
    ],
  },
  {
    question: "What experiences make your soul come alive?",
    placeholder: "e.g., Traveling to new countries, creating art, learning new skills…",
    category: "experiences",
    suggestions: [
      "Exploring a new country every month and immersing in local culture",
      "Creating art — painting, sculpting, or making music that moves people",
      "Attending incredible events: fashion weeks, film festivals, galleries",
      "Learning new languages and connecting with people everywhere",
      "Cooking gourmet meals and hosting beautiful dinner parties",
      "Skydiving, scuba diving, surfing — chasing adventure and adrenaline",
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

interface DreamExplorerProps {
  onComplete: (combinedDream: string) => void;
  initialPromptStates?: SerializablePromptState[] | null;
  onStateChange?: (states: SerializablePromptState[]) => void;
}

export function DreamExplorer({ onComplete, initialPromptStates, onStateChange }: DreamExplorerProps) {
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
  // Track editing as [promptIndex, suggestionIndex] so it auto-clears on prompt change
  const [editing, setEditing] = useState<[number, number] | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editing]);

  // Sync selections back to wizard state so they survive navigation
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

  const handleFinish = () => {
    const parts: string[] = [];
    for (let i = 0; i < EXPLORATION_PROMPTS.length; i++) {
      const ps = promptStates[i];
      const p = EXPLORATION_PROMPTS[i];
      const picked = Array.from(ps.selectedIndices).map(
        (idx) => ps.edits[idx] ?? p.suggestions[idx]
      );
      const custom = ps.customText.trim();
      const combined = [...picked, ...(custom ? [custom] : [])];
      if (combined.length > 0) {
        parts.push(combined.join('. '));
      }
    }
    onComplete(parts.join('. ') + '.');
  };

  const totalAnswered = promptStates.filter(
    (ps) => ps.selectedIndices.size > 0 || ps.customText.trim().length > 0
  ).length;
  const isLast = currentPrompt === EXPLORATION_PROMPTS.length - 1;

  return (
    <div className="space-y-5 rounded-2xl border-2 border-sage/20 bg-sage-light/30 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 text-sage">
        <Wand2 className="h-4 w-4" />
        <span className="font-sans text-sm font-semibold">Dream Explorer</span>
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
            <h3 className="font-display text-xl font-semibold text-forest leading-snug">
              {prompt.question}
            </h3>
          </div>

          {/* Suggestion chips */}
          <div className="space-y-2">
            <p className="font-sans text-xs text-forest/50 font-medium">
              Tap to select · tap again to deselect:
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
                        title="Remove"
                      >
                        ✕
                      </button>
                    </motion.div>
                  );
                }

                // Use div+role so we can nest the pencil button without invalid HTML
                return (
                  <motion.div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSuggestion(idx)}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSuggestion(idx)}
                    className={cn(
                      'rounded-full px-3.5 py-2 font-sans text-xs transition-all duration-200 border flex items-center gap-1.5 cursor-pointer select-none',
                      isSelected
                        ? 'bg-sage text-white border-sage shadow-sm'
                        : 'bg-cream text-forest border-sage/20 hover:border-sage/50 hover:bg-sage-light/60'
                    )}
                  >
                    <span>{displayText}</span>
                    {isEdited && (
                      <span className="text-[9px] opacity-60">(edited)</span>
                    )}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing([currentPrompt, idx]);
                        }}
                        className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                        title="Edit text"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
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
          ← Previous
        </button>

        <div className="flex items-center gap-3">
          {totalAnswered >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFinish}
              className="text-xs"
            >
              Use my answers ({totalAnswered}/{EXPLORATION_PROMPTS.length})
            </Button>
          )}
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
          {isLast && totalAnswered >= 2 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleFinish}
              className="text-xs"
              data-testid="explorer-complete"
            >
              Complete ✨
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
