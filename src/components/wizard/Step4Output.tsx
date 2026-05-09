'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Sparkles, Star, Headphones, Mail, LayoutDashboard, Plus, X } from 'lucide-react';
import Link from 'next/link';
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

// ── Offer definitions ─────────────────────────────────────────────────────────

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
    badge: 'ALWAYS INCLUDED — FREE',
    title: 'Dream Board Wallpaper',
    tagline: 'Your personalized AI vision board, delivered to your email within 24 hours.',
    bullets: ['Custom AI-generated wallpaper', 'Phone & desktop sizes', 'Delivered within 24 hours'],
    priceLabel: 'Free',
    free: true,
  },
  {
    id: 'dream-card',
    Icon: Star,
    badge: 'MOST POPULAR',
    title: 'Manifesta Dream Card',
    tagline: 'A beautifully designed PDF with your dream board + a personal manifesto — your declaration of the life you\'re calling in.',
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
    tagline: '3 personalized audio meditations (5–10 min each) crafted to rewire your subconscious and accelerate manifestation.',
    bullets: ['3 custom audio meditations', '5–10 minutes each', 'Scripted around your dreams'],
    priceLabel: '$39',
    free: false,
  },
  {
    id: 'life-coach',
    Icon: Mail,
    badge: null,
    title: 'Daily Life Coach Emails',
    tagline: 'Your AI coach in your inbox every morning — motivation, personalized vision images, and habit reminders.',
    bullets: ['Daily personalized message', 'AI-generated vision images', 'Cancel anytime'],
    priceLabel: '$17/month',
    free: false,
    subscription: true,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Step4Output({ state, update, onReset }: Step4Props) {
  const [phase, setPhase] = useState<'offers' | 'confirmed'>(
    state.boardId ? 'confirmed' : 'offers',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const { isSignedIn, isLoaded, user } = useUser();
  const { openSignIn } = useClerk();

  const pendingSave = useRef(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);

  // If user signs in while we have a pending save, fire it
  useEffect(() => {
    if (!isSignedIn) return;
    if (pendingSave.current) {
      pendingSave.current = false;
      void saveRef.current?.();
    }
  }, [isSignedIn]);

  // If board was already saved (edit mode on mount), jump straight to confirmed
  useEffect(() => {
    if (state.boardId) setPhase('confirmed');
  }, [state.boardId]);

  const toggleOffer = (id: string) => {
    if (id === 'wallpaper') return; // always included
    const current = state.selectedOffers ?? ['wallpaper'];
    const action = current.includes(id) ? 'removed' : 'added';
    const next = action === 'removed'
      ? current.filter((o) => o !== id)
      : [...current, id];
    analytics.offerToggled(id, action);
    update({ selectedOffers: next });
  };

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
        selectedOffers: state.selectedOffers?.length ? state.selectedOffers : ['wallpaper'],
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
      const savedOffers = state.selectedOffers?.length ? state.selectedOffers : ['wallpaper'];
      analytics.boardSaved({
        boardId: data.board.id,
        offers: savedOffers,
        hasPaid: OFFERS.some((o) => !o.free && savedOffers.includes(o.id)),
        areas: state.selectedAreas,
        style: state.style ?? '',
        hasPhotos: state.photos.length > 0,
        quoteCount: (state.selectedQuotes?.length ?? 0) + (state.customQuotes?.length ?? 0),
        gender: state.gender,
      });
      setPhase('confirmed');
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

  const selectedOffers = state.selectedOffers ?? ['wallpaper'];
  const paidSelected = OFFERS.filter((o) => !o.free && selectedOffers.includes(o.id));
  const totalLabel = paidSelected.length === 0
    ? 'Free'
    : paidSelected.map((o) => o.priceLabel).join(' + ');

  // ── Confirmed phase ───────────────────────────────────────────────────────

  if (phase === 'confirmed') {
    const firstName = user?.firstName ?? null;
    const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
    const hasPaid = paidSelected.length > 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-8 pb-10 text-center"
      >
        {/* Sparkle burst */}
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

        {/* Headline */}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest">
            {firstName ? `You're in, ${firstName}!` : "You're in!"}
          </h1>
          <p className="font-sans text-forest/60 text-base max-w-sm mx-auto">
            Your dream board is being crafted with care.
            {email && (
              <> We&apos;ll send it to <strong className="text-forest">{email}</strong> within 24 hours.</>
            )}
            {!email && ' We\'ll email your dream board within 24 hours.'}
          </p>
        </div>

        {/* What they claimed */}
        <div className="w-full max-w-sm rounded-2xl border border-sage/20 bg-white/70 p-5 text-left flex flex-col gap-3">
          <p className="font-sans text-xs font-semibold text-sage uppercase tracking-wider">Your Journey</p>
          {OFFERS.filter((o) => selectedOffers.includes(o.id)).map((o) => (
            <div key={o.id} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-sage flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-forest">{o.title}</p>
                <p className="font-sans text-xs text-forest/50">{o.free ? 'Free — arriving within 24 hours' : `${o.priceLabel} — we'll reach out to complete this`}</p>
              </div>
            </div>
          ))}
        </div>

        {hasPaid && (
          <p className="font-sans text-xs text-forest/50 max-w-xs">
            We&apos;ll contact you at your email address to complete your selected upgrades.
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link href="/dashboard">
            <Button variant="gold" className="w-full gap-2 text-base" size="lg">
              <LayoutDashboard className="w-4 h-4" />
              Go to My Dashboard
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="text-forest/50 hover:text-forest text-sm"
            onClick={onReset}
          >
            Create another board
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Offers phase ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/15 mb-3">
          <Sparkles className="w-6 h-6 text-gold" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-2">
          Your Dream Life Awaits
        </h1>
        <p className="font-sans text-forest/60 text-base max-w-sm mx-auto">
          Your personalized dream board is being crafted — choose how far you want to take your journey.
        </p>
      </div>

      {/* Offer cards */}
      <div className="flex flex-col gap-4">
        {OFFERS.map((offer) => {
          const isSelected = selectedOffers.includes(offer.id);
          const isFree = offer.free;

          return (
            <motion.div
              key={offer.id}
              whileTap={isFree ? undefined : { scale: 0.99 }}
              onClick={isFree ? undefined : () => toggleOffer(offer.id)}
              className={cn(
                'rounded-2xl border-2 p-5 transition-all duration-200 flex flex-col gap-3',
                isFree
                  ? 'border-gold/40 bg-gold/5 cursor-default'
                  : isSelected
                  ? 'border-sage shadow-sm bg-sage-light/20 cursor-pointer'
                  : 'border-sage/20 bg-white/60 cursor-pointer hover:border-sage/40 hover:bg-white/80',
              )}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    isFree ? 'bg-gold/20' : isSelected ? 'bg-sage-light' : 'bg-sage-light/60',
                  )}>
                    <offer.Icon className={cn('w-5 h-5', isFree ? 'text-gold' : 'text-sage')} />
                  </div>
                  <div>
                    {offer.badge && (
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wider',
                        isFree ? 'text-gold' : 'text-sage',
                      )}>
                        {offer.badge}
                      </span>
                    )}
                    <p className="font-sans font-semibold text-sm text-forest leading-tight">{offer.title}</p>
                  </div>
                </div>

                {/* Toggle / price */}
                {isFree ? (
                  <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
                    <Check className="w-3 h-3" /> Included
                  </span>
                ) : (
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
                )}
              </div>

              {/* Description */}
              <p className="font-sans text-xs text-forest/60 leading-relaxed">{offer.tagline}</p>

              {/* Bullets */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {offer.bullets.map((b) => (
                  <span key={b} className="flex items-center gap-1 font-sans text-[11px] text-forest/55">
                    <span className={cn('w-1 h-1 rounded-full flex-shrink-0', isFree ? 'bg-gold' : 'bg-sage')} />
                    {b}
                  </span>
                ))}
              </div>

              {/* Deselect hint for paid selected */}
              <AnimatePresence>
                {!isFree && isSelected && (
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

      {/* Summary + CTA */}
      <div className="flex flex-col gap-3 pt-2">
        {paidSelected.length > 0 && (
          <div className="rounded-xl bg-sage-light/40 border border-sage/20 px-4 py-3 flex items-center justify-between">
            <p className="font-sans text-sm text-forest/70">
              <span className="font-semibold text-forest">{paidSelected.length}</span> upgrade{paidSelected.length > 1 ? 's' : ''} added
            </p>
            <p className="font-sans text-sm font-bold text-forest">{totalLabel}</p>
          </div>
        )}

        {saveError && (
          <p className="font-sans text-xs text-red-500 text-center">{saveError}</p>
        )}

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
            'Claim My Free Dream Board →'
          ) : paidSelected.length > 0 ? (
            `Claim My Board + ${paidSelected.length} Upgrade${paidSelected.length > 1 ? 's' : ''} →`
          ) : (
            'Claim My Free Dream Board →'
          )}
        </Button>

        <p className="font-sans text-xs text-center text-forest/40">
          {isSignedIn
            ? 'Your board will be saved and your wallpaper sent within 24 hours.'
            : 'You\'ll be asked to create a free account — it takes 30 seconds.'}
        </p>
      </div>
    </div>
  );
}
