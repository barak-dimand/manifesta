'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Plus, Check, ChevronRight, Sparkles } from 'lucide-react';
import type { Board } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

const AREA_LABELS: Record<string, string> = {
  career: 'Career & Purpose',
  love: 'Love & Relationships',
  health: 'Health & Vitality',
  travel: 'Travel & Adventure',
  wealth: 'Wealth & Abundance',
  creativity: 'Creativity & Joy',
};

const DISCOVER_PROMPTS: { category: string; question: string; suggestions: string[] }[] = [
  {
    category: 'environment',
    question: 'Where would you wake up every morning if anything were possible?',
    suggestions: [
      'A sun-drenched penthouse in NYC with floor-to-ceiling views',
      'A beachfront villa in Bali with the sound of waves every morning',
      'A cozy chalet in the Swiss Alps surrounded by pine forests',
      'A sleek apartment in Tokyo with city lights all around me',
      'A private estate in Tuscany with vineyards and olive groves',
      'A tropical overwater bungalow in the Maldives',
    ],
  },
  {
    category: 'freedom',
    question: 'What does your ideal week look like, with zero obligations?',
    suggestions: [
      'Working on creative projects from a cafe in a new city each week',
      'Spending mornings on a yacht before diving into meaningful work',
      'Waking up without an alarm, moving my body and eating beautifully',
      'Traveling to a new country every few weeks entirely on my own schedule',
      'Deep focus mornings, long afternoon walks, dinner with people I love',
      'Complete freedom to follow inspiration wherever it leads each day',
    ],
  },
  {
    category: 'wealth',
    question: 'What would financial freedom mean for your day-to-day life?',
    suggestions: [
      'Never checking prices before buying something I truly want',
      'Investing in experiences over things: travel, education, art',
      'Giving generously to people and causes that matter to me',
      'Owning property in multiple cities I love visiting',
      'Being able to say yes to every opportunity that excites me',
      'Building wealth that lasts beyond me and supports my family',
    ],
  },
  {
    category: 'relationships',
    question: 'Who are the most important people in your dream life?',
    suggestions: [
      'A deeply loving partner who truly sees and celebrates me',
      'A small circle of ambitious, uplifting friends who challenge me',
      'A mentor who has built what I am building and shows me the way',
      'A warm, close family that gathers often and shares real joy',
      'Collaborators who match my energy and share my vision',
      'Friends across the globe, in every city I love',
    ],
  },
  {
    category: 'health',
    question: 'How does your body feel in your dream life?',
    suggestions: [
      'Strong, toned, and full of energy — I feel amazing every single morning',
      'Glowing skin, bright eyes, and vibrant health from nourishing food',
      'Running marathons and hiking mountains — my body can do anything',
      'Sleeping deeply, waking refreshed, with a completely clear mind',
      'Flexible and powerful from a consistent yoga or movement practice',
      'Calm, balanced, and deeply at peace with a daily meditation ritual',
    ],
  },
  {
    category: 'purpose',
    question: 'What impact do you want to have on the world?',
    suggestions: [
      'Building a company that creates real jobs and genuine change',
      'Creating art or content that moves and inspires millions of people',
      'Raising children who are deeply kind, curious, and confident',
      'Teaching and mentoring the next generation of leaders',
      'Funding causes that address the world\'s most urgent problems',
      'Living as a daily example that a beautiful life is truly possible',
    ],
  },
];

interface Props {
  board: Board;
}

export function DiscoverSection({ board }: Props) {
  const [activePrompt, setActivePrompt] = useState(0);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  const prompt = DISCOVER_PROMPTS[activePrompt];
  const hasStagedItems = addedItems.size > 0;

  const toggle = (text: string) => {
    setAddedItems((prev) => {
      const next = new Set(prev);
      if (next.has(text)) {
        next.delete(text);
      } else {
        next.add(text);
      }
      return next;
    });
  };

  const handleAddToDreams = async () => {
    if (!hasStagedItems) return;
    setIsSaving(true);
    const additions = [...addedItems].join('. ');
    const updatedDreams = board.dreams
      ? `${board.dreams.trimEnd()} ${additions}.`
      : `${additions}.`;

    try {
      await fetch(`/api/boards/${board.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedAreas: board.selectedAreas,
          dreams: updatedDreams,
          style: board.style,
          goals: board.goals ?? [],
          manifesto: board.manifesto ?? undefined,
          enableTimeline: board.enableTimeline ?? false,
          photoUrls: board.photoUrls ?? [],
          explorerData: board.explorerData,
          selectedOffers: board.selectedOffers ?? ['wallpaper'],
          selectedQuotes: board.selectedQuotes ?? [],
          customQuotes: board.customQuotes ?? [],
        }),
      });
      setSavedItems((prev) => new Set([...prev, ...addedItems]));
      setAddedItems(new Set());
    } catch {
      // Swallow — user can retry
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Compass className="w-4 h-4 text-sage" />
            <h2 className="font-sans text-base font-semibold text-forest">Keep Discovering</h2>
          </div>
          <p className="font-sans text-xs text-forest/45">
            Dream bigger. Add new dimensions to your vision.
          </p>
        </div>
        {hasStagedItems && (
          <button
            type="button"
            onClick={() => void handleAddToDreams()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sage text-white font-sans text-xs font-semibold hover:bg-sage/90 transition-colors disabled:opacity-60"
          >
            {isSaving ? (
              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add {addedItems.size} to Dreams
          </button>
        )}
      </div>

      {/* Area chips (to filter prompts) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DISCOVER_PROMPTS.map((p, i) => (
          <button
            key={p.category}
            type="button"
            onClick={() => { setActivePrompt(i); setAddedItems(new Set()); }}
            className={cn(
              'flex-shrink-0 px-3 py-1.5 rounded-full font-sans text-xs font-medium border transition-all capitalize',
              i === activePrompt
                ? 'bg-sage text-white border-sage'
                : 'bg-cream text-forest/60 border-sage/20 hover:border-sage/40',
            )}
          >
            {p.category}
          </button>
        ))}
      </div>

      {/* Prompt card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePrompt}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border border-sage/15 bg-white/80 p-5 flex flex-col gap-4"
        >
          <p className="font-display text-base font-semibold text-forest leading-snug">
            {prompt.question}
          </p>
          <div className="flex flex-wrap gap-2">
            {prompt.suggestions.map((s) => {
              const isAdded = addedItems.has(s);
              const isSaved = savedItems.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => !isSaved && toggle(s)}
                  className={cn(
                    'flex items-start gap-1.5 px-3 py-2 rounded-xl border text-left font-sans text-xs leading-snug transition-all',
                    isSaved
                      ? 'bg-sage-light/60 border-sage/30 text-sage/80 cursor-default'
                      : isAdded
                      ? 'bg-sage border-sage text-white shadow-sm'
                      : 'bg-cream border-sage/20 text-forest/70 hover:border-sage/50 hover:bg-sage-light/40',
                  )}
                >
                  {isSaved ? (
                    <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  ) : isAdded ? (
                    <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Plus className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-50" />
                  )}
                  {s}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Unexplored areas nudge */}
      {board.selectedAreas.length < 6 && (
        <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-gold/60 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-sans text-xs text-forest/70 font-medium">
              You haven&apos;t explored all life areas yet.
            </p>
            <p className="font-sans text-[11px] text-forest/45 mt-0.5">
              Consider adding:{' '}
              {Object.keys(AREA_LABELS)
                .filter((a) => !board.selectedAreas.includes(a))
                .map((a) => AREA_LABELS[a])
                .join(', ')}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-forest/30 flex-shrink-0" />
        </div>
      )}
    </div>
  );
}
