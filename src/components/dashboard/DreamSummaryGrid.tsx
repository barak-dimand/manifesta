'use client';

import { Sparkles, Target, Quote, Wand2 } from 'lucide-react';
import type { Board } from '@/lib/db/schema';
import type { Goal } from '@/lib/validations/wizard';

const AREA_LABELS: Record<string, string> = {
  career: 'Career & Purpose',
  love: 'Love & Relationships',
  health: 'Health & Vitality',
  travel: 'Travel & Adventure',
  wealth: 'Wealth & Abundance',
  creativity: 'Creativity & Joy',
};

const STYLE_NAMES: Record<string, string> = {
  minimal: 'Minimal',
  vibrant: 'Vibrant',
  ethereal: 'Ethereal',
  luxe: 'Luxe',
};

interface Props {
  board: Board;
}

export function DreamSummaryGrid({ board }: Props) {
  const goals = (board.goals as Goal[] | null) ?? [];
  const activeGoals = goals.filter((g) => g.objective?.trim());
  const allQuotes = [...(board.selectedQuotes ?? []), ...(board.customQuotes ?? [])];

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Life Areas */}
      <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-md p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-sage" />
          <p className="font-sans text-xs font-semibold text-forest/70">Life Areas</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {board.selectedAreas.length > 0 ? (
            board.selectedAreas.map((a) => (
              <span
                key={a}
                className="px-2.5 py-1 rounded-full bg-sage-light/60 text-sage text-[11px] font-sans font-medium border border-sage/20"
              >
                {AREA_LABELS[a] ?? a}
              </span>
            ))
          ) : (
            <p className="font-sans text-xs text-forest/35">None selected</p>
          )}
        </div>
      </div>

      {/* Goals & Habits */}
      <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-md p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-sage" />
          <p className="font-sans text-xs font-semibold text-forest/70">Goals & Habits</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {activeGoals.length > 0 ? (
            activeGoals.slice(0, 3).map((g) => (
              <p key={g.area} className="font-sans text-[11px] text-forest/65 leading-snug">
                <span className="text-sage/70 mr-1">•</span>
                {g.objective}
              </p>
            ))
          ) : (
            <p className="font-sans text-xs text-forest/35">No goals yet</p>
          )}
          {activeGoals.length > 3 && (
            <p className="font-sans text-[11px] text-forest/35">+{activeGoals.length - 3} more</p>
          )}
        </div>
      </div>

      {/* Quotes & Affirmations */}
      <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-md p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Quote className="w-3.5 h-3.5 text-sage" />
          <p className="font-sans text-xs font-semibold text-forest/70">Quotes & Affirmations</p>
        </div>
        {allQuotes.length > 0 ? (
          <p className="font-display italic text-xs text-forest/65 leading-relaxed line-clamp-3">
            &ldquo;{allQuotes[0]}&rdquo;
          </p>
        ) : (
          <p className="font-sans text-xs text-forest/35">No quotes yet</p>
        )}
        {allQuotes.length > 1 && (
          <p className="font-sans text-[11px] text-forest/35">+{allQuotes.length - 1} more</p>
        )}
      </div>

      {/* Aesthetic */}
      <div className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-md p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-sage" />
          <p className="font-sans text-xs font-semibold text-forest/70">Aesthetic</p>
        </div>
        <p className="font-sans text-sm font-semibold text-forest capitalize">
          {STYLE_NAMES[board.style] ?? board.style}
        </p>
        {board.dreams && (
          <p className="font-display italic text-[11px] text-forest/45 leading-relaxed line-clamp-2">
            {board.dreams.slice(0, 80)}...
          </p>
        )}
      </div>
    </div>
  );
}
