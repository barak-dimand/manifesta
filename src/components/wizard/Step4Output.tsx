'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Sparkles, Star, Headphones, Mail, Plus, X, ArrowRight, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { WizardState } from '@/hooks/use-wizard';
import { cn } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

interface Step4Props {
  state: WizardState;
  update: (updates: Partial<WizardState>) => void;
  next: () => void;
  prev: () => void;
  onReset: () => void;
}

type Phase = 'claiming' | 'success' | 'upsell';

interface Offer {
  id: string;
  Icon: React.ElementType;
  badge: string | null;
  title: string;
  tagline: string;
  bullets: string[];
  priceLabel: string;
  free: boolean;
  popular?: boolean;
  subscription?: boolean;
}

const OFFERS: Offer[] = [
  {
    id: 'wallpaper',
    Icon: Sparkles,
    badge: 'ALWAYS INCLUDED | FREE',
    title: 'Dream Board Wallpaper',
    tagline: 'Your personalized AI vision board, delivered to your email within 5 days.',
    bullets: ['Custom AI-generated wallpaper', 'Phone & desktop sizes', 'Delivered within 5 days'],
    priceLabel: 'Free',
    free: true,
  },
  {
    id: 'dream-card',
    Icon: Star,
    badge: 'MOST POPULAR',
    title: 'Manifesta Dream Card',
    tagline: "A beautifully designed PDF with your dream board plus a personal manifesto: your declaration of the life you're calling in.",
    bullets: ['Custom manifesto written for you', 'Print-quality PDF design', 'Yours to print & frame'],
    priceLabel: '$19',
    free: false,
    popular: true,
  },
  {
    id: 'meditations',
    Icon: Headphones,
    badge: null,
    title: 'Guided Manifestation Meditations',
    tagline: '3 personalized audio meditations (5-10 min each) crafted to rewire your subconscious and accelerate manifestation.',
    bullets: ['3 custom audio meditations', '5-10 minutes each', 'Scripted around your dreams'],
    priceLabel: '$39',
    free: false,
  },
  {
    id: 'life-coach',
    Icon: Mail,
    badge: null,
    title: 'Daily Life Coach Emails',
    tagline: 'Your AI coach in your inbox every morning: motivation, personalized vision images, and habit reminders.',
    bullets: ['Daily personalized message', 'AI-generated vision images', 'Cancel anytime'],
    priceLabel: '$17/month',
    free: false,
    subscription: true,
  },
];

export function Step4Output({ state, update, onReset }: Step4Props) {
  const isEditModeRef = useRef(!!state.boardId);
  const [phase, setPhase] = useState<Phase>(state.boardId ? 'success' : 'claiming');
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveError, setSaveError] = useState('');
  const { isSignedIn, isLoaded, user } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();

  const pendingSave = useRef(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    if (pendingSave.current) {
      pendingSave.current = false;
      void saveRef.current?.();
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (state.boardId && phase === 'claiming') setPhase('success');
  }, [state.boardId, phase]);

  const saveBoard = useCallback(async () => {
    if (isSaving || state.boardId) return;
    setIsSaving(true);
    setSaveError('');

    try {
      const goals = state.goals.filter((g) => g.objective.trim() || g.habit.trim());
      const body = {
        selectedAreas: state.selectedAreas,
        dreams: state.dreams,
        style: state.style,
        goals,
        manifesto: state.manifesto || undefined,
        enableTimeline: state.enableTimeline,
        photoUrls: state.photos.filter((p) => p.startsWith('http')),
        explorerData: {
          promptStates: state.explorerPromptStates,
          priorities: Object.keys(state.dreamPriorities ?? {}).length ? state.dreamPriorities : undefined,
        },
        selectedOffers: ['wallpaper'],
        selectedQuotes: state.selectedQuotes,
        customQuotes: state.customQuotes,
        gender: state.gender,
      };

      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { board?: { id: string }; error?: string };

      if (!res.ok || !data.board?.id) {
        setSaveError('Something went wrong saving your board. Please try again.');
        return;
      }

      update({ boardId: data.board.id });
      analytics.boardSaved({
        boardId: data.board.id,
        offers: ['wallpaper'],
        hasPaid: false,
        areas: state.selectedAreas,
        style: state.style ?? '',
        hasPhotos: state.photos.length > 0,
        quoteCount: (state.selectedQuotes?.length ?? 0) + (state.customQuotes?.length ?? 0),
        gender: state.gender,
      });
      setPhase('success');
    } catch {
      setSaveError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, state, update]);

  saveRef.current = saveBoard;

  const handleClaimClick = () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      analytics.signInTriggered('board_save');
      pendingSave.current = true;
      openSignIn();
      return;
    }
    void saveBoard();
  };

  const toggleOffer = (id: string) => {
    if (id === 'wallpaper') return;
    const current = state.selectedOffers ?? ['wallpaper'];
    const action = current.includes(id) ? 'removed' : 'added';
    const next = action === 'removed'
      ? current.filter((o) => o !== id)
      : [...current, id];
    analytics.offerToggled(id, action);
    update({ selectedOffers: next });
  };

  const handleGoToDashboard = async () => {
    const selectedOffers = state.selectedOffers ?? ['wallpaper'];
    const hasPaidOffers = selectedOffers.some((o) => o !== 'wallpaper');

    if (state.boardId && hasPaidOffers) {
      setIsUpdating(true);
      try {
        await fetch(`/api/boards/${state.boardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedOffers }),
        });
        analytics.boardSaved({
          boardId: state.boardId,
          offers: selectedOffers,
          hasPaid: true,
          areas: state.selectedAreas,
          style: state.style ?? '',
          hasPhotos: state.photos.length > 0,
          quoteCount: (state.selectedQuotes?.length ?? 0) + (state.customQuotes?.length ?? 0),
          gender: state.gender,
        });
      } catch {
        // Non-fatal — still redirect
      } finally {
        setIsUpdating(false);
      }
    }

    router.push('/dashboard');
  };

  const firstName = user?.firstName ?? null;
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const selectedOffers = state.selectedOffers ?? ['wallpaper'];
  const paidSelected = OFFERS.filter((o) => !o.free && selectedOffers.includes(o.id));

  // ── Phase: claiming ───────────────────────────────────────────────────────

  if (phase === 'claiming') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="flex flex-col gap-8 pb-10"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/15 mb-4">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-3">
            Your Dream Board is Ready
          </h1>
          <p className="font-sans text-forest/60 text-base max-w-sm mx-auto">
            You&apos;ve just mapped out your future. We&apos;ll craft a personalized AI vision board and send it to your inbox within 5 days.
          </p>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl border border-sage/20 bg-white/70 p-5 flex flex-col gap-4">
          <p className="font-sans text-xs font-semibold text-sage uppercase tracking-wider">Your board</p>
          <div className="flex flex-wrap gap-1.5">
            {state.selectedAreas.map((area) => (
              <span key={area} className="px-2.5 py-0.5 rounded-full bg-sage-light text-sage text-xs font-sans font-medium capitalize">
                {area}
              </span>
            ))}
          </div>
          {state.style && (
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-forest/50">Aesthetic</span>
              <span className="font-sans text-xs font-semibold text-forest capitalize">{state.style}</span>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-gold/5 border border-gold/20 p-4">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold text-forest">AI Dream Board Wallpaper</p>
              <p className="font-sans text-xs text-forest/50">Custom generated, phone & desktop sizes, delivered within 5 days.</p>
            </div>
            <span className="flex-shrink-0 font-sans text-xs font-bold text-gold">Free</span>
          </div>
        </div>

        {saveError && (
          <p className="font-sans text-xs text-red-500 text-center">{saveError}</p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            variant="gold"
            size="lg"
            className="w-full text-base font-semibold gap-2"
            onClick={handleClaimClick}
            disabled={isSaving}
          >
            {isSaving ? (
              <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
            ) : !isLoaded || !isSignedIn ? (
              'Get My Free Dream Board →'
            ) : (
              'Send My Dream Board →'
            )}
          </Button>
          <p className="font-sans text-xs text-center text-forest/40">
            {isSignedIn
              ? 'Your board will be saved and your wallpaper sent within 5 days.'
              : 'Create a free account in 30 seconds. No credit card needed.'}
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Phase: success ────────────────────────────────────────────────────────

  if (phase === 'success') {
    const isEdit = isEditModeRef.current;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="flex flex-col items-center gap-8 pb-10 text-center"
      >
        <div className="relative mt-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center"
          >
            <Sparkles className="w-9 h-9 text-gold" />
          </motion.div>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.7 }}
              className="absolute inset-0 rounded-full border border-gold/30"
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest">
            {isEdit
              ? 'Changes saved!'
              : firstName ? `It's on its way, ${firstName}!` : "It's on its way!"}
          </h1>
          <p className="font-sans text-forest/60 text-base max-w-sm mx-auto">
            {isEdit ? (
              'Your dream board has been updated.'
            ) : (
              <>
                Your dream board is being crafted with care.
                {email ? (
                  <> We&apos;ll deliver it to <strong className="text-forest">{email}</strong> within 5 days.</>
                ) : (
                  " We'll email your dream board within 5 days."
                )}
              </>
            )}
          </p>
        </div>

        {!isEdit && (
          <div className="w-full max-w-sm flex flex-col gap-2.5">
            {[
              { label: 'Dream board created', done: true },
              { label: 'AI is crafting your wallpaper', done: false },
              { label: 'Delivered to your inbox', done: false },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                  step.done ? 'bg-sage' : 'bg-sage/20',
                )}>
                  {step.done && <Check className="w-3 h-3 text-white" />}
                </div>
                <p className={cn('font-sans text-sm', step.done ? 'text-forest font-medium' : 'text-forest/40')}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-sm">
          {isEdit ? (
            <Button
              variant="gold"
              size="lg"
              className="w-full gap-2 text-base"
              onClick={() => router.push('/dashboard')}
            >
              Back to My Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="gold"
                size="lg"
                className="w-full gap-2 text-base"
                onClick={() => setPhase('upsell')}
              >
                See what else is possible
                <ChevronRight className="w-4 h-4" />
              </Button>
              <button
                type="button"
                className="font-sans text-sm text-forest/50 hover:text-forest transition-colors py-1"
                onClick={() => router.push('/dashboard')}
              >
                Go to my dashboard →
              </button>
            </>
          )}
          <Button
            variant="ghost"
            className="text-forest/40 hover:text-forest text-sm"
            onClick={onReset}
          >
            Create another board
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Phase: upsell ─────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="flex flex-col gap-6 pb-10"
    >
      <div className="text-center py-2">
        <p className="font-sans text-xs font-semibold text-sage/70 uppercase tracking-wider mb-2">
          While your board is being crafted
        </p>
        <h1 className="font-display text-3xl font-semibold text-forest mb-2">
          Deepen your journey
        </h1>
        <p className="font-sans text-forest/60 text-sm max-w-sm mx-auto">
          Your dream board is free and on its way. These add-ons help you go further.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {OFFERS.filter((o) => !o.free).map((offer) => {
          const isSelected = selectedOffers.includes(offer.id);
          return (
            <motion.div
              key={offer.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleOffer(offer.id)}
              className={cn(
                'rounded-2xl border-2 p-5 transition-all duration-200 flex flex-col gap-3 cursor-pointer',
                isSelected
                  ? 'border-sage shadow-sm bg-sage-light/20'
                  : 'border-sage/20 bg-white/60 hover:border-sage/40 hover:bg-white/80',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-sage-light' : 'bg-sage-light/60',
                  )}>
                    <offer.Icon className="w-5 h-5 text-sage" />
                  </div>
                  <div>
                    {offer.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sage block">
                        {offer.badge}
                      </span>
                    )}
                    <p className="font-sans font-semibold text-sm text-forest leading-tight">{offer.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleOffer(offer.id); }}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-all duration-200',
                    isSelected
                      ? 'bg-sage text-white border-sage'
                      : 'bg-white text-forest/60 border-sage/30 hover:border-sage',
                  )}
                >
                  {isSelected
                    ? <><Check className="w-3 h-3" /> Added</>
                    : <><Plus className="w-3 h-3" /> {offer.priceLabel}</>}
                </button>
              </div>

              <p className="font-sans text-xs text-forest/60 leading-relaxed">{offer.tagline}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {offer.bullets.map((b) => (
                  <span key={b} className="flex items-center gap-1 font-sans text-[11px] text-forest/55">
                    <span className="w-1 h-1 rounded-full bg-sage flex-shrink-0" />
                    {b}
                  </span>
                ))}
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.button
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleOffer(offer.id); }}
                    className="self-start flex items-center gap-1 text-[11px] text-forest/40 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" /> Remove
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {paidSelected.length > 0 && (
          <div className="rounded-xl bg-sage-light/40 border border-sage/20 px-4 py-3 flex items-center justify-between">
            <p className="font-sans text-sm text-forest/70">
              <span className="font-semibold text-forest">{paidSelected.length}</span> upgrade{paidSelected.length > 1 ? 's' : ''} added
            </p>
            <p className="font-sans text-sm font-bold text-forest">
              {paidSelected.map((o) => o.priceLabel).join(' + ')}
            </p>
          </div>
        )}

        <Button
          variant="gold"
          size="lg"
          className="w-full text-base font-semibold gap-2"
          onClick={() => void handleGoToDashboard()}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
          ) : paidSelected.length > 0 ? (
            <>Continue with {paidSelected.length} upgrade{paidSelected.length > 1 ? 's' : ''} <ArrowRight className="w-4 h-4" /></>
          ) : (
            <>Continue to my dashboard <ArrowRight className="w-4 h-4" /></>
          )}
        </Button>

        {paidSelected.length > 0 && (
          <p className="font-sans text-xs text-center text-forest/40">
            We&apos;ll reach out to your email to complete your selected upgrades.
          </p>
        )}

        <button
          type="button"
          className="font-sans text-sm text-center text-forest/40 hover:text-forest transition-colors py-1"
          onClick={() => router.push('/dashboard')}
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}
