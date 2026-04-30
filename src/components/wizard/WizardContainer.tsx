'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
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
  const { state, next, prev, update } = useWizard();

  const slideVariants = {
    enter: () => ({
      x: 60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
    exit: (_dir: number) => ({
      x: -60,
      opacity: 0,
      transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  const renderStep = () => {
    const props = { state, update, next, prev };
    switch (state.step) {
      case 0:
        return <Step1DreamLife key="step-1" {...props} />;
      case 1:
        return <Step2PhotosStyle key="step-2" {...props} />;
      case 2:
        return <Step3GoalsHabits key="step-3" {...props} />;
      case 3:
        return <Step4Output key="step-4" {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Progress header */}
      <div className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-sage/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {/* Step dots + labels */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step.index} className="flex flex-col items-center gap-1.5 flex-1">
                {/* Dot */}
                <div className="relative flex items-center w-full">
                  {/* Line before */}
                  {i > 0 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 transition-colors duration-300',
                        state.step >= i ? 'bg-sage' : 'bg-sage-light',
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex-shrink-0 transition-all duration-300 border-2',
                      state.step === i
                        ? 'bg-gold border-gold scale-110 shadow-sm shadow-gold/40'
                        : state.step > i
                        ? 'bg-sage border-sage'
                        : 'bg-cream border-sage-light',
                    )}
                  />
                  {/* Line after */}
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 transition-colors duration-300',
                        state.step > i ? 'bg-sage' : 'bg-sage-light',
                      )}
                    />
                  )}
                </div>
                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-sans font-medium transition-colors duration-300 whitespace-nowrap',
                    state.step === i
                      ? 'text-forest'
                      : state.step > i
                      ? 'text-sage'
                      : 'text-forest/40',
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 relative overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 py-8 min-h-full">
          {/* Back button */}
          <AnimatePresence>
            {state.step > 0 && state.step < 3 && (
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
                  onClick={prev}
                  className="gap-1.5 text-forest/60 hover:text-forest"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={state.step}
              custom={1}
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
