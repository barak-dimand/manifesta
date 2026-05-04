'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { useWizard } from '@/hooks/use-wizard';
import { Step1DreamLife } from '@/components/wizard/Step1DreamLife';
import { Step2PhotosStyle } from '@/components/wizard/Step2PhotosStyle';
import { Step3GoalsHabits } from '@/components/wizard/Step3GoalsHabits';
import { Step4Output } from '@/components/wizard/Step4Output';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Dream Life', index: 0 },
  { label: 'Photos & Style', index: 1 },
  { label: 'Goals', index: 2 },
  { label: 'Your Board', index: 3 },
];

export function WizardContainer() {
  const { state, next, prev, goToStep, update, reset } = useWizard();
  const router = useRouter();
  const [dir, setDir] = useState(1);
  const { isSignedIn } = useUser();
  const autoSaveRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn || state.step !== 3 || !state.manifesto || state.boardId) return;
    if (autoSaveRef.current) return;
    autoSaveRef.current = true;

    const goals = state.goals.filter((g) => g.objective.trim() && g.habit.trim());
    fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedAreas: state.selectedAreas,
        dreams: state.dreams,
        style: state.style,
        goals,
        manifesto: state.manifesto,
        enableTimeline: state.enableTimeline,
        photoUrls: state.photos.filter((p) => p.startsWith('http')),
        explorerData: state.explorerPromptStates,
      }),
    })
      .then((r) => r.json() as Promise<{ board?: { id: string } }>)
      .then((data) => {
        if (data.board?.id) update({ boardId: data.board.id });
      })
      .catch(console.error);
  }, [isSignedIn, state.step, state.manifesto, state.boardId, state.selectedAreas, state.dreams, state.style, state.goals, state.enableTimeline, update]);

  const slideVariants = {
    enter: (d: number) => ({ x: d * 60, opacity: 0 }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
    exit: (d: number) => ({
      x: d * -60,
      opacity: 0,
      transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  const handleNext = () => {
    setDir(1);
    next();
  };

  const handlePrev = () => {
    if (state.step === 0) {
      router.push('/');
    } else {
      setDir(-1);
      prev();
    }
  };

  const handleGoToStep = (target: number) => {
    setDir(target > state.step ? 1 : -1);
    goToStep(target);
  };

  const renderStep = () => {
    const props = { state, update, next: handleNext, prev: handlePrev };
    switch (state.step) {
      case 0:
        return <Step1DreamLife key="step-1" {...props} />;
      case 1:
        return <Step2PhotosStyle key="step-2" {...props} />;
      case 2:
        return <Step3GoalsHabits key="step-3" {...props} />;
      case 3:
        return <Step4Output key="step-4" {...props} onReset={reset} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Progress header */}
      <div className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-sage/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {/* Logo / home link */}
          <Link href="/" className="flex items-center gap-1.5 group w-fit">
            <Sparkles className="w-4 h-4 text-gold transition-transform group-hover:scale-110" />
            <span className="font-display text-base font-semibold text-forest tracking-wide">
              Manifesta
            </span>
          </Link>

          {/* Step dots + labels */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const isVisited = i <= state.maxStep;
              const isCurrent = state.step === i;
              const isClickable = isVisited && !isCurrent;
              return (
                <div key={step.index} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="relative flex items-center w-full">
                    {i > 0 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 transition-colors duration-300',
                          state.step >= i ? 'bg-sage' : 'bg-sage-light',
                        )}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => isClickable && handleGoToStep(i)}
                      disabled={!isClickable}
                      className={cn(
                        'w-5 h-5 rounded-full flex-shrink-0 transition-all duration-300 border-2',
                        isCurrent
                          ? 'bg-gold border-gold scale-110 shadow-sm shadow-gold/40'
                          : isVisited
                          ? 'bg-sage border-sage cursor-pointer hover:scale-110 hover:shadow-sm hover:shadow-sage/40'
                          : 'bg-cream border-sage-light cursor-default',
                      )}
                      aria-label={`Go to ${step.label}`}
                    />
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 transition-colors duration-300',
                          state.step > i ? 'bg-sage' : 'bg-sage-light',
                        )}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => isClickable && handleGoToStep(i)}
                    disabled={!isClickable}
                    className={cn(
                      'text-xs font-sans font-medium transition-colors duration-300 whitespace-nowrap',
                      isCurrent
                        ? 'text-forest'
                        : isVisited
                        ? 'text-sage cursor-pointer hover:text-forest'
                        : 'text-forest/40 cursor-default',
                    )}
                  >
                    {step.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 relative overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 py-8 min-h-full">
          {/* Back / Home button — hidden on final output step */}
          <AnimatePresence>
            {state.step < 3 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  className="gap-1.5 text-forest/60 hover:text-forest"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {state.step === 0 ? 'Home' : 'Back'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={state.step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
