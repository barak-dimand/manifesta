'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Heart,
  Zap,
  Globe,
  TrendingUp,
  Palette,
  Check,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DreamExplorer } from './DreamExplorer';
import type { WizardState, SerializablePromptState } from '@/hooks/use-wizard';
import type { LifeArea } from '@/lib/validations/wizard';
import { cn } from '@/lib/utils';

interface Step1Props {
  state: WizardState;
  update: (updates: Partial<WizardState>) => void;
  next: () => void;
  prev: () => void;
}

const LIFE_AREAS: { id: LifeArea; label: string; Icon: React.ElementType }[] = [
  { id: 'career', label: 'Career & Purpose', Icon: Briefcase },
  { id: 'love', label: 'Love & Relationships', Icon: Heart },
  { id: 'health', label: 'Health & Vitality', Icon: Zap },
  { id: 'travel', label: 'Travel & Adventure', Icon: Globe },
  { id: 'wealth', label: 'Wealth & Abundance', Icon: TrendingUp },
  { id: 'creativity', label: 'Creativity & Joy', Icon: Palette },
];

const MAX_DREAMS = 1500;
const MIN_DREAMS = 10;

export function Step1DreamLife({ state, update, next }: Step1Props) {
  const [dreamsError, setDreamsError] = useState('');
  // Show textarea (not explorer) if the user has already completed the explorer
  const [explorerOpen, setExplorerOpen] = useState(() => state.dreams.length === 0);

  const toggleArea = (area: LifeArea) => {
    const current = state.selectedAreas;
    if (current.includes(area)) {
      update({ selectedAreas: current.filter((a) => a !== area) });
    } else {
      update({ selectedAreas: [...current, area] });
    }
  };

  const handleNext = () => {
    if (state.selectedAreas.length === 0) return;
    if (state.dreams.length < MIN_DREAMS) {
      setDreamsError('Please tell us a bit more about your dream life (at least 10 characters).');
      return;
    }
    setDreamsError('');
    next();
  };

  const handleExplorerComplete = (combinedDream: string) => {
    update({ dreams: combinedDream });
    setExplorerOpen(false);
  };

  const handleExplorerStateChange = (states: SerializablePromptState[]) => {
    update({ explorerPromptStates: states });
  };

  const isValid = state.selectedAreas.length > 0 && state.dreams.length >= MIN_DREAMS;

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-2">
          What does your dream life look like?
        </h1>
        <p className="font-sans text-forest/60 text-base">
          Select the areas of life you want to transform and describe your vision.
        </p>
      </div>

      {/* Life area toggles */}
      <div>
        <Label className="text-sm font-semibold text-forest/80 mb-3 block">
          Which areas of your life are you focusing on?{' '}
          <span className="text-forest/40 font-normal">(Select all that apply)</span>
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LIFE_AREAS.map(({ id, label, Icon }) => {
            const selected = state.selectedAreas.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleArea(id)}
                className={cn(
                  'relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer',
                  selected
                    ? 'bg-sage border-sage text-white shadow-sm shadow-sage/25'
                    : 'bg-cream border-sage/20 text-forest hover:border-sage/50 hover:bg-sage-light/50'
                )}
              >
                {selected && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    selected ? 'text-white' : 'text-sage'
                  )}
                />
                <span className="font-sans text-sm font-medium leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
        {state.selectedAreas.length === 0 && (
          <p className="text-xs text-forest/40 mt-2 font-sans">
            Select at least one area to continue.
          </p>
        )}
      </div>

      {/* Dream description — textarea or explorer */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="dreams" className="text-sm font-semibold text-forest/80">
            Describe your dream life in your own words
          </Label>
          {!explorerOpen && (
            <button
              type="button"
              onClick={() => setExplorerOpen(true)}
              className="flex items-center gap-1.5 text-xs text-sage hover:text-sage/80 font-sans font-medium transition-colors"
            >
              <Wand2 className="h-3 w-3" />
              Edit answers
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {explorerOpen ? (
            <motion.div
              key="explorer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <DreamExplorer
                onComplete={handleExplorerComplete}
                initialPromptStates={state.explorerPromptStates}
                onStateChange={handleExplorerStateChange}
              />
            </motion.div>
          ) : (
            <motion.div
              key="textarea"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              <Textarea
                id="dreams"
                value={state.dreams}
                onChange={(e) => {
                  setDreamsError('');
                  update({ dreams: e.target.value.slice(0, MAX_DREAMS) });
                }}
                placeholder="Imagine waking up in your ideal life. Where are you? What does your day look like? How do you feel?"
                className="min-h-[160px] text-sm leading-relaxed"
              />
              <div className="flex justify-between items-center">
                {dreamsError ? (
                  <p className="text-xs text-red-500 font-sans">{dreamsError}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-forest/40 font-sans ml-auto">
                  {state.dreams.length}/{MAX_DREAMS}
                </span>
              </div>
              {state.dreams.length === 0 && (
                <p className="text-xs text-forest/40 font-sans -mt-1">
                  Tip: the more detail you give, the better your board will be.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA — only show when not in explorer mode */}
      {!explorerOpen && (
        <Button
          variant="gold"
          size="lg"
          className="w-full text-base"
          onClick={handleNext}
          disabled={!isValid}
        >
          Next: Photos &amp; Style →
        </Button>
      )}
    </div>
  );
}
